using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Vandingo.Api.Quizzes;
using Vandingo.Api.Results;
using Vandingo.Api.Storage;
using Vandingo.Api.Subjects;
using Vandingo.Api.Validation;

var builder = WebApplication.CreateBuilder(args);

var paths = DataPaths.FromConfiguration(builder.Configuration, builder.Environment.ContentRootPath);
builder.Services.AddSingleton(paths);
builder.Services.AddSingleton<QuizLibrary>();
builder.Services.AddSingleton<ResultStore>();
builder.Services.AddSingleton<QuizBundleImport>();

var app = builder.Build();

app.Services.GetRequiredService<QuizBundleImport>().TakeOverInitialQuizzesIfEmpty();

app.UseDefaultFiles();
app.UseStaticFiles();

var api = app.MapGroup("/api");
api.MapGet("/subjects", (QuizLibrary library) => library.Subjects());
api.MapPost("/subjects", (NewSubject subject, QuizLibrary library) =>
    Respond(library.CreateSubject(subject), created => Results.Created($"/api/subjects/{created.Key}", created)));
api.MapPut("/subjects/{key}", (string key, SubjectSettings settings, QuizLibrary library) =>
    Respond(library.UpdateSubject(key, settings), Results.Ok));
api.MapGet("/subjects/{key}/quizzes", (string key, QuizLibrary library) =>
    library.Quizzes(key) is { } list ? Results.Ok(list) : Results.NotFound());
api.MapGet("/subjects/{key}/quizzes/{difficulty:int}", (string key, int difficulty, QuizLibrary library) =>
    library.FindQuiz(key, difficulty) is { } quiz ? Results.Ok(quiz) : Results.NotFound());
api.MapPut("/subjects/{key}/quizzes/{difficulty:int}", (
    string key,
    int difficulty,
    [FromQuery(Name = "original_difficulty")] int? originalDifficulty,
    bool? overwrite,
    QuizDraft draft,
    QuizLibrary library) =>
    Respond(library.SaveQuiz(key, difficulty, draft, originalDifficulty, overwrite ?? false), _ => Results.Ok()));
api.MapDelete("/subjects/{key}/quizzes/{difficulty:int}", (string key, int difficulty, QuizLibrary library) =>
    library.DeleteQuiz(key, difficulty) ? Results.NoContent() : Results.NotFound());
api.MapGet("/subjects/{key}/questions", (string key, int from, int to, QuizLibrary library) =>
    library.Questions(key, from, to) is { } questions ? Results.Ok(questions) : Results.NotFound());
api.MapPost("/results", (NewResult result, ResultStore results) =>
{
    var saved = results.Save(result);
    return Results.Created($"/api/results/{saved.Id}", saved);
});
api.MapGet("/results", (string participant, int? limit, ResultStore results) =>
    results.List(participant, Math.Max(limit ?? 10, 0)));
api.MapGet("/results/{id}", (string id, ResultStore results) =>
    results.Find(id) is { } result ? Results.Ok(result) : Results.NotFound());
api.MapPost("/seed", (QuizBundleImport import) => import.TakeOverFromSource());
api.MapGet("/export", (DataPaths paths) => DataExport.Download(paths));
api.MapPost("/import", async (HttpRequest request, bool? overwrite, QuizBundleImport import) =>
{
    // The ZIP needs a seekable stream, so the body is buffered first.
    using var body = new MemoryStream();
    await request.Body.CopyToAsync(body);
    body.Position = 0;
    return import.Upload(body, overwrite ?? false) switch
    {
        QuizBundleImport.Invalid invalid => TypedResults.BadRequest(new { errors = invalid.Errors }),
        QuizBundleImport.Occupied occupied => TypedResults.Conflict(new { occupied = occupied.Quizzes }),
        QuizBundleImport.Imported done => Results.Ok(new { quizzes = done.Quizzes, subjects = done.Subjects }),
        var other => throw new UnreachableException($"Unknown upload outcome {other}"),
    };
});
api.MapFallback(() => Results.NotFound());

app.MapFallbackToFile("index.html");

app.Run();

/// <summary>The HTTP response for what became of a change to the Quiz library.</summary>
static IResult Respond<T>(Outcome<T> outcome, Func<T, IResult> saved) => outcome.Kind switch
{
    OutcomeKind.Saved => saved(outcome.Value!),
    OutcomeKind.Invalid => ValidationError.Response(outcome.Errors),
    OutcomeKind.Occupied => Results.Conflict(),
    _ => Results.NotFound(),
};

public partial class Program;
