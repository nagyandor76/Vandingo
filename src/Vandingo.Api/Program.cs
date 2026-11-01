using Vandingo.Api.Quizzes;
using Vandingo.Api.Results;
using Vandingo.Api.Storage;
using Vandingo.Api.Subjects;

var builder = WebApplication.CreateBuilder(args);

var paths = DataPaths.FromConfiguration(builder.Configuration, builder.Environment.ContentRootPath);
builder.Services.AddSingleton(paths);
builder.Services.AddSingleton<SubjectStore>();
builder.Services.AddSingleton<QuizStore>();
builder.Services.AddSingleton<ResultStore>();

var app = builder.Build();

InitialData.CopyIfEmpty(paths, app.Logger);

app.UseDefaultFiles();
app.UseStaticFiles();

var api = app.MapGroup("/api");
api.MapGet("/subjects", (SubjectStore subjects) => subjects.List());
api.MapGet("/subjects/{key}/quizzes", (string key, QuizStore quizzes) =>
    quizzes.List(key) is { } list ? Results.Ok(list) : Results.NotFound());
api.MapGet("/subjects/{key}/questions", (string key, int from, int to, QuizStore quizzes) =>
    quizzes.Questions(key, from, to) is { } questions ? Results.Ok(questions) : Results.NotFound());
api.MapPost("/results", (NewResult result, ResultStore results) =>
{
    var saved = results.Save(result);
    return Results.Created($"/api/results/{saved.Id}", saved);
});
api.MapGet("/results/{id}", (string id, ResultStore results) =>
    results.Find(id) is { } result ? Results.Ok(result) : Results.NotFound());
api.MapFallback(() => Results.NotFound());

app.MapFallbackToFile("index.html");

app.Run();

public partial class Program;
