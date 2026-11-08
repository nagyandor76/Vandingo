using System.IO.Compression;
using System.Text.Json;
using System.Text.Json.Serialization;
using Vandingo.Api.Quizzes;
using Vandingo.Api.Subjects;
using Vandingo.Api.Validation;

namespace Vandingo.Api.Storage;

/// <summary>
/// Loads Quizzes (and new Subjects) from a ZIP that follows the <c>Quizzes/</c> layout:
/// <c>&lt;subject&gt;/&lt;difficulty&gt;.json</c> and <c>&lt;subject&gt;/subject.json</c>, in the root or in a <c>Quizzes/</c> folder.
/// Everything is checked first; nothing is written unless all of it is fine and no occupied Difficulty is unconfirmed.
/// </summary>
public sealed class QuizImport(QuizLibrary library)
{
    private const string QuizzesFolder = "Quizzes";
    private const string SubjectFile = "subject.json";

    public abstract record Outcome;

    /// <summary>Something in the ZIP is wrong; nothing was written.</summary>
    public sealed record Invalid(IReadOnlyList<FileError> Errors) : Outcome;

    /// <summary>These Difficulties are taken and overwriting was not confirmed; nothing was written.</summary>
    public sealed record Occupied(IReadOnlyList<QuizRef> Quizzes) : Outcome;

    public sealed record Imported(IReadOnlyList<QuizRef> Quizzes, IReadOnlyList<ImportedSubject> Subjects) : Outcome;

    /// <summary>A Quiz by its Subject, Difficulty and name: an occupied one (the existing name) or an imported one.</summary>
    public sealed record QuizRef(
        [property: JsonPropertyName("subject")] string Subject,
        [property: JsonPropertyName("difficulty")] int Difficulty,
        [property: JsonPropertyName("name")] string Name);

    public sealed record ImportedSubject(
        [property: JsonPropertyName("key")] string Key,
        [property: JsonPropertyName("name")] string Name);

    private sealed record Candidate(string Subject, int Difficulty, QuizDraft Draft);

    private sealed record Item(string Path, string Subject, string Name, ZipArchiveEntry Entry);

    public Outcome Run(Stream zipStream, bool overwrite)
    {
        ZipArchive zip;
        try
        {
            zip = new ZipArchive(zipStream, ZipArchiveMode.Read);
        }
        catch (InvalidDataException)
        {
            return new Invalid([new FileError("", null, "file", "A feltöltött fájl nem érvényes ZIP.")]);
        }

        using (zip)
        {
            var errors = new List<FileError>();
            var items = Relevant(zip, errors);

            var candidates = new List<Candidate>();
            var seen = new HashSet<(string, int)>();
            foreach (var item in items.Where(i => i.Name != SubjectFile))
            {
                if (!int.TryParse(Path.GetFileNameWithoutExtension(item.Name), out var difficulty))
                {
                    errors.Add(new(item.Path, null, "difficulty", "A fájl neve a szint száma kell legyen (pl. 3.json)."));
                    continue;
                }
                if (!seen.Add((item.Subject, difficulty)))
                {
                    errors.Add(new(item.Path, null, "difficulty", "Ez a szint a ZIP-ben már szerepel."));
                    continue;
                }
                if (!TryReadDraft(item, errors, out var draft)) continue;

                var problems = QuizLibrary.CheckQuiz(difficulty, draft);
                errors.AddRange(problems.Select(error => FileError.Of(item.Path, error)));
                if (problems.Count == 0) candidates.Add(new(item.Subject, difficulty, draft));
            }

            var newSubjects = NewSubjects(items, errors);
            if (errors.Count > 0) return new Invalid(errors);

            var taken = candidates
                .Select(c => library.FindQuiz(c.Subject, c.Difficulty) is { } existing ? new QuizRef(c.Subject, c.Difficulty, existing.Name) : null)
                .OfType<QuizRef>()
                .ToList();
            if (taken.Count > 0 && !overwrite) return new Occupied(taken);

            foreach (var subject in newSubjects) library.AddSubject(subject);
            foreach (var c in candidates) library.SaveQuiz(c.Subject, c.Difficulty, c.Draft, overwrite: true);
            return new Imported(
                candidates.Select(c => new QuizRef(c.Subject, c.Difficulty, c.Draft.Name!.Trim())).ToList(),
                newSubjects.Select(s => new ImportedSubject(s.Key, s.Name)).ToList());
        }
    }

