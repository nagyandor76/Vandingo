using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Vandingo.Api.Tests.Support;

namespace Vandingo.Api.Tests;

public class QuizApiTests
{
    private const string HistorySubject = """
        { "key": "history", "name": "Történelem", "max_questions": 20, "auto_advance": false }
        """;

    [Fact]
    public async Task Quiz_list_gives_difficulty_name_and_question_count_per_type_in_difficulty_order()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        app.WriteData("Quizzes/history/10.json", """
            { "name": "Róma", "subject": "history", "difficulty": 10, "default_time": 10, "questions": [
              { "type": "multiple-choice", "text": "Melyek római császárok?", "options": ["Néró", "Kheopsz"], "answer": ["Néró"] }
            ] }
            """);
        app.WriteData("Quizzes/history/3.json", """
            { "name": "Egyiptom", "subject": "history", "difficulty": 3, "default_time": 14, "questions": [
              { "type": "true-false", "text": "A piramis Egyiptomban áll.", "answer": ["true"] },
              { "type": "true-false", "text": "A Nílus Európában folyik.", "answer": ["false"] },
              { "type": "word-matching", "text": "pyramid", "answer": ["piramis"] }
            ] }
            """);

        var quizzes = await app.CreateClient().GetFromJsonAsync<JsonElement>("/api/subjects/history/quizzes");

