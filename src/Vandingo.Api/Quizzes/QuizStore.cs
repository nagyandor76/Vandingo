using Vandingo.Api.Storage;

namespace Vandingo.Api.Quizzes;

/// <summary>
/// Keeps Quizzes in <c>Quizzes/&lt;subject&gt;/&lt;difficulty&gt;.json</c> in the data directory;
/// the file name is the Difficulty.
/// </summary>
public sealed class QuizStore(DataPaths paths)
{
    /// <summary>The Subject's Quizzes in Difficulty order, or null if there is no such Subject.</summary>
    public IReadOnlyList<QuizSummary>? List(string subject) =>
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

    /// <summary>The Quiz at this Difficulty, or null if there is none.</summary>
    public Quiz? Find(string subject, int difficulty) =>
        SubjectExists(subject) && File.Exists(FileOf(subject, difficulty))
            ? JsonFile.Read<Quiz>(FileOf(subject, difficulty)) with { Difficulty = difficulty }
            : null;

    /// <summary>
    /// Writes a checked Quiz to its Difficulty's file. A Quiz moved here from <paramref name="originalDifficulty"/>
    /// no longer stays there. Another Quiz already at this Difficulty is replaced only if <paramref name="overwrite"/>.
    /// </summary>
    public SaveOutcome Save(string subject, int difficulty, QuizDraft draft, int? originalDifficulty, bool overwrite)
    {
        if (!SubjectExists(subject)) return SaveOutcome.NoSuchSubject;
        if (difficulty != originalDifficulty && File.Exists(FileOf(subject, difficulty)) && !overwrite) return SaveOutcome.Occupied;

        var questions = draft.Questions!.Select(question => question with
        {
            // Empty cells of the Editor's grid are left out of the file.
            Options = question.Options is [_, ..] ? question.Options : null,
            SpeakText = string.IsNullOrWhiteSpace(question.SpeakText) ? null : question.SpeakText,
            SpeakAnswer = string.IsNullOrWhiteSpace(question.SpeakAnswer) ? null : question.SpeakAnswer,
        }).ToList();
        JsonFile.Write(FileOf(subject, difficulty), new Quiz(draft.Name!.Trim(), subject, difficulty, draft.DefaultTime!.Value, questions));
        if (originalDifficulty is { } original && original != difficulty) File.Delete(FileOf(subject, original));
        return SaveOutcome.Saved;
    }

    public enum SaveOutcome { Saved, NoSuchSubject, Occupied }

    /// <summary>Removes the Quiz at this Difficulty; false if there is none.</summary>
    public bool Delete(string subject, int difficulty)
    {
        if (!SubjectExists(subject) || !File.Exists(FileOf(subject, difficulty))) return false;
        File.Delete(FileOf(subject, difficulty));
        return true;
    }

    private bool SubjectExists(string subject) =>
        subject.IndexOfAny(['/', '\\', '.']) < 0 && File.Exists(Path.Combine(paths.QuizzesDirectory, subject, "subject.json"));

    private string FileOf(string subject, int difficulty) => Path.Combine(paths.QuizzesDirectory, subject, $"{difficulty}.json");

    private IEnumerable<Quiz>? Load(string subject)
    {
        if (!SubjectExists(subject)) return null;

        return Directory.EnumerateFiles(Path.Combine(paths.QuizzesDirectory, subject), "*.json")
            .Select(file => (file, difficulty: int.TryParse(Path.GetFileNameWithoutExtension(file), out var d) ? d : (int?)null))
            .Where(entry => entry.difficulty is not null)
            .OrderBy(entry => entry.difficulty)
            .Select(entry => JsonFile.Read<Quiz>(entry.file) with { Difficulty = entry.difficulty!.Value });
    }
}
