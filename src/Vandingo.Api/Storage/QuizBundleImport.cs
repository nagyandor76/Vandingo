using System.IO.Compression;
using System.Text.Json.Serialization;
using Vandingo.Api.Quizzes;
using Vandingo.Api.Subjects;
using Vandingo.Api.Validation;

namespace Vandingo.Api.Storage;

/// <summary>One Quiz or Subject taken over from the source; <see cref="Difficulty"/> is null for a Subject.</summary>
public sealed record SeedItem(
    [property: JsonPropertyName("subject")] string Subject,
    [property: JsonPropertyName("difficulty")] int? Difficulty,
    [property: JsonPropertyName("name")] string Name);

/// <summary>
/// Brings a Quiz bundle into the Quiz library, which checks every Subject and Quiz like any other change.
/// Each way in has its own policy:
/// an uploaded ZIP is all or nothing; the initial-quiz source only fills in what is missing, leaving out what is faulty;
/// and on startup that source is taken over once, while the library is still empty.
/// </summary>
public sealed class QuizBundleImport(QuizLibrary library, DataPaths paths, ILogger<QuizBundleImport> logger)
{
    /// <summary>What an upload brought in: every Quiz, and the Subjects it created.</summary>
    public sealed record Imported(
        [property: JsonPropertyName("quizzes")] IReadOnlyList<QuizRef> Quizzes,
        [property: JsonPropertyName("subjects")] IReadOnlyList<ImportedSubject> Subjects);

    public sealed record ImportedSubject(
        [property: JsonPropertyName("key")] string Key,
        [property: JsonPropertyName("name")] string Name);

    /// <summary>
    /// Loads every Quiz of the ZIP, creating the Subjects that do not exist yet from their <c>subject.json</c>;
    /// an existing Subject's own settings are never touched. Everything is checked first, and nothing is written
    /// unless all of it is fine (else invalid, each error naming its file) and every occupied Difficulty may be overwritten
    /// (else occupied, by those Quizzes).
    /// </summary>
    public Outcome<Imported> Upload(Stream zipStream, bool overwrite)
    {
        ZipArchive zip;
        try
        {
            zip = new ZipArchive(zipStream, ZipArchiveMode.Read);
        }
        catch (InvalidDataException)
        {
            return Outcome<Imported>.Invalid([ValidationError.OfFile("", "file", "A feltöltött fájl nem érvényes ZIP.")]);
        }

        using (zip)
        {
            var errors = new List<ValidationError>();
            var files = UsableFiles(QuizBundle.FromZip(zip), errors);

            var quizzes = new List<(BundleFile File, QuizDraft Draft)>();
            foreach (var file in files.Where(file => !file.IsSubjectFile))
            {
                if (QuizBundle.Read<QuizDraft>(file, out var error) is not { } draft)
                {
                    errors.Add(error!);
                    continue;
                }
                var problems = QuizLibrary.CheckQuiz(file.Difficulty!.Value, draft);
                errors.AddRange(problems.Select(problem => problem with { File = file.Path }));
                if (problems.Count == 0) quizzes.Add((file, draft));
            }

            var newSubjects = new List<Subject>();
            foreach (var key in files.Select(file => file.Subject).Distinct().Where(key => !library.SubjectExists(key)))
            {
                if (ReadNewSubject(files, key, out var subjectErrors) is { } subject) newSubjects.Add(subject);
                errors.AddRange(subjectErrors);
            }
            if (errors.Count > 0) return Outcome<Imported>.Invalid(errors);

            var occupied = quizzes
                .Where(quiz => library.QuizExists(quiz.File.Subject, quiz.File.Difficulty!.Value))
                .Select(quiz => library.OccupantOf(quiz.File.Subject, quiz.File.Difficulty!.Value))
                .ToList();
            if (occupied.Count > 0 && !overwrite) return Outcome<Imported>.Occupied(occupied);

            // Everything was checked above, so a write can only fail if the library changed meanwhile:
            // that is an error, not something to leave out quietly.
            var subjects = newSubjects.Select(subject => SavedOrThrow(library.AddSubject(subject), subject.Key)).ToList();
            var saved = quizzes
                .Select(quiz => SavedOrThrow(
                    library.SaveQuiz(quiz.File.Subject, quiz.File.Difficulty!.Value, quiz.Draft, overwrite: true),
                    quiz.File.Path))
                .ToList();
            return Outcome<Imported>.Saved(new Imported(
                saved.Select(quiz => new QuizRef(quiz.Subject, quiz.Difficulty, quiz.Name)).ToList(),
                subjects.Select(subject => new ImportedSubject(subject.Key, subject.Name)).ToList()));
        }
    }

