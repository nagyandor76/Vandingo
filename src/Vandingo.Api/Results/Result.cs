using System.Text.Json.Serialization;

namespace Vandingo.Api.Results;

/// <summary>A Result as stored in <c>results/&lt;id&gt;.json</c> (camelCase keys): the summary of one finished Practice. The Quiz names are as they were at completion; Results from before they were recorded have none.</summary>
public sealed record Result(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("completedAt")] DateTimeOffset CompletedAt,
    [property: JsonPropertyName("participant")] string Participant,
    [property: JsonPropertyName("subject")] string Subject,
    [property: JsonPropertyName("difficultyFrom")] int DifficultyFrom,
    [property: JsonPropertyName("difficultyTo")] int DifficultyTo,
    [property: JsonPropertyName("quizNameFrom"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? QuizNameFrom,
    [property: JsonPropertyName("quizNameTo"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? QuizNameTo,
    [property: JsonPropertyName("total")] int Total,
    [property: JsonPropertyName("correct")] int Correct,
    [property: JsonPropertyName("incorrect")] int Incorrect,
    [property: JsonPropertyName("scorePercent")] int ScorePercent,
    [property: JsonPropertyName("timeLimitSeconds")] int TimeLimitSeconds,
    [property: JsonPropertyName("elapsedSeconds")] int ElapsedSeconds);

/// <summary>A Result as the client submits it; the server gives it its id and completion time.</summary>
public sealed record NewResult(
    [property: JsonPropertyName("participant")] string Participant,
    [property: JsonPropertyName("subject")] string Subject,
    [property: JsonPropertyName("difficultyFrom")] int DifficultyFrom,
    [property: JsonPropertyName("difficultyTo")] int DifficultyTo,
    [property: JsonPropertyName("quizNameFrom"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? QuizNameFrom,
    [property: JsonPropertyName("quizNameTo"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? QuizNameTo,
    [property: JsonPropertyName("total")] int Total,
    [property: JsonPropertyName("correct")] int Correct,
    [property: JsonPropertyName("incorrect")] int Incorrect,
    [property: JsonPropertyName("scorePercent")] int ScorePercent,
    [property: JsonPropertyName("timeLimitSeconds")] int TimeLimitSeconds,
    [property: JsonPropertyName("elapsedSeconds")] int ElapsedSeconds);
