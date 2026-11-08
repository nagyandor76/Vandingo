using System.Text.RegularExpressions;

namespace Vandingo.Api.Quizzes;

/// <summary>
/// How Subjects and Quizzes are laid out as files, in the data directory, the initial-quiz source and an uploaded ZIP alike:
/// a folder per Subject named by its key, holding its <c>subject.json</c> and a <c>&lt;difficulty&gt;.json</c> per Quiz.
/// </summary>
public static partial class QuizLayout
{
    public const string SubjectFileName = "subject.json";

    public static string QuizFileName(int difficulty) => $"{difficulty}.json";

    /// <summary>
    /// Whether the file name is a Quiz's (digits only, then <c>.json</c>), and its Difficulty if so.
    /// Whether that Difficulty is in range is up to the Quiz rules.
    /// </summary>
    public static bool TryDifficultyOf(string fileName, out int difficulty)
    {
        difficulty = 0;
        if (!fileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase)) return false;
        var number = fileName[..^".json".Length];
        return number.Length > 0 && number.All(char.IsAsciiDigit) && int.TryParse(number, out difficulty);
    }

    /// <summary>A Subject key: lowercase letters, digits and hyphens, so it is always a safe folder name.</summary>
    public static bool IsSubjectKey(string? key) => key is not null && KeyPattern().IsMatch(key);

    [GeneratedRegex("^[a-z0-9-]+$")]
    private static partial Regex KeyPattern();
}
