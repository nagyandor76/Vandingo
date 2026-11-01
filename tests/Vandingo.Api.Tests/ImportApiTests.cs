using System.IO.Compression;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Vandingo.Api.Tests.Support;

namespace Vandingo.Api.Tests;

public class ImportApiTests
{
    private const string HistorySubject = """
        { "key": "history", "name": "Történelem", "max_questions": 7, "auto_advance": true }
        """;

    private static string QuizJson(string name, int defaultTime = 10) => $$"""
        { "name": "{{name}}", "default_time": {{defaultTime}}, "questions": [
          { "type": "true-false", "text": "Egy", "answer": ["true"] },
          { "type": "true-false", "text": "Kettő", "answer": ["false"] },
          { "type": "true-false", "text": "Három", "answer": ["true"] },
          { "type": "true-false", "text": "Négy", "answer": ["true"] },
          { "type": "true-false", "text": "Öt", "answer": ["true"] }
        ] }
        """;

    private static ByteArrayContent ZipOf(IReadOnlyDictionary<string, string> files)
    {
        var stream = new MemoryStream();
        using (var zip = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (var (path, content) in files)
            {
                using var writer = new StreamWriter(zip.CreateEntry(path).Open());
                writer.Write(content);
            }
        }
        return new ByteArrayContent(stream.ToArray());
    }

    private static async Task<string[]> QuizListOf(HttpClient client, string subject) =>
        (await client.GetFromJsonAsync<JsonElement>($"/api/subjects/{subject}/quizzes"))
            .EnumerateArray()
            .Select(quiz => $"{quiz.GetProperty("difficulty").GetInt32()} {quiz.GetProperty("name").GetString()}")
            .ToArray();

    [Theory]
    [InlineData("")]
    [InlineData("Quizzes/")]
    public async Task Valid_zip_loads_every_Quiz_onto_its_folders_Subject_and_file_names_Difficulty(string prefix)
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        var client = app.CreateClient();

