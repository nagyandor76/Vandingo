using System.IO.Compression;
using Vandingo.Api.Tests.Support;

namespace Vandingo.Api.Tests;

public class ExportApiTests
{
    [Fact]
    public async Task Export_downloads_every_file_of_the_data_directory_unchanged_in_a_dated_zip()
    {
        using var app = new VandingoApp();
        var files = new Dictionary<string, string>
        {
            ["Quizzes/history/subject.json"] = """{ "key": "history", "name": "Történelem", "max_questions": 20, "auto_advance": false }""",
            ["Quizzes/history/3.json"] = """{ "name": "Egyiptom", "subject": "history", "difficulty": 3, "default_time": 14, "questions": [] }""",
            ["results/abc.json"] = """{ "id": "abc", "participant": "Panni" }""",
        };
        foreach (var (path, content) in files) app.WriteData(path, content);

        var response = await app.CreateClient().GetAsync("/api/export");

        response.EnsureSuccessStatusCode();
        Assert.Equal("application/zip", response.Content.Headers.ContentType?.MediaType);
        var fileName = response.Content.Headers.ContentDisposition?.FileNameStar
            ?? response.Content.Headers.ContentDisposition?.FileName?.Trim('"');
        Assert.Contains(DateTime.Now.ToString("yyyy-MM-dd"), fileName);
        Assert.EndsWith(".zip", fileName);

        using var zip = new ZipArchive(await response.Content.ReadAsStreamAsync());
        var entries = zip.Entries.Where(e => e.Name != "").ToDictionary(
            e => e.FullName,
            e => new StreamReader(e.Open()).ReadToEnd());
        Assert.Equal(files.OrderBy(f => f.Key), entries.OrderBy(e => e.Key));
    }
}
