using Microsoft.AspNetCore.Mvc;
using Vandingo.Api.Quizzes;
using Vandingo.Api.Results;
using Vandingo.Api.Storage;
using Vandingo.Api.Subjects;
using Vandingo.Api.Validation;

var builder = WebApplication.CreateBuilder(args);

var paths = DataPaths.FromConfiguration(builder.Configuration, builder.Environment.ContentRootPath);
builder.Services.AddSingleton(paths);
builder.Services.AddSingleton<SubjectStore>();
builder.Services.AddSingleton<QuizStore>();
builder.Services.AddSingleton<ResultStore>();
builder.Services.AddSingleton<QuizImport>();

var app = builder.Build();

InitialData.CopyIfEmpty(paths, app.Logger);

app.UseDefaultFiles();
app.UseStaticFiles();

var api = app.MapGroup("/api");
api.MapGet("/subjects", (SubjectStore subjects) => subjects.List());
api.MapPost("/subjects", (NewSubject subject, SubjectStore subjects) =>
{
    if (SubjectStore.Check(subject) is [_, ..] errors) return ValidationError.Response(errors);
    return subjects.Create(subject) is { } created
        ? Results.Created($"/api/subjects/{created.Key}", created)
        : Results.Conflict();
});
api.MapPut("/subjects/{key}", (string key, SubjectSettings settings, SubjectStore subjects) =>
{
    if (settings.MaxQuestions < 1)
        return ValidationError.Response([new(null, "max_questions", "Legalább 1 kérdés kell.")]);
    return subjects.Update(key, settings) is { } updated ? Results.Ok(updated) : Results.NotFound();
});
api.MapGet("/subjects/{key}/quizzes", (string key, QuizStore quizzes) =>
    quizzes.List(key) is { } list ? Results.Ok(list) : Results.NotFound());
api.MapGet("/subjects/{key}/quizzes/{difficulty:int}", (string key, int difficulty, QuizStore quizzes) =>
    quizzes.Find(key, difficulty) is { } quiz ? Results.Ok(quiz) : Results.NotFound());
api.MapPut("/subjects/{key}/quizzes/{difficulty:int}", (
    string key,
    int difficulty,
    [FromQuery(Name = "original_difficulty")] int? originalDifficulty,
    bool? overwrite,
    QuizDraft draft,
    QuizStore quizzes) =>
{
    if (QuizRules.Check(difficulty, draft) is [_, ..] errors) return ValidationError.Response(errors);
    return quizzes.Save(key, difficulty, draft, originalDifficulty, overwrite ?? false) switch
    {
        QuizStore.SaveOutcome.Saved => Results.Ok(),
        QuizStore.SaveOutcome.Occupied => Results.Conflict(),
        _ => Results.NotFound(),
    };
});
api.MapDelete("/subjects/{key}/quizzes/{difficulty:int}", (string key, int difficulty, QuizStore quizzes) =>
    quizzes.Delete(key, difficulty) ? Results.NoContent() : Results.NotFound());
api.MapGet("/subjects/{key}/questions", (string key, int from, int to, QuizStore quizzes) =>
    quizzes.Questions(key, from, to) is { } questions ? Results.Ok(questions) : Results.NotFound());
api.MapPost("/results", (NewResult result, ResultStore results) =>
{
    var saved = results.Save(result);
    return Results.Created($"/api/results/{saved.Id}", saved);
});
api.MapGet("/results", (string participant, int? limit, ResultStore results) =>
    results.List(participant, Math.Max(limit ?? 10, 0)));
api.MapGet("/results/{id}", (string id, ResultStore results) =>
    results.Find(id) is { } result ? Results.Ok(result) : Results.NotFound());
api.MapGet("/export", (DataPaths paths) => DataExport.Download(paths));
api.MapPost("/import", async (HttpRequest request, bool? overwrite, QuizImport import) =>
{
    // The ZIP needs a seekable stream, so the body is buffered first.
    using var body = new MemoryStream();
    await request.Body.CopyToAsync(body);
    body.Position = 0;
    return import.Run(body, overwrite ?? false) switch
    {
        QuizImport.Invalid invalid => TypedResults.BadRequest(new { errors = invalid.Errors }),
        QuizImport.Occupied occupied => TypedResults.Conflict(new { occupied = occupied.Quizzes }),
        QuizImport.Imported done => Results.Ok(new { quizzes = done.Quizzes, subjects = done.Subjects }),
        _ => Results.StatusCode(500),
    };
});
api.MapFallback(() => Results.NotFound());

app.MapFallbackToFile("index.html");

app.Run();

public partial class Program;
