using System.Text.Json.Serialization;

namespace Vandingo.Api.Validation;

/// <summary>
/// Why something can't be saved: the field at fault, and for a Question also its row
/// (0-based index in <c>questions</c>); errors about the whole thing have no row.
/// An error of one file of an uploaded ZIP also names that <see cref="File"/> by its path inside the ZIP.
/// </summary>
public sealed record ValidationError(
    [property: JsonPropertyName("row"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] int? Row,
    [property: JsonPropertyName("field")] string Field,
    [property: JsonPropertyName("message")] string Message)
{
    [JsonPropertyName("file"), JsonPropertyOrder(-1), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? File { get; init; }

    /// <summary>An error of the file at this path inside a ZIP.</summary>
    public static ValidationError OfFile(string file, string field, string message) => new(null, field, message) { File = file };
}
