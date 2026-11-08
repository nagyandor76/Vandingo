namespace Vandingo.Api.Storage;

/// <summary>
/// Where the app keeps its data (<c>Vandingo:DataDirectory</c>) and where the initial quizzes
/// shipped with the repo live (<c>Vandingo:SeedDirectory</c>). Relative paths are resolved
/// against the content root.
/// </summary>
public sealed partial record DataPaths(string DataDirectory, string SeedDirectory)
{
    /// <summary>
    /// Whether a name taken from a request is safe to use as a file or folder name in the data directory:
    /// lowercase letters, digits and hyphens only, so it can never reach outside its folder.
    /// </summary>
    public static bool IsPlainName(string? name) => name is not null && PlainName().IsMatch(name);

    [System.Text.RegularExpressions.GeneratedRegex("^[a-z0-9-]+$")]
    private static partial System.Text.RegularExpressions.Regex PlainName();

    public string QuizzesDirectory => Path.Combine(DataDirectory, "Quizzes");

    public string ResultsDirectory => Path.Combine(DataDirectory, "results");

    public static DataPaths FromConfiguration(IConfiguration configuration, string contentRoot)
    {
        var data = configuration["Vandingo:DataDirectory"] ?? "/data";
        var seed = configuration["Vandingo:SeedDirectory"] ?? Path.Combine(AppContext.BaseDirectory, "Quizzes");
        return new DataPaths(Path.GetFullPath(data, contentRoot), Path.GetFullPath(seed, contentRoot));
    }
}
