using Vandingo.Api.Validation;

namespace Vandingo.Api.Quizzes;

/// <summary>What a Quiz must satisfy before it is saved: the Quiz as a whole, and each Question by its type's rules.</summary>
public static class QuizRules
{
    public const int MinQuestions = 5;
    public const int MinDifficulty = 1;
    public const int MaxDifficulty = 20;

    /// <summary>Every question type, each with the check of the fields it uses.</summary>
    private static readonly Dictionary<string, Func<Question, (string Field, string Message)?>> TypeRules = new()
    {
        ["true-false"] = question => question.Answer is ["true"] or ["false"]
            ? null
            : ("answer", "A válasz Igaz vagy Hamis lehet."),
        ["word-matching"] = question => question.Answer is [var meaning] && !string.IsNullOrWhiteSpace(meaning)
            ? null
            : ("answer", "Pontosan egy magyar jelentés kell."),
        ["multiple-choice"] = ChoicesAndAnswers,
        ["ordered"] = ChoicesAndAnswers,
    };

    /// <summary>Everything wrong with the draft to be saved at this Difficulty; empty if it can be saved.</summary>
    public static IReadOnlyList<ValidationError> Check(int difficulty, QuizDraft draft)
    {
        var errors = new List<ValidationError>();
        if (difficulty is < MinDifficulty or > MaxDifficulty)
            errors.Add(new(null, "difficulty", $"A szint {MinDifficulty} és {MaxDifficulty} közötti egész szám lehet."));
        if (string.IsNullOrWhiteSpace(draft.Name))
            errors.Add(new(null, "name", "A kvíz neve nem lehet üres."));
        if (draft.DefaultTime is not > 0)
            errors.Add(new(null, "default_time", "Az alapidő kötelező, és legalább 1 másodperc."));

        var questions = draft.Questions ?? [];
        if (questions.Count < MinQuestions)
            errors.Add(new(null, "questions", $"Egy kvízben legalább {MinQuestions} kérdés kell, most {questions.Count} van."));
        for (var row = 0; row < questions.Count; row++)
        {
            if (CheckQuestion(questions[row]) is var (field, message)) errors.Add(new(row, field, message));
        }
        return errors;
    }

    /// <summary>The first thing wrong with the Question, if any.</summary>
    private static (string Field, string Message)? CheckQuestion(Question? question)
    {
        // The draft comes straight from the request, so any field may be missing despite its type.
        if (question?.Type is null || !TypeRules.TryGetValue(question.Type, out var typeRule))
            return ("type", "Ismeretlen kérdéstípus.");
        if (string.IsNullOrWhiteSpace(question.Text)) return ("text", "A kérdés szövege nem lehet üres.");
        if (question.Time is <= 0) return ("time", "Az idő legalább 1 másodperc.");
        return typeRule(question);
    }

    private static (string Field, string Message)? ChoicesAndAnswers(Question question)
    {
        var options = question.Options ?? [];
        if (options.Count < 2 || options.Any(string.IsNullOrWhiteSpace))
            return ("options", "Legalább 2 nem üres válaszlehetőség kell.");
        var answer = question.Answer ?? [];
        if (answer.Count == 0) return ("answer", "Legalább egy helyes válasz kell.");
        if (answer.FirstOrDefault(item => !options.Contains(item)) is { } unknown)
            return ("answer", $"A(z) „{unknown}” nincs a válaszlehetőségek között.");
        return null;
    }
}
