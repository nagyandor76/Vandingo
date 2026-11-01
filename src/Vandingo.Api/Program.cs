using Vandingo.Api.Storage;
using Vandingo.Api.Subjects;

var builder = WebApplication.CreateBuilder(args);

var paths = DataPaths.FromConfiguration(builder.Configuration, builder.Environment.ContentRootPath);
builder.Services.AddSingleton(paths);
builder.Services.AddSingleton<SubjectStore>();

var app = builder.Build();

InitialData.CopyIfEmpty(paths, app.Logger);

app.UseDefaultFiles();
app.UseStaticFiles();

var api = app.MapGroup("/api");
api.MapGet("/subjects", (SubjectStore subjects) => subjects.List());
api.MapFallback(() => Results.NotFound());

app.MapFallbackToFile("index.html");

app.Run();

public partial class Program;
