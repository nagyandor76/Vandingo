using Vandingo.Api.Validation;

namespace Vandingo.Api.Quizzes;

public enum OutcomeKind { Saved, Invalid, Occupied, NotFound }

/// <summary>
/// What became of a change to the Quiz library: saved (with what was written), invalid (with every reason),
/// refused because its place is occupied (with the Quizzes occupying it, if it is about Quizzes),
/// or refused because the Subject or Quiz does not exist.
/// </summary>
public sealed record Outcome<T>(OutcomeKind Kind, T? Value, IReadOnlyList<ValidationError> Errors, IReadOnlyList<QuizRef> OccupiedBy)
{
    public static Outcome<T> Saved(T value) => new(OutcomeKind.Saved, value, [], []);
    public static Outcome<T> Invalid(IReadOnlyList<ValidationError> errors) => new(OutcomeKind.Invalid, default, errors, []);
    public static Outcome<T> Occupied(IReadOnlyList<QuizRef>? occupiedBy = null) => new(OutcomeKind.Occupied, default, [], occupiedBy ?? []);
    public static Outcome<T> NotFound() => new(OutcomeKind.NotFound, default, [], []);
}
