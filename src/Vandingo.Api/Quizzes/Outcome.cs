using Vandingo.Api.Validation;

namespace Vandingo.Api.Quizzes;

public enum OutcomeKind { Saved, Invalid, Occupied, NotFound }

/// <summary>
/// What became of a change to the Quiz library: saved (with what was written), invalid (with every reason),
/// refused because its place is occupied, or refused because the Subject or Quiz does not exist.
/// </summary>
public sealed record Outcome<T>(OutcomeKind Kind, T? Value, IReadOnlyList<ValidationError> Errors)
{
    public static Outcome<T> Saved(T value) => new(OutcomeKind.Saved, value, []);
    public static Outcome<T> Invalid(IReadOnlyList<ValidationError> errors) => new(OutcomeKind.Invalid, default, errors);
    public static Outcome<T> Occupied() => new(OutcomeKind.Occupied, default, []);
    public static Outcome<T> NotFound() => new(OutcomeKind.NotFound, default, []);
}
