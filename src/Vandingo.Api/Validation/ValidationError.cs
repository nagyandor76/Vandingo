using System.Text.Json.Serialization;

namespace Vandingo.Api.Validation;

/// <summary>
/// Why something can't be saved: the field at fault, and for a Question also its row
/// (0-based index in <c>questions</c>); errors about the whole thing have no row.
/// </summary>
public sealed record ValidationError(
    [property: JsonPropertyName("row"), JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] int? Row,
    [property: JsonPropertyName("field")] string Field,
    [property: JsonPropertyName("message")] string Message)
{
    /// <summary>The 400 response listing the errors.</summary>
    public static IResult Response(IEnumerable<ValidationError> errors) => TypedResults.BadRequest(new { errors });
}
