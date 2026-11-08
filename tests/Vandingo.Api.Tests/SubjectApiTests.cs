using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Vandingo.Api.Tests.Support;

namespace Vandingo.Api.Tests;

public class SubjectApiTests
{
    private const string HistorySubject = """
        { "key": "history", "name": "Történelem", "max_questions": 20, "auto_advance": false }
        """;

    [Fact]
    public async Task A_new_Subject_gets_the_default_settings_and_appears_in_the_list()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        var client = app.CreateClient();

        var response = await client.PostAsJsonAsync("/api/subjects", new { key = "math-5", name = "Matematika" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var subjects = await client.GetFromJsonAsync<JsonElement>("/api/subjects");
        Assert.Equal(["history", "math-5"], subjects.EnumerateArray().Select(s => s.GetProperty("key").GetString()));
        var file = JsonSerializer.Deserialize<JsonElement>(app.ReadData("Quizzes/math-5/subject.json"));
        Assert.Equal("math-5", file.GetProperty("key").GetString());
        Assert.Equal("Matematika", file.GetProperty("name").GetString());
        Assert.Equal(20, file.GetProperty("max_questions").GetInt32());
        Assert.False(file.GetProperty("auto_advance").GetBoolean());
    }

    [Fact]
    public async Task Settings_can_be_changed_but_the_key_and_name_stay()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        var client = app.CreateClient();

        var response = await client.PutAsJsonAsync("/api/subjects/history",
            new { key = "tori", name = "Másik", max_questions = 12, auto_advance = true });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var subject = Assert.Single((await client.GetFromJsonAsync<JsonElement>("/api/subjects")).EnumerateArray());
        Assert.Equal("history", subject.GetProperty("key").GetString());
        Assert.Equal("Történelem", subject.GetProperty("name").GetString());
        Assert.Equal(12, subject.GetProperty("max_questions").GetInt32());
        Assert.True(subject.GetProperty("auto_advance").GetBoolean());
        Assert.False(Directory.Exists(Path.Combine(app.DataDirectory, "Quizzes", "tori")));
    }

    [Fact]
    public async Task A_maximum_below_one_Question_is_rejected()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);

        var response = await app.CreateClient().PutAsJsonAsync("/api/subjects/history",
            new { max_questions = 0, auto_advance = false });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(HistorySubject, app.ReadData("Quizzes/history/subject.json"));
    }

    [Fact]
    public async Task Settings_of_an_unknown_Subject_are_not_found()
    {
        using var app = new VandingoApp();

        var response = await app.CreateClient().PutAsJsonAsync("/api/subjects/nosuch",
            new { max_questions = 10, auto_advance = false });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.False(Directory.Exists(Path.Combine(app.DataDirectory, "Quizzes", "nosuch")));
    }

    [Theory]
    [InlineData("History")]
    [InlineData("törit")]
    [InlineData("math 5")]
    [InlineData("../evil")]
    [InlineData("")]
    public async Task A_key_with_anything_but_lowercase_letters_digits_and_hyphens_is_rejected(string key)
    {
        using var app = new VandingoApp();

        var response = await app.CreateClient().PostAsJsonAsync("/api/subjects", new { key, name = "Valami" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.False(Directory.Exists(Path.Combine(app.DataDirectory, "Quizzes")) &&
            Directory.EnumerateFileSystemEntries(Path.Combine(app.DataDirectory, "Quizzes")).Any());
    }

    [Fact]
    public async Task A_Subject_without_a_name_is_rejected()
    {
        using var app = new VandingoApp();

        var response = await app.CreateClient().PostAsJsonAsync("/api/subjects", new { key = "math", name = "  " });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Folders_with_an_invalid_key_or_a_broken_subject_json_are_not_listed_and_the_rest_still_are()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        app.WriteData("Quizzes/Math/subject.json", """
            { "key": "Math", "name": "Matek", "max_questions": 20, "auto_advance": false }
            """);
        app.WriteData("Quizzes/english/subject.json", "ez nem JSON");

        var subjects = await app.CreateClient().GetFromJsonAsync<JsonElement>("/api/subjects");

        Assert.Equal(["history"], subjects.EnumerateArray().Select(subject => subject.GetProperty("key").GetString()));
    }

    [Fact]
    public async Task A_Subject_with_a_broken_subject_json_is_not_found_anywhere_and_nothing_is_written_into_it()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", "ez nem JSON");
        var client = app.CreateClient();

        var settings = await client.PutAsJsonAsync("/api/subjects/history", new { max_questions = 10, auto_advance = false });
        var quizzes = await client.GetAsync("/api/subjects/history/quizzes");
        var save = await client.PutAsJsonAsync("/api/subjects/history/quizzes/3", new
        {
            name = "Egyiptom",
            default_time = 10,
            questions = Enumerable.Range(1, 5).Select(n => new { type = "true-false", text = $"Állítás {n}", answer = new[] { "true" } }),
        });

        Assert.Equal(
            [HttpStatusCode.NotFound, HttpStatusCode.NotFound, HttpStatusCode.NotFound],
            new[] { settings.StatusCode, quizzes.StatusCode, save.StatusCode });
        Assert.False(File.Exists(Path.Combine(app.DataDirectory, "Quizzes", "history", "3.json")));
    }

    [Fact]
    public async Task A_taken_key_is_a_conflict_and_leaves_the_existing_Subject_alone()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);

        var response = await app.CreateClient().PostAsJsonAsync("/api/subjects", new { key = "history", name = "Másik" });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal(HistorySubject, app.ReadData("Quizzes/history/subject.json"));
    }
}