        Assert.Equal(
            ["3 Egyiptom true-false=2 word-matching=1", "10 Róma multiple-choice=1"],
            quizzes.EnumerateArray().Select(quiz => string.Join(' ',
                [
                    quiz.GetProperty("difficulty").GetInt32().ToString(),
                    quiz.GetProperty("name").GetString(),
                    .. quiz.GetProperty("question_counts").EnumerateObject().Select(count => $"{count.Name}={count.Value.GetInt32()}").Order(),
                ])));
    }

    [Fact]
    public async Task Questions_of_a_range_include_both_ends_with_time_resolved_against_the_Quiz_default()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        foreach (var (difficulty, defaultTime) in new[] { (1, 5), (2, 8), (4, 12), (5, 20) })
        {
            app.WriteData($"Quizzes/history/{difficulty}.json", $$"""
                { "name": "Szint {{difficulty}}", "subject": "history", "difficulty": {{difficulty}}, "default_time": {{defaultTime}}, "questions": [
                  { "type": "true-false", "text": "Állítás {{difficulty}}", "answer": ["true"] }
                ] }
                """);
        }
        app.WriteData("Quizzes/history/3.json", """
            { "name": "Egyiptom", "subject": "history", "difficulty": 3, "default_time": 14, "questions": [
              { "type": "true-false", "text": "A piramis Egyiptomban áll.", "answer": ["true"], "time": 10 },
              { "type": "word-matching", "text": "pyramid", "speak_text": "en-GB", "answer": ["piramis"] }
            ] }
            """);

        var questions = await app.CreateClient().GetFromJsonAsync<JsonElement>("/api/subjects/history/questions?from=2&to=4");

        Assert.Equal(
            ["Állítás 2/8", "A piramis Egyiptomban áll./10", "pyramid/14", "Állítás 4/12"],
            questions.EnumerateArray().Select(q => $"{q.GetProperty("text").GetString()}/{q.GetProperty("time").GetInt32()}"));
        var pyramid = questions[2];
        Assert.Equal("word-matching", pyramid.GetProperty("type").GetString());
        Assert.Equal("en-GB", pyramid.GetProperty("speak_text").GetString());
        Assert.Equal(["piramis"], pyramid.GetProperty("answer").EnumerateArray().Select(a => a.GetString()));
    }

    [Fact]
    public async Task A_saved_Quiz_of_every_question_type_can_be_loaded_back_from_its_own_file()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        var client = app.CreateClient();

        var response = await client.PutAsJsonAsync("/api/subjects/history/quizzes/7", ValidQuiz());

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var file = JsonSerializer.Deserialize<JsonElement>(app.ReadData("Quizzes/history/7.json"));
        Assert.Equal(["name", "subject", "difficulty", "default_time", "questions"], file.EnumerateObject().Select(p => p.Name));
        Assert.Equal("Görögök", file.GetProperty("name").GetString());
        Assert.Equal("history", file.GetProperty("subject").GetString());
        Assert.Equal(7, file.GetProperty("difficulty").GetInt32());
        Assert.Equal(10, file.GetProperty("default_time").GetInt32());
        var questions = file.GetProperty("questions");
        Assert.Equal(
            ["type,text,answer,time", "type,text,answer,speak_text", "type,text,options,answer,speak_answer", "type,text,options,answer", "type,text,answer"],
            questions.EnumerateArray().Select(q => string.Join(',', q.EnumerateObject().Select(p => p.Name))));
        Assert.Equal(["Spárta", "Athén"], questions[3].GetProperty("answer").EnumerateArray().Select(a => a.GetString()));

        var loaded = await client.GetFromJsonAsync<JsonElement>("/api/subjects/history/quizzes/7");
        Assert.Equal(JsonSerializer.Serialize(file), JsonSerializer.Serialize(loaded));
        var list = await client.GetFromJsonAsync<JsonElement>("/api/subjects/history/quizzes");
        Assert.Equal([7], list.EnumerateArray().Select(q => q.GetProperty("difficulty").GetInt32()));
    }

    [Fact]
    public async Task An_uploaded_Quiz_file_is_saved_to_the_chosen_Subject_and_the_path_Difficulty_whatever_its_own_subject_and_difficulty_say()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        var client = app.CreateClient();
        // The whole file as the Editor sends it after reading it: with its own `subject` and `difficulty`.
        var file = ValidQuiz();
        file["subject"] = "geography";
        file["difficulty"] = 3;

        var response = await client.PutAsJsonAsync("/api/subjects/history/quizzes/12", file);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var saved = JsonSerializer.Deserialize<JsonElement>(app.ReadData("Quizzes/history/12.json"));
        Assert.Equal("history", saved.GetProperty("subject").GetString());
        Assert.Equal(12, saved.GetProperty("difficulty").GetInt32());
        Assert.False(File.Exists(Path.Combine(app.DataDirectory, "Quizzes/history/3.json")));
        Assert.False(File.Exists(Path.Combine(app.DataDirectory, "Quizzes/geography/3.json")));
    }

    [Fact]
    public async Task A_Quiz_of_fewer_than_5_Questions_is_rejected_as_a_whole_and_not_written()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        var quiz = ValidQuiz();
        quiz["questions"] = ((List<Dictionary<string, object?>>)quiz["questions"]!).Take(4).ToList();

        var response = await app.CreateClient().PutAsJsonAsync("/api/subjects/history/quizzes/7", quiz);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = Assert.Single(await Errors(response));
        Assert.Equal("questions", error.GetProperty("field").GetString());
        Assert.False(error.TryGetProperty("row", out _));
        Assert.False(File.Exists(Path.Combine(app.DataDirectory, "Quizzes", "history", "7.json")));
    }

    [Theory]
    [InlineData("default_time", null)]
    [InlineData("default_time", 0)]
    [InlineData("name", null)]
    [InlineData("name", " ")]
    public async Task A_Quiz_without_a_default_time_or_name_is_rejected_and_not_written(string field, object? value)
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        var quiz = ValidQuiz();
        if (value is null) quiz.Remove(field); else quiz[field] = value;

        var response = await app.CreateClient().PutAsJsonAsync("/api/subjects/history/quizzes/7", quiz);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal([field], (await Errors(response)).Select(e => e.GetProperty("field").GetString()));
        Assert.False(File.Exists(Path.Combine(app.DataDirectory, "Quizzes", "history", "7.json")));
    }

    [Theory]
    [InlineData("""{ "type": "essay", "text": "Írj!", "answer": ["x"] }""", "type")]
    [InlineData("""{ "type": "true-false", "text": " ", "answer": ["true"] }""", "text")]
    [InlineData("""{ "type": "true-false", "text": "Állítás", "answer": ["igen"] }""", "answer")]
    [InlineData("""{ "type": "true-false", "text": "Állítás", "answer": ["true", "false"] }""", "answer")]
    [InlineData("""{ "type": "true-false", "text": "Állítás", "answer": ["true"], "time": 0 }""", "time")]
    [InlineData("""{ "type": "word-matching", "text": "temple", "answer": [] }""", "answer")]
    [InlineData("""{ "type": "word-matching", "text": "temple", "answer": ["templom", "szentély"] }""", "answer")]
    [InlineData("""{ "type": "multiple-choice", "text": "Melyik?", "options": ["Athén"], "answer": ["Athén"] }""", "options")]
    [InlineData("""{ "type": "multiple-choice", "text": "Melyik?", "options": ["Athén", "Róma"], "answer": [] }""", "answer")]
    [InlineData("""{ "type": "multiple-choice", "text": "Melyik?", "options": ["Athén", "Róma"], "answer": ["Spárta"] }""", "answer")]
    [InlineData("""{ "type": "ordered", "text": "Sorrend?", "answer": ["Athén", "Róma"] }""", "options")]
    [InlineData("""{ "type": "ordered", "text": "Sorrend?", "options": ["Athén", "Róma"], "answer": ["Róma", "Spárta"] }""", "answer")]
    public async Task A_Question_breaking_its_types_rules_is_reported_by_row_and_field_and_nothing_is_written(string question, string field)
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        var quiz = ValidQuiz();
        ((List<Dictionary<string, object?>>)quiz["questions"]!)[2] = JsonSerializer.Deserialize<Dictionary<string, object?>>(question)!;

        var response = await app.CreateClient().PutAsJsonAsync("/api/subjects/history/quizzes/7", quiz);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = Assert.Single(await Errors(response));
        Assert.Equal(2, error.GetProperty("row").GetInt32());
        Assert.Equal(field, error.GetProperty("field").GetString());
        Assert.NotEmpty(error.GetProperty("message").GetString()!);
        Assert.False(File.Exists(Path.Combine(app.DataDirectory, "Quizzes", "history", "7.json")));
    }

    [Fact]
    public async Task Every_faulty_row_is_reported_and_an_existing_Quiz_is_left_unchanged()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        const string existing = """{ "name": "Régi", "subject": "history", "difficulty": 7, "default_time": 10, "questions": [] }""";
        app.WriteData("Quizzes/history/7.json", existing);
        var quiz = ValidQuiz();
        var questions = (List<Dictionary<string, object?>>)quiz["questions"]!;
        questions[0]["answer"] = Array.Empty<string>();
        questions[4]["text"] = "";

        var response = await app.CreateClient().PutAsJsonAsync("/api/subjects/history/quizzes/7", quiz);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(["0 answer", "4 text"], (await Errors(response)).Select(e => $"{e.GetProperty("row").GetInt32()} {e.GetProperty("field").GetString()}"));
        Assert.Equal(existing, app.ReadData("Quizzes/history/7.json"));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(21)]
    public async Task A_Difficulty_outside_1_to_20_is_rejected(int difficulty)
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);

        var response = await app.CreateClient().PutAsJsonAsync($"/api/subjects/history/quizzes/{difficulty}", ValidQuiz());

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(["difficulty"], (await Errors(response)).Select(e => e.GetProperty("field").GetString()));
        Assert.False(File.Exists(Path.Combine(app.DataDirectory, "Quizzes", "history", $"{difficulty}.json")));
    }

    [Fact]
    public async Task Unknown_Quiz_is_not_found()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);

        var response = await app.CreateClient().GetAsync("/api/subjects/history/quizzes/4");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task A_Quiz_moved_to_a_free_Difficulty_is_there_and_no_longer_at_its_original_one()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        app.WriteData("Quizzes/history/3.json", """{ "name": "Régi", "subject": "history", "difficulty": 3, "default_time": 10, "questions": [] }""");
        var client = app.CreateClient();

        var response = await client.PutAsJsonAsync("/api/subjects/history/quizzes/8?original_difficulty=3", ValidQuiz());

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var moved = await client.GetFromJsonAsync<JsonElement>("/api/subjects/history/quizzes/8");
        Assert.Equal("Görögök", moved.GetProperty("name").GetString());
        Assert.Equal(8, moved.GetProperty("difficulty").GetInt32());
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/api/subjects/history/quizzes/3")).StatusCode);
        var list = await client.GetFromJsonAsync<JsonElement>("/api/subjects/history/quizzes");
        Assert.Equal([8], list.EnumerateArray().Select(q => q.GetProperty("difficulty").GetInt32()));
    }

    [Theory]
    [InlineData("/api/subjects/history/quizzes/8?original_difficulty=3")]
    [InlineData("/api/subjects/history/quizzes/8")]
    public async Task Saving_to_an_occupied_Difficulty_without_overwrite_is_a_conflict_and_changes_nothing(string url)
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        const string original = """{ "name": "Régi", "subject": "history", "difficulty": 3, "default_time": 10, "questions": [] }""";
        const string occupant = """{ "name": "Foglaló", "subject": "history", "difficulty": 8, "default_time": 10, "questions": [] }""";
        app.WriteData("Quizzes/history/3.json", original);
        app.WriteData("Quizzes/history/8.json", occupant);

        var response = await app.CreateClient().PutAsJsonAsync(url, ValidQuiz());

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal(original, app.ReadData("Quizzes/history/3.json"));
        Assert.Equal(occupant, app.ReadData("Quizzes/history/8.json"));
    }

    [Theory]
    [InlineData("/api/subjects/history/quizzes/8?original_difficulty=3&overwrite=true", new[] { 8 })]
    [InlineData("/api/subjects/history/quizzes/8?overwrite=true", new[] { 3, 8 })]
    public async Task Saving_to_an_occupied_Difficulty_with_overwrite_replaces_its_Quiz(string url, int[] difficultiesAfter)
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        app.WriteData("Quizzes/history/3.json", """{ "name": "Régi", "subject": "history", "difficulty": 3, "default_time": 10, "questions": [] }""");
        app.WriteData("Quizzes/history/8.json", """{ "name": "Foglaló", "subject": "history", "difficulty": 8, "default_time": 10, "questions": [] }""");
        var client = app.CreateClient();

        var response = await client.PutAsJsonAsync(url, ValidQuiz());

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var saved = await client.GetFromJsonAsync<JsonElement>("/api/subjects/history/quizzes/8");
        Assert.Equal("Görögök", saved.GetProperty("name").GetString());
        var list = await client.GetFromJsonAsync<JsonElement>("/api/subjects/history/quizzes");
        Assert.Equal(difficultiesAfter, list.EnumerateArray().Select(q => q.GetProperty("difficulty").GetInt32()));
    }

    [Fact]
    public async Task Saving_an_existing_Quiz_at_its_own_Difficulty_needs_no_overwrite()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        app.WriteData("Quizzes/history/3.json", """{ "name": "Régi", "subject": "history", "difficulty": 3, "default_time": 10, "questions": [] }""");
        var client = app.CreateClient();

        var response = await client.PutAsJsonAsync("/api/subjects/history/quizzes/3?original_difficulty=3", ValidQuiz());

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Görögök", (await client.GetFromJsonAsync<JsonElement>("/api/subjects/history/quizzes/3")).GetProperty("name").GetString());
    }

    [Fact]
    public async Task A_deleted_Quiz_cannot_be_loaded_and_is_not_listed()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        app.WriteData("Quizzes/history/3.json", """{ "name": "Régi", "subject": "history", "difficulty": 3, "default_time": 10, "questions": [] }""");
        app.WriteData("Quizzes/history/5.json", """{ "name": "Marad", "subject": "history", "difficulty": 5, "default_time": 10, "questions": [] }""");
        var client = app.CreateClient();

        var response = await client.DeleteAsync("/api/subjects/history/quizzes/3");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/api/subjects/history/quizzes/3")).StatusCode);
        var list = await client.GetFromJsonAsync<JsonElement>("/api/subjects/history/quizzes");
        Assert.Equal([5], list.EnumerateArray().Select(q => q.GetProperty("difficulty").GetInt32()));
    }

    [Fact]
    public async Task Deleting_an_unknown_Quiz_is_not_found()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);

        var response = await app.CreateClient().DeleteAsync("/api/subjects/history/quizzes/3");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private static async Task<JsonElement[]> Errors(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors").EnumerateArray().ToArray();

    /// <summary>A valid Quiz of exactly 5 Questions, one or more of every question type.</summary>
    private static Dictionary<string, object?> ValidQuiz() => new()
    {
        ["name"] = "Görögök",
        ["default_time"] = 10,
        ["questions"] = new List<Dictionary<string, object?>>
        {
            // Empty cells of the Editor's grid: left out of the file.
            new()
            {
                ["type"] = "true-false", ["text"] = "Athén Görögországban van.", ["options"] = Array.Empty<string>(),
                ["answer"] = new[] { "true" }, ["time"] = 8, ["speak_text"] = "", ["speak_answer"] = null,
            },
            new() { ["type"] = "word-matching", ["text"] = "temple", ["answer"] = new[] { "templom" }, ["speak_text"] = "en-GB" },
            new()
            {
                ["type"] = "multiple-choice", ["text"] = "Melyek görög városok?",
                ["options"] = new[] { "Athén", "Róma", "Spárta" }, ["answer"] = new[] { "Athén", "Spárta" }, ["speak_answer"] = "hu-HU",
            },
            new()
            {
                ["type"] = "ordered", ["text"] = "Melyik alapult előbb?",
                ["options"] = new[] { "Athén", "Spárta" }, ["answer"] = new[] { "Spárta", "Athén" },
            },
            new() { ["type"] = "true-false", ["text"] = "Spárta sziget.", ["answer"] = new[] { "false" } },
        },
    };

    [Theory]
    [InlineData("ez nem JSON")]
    [InlineData("""{ "name": "Kérdések nélkül", "default_time": 10 }""")]
    public async Task A_broken_Quiz_file_is_left_out_of_the_list_and_the_Questions_instead_of_failing_the_whole_Subject(string broken)
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        app.WriteData("Quizzes/history/3.json", """
            { "name": "Egyiptom", "subject": "history", "difficulty": 3, "default_time": 14, "questions": [
              { "type": "true-false", "text": "A piramis Egyiptomban áll.", "answer": ["true"] }
            ] }
            """);
        app.WriteData("Quizzes/history/4.json", broken);
        var client = app.CreateClient();

        var quizzes = await client.GetFromJsonAsync<JsonElement>("/api/subjects/history/quizzes");
        var questions = await client.GetFromJsonAsync<JsonElement>("/api/subjects/history/questions?from=1&to=20");
        var single = await client.GetAsync("/api/subjects/history/quizzes/4");

        Assert.Equal([3], quizzes.EnumerateArray().Select(quiz => quiz.GetProperty("difficulty").GetInt32()));
        Assert.Equal(1, questions.GetArrayLength());
        Assert.Equal(HttpStatusCode.NotFound, single.StatusCode);
    }

    [Fact]
    public async Task A_conflict_names_the_Quiz_occupying_the_Difficulty_like_a_ZIP_upload_does()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        app.WriteData("Quizzes/history/3.json", """
            { "name": "Egyiptom", "subject": "history", "difficulty": 3, "default_time": 14, "questions": [
              { "type": "true-false", "text": "A piramis Egyiptomban áll.", "answer": ["true"] }
            ] }
            """);

        var response = await app.CreateClient().PutAsJsonAsync("/api/subjects/history/quizzes/3", ValidQuiz());

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var occupied = Assert.Single((await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("occupied").EnumerateArray());
        Assert.Equal("history 3 Egyiptom", string.Join(' ',
            occupied.GetProperty("subject").GetString(), occupied.GetProperty("difficulty").GetInt32(), occupied.GetProperty("name").GetString()));
    }

    [Fact]
    public async Task Saving_the_same_Quiz_many_times_at_once_never_fails_and_leaves_one_whole_file()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        var client = app.CreateClient();

        var responses = await Task.WhenAll(Enumerable.Range(1, 30).Select(n =>
        {
            var quiz = ValidQuiz();
            quiz["name"] = $"Mentés {n}";
            return client.PutAsJsonAsync("/api/subjects/history/quizzes/3?overwrite=true", quiz);
        }));

        Assert.All(responses, response => Assert.Equal(HttpStatusCode.OK, response.StatusCode));
        var saved = await client.GetFromJsonAsync<JsonElement>("/api/subjects/history/quizzes/3");
        Assert.StartsWith("Mentés ", saved.GetProperty("name").GetString());
        Assert.Equal(["3.json", "subject.json"],
            Directory.GetFiles(Path.Combine(app.DataDirectory, "Quizzes", "history")).Select(Path.GetFileName).Order());
    }

    [Fact]
    public async Task Quiz_list_of_unknown_subject_is_not_found()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);

        var response = await app.CreateClient().GetAsync("/api/subjects/nosuch/quizzes");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
