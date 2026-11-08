using System.Text.Json.Serialization;

namespace Vandingo.Api.Quizzes;

/// <summary>A Quiz as stored in <c>Quizzes/&lt;subject&gt;/&lt;difficulty&gt;.json</c> (snake_case keys).</summary>
public sealed record Quiz(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("subject")] string Subject,
    [property: JsonPropertyName("difficulty")] int Difficulty,
    [property: JsonPropertyName("default_time")] int DefaultTime,
    [property: JsonPropertyName("questions")] IReadOnlyList<Question> Questions);

/// <summary>One Question of a Quiz; which fields matter depends on its type.</summary>
public sealed record Question(
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("text")] string Text,
    [property: JsonPropertyName("options"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] IReadOnlyList<string>? Options,
    [property: JsonPropertyName("answer")] IReadOnlyList<string> Answer,
    [property: JsonPropertyName("time"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] int? Time,
    [property: JsonPropertyName("speak_text"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? SpeakText,
    [property: JsonPropertyName("speak_answer"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? SpeakAnswer);

/// <summary>What the Difficulty pickers need to know about a Quiz.</summary>
public sealed record QuizSummary(
    [property: JsonPropertyName("difficulty")] int Difficulty,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("question_counts")] IReadOnlyDictionary<string, int> QuestionCounts);

/// <summary>A Quiz by its Subject, Difficulty and name: one occupying a Difficulty, or one just saved.</summary>
public sealed record QuizRef(
    [property: JsonPropertyName("subject")] string Subject,
    [property: JsonPropertyName("difficulty")] int Difficulty,
    [property: JsonPropertyName("name")] string Name);

/// <summary>
/// A Quiz as the Editor saves it: its Subject and Difficulty come from where it is saved.
/// Anything may be missing until it is checked.
/// </summary>
public sealed record QuizDraft(
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("default_time")] int? DefaultTime,
    [property: JsonPropertyName("questions")] IReadOnlyList<Question>? Questions);
