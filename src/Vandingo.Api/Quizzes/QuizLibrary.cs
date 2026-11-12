using System.Text.Json;
using Vandingo.Api.Storage;
using Vandingo.Api.Subjects;
using Vandingo.Api.Validation;

namespace Vandingo.Api.Quizzes;

/// <summary>
/// Every Subject and its Quizzes in the data directory's <c>Quizzes</c> folder, laid out as <see cref="QuizLayout"/> says.
/// Every change is checked here, whoever asks for it, so nothing invalid is ever written;
/// a file that is broken anyway (edited by hand, say) is left out when reading instead of failing its whole Subject.
/// </summary>
public sealed class QuizLibrary(DataPaths paths, ILogger<QuizLibrary> logger)
{
    public const int DefaultMaxQuestions = 20;

    /// <summary>Whether there is nothing at all in the library yet, not even an empty Subject folder.</summary>
    public bool IsEmpty =>
        !Directory.Exists(paths.QuizzesDirectory) || !Directory.EnumerateFileSystemEntries(paths.QuizzesDirectory).Any();

    // ---- Subjects ----

    /// <summary>Every Subject in key order.</summary>
    public IReadOnlyList<Subject> Subjects()
    {
        if (!Directory.Exists(paths.QuizzesDirectory)) return [];

        return Directory.EnumerateDirectories(paths.QuizzesDirectory)
            .Select(directory => FindSubject(Path.GetFileName(directory)))
            .OfType<Subject>()
            .OrderBy(subject => subject.Key, StringComparer.Ordinal)
            .ToList();
    }

    /// <summary>The Subject with this key, or null if there is none (or its file is broken).</summary>
    public Subject? FindSubject(string key)
    {
        if (!QuizLayout.IsSubjectKey(key)) return null;
        // The folder name is the key, whatever the file says.
        return JsonFile.TryRead<Subject>(SubjectFile(key), logger) is { Name: not null } subject ? subject with { Key = key } : null;
    }

    /// <summary>
    /// Whether there is a Subject with this key that can be read; a Subject whose file is broken does not exist anywhere,
    /// so its Quizzes are not served or written either, and adding the Subject again replaces the broken file.
    /// </summary>
    public bool SubjectExists(string key) => FindSubject(key) is not null;

    /// <summary>Everything wrong with a Subject to be added; empty if nothing.</summary>
    public static IReadOnlyList<ValidationError> CheckSubject(Subject subject)
    {
        var errors = new List<ValidationError>();
        if (!QuizLayout.IsSubjectKey(subject.Key))
            errors.Add(new(null, "key", "A kulcs csak kisbetű (a–z), számjegy (0–9) és - jel lehet."));
        if (string.IsNullOrWhiteSpace(subject.Name))
            errors.Add(new(null, "name", "A név nem lehet üres."));
        errors.AddRange(CheckSettings(new SubjectSettings(subject.MaxQuestions, subject.AutoAdvance)));
        return errors;
    }

    /// <summary>Creates a Subject with the default settings.</summary>
    public Outcome<Subject> CreateSubject(NewSubject subject) =>
        AddSubject(new Subject(subject.Key, subject.Name, DefaultMaxQuestions, AutoAdvance: false));

    /// <summary>Adds a Subject with its own settings (e.g. from an upload or the initial-quiz source); occupied if its key is taken.</summary>
    public Outcome<Subject> AddSubject(Subject subject)
    {
        if (CheckSubject(subject) is [_, ..] errors) return Outcome<Subject>.Invalid(errors);
        if (SubjectExists(subject.Key)) return Outcome<Subject>.Occupied();

        var added = subject with { Name = subject.Name.Trim() };
        JsonFile.Write(SubjectFile(added.Key), added);
        return Outcome<Subject>.Saved(added);
    }

    /// <summary>Changes a Subject's settings, never its key or name.</summary>
    public Outcome<Subject> UpdateSubject(string key, SubjectSettings settings)
    {
        if (CheckSettings(settings) is [_, ..] errors) return Outcome<Subject>.Invalid(errors);
        if (FindSubject(key) is not { } subject) return Outcome<Subject>.NotFound();

        var updated = subject with { MaxQuestions = settings.MaxQuestions, AutoAdvance = settings.AutoAdvance };
        JsonFile.Write(SubjectFile(key), updated);
        return Outcome<Subject>.Saved(updated);
    }

    private static IReadOnlyList<ValidationError> CheckSettings(SubjectSettings settings) =>
        settings.MaxQuestions < 1 ? [new(null, "max_questions", "Legalább 1 kérdés kell.")] : [];

    // ---- Quizzes ----

    /// <summary>The Subject's Quizzes in Difficulty order, or null if there is no such Subject.</summary>
    public IReadOnlyList<QuizSummary>? Quizzes(string subject) =>
        Load(subject)?
            .Select(quiz => new QuizSummary(
                quiz.Difficulty,
                quiz.Name,
                quiz.Questions.GroupBy(question => question.Type).ToDictionary(group => group.Key, group => group.Count())))
            .ToList();

