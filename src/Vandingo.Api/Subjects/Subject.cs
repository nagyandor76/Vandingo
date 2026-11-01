using System.Text.Json.Serialization;

namespace Vandingo.Api.Subjects;

/// <summary>A Subject as stored in its <c>subject.json</c> (snake_case keys).</summary>
public sealed record Subject(
    [property: JsonPropertyName("key")] string Key,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("max_questions")] int MaxQuestions,
    [property: JsonPropertyName("auto_advance")] bool AutoAdvance);
