using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Vandingo.Api.Tests.Support;

/// <summary>
/// The whole application in memory, with a throwaway data directory and a throwaway
/// initial-quiz directory standing in for the repo's Quizzes folder.
/// </summary>
public sealed class VandingoApp : WebApplicationFactory<Program>
{
    private readonly string root = Path.Combine(Path.GetTempPath(), "vandingo-tests", Guid.NewGuid().ToString("N"));

    public VandingoApp()
    {
        Directory.CreateDirectory(DataDirectory);
        Directory.CreateDirectory(SeedDirectory);
    }

    public string DataDirectory => Path.Combine(root, "data");
    public string SeedDirectory => Path.Combine(root, "seed");

    /// <summary>Writes a file under the data directory, before the app starts.</summary>
    public void WriteData(string relativePath, string content) => Write(DataDirectory, relativePath, content);

    /// <summary>Writes a file under the initial-quiz directory, before the app starts.</summary>
    public void WriteSeed(string relativePath, string content) => Write(SeedDirectory, relativePath, content);

    public string ReadData(string relativePath) => File.ReadAllText(Path.Combine(DataDirectory, relativePath));

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Vandingo:DataDirectory", DataDirectory);
        builder.UseSetting("Vandingo:SeedDirectory", SeedDirectory);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (Directory.Exists(root)) Directory.Delete(root, recursive: true);
    }

    private static void Write(string baseDirectory, string relativePath, string content)
    {
        var path = Path.Combine(baseDirectory, relativePath);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        File.WriteAllText(path, content);
    }
}
