using System.Text.Json;
using Vandingo.Api.Storage;

namespace Vandingo.Api.Quizzes;

/// <summary>
/// Reads Quizzes from <c>Quizzes/&lt;subject&gt;/&lt;difficulty&gt;.json</c> in the data directory;
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

    private IEnumerable<Quiz>? Load(string subject)
    {
        var directory = Path.Combine(paths.QuizzesDirectory, subject);
        if (subject.IndexOfAny(['/', '\\', '.']) >= 0 || !File.Exists(Path.Combine(directory, "subject.json"))) return null;

        return Directory.EnumerateFiles(directory, "*.json")
            .Select(file => (file, difficulty: int.TryParse(Path.GetFileNameWithoutExtension(file), out var d) ? d : (int?)null))
            .Where(entry => entry.difficulty is not null)
            .OrderBy(entry => entry.difficulty)
            .Select(entry => JsonSerializer.Deserialize<Quiz>(File.ReadAllText(entry.file))! with { Difficulty = entry.difficulty!.Value });
    }
}
