using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Vandingo.Api.Tests.Support;

namespace Vandingo.Api.Tests;

public class SeedApiTests
{
    private const string History = """
        { "key": "history", "name": "Történelem", "max_questions": 20, "auto_advance": false }
        """;

    private const string English = """
        { "key": "english", "name": "Angol", "max_questions": 15, "auto_advance": true }
        """;

    /// <summary>A valid Quiz of <paramref name="questions"/> true–false Questions (5 is the least a Quiz may have).</summary>
    private static string Quiz(string subject, int difficulty, string name, int questions = 5) => $$"""
        { "name": "{{name}}", "subject": "{{subject}}", "difficulty": {{difficulty}}, "default_time": 14, "questions": [
          {{string.Join(",\n", Enumerable.Range(1, questions).Select(n => $$"""{ "type": "true-false", "text": "Állítás {{n}}", "answer": ["true"] }"""))}}
        ] }
        """;

    private static async Task<JsonElement> Seed(VandingoApp app)
    {
        var response = await app.CreateClient().PostAsync("/api/seed", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    [Fact]
    public async Task New_Quiz_in_the_source_is_copied_and_listed()
    {
        using var app = new VandingoApp();
        app.WriteSeed("history/subject.json", History);
        app.WriteSeed("history/3.json", Quiz("history", 3, "Egyiptom"));
        await app.CreateClient().GetAsync("/api/subjects"); // startup copy
        app.WriteSeed("history/5.json", Quiz("history", 5, "Róma"));

        var copied = await Seed(app);

        var item = Assert.Single(copied.EnumerateArray());
        Assert.Equal("history", item.GetProperty("subject").GetString());
        Assert.Equal(5, item.GetProperty("difficulty").GetInt32());
        Assert.Equal("Róma", item.GetProperty("name").GetString());
        var quiz = await app.CreateClient().GetFromJsonAsync<JsonElement>("/api/subjects/history/quizzes/5");
        Assert.Equal("Róma", quiz.GetProperty("name").GetString());
    }

    [Fact]
    public async Task New_Subject_in_the_source_is_created_with_its_settings_and_listed()
    {
        using var app = new VandingoApp();
        app.WriteSeed("history/subject.json", History);
        await app.CreateClient().GetAsync("/api/subjects");
        app.WriteSeed("english/subject.json", English);
        app.WriteSeed("english/1.json", Quiz("english", 1, "Állatok"));

        var copied = (await Seed(app)).EnumerateArray().ToList();

        Assert.Contains(copied, c => c.GetProperty("subject").GetString() == "english"
            && c.GetProperty("difficulty").ValueKind == JsonValueKind.Null
            && c.GetProperty("name").GetString() == "Angol");
        Assert.Contains(copied, c => c.GetProperty("difficulty").ValueKind == JsonValueKind.Number
            && c.GetProperty("name").GetString() == "Állatok");
        var subjects = await app.CreateClient().GetFromJsonAsync<JsonElement>("/api/subjects");
        Assert.Equal(
            ["english Angol 15 True", "history Történelem 20 False"],
            subjects.EnumerateArray().Select(s => string.Join(' ',
                s.GetProperty("key").GetString(), s.GetProperty("name").GetString(),
                s.GetProperty("max_questions").GetInt32(), s.GetProperty("auto_advance").GetBoolean())));
    }

    [Fact]
    public async Task Edited_Quiz_and_changed_Subject_settings_are_not_overwritten()
    {
        using var app = new VandingoApp();
        const string edited = """
            { "name": "Szerkesztett", "subject": "history", "difficulty": 3, "default_time": 10, "questions": [] }
            """;
        const string changedSubject = """
            { "key": "history", "name": "Történelem", "max_questions": 5, "auto_advance": true }
            """;
        app.WriteData("Quizzes/history/subject.json", changedSubject);
        app.WriteData("Quizzes/history/3.json", edited);
        app.WriteSeed("history/subject.json", History);
        app.WriteSeed("history/3.json", Quiz("history", 3, "Egyiptom"));

        var copied = await Seed(app);

        Assert.Equal(0, copied.GetArrayLength());
        Assert.Equal(edited, app.ReadData("Quizzes/history/3.json"));
        Assert.Equal(changedSubject, app.ReadData("Quizzes/history/subject.json"));
    }

    [Fact]
    public async Task Without_anything_new_the_list_is_empty_and_nothing_changes()
    {
        using var app = new VandingoApp();
        app.WriteSeed("history/subject.json", History);
        app.WriteSeed("history/3.json", Quiz("history", 3, "Egyiptom"));
        await app.CreateClient().GetAsync("/api/subjects");

        var before = app.ReadData("Quizzes/history/3.json");

        var copied = await Seed(app);

        Assert.Equal(0, copied.GetArrayLength());
        Assert.Equal(before, app.ReadData("Quizzes/history/3.json"));
    }

    [Fact]
    public async Task A_source_Quiz_breaking_the_Quiz_rules_is_left_out_like_a_faulty_file()
    {
        using var app = new VandingoApp();
        app.WriteSeed("history/subject.json", History);
        await app.CreateClient().GetAsync("/api/subjects"); // startup copy
        app.WriteSeed("history/4.json", Quiz("history", 4, "Csak négy kérdés", questions: 4));
        app.WriteSeed("history/5.json", """{ "name": "Kérdések nélkül", "default_time": 10 }""");
        app.WriteSeed("history/6.json", Quiz("history", 6, "Spárta"));
        app.WriteSeed("history/99.json", Quiz("history", 99, "Túl magas szint"));

        var copied = await Seed(app);

        Assert.Equal([6], copied.EnumerateArray().Select(c => c.GetProperty("difficulty").GetInt32()));
        var quizzes = await app.CreateClient().GetFromJsonAsync<JsonElement>("/api/subjects/history/quizzes");
        Assert.Equal([6], quizzes.EnumerateArray().Select(quiz => quiz.GetProperty("difficulty").GetInt32()));
    }

    [Theory]
    [InlineData("ez nem JSON")]
    [InlineData("""{ "key": "english", "name": "", "max_questions": 15, "auto_advance": true }""")]
    [InlineData(null)]
    public async Task Quizzes_of_a_new_Subject_whose_subject_json_is_faulty_or_missing_are_not_taken_over_either(string? subjectJson)
    {
        using var app = new VandingoApp();
        app.WriteSeed("history/subject.json", History);
        await app.CreateClient().GetAsync("/api/subjects"); // startup copy
        if (subjectJson is not null) app.WriteSeed("english/subject.json", subjectJson);
        app.WriteSeed("english/1.json", Quiz("english", 1, "Állatok"));

        var copied = await Seed(app);

        Assert.Equal(0, copied.GetArrayLength());
        Assert.False(File.Exists(Path.Combine(app.DataDirectory, "Quizzes", "english", "1.json")));
    }

    [Fact]
    public async Task Faulty_source_file_is_left_out_and_everything_else_is_copied_whole()
    {
        using var app = new VandingoApp();
        app.WriteSeed("history/subject.json", History);
        await app.CreateClient().GetAsync("/api/subjects"); // startup copy
        app.WriteSeed("history/4.json", Quiz("history", 4, "Athén"));
        app.WriteSeed("history/5.json", "ez nem JSON");
        app.WriteSeed("history/6.json", Quiz("history", 6, "Spárta"));

        var copied = await Seed(app);

        Assert.Equal([4, 6], copied.EnumerateArray().Select(c => c.GetProperty("difficulty").GetInt32()));
        Assert.False(File.Exists(Path.Combine(app.DataDirectory, "Quizzes", "history", "5.json")));
        Assert.Empty(Directory.GetFiles(Path.Combine(app.DataDirectory, "Quizzes", "history"), "*.tmp"));
    }
}
