using System.Text.Json.Serialization;

namespace Vandingo.Api.Results;

/// <summary>
/// A Result as stored in <c>results/&lt;id&gt;.json</c> (camelCase keys): the summary of one finished Practice.
/// The client submits everything but <see cref="Id"/> and <see cref="CompletedAt"/>, which the server always gives it.
/// The Quiz names are as they were at completion; Results from before they were recorded have none.
/// </summary>
public sealed record Result(
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
    [property: JsonPropertyName("elapsedSeconds")] int ElapsedSeconds)
{
    [JsonPropertyName("id"), JsonPropertyOrder(-2)]
    public string Id { get; init; } = "";

    [JsonPropertyName("completedAt"), JsonPropertyOrder(-1)]
    public DateTimeOffset CompletedAt { get; init; }
}