    /// <summary>
    /// The <c>&lt;subject&gt;/&lt;number&gt;.json</c> and <c>&lt;subject&gt;/subject.json</c> entries;
    /// everything else (<c>results/</c>, other files and folders) is left out.
    /// </summary>
    private static List<Item> Relevant(ZipArchive zip, List<FileError> errors)
    {
        var found = new List<Item>();
        var subjectFiles = new HashSet<string>();
        foreach (var entry in zip.Entries.Where(e => e.Name != ""))
        {
            var parts = entry.FullName.Replace('\\', '/').Split('/', StringSplitOptions.RemoveEmptyEntries);
            if (parts is [QuizzesFolder, .. var rest] && rest.Length == 2) parts = rest;
            if (parts.Length != 2 || parts[0] == "results" || !IsQuizOrSubjectFile(parts[1])) continue;

            var path = string.Join('/', parts);
            if (parts[1] == SubjectFile && !subjectFiles.Add(parts[0]))
            {
                errors.Add(new(path, null, "file", "A subject.json a ZIP-ben többször szerepel ebben a mappában."));
                continue;
            }
            if (!QuizLayout.IsSubjectKey(parts[0]))
                errors.Add(new(path, null, "subject", "A mappa neve csak kisbetű (a–z), számjegy (0–9) és - jel lehet."));
            else
                found.Add(new(path, parts[0], parts[1], entry));
        }
        return found;
    }

    private static bool IsQuizOrSubjectFile(string name) =>
        name == SubjectFile
        || (name.EndsWith(".json", StringComparison.OrdinalIgnoreCase)
            && name.Length > ".json".Length
            && name[..^".json".Length].All(char.IsAsciiDigit));

    private static bool TryReadDraft(Item item, List<FileError> errors, out QuizDraft draft)
    {
        try
        {
            using var stream = item.Entry.Open();
            draft = JsonSerializer.Deserialize<QuizDraft>(stream) ?? throw new JsonException("A fájl üres.");
            return true;
        }
        catch (Exception exception) when (exception is InvalidDataException or IOException)
        {
            errors.Add(new(item.Path, null, "file", $"A ZIP-bejegyzés sérült: {exception.Message}"));
            draft = null!;
            return false;
        }
        catch (JsonException exception)
        {
            var line = exception.LineNumber is { } n ? $" ({n + 1}. sor)" : "";
            errors.Add(new(item.Path, null, "json", $"Hibás JSON{line}: {exception.Message}"));
            draft = null!;
            return false;
        }
    }

    /// <summary>
    /// The Subjects of the Quizzes that do not exist yet, from their <c>subject.json</c>;
    /// an existing Subject's own settings are never touched.
    /// </summary>
    private List<Subject> NewSubjects(List<Item> items, List<FileError> errors)
    {
        var created = new List<Subject>();
        foreach (var key in items.Select(i => i.Subject).Distinct().Where(key => !library.SubjectExists(key)))
        {
            var path = $"{key}/{SubjectFile}";
            var item = items.FirstOrDefault(i => i.Path == path);
            if (item is null)
            {
                errors.Add(new(path, null, "file", "Új tantárgyhoz kell a subject.json."));
                continue;
            }

            Subject? subject;
            try
            {
                using var stream = item.Entry.Open();
                subject = JsonSerializer.Deserialize<Subject>(stream);
            }
            catch (Exception exception) when (exception is InvalidDataException or IOException)
            {
                errors.Add(new(path, null, "file", $"A ZIP-bejegyzés sérült: {exception.Message}"));
                continue;
            }
            catch (JsonException exception)
            {
                errors.Add(new(path, null, "json", $"Hibás JSON: {exception.Message}"));
                continue;
            }
            if (subject is null)
            {
                errors.Add(new(path, null, "json", "A fájl üres."));
                continue;
            }

            var problems = QuizLibrary.CheckSubject(subject).ToList();
            if (subject.Key is not null && subject.Key != key)
                problems.Add(new(null, "key", "A kulcs nem egyezik a mappa nevével."));
            if (problems.Count > 0) errors.AddRange(problems.Select(p => FileError.Of(path, p)));
            else created.Add(subject with { Name = subject.Name.Trim() });
        }
        return created;
    }
}