    /// <summary>
    /// Takes over the Subjects and Quizzes of the initial-quiz source that the library lacks; nothing in the library is overwritten.
    /// A faulty file is left out, and so are the Quizzes of a new Subject that cannot be taken over itself.
    /// </summary>
    public IReadOnlyList<SeedItem> TakeOverFromSource()
    {
        var taken = new List<SeedItem>();
        if (!Directory.Exists(paths.SeedDirectory)) return taken;

        foreach (var folder in QuizBundle.FromDirectory(paths.SeedDirectory).GroupBy(file => file.Subject).OrderBy(group => group.Key, StringComparer.Ordinal))
        {
            var key = folder.Key;
            var files = folder.ToList();
            if (!QuizLayout.IsSubjectKey(key))
            {
                logger.LogWarning("Initial-quiz folder {Folder} is not a valid Subject key; it is left out", key);
                continue;
            }
            if (!library.SubjectExists(key))
            {
                if (ReadNewSubject(files, key, out var errors) is not { } subject || library.AddSubject(subject) is not { Kind: OutcomeKind.Saved } added)
                {
                    LogLeftOut(errors, $"{key}/{QuizLayout.SubjectFileName}");
                    continue;
                }
                taken.Add(new SeedItem(key, null, added.Value!.Name));
            }

            foreach (var file in files.Where(file => !file.IsSubjectFile).OrderBy(file => file.Difficulty))
            {
                var difficulty = file.Difficulty!.Value;
                if (library.QuizExists(key, difficulty)) continue;
                if (QuizBundle.Read<QuizDraft>(file, out var error) is not { } draft)
                {
                    LogLeftOut([error!], file.Path);
                    continue;
                }
                var outcome = library.SaveQuiz(key, difficulty, draft);
                if (outcome.Kind == OutcomeKind.Saved) taken.Add(new SeedItem(key, difficulty, outcome.Value!.Name));
                else LogLeftOut(outcome.Errors.Select(problem => problem with { File = file.Path }).ToList(), file.Path);
            }
        }
        return taken;
    }

    /// <summary>On startup: takes over the initial-quiz source once, while the library is still empty, so edits are never overwritten.</summary>
    public void TakeOverInitialQuizzesIfEmpty()
    {
        if (!library.IsEmpty) return;
        if (!Directory.Exists(paths.SeedDirectory))
        {
            logger.LogWarning("Initial quiz directory {SeedDirectory} not found; starting with no Quizzes", paths.SeedDirectory);
            return;
        }
        TakeOverFromSource();
    }

    /// <summary>
    /// The files that can be taken further: each Subject and Difficulty at most once, in a folder named by a valid Subject key.
    /// </summary>
    private static List<BundleFile> UsableFiles(IReadOnlyList<BundleFile> files, List<ValidationError> errors)
    {
        var usable = new List<BundleFile>();
        var seen = new HashSet<(string, int?)>();
        foreach (var file in files)
        {
            if (!seen.Add((file.Subject, file.Difficulty)))
                errors.Add(file.IsSubjectFile
                    ? ValidationError.OfFile(file.Path, "file", "A subject.json a ZIP-ben többször szerepel ebben a mappában.")
                    : ValidationError.OfFile(file.Path, "difficulty", "Ez a szint a ZIP-ben már szerepel."));
            else if (!QuizLayout.IsSubjectKey(file.Subject))
                errors.Add(ValidationError.OfFile(file.Path, "subject", "A mappa neve csak kisbetű (a–z), számjegy (0–9) és - jel lehet."));
            else
                usable.Add(file);
        }
        return usable;
    }

    /// <summary>A Subject that does not exist yet, from its folder's <c>subject.json</c>: null, with the reasons, if that cannot be done.</summary>
    private static Subject? ReadNewSubject(IReadOnlyList<BundleFile> files, string key, out List<ValidationError> errors)
    {
        errors = [];
        var path = $"{key}/{QuizLayout.SubjectFileName}";
        if (files.FirstOrDefault(file => file.Subject == key && file.IsSubjectFile) is not { } subjectFile)
        {
            errors.Add(ValidationError.OfFile(path, "file", "Új tantárgyhoz kell a subject.json."));
            return null;
        }
        if (QuizBundle.Read<Subject>(subjectFile, out var error) is not { } subject)
        {
            errors.Add(error!);
            return null;
        }

        errors.AddRange(QuizLibrary.CheckSubject(subject).Select(problem => problem with { File = path }));
        if (subject.Key is not null && subject.Key != key)
            errors.Add(ValidationError.OfFile(path, "key", "A kulcs nem egyezik a mappa nevével."));
        return errors.Count == 0 ? subject : null;
    }

    private void LogLeftOut(IReadOnlyList<ValidationError> errors, string path) =>
        logger.LogWarning("Initial-quiz file {File} is left out: {Errors}", path,
            errors.Count == 0 ? "it could not be saved" : string.Join("; ", errors.Select(error => $"{error.Field}: {error.Message}")));

    private static T SavedOrThrow<T>(Outcome<T> outcome, string what) =>
        outcome.Kind == OutcomeKind.Saved
            ? outcome.Value!
            : throw new InvalidOperationException($"Upload of {what} was checked but could not be saved: {outcome.Kind}");
}
