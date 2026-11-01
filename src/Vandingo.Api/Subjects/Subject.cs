using System.Text.Json.Serialization;

namespace Vandingo.Api.Subjects;

/// <summary>A Subject as stored in its <c>subject.json</c> (snake_case keys).</summary>
public sealed record Subject(
    [property: JsonPropertyName("key")] string Key,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("max_questions")] int MaxQuestions,
    [property: JsonPropertyName("auto_advance")] bool AutoAdvance);

/// <summary>A Subject as the Settings screen creates it; its settings start from the defaults.</summary>
public sealed record NewSubject(
    [property: JsonPropertyName("key")] string Key,
    [property: JsonPropertyName("name")] string Name);

/// <summary>The part of a Subject that can be changed after it was created.</summary>
public sealed record SubjectSettings(
    [property: JsonPropertyName("max_questions")] int MaxQuestions,
    [property: JsonPropertyName("auto_advance")] bool AutoAdvance);
