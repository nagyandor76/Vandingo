namespace Vandingo.Api.Storage;

/// <summary>
/// Where the app keeps its data (<c>Vandingo:DataDirectory</c>) and where the initial quizzes
/// shipped with the repo live (<c>Vandingo:SeedDirectory</c>). Relative paths are resolved
/// against the content root.
/// </summary>
public sealed record DataPaths(string DataDirectory, string SeedDirectory)
{
    public string QuizzesDirectory => Path.Combine(DataDirectory, "Quizzes");

    public string ResultsDirectory => Path.Combine(DataDirectory, "results");

    public static DataPaths FromConfiguration(IConfiguration configuration, string contentRoot)
    {
        var data = configuration["Vandingo:DataDirectory"] ?? "/data";
        var seed = configuration["Vandingo:SeedDirectory"] ?? Path.Combine(AppContext.BaseDirectory, "Quizzes");
        return new DataPaths(Path.GetFullPath(data, contentRoot), Path.GetFullPath(seed, contentRoot));
    }
}