    /// <summary>
    /// Every Question of the Quizzes from <paramref name="from"/> to <paramref name="to"/> (both included),
    /// with <c>time</c> resolved against its Quiz's default; null if there is no such Subject.
    /// </summary>
    public IReadOnlyList<Question>? Questions(string subject, int from, int to) =>
        Load(subject)?
            .Where(quiz => quiz.Difficulty >= from && quiz.Difficulty <= to)
            .SelectMany(quiz => quiz.Questions.Select(question => question with { Time = question.Time ?? quiz.DefaultTime }))
            .ToList();

    /// <summary>The Quiz at this Difficulty, or null if there is none (or its file is broken).</summary>
    public Quiz? FindQuiz(string subject, int difficulty) =>
        SubjectExists(subject) ? ReadQuiz(QuizFile(subject, difficulty), difficulty) : null;

    /// <summary>Whether this Difficulty is taken, even by a broken file that cannot be read.</summary>
    public bool QuizExists(string subject, int difficulty) => SubjectExists(subject) && File.Exists(QuizFile(subject, difficulty));

    /// <summary>Everything wrong with a Quiz to be saved at this Difficulty; empty if it can be saved.</summary>
    public static IReadOnlyList<ValidationError> CheckQuiz(int difficulty, QuizDraft draft) => QuizRules.Check(difficulty, draft);

    /// <summary>
    /// Saves a Quiz at its Difficulty. A Quiz moved here from <paramref name="originalDifficulty"/> no longer stays there.
    /// Another Quiz already at this Difficulty is replaced only if <paramref name="overwrite"/>.
    /// </summary>
    public Outcome<Quiz> SaveQuiz(string subject, int difficulty, QuizDraft draft, int? originalDifficulty = null, bool overwrite = false)
    {
        if (CheckQuiz(difficulty, draft) is [_, ..] errors) return Outcome<Quiz>.Invalid(errors);
        if (!SubjectExists(subject)) return Outcome<Quiz>.NotFound();
        if (difficulty != originalDifficulty && !overwrite && QuizExists(subject, difficulty))
            return Outcome<Quiz>.Occupied([OccupantOf(subject, difficulty)]);

        var questions = draft.Questions!.Select(question => question with
        {
            // Empty cells of the Editor's grid are left out of the file.
            Options = question.Options is [_, ..] ? question.Options : null,
            SpeakText = string.IsNullOrWhiteSpace(question.SpeakText) ? null : question.SpeakText,
            SpeakAnswer = string.IsNullOrWhiteSpace(question.SpeakAnswer) ? null : question.SpeakAnswer,
        }).ToList();
        var quiz = new Quiz(draft.Name!.Trim(), subject, difficulty, draft.DefaultTime!.Value, questions);
        JsonFile.Write(QuizFile(subject, difficulty), quiz);
        if (originalDifficulty is { } original && original != difficulty) File.Delete(QuizFile(subject, original));
        return Outcome<Quiz>.Saved(quiz);
    }

    /// <summary>The Quiz occupying this Difficulty; a broken file there has no name.</summary>
    public QuizRef OccupantOf(string subject, int difficulty) =>
        new(subject, difficulty, FindQuiz(subject, difficulty)?.Name ?? "");

    /// <summary>Removes the Quiz at this Difficulty; false if there is none.</summary>
    public bool DeleteQuiz(string subject, int difficulty)
    {
        if (!SubjectExists(subject) || !File.Exists(QuizFile(subject, difficulty))) return false;
        File.Delete(QuizFile(subject, difficulty));
        return true;
    }

    // ---- Files ----

    private string SubjectFile(string key) => Path.Combine(paths.QuizzesDirectory, key, QuizLayout.SubjectFileName);

    private string QuizFile(string subject, int difficulty) =>
        Path.Combine(paths.QuizzesDirectory, subject, QuizLayout.QuizFileName(difficulty));

    private IEnumerable<Quiz>? Load(string subject)
    {
        if (!SubjectExists(subject)) return null;

        return Directory.EnumerateFiles(Path.Combine(paths.QuizzesDirectory, subject), "*.json")
            .Select(file => QuizLayout.TryDifficultyOf(Path.GetFileName(file), out var difficulty) ? ReadQuiz(file, difficulty) : null)
            .OfType<Quiz>()
            .OrderBy(quiz => quiz.Difficulty)
            .ToList();
    }

    /// <summary>The Quiz in the file at this Difficulty; null if there is none or it is broken.</summary>
    private Quiz? ReadQuiz(string file, int difficulty)
    {
        if (!File.Exists(file)) return null;
        // The file name is the Difficulty, whatever the file says.
        if (JsonFile.TryRead<Quiz>(file, logger) is { Name: not null, Questions: { } questions } quiz && questions.All(question => question?.Type is not null))
            return quiz with { Difficulty = difficulty };

        logger.LogWarning("Quiz file {File} is broken; it is left out", file);
        return null;
    }
}