        var response = await client.PostAsync("/api/import", ZipOf(new Dictionary<string, string>
        {
            [$"{prefix}history/3.json"] = QuizJson("Egyiptom"),
            [$"{prefix}history/10.json"] = QuizJson("Róma"),
            [$"{prefix}history/readme.txt"] = "figyelmen kívül marad",
            [$"{prefix}notes.txt"] = "figyelmen kívül marad",
        }));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(["3 Egyiptom", "10 Róma"], await QuizListOf(client, "history"));
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(
            ["history/3 Egyiptom", "history/10 Róma"],
            result.GetProperty("quizzes").EnumerateArray().Select(q =>
                $"{q.GetProperty("subject").GetString()}/{q.GetProperty("difficulty").GetInt32()} {q.GetProperty("name").GetString()}"));
        Assert.Empty(result.GetProperty("subjects").EnumerateArray());
        var saved = JsonDocument.Parse(app.ReadData("Quizzes/history/3.json")).RootElement;
        Assert.Equal("history", saved.GetProperty("subject").GetString());
        Assert.Equal(3, saved.GetProperty("difficulty").GetInt32());
    }

    [Fact]
    public async Task Unknown_Subject_is_created_from_its_subject_json_with_its_settings()
    {
        using var app = new VandingoApp();
        var client = app.CreateClient();

        var response = await client.PostAsync("/api/import", ZipOf(new Dictionary<string, string>
        {
            ["english/subject.json"] = """{ "key": "english", "name": "Angol", "max_questions": 12, "auto_advance": true }""",
            ["english/2.json"] = QuizJson("Állatok"),
        }));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var subjects = await client.GetFromJsonAsync<JsonElement>("/api/subjects");
        var english = Assert.Single(subjects.EnumerateArray());
        Assert.Equal("Angol", english.GetProperty("name").GetString());
        Assert.Equal(12, english.GetProperty("max_questions").GetInt32());
        Assert.True(english.GetProperty("auto_advance").GetBoolean());
        Assert.Equal(["2 Állatok"], await QuizListOf(client, "english"));
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("english", Assert.Single(result.GetProperty("subjects").EnumerateArray()).GetProperty("key").GetString());
    }

    [Fact]
    public async Task Unknown_Subject_without_a_valid_subject_json_is_an_error_and_nothing_is_written()
    {
        using var app = new VandingoApp();
        var client = app.CreateClient();

        var missing = await client.PostAsync("/api/import", ZipOf(new Dictionary<string, string>
        {
            ["english/2.json"] = QuizJson("Állatok"),
        }));
        var broken = await client.PostAsync("/api/import", ZipOf(new Dictionary<string, string>
        {
            ["english/subject.json"] = """{ "key": "Angol!", "name": "Angol", "max_questions": 12, "auto_advance": true }""",
            ["english/2.json"] = QuizJson("Állatok"),
        }));

        Assert.Equal(HttpStatusCode.BadRequest, missing.StatusCode);
        var errors = (await missing.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("english/subject.json", Assert.Single(errors.EnumerateArray()).GetProperty("file").GetString());
        Assert.Equal(HttpStatusCode.BadRequest, broken.StatusCode);
        Assert.Equal("english/subject.json",
            (await broken.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors")[0].GetProperty("file").GetString());
        Assert.Empty(await client.GetFromJsonAsync<JsonElement[]>("/api/subjects") ?? []);
        Assert.False(Directory.Exists(Path.Combine(app.DataDirectory, "Quizzes", "english")));
    }

    [Fact]
    public async Task One_faulty_Quiz_file_gives_400_with_errors_per_file_and_no_Quiz_is_written()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        var client = app.CreateClient();

        var response = await client.PostAsync("/api/import", ZipOf(new Dictionary<string, string>
        {
            ["history/1.json"] = QuizJson("Jó"),
            ["history/2.json"] = QuizJson("Jó"),
            ["history/3.json"] = """
                { "name": "Rossz", "default_time": 10, "questions": [
                  { "type": "true-false", "text": "Egy", "answer": ["talán"] },
                  { "type": "true-false", "text": "Kettő", "answer": ["true"] },
                  { "type": "true-false", "text": "Három", "answer": ["true"] },
                  { "type": "true-false", "text": "Négy", "answer": ["true"] },
                  { "type": "true-false", "text": "Öt", "answer": ["true"] }
                ] }
                """,
            ["history/4.json"] = "ez nem JSON",
            ["history/25.json"] = QuizJson("Túl magas"),
        }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").EnumerateArray().ToList();
        Assert.Equal(["history/25.json", "history/3.json", "history/4.json"], errors.Select(e => e.GetProperty("file").GetString()).Order());
        var wrongAnswer = errors.Single(e => e.GetProperty("file").GetString() == "history/3.json");
        Assert.Equal(0, wrongAnswer.GetProperty("row").GetInt32());
        Assert.Equal("answer", wrongAnswer.GetProperty("field").GetString());
        Assert.False(string.IsNullOrWhiteSpace(wrongAnswer.GetProperty("message").GetString()));
        Assert.Empty(await QuizListOf(client, "history"));
    }

    [Fact]
    public async Task Occupied_Difficulty_without_overwrite_gives_409_listing_it_and_nothing_changes_but_with_overwrite_it_is_replaced()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        app.WriteData("Quizzes/history/3.json", QuizJson("Régi"));
        var client = app.CreateClient();
        var zip = new Dictionary<string, string>
        {
            ["history/3.json"] = QuizJson("Új"),
            ["history/4.json"] = QuizJson("Másik"),
        };

        var conflict = await client.PostAsync("/api/import", ZipOf(zip));

        Assert.Equal(HttpStatusCode.Conflict, conflict.StatusCode);
        var occupied = Assert.Single((await conflict.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("occupied").EnumerateArray());
        Assert.Equal("history", occupied.GetProperty("subject").GetString());
        Assert.Equal(3, occupied.GetProperty("difficulty").GetInt32());
        Assert.Equal("Régi", occupied.GetProperty("name").GetString());
        Assert.Equal(["3 Régi"], await QuizListOf(client, "history"));

        var overwritten = await client.PostAsync("/api/import?overwrite=true", ZipOf(zip));

        Assert.Equal(HttpStatusCode.OK, overwritten.StatusCode);
        Assert.Equal(["3 Új", "4 Másik"], await QuizListOf(client, "history"));
    }

    [Fact]
    public async Task Faulty_file_wins_over_an_occupied_Difficulty_and_still_nothing_is_written()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        app.WriteData("Quizzes/history/3.json", QuizJson("Régi"));
        var client = app.CreateClient();

        var response = await client.PostAsync("/api/import?overwrite=true", ZipOf(new Dictionary<string, string>
        {
            ["history/3.json"] = QuizJson("Új"),
            ["history/4.json"] = "{}",
        }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(["3 Régi"], await QuizListOf(client, "history"));
    }

    [Fact]
    public async Task Export_zip_can_be_uploaded_back_without_touching_Results()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        app.WriteData("Quizzes/history/3.json", QuizJson("Egyiptom"));
        app.WriteData("results/abc.json", """{ "id": "abc", "participant": "Panni" }""");
        var client = app.CreateClient();
        var exported = await (await client.GetAsync("/api/export")).Content.ReadAsByteArrayAsync();
        app.WriteData("Quizzes/history/3.json", QuizJson("Átírva"));
        app.WriteData("results/def.json", """{ "id": "def", "participant": "Panni" }""");

        var response = await client.PostAsync("/api/import?overwrite=true", new ByteArrayContent(exported));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(["3 Egyiptom"], await QuizListOf(client, "history"));
        Assert.Equal("""{ "id": "def", "participant": "Panni" }""", app.ReadData("results/def.json"));
        Assert.Equal("""{ "id": "abc", "participant": "Panni" }""", app.ReadData("results/abc.json"));
    }

    [Fact]
    public async Task Existing_Subjects_settings_do_not_change_even_if_the_zips_subject_json_differs()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        var client = app.CreateClient();

        var response = await client.PostAsync("/api/import", ZipOf(new Dictionary<string, string>
        {
            ["history/subject.json"] = """{ "key": "history", "name": "Más név", "max_questions": 99, "auto_advance": false }""",
            ["history/1.json"] = QuizJson("Új"),
        }));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var subject = Assert.Single(await client.GetFromJsonAsync<JsonElement[]>("/api/subjects") ?? []);
        Assert.Equal("Történelem", subject.GetProperty("name").GetString());
        Assert.Equal(7, subject.GetProperty("max_questions").GetInt32());
        Assert.True(subject.GetProperty("auto_advance").GetBoolean());
    }

    [Fact]
    public async Task Something_that_is_not_a_zip_gives_400()
    {
        using var app = new VandingoApp();

        var response = await app.CreateClient().PostAsync("/api/import", new ByteArrayContent("nem zip"u8.ToArray()));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Corrupt_zip_entry_gives_400_for_that_file_and_nothing_is_written()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        var client = app.CreateClient();
        var bytes = ZipOf(new Dictionary<string, string>
        {
            ["history/1.json"] = QuizJson("Jó"),
            ["history/2.json"] = QuizJson("Sérült") + new string(' ', 4000),
        }).ReadAsByteArrayAsync().Result;
        CorruptData(bytes, "history/2.json");

        var response = await client.PostAsync("/api/import", new ByteArrayContent(bytes));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").EnumerateArray().ToList();
        Assert.Equal("history/2.json", Assert.Single(errors).GetProperty("file").GetString());
        Assert.Empty(await QuizListOf(client, "history"));
    }

    // Overwrites the compressed data of one entry (found by its local header) with bytes that are not valid deflate.
    private static void CorruptData(byte[] zip, string name)
    {
        var nameBytes = System.Text.Encoding.UTF8.GetBytes(name);
        for (var i = 0; i + 30 + nameBytes.Length < zip.Length; i++)
        {
            if (zip[i] != 0x50 || zip[i + 1] != 0x4B || zip[i + 2] != 3 || zip[i + 3] != 4) continue;
            if (!zip.AsSpan(i + 30, nameBytes.Length).SequenceEqual(nameBytes)) continue;
            var start = i + 30 + nameBytes.Length + BitConverter.ToUInt16(zip, i + 28);
            for (var k = 0; k < 8; k++) zip[start + k] = 0xFF;
            return;
        }
        throw new InvalidOperationException("entry not found");
    }

    [Fact]
    public async Task Files_that_are_not_Quiz_or_Subject_files_are_left_out_without_error()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        var client = app.CreateClient();

        var response = await client.PostAsync("/api/import", ZipOf(new Dictionary<string, string>
        {
            ["history/3.json"] = QuizJson("Egyiptom"),
            ["docs/readme.json"] = "nem Quiz",
            ["__MACOSX/._x.json"] = "nem Quiz",
            ["Quizzes/x.json"] = "nem Quiz",
            ["history/notes.json"] = "nem Quiz",
        }));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(["3 Egyiptom"], await QuizListOf(client, "history"));
    }

    [Fact]
    public async Task Quiz_file_in_a_folder_with_an_invalid_Subject_key_is_still_an_error()
    {
        using var app = new VandingoApp();

        var response = await app.CreateClient().PostAsync("/api/import", ZipOf(new Dictionary<string, string>
        {
            ["Rossz_Kulcs/3.json"] = QuizJson("Egyiptom"),
        }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Two_subject_jsons_in_the_same_Subject_folder_are_an_error()
    {
        using var app = new VandingoApp();
        var client = app.CreateClient();

        var response = await client.PostAsync("/api/import", ZipOf(new Dictionary<string, string>
        {
            ["english/subject.json"] = """{ "key": "english", "name": "Angol", "max_questions": 12, "auto_advance": true }""",
            ["Quizzes/english/subject.json"] = """{ "key": "english", "name": "Másik", "max_questions": 5, "auto_advance": false }""",
            ["english/2.json"] = QuizJson("Állatok"),
        }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("english/subject.json", Assert.Single(errors.EnumerateArray()).GetProperty("file").GetString());
        Assert.Empty(await client.GetFromJsonAsync<JsonElement[]>("/api/subjects") ?? []);
    }
}
