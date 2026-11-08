using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Vandingo.Api.Tests.Support;

namespace Vandingo.Api.Tests;

public class ResultApiTests
{
    [Fact]
    public async Task A_saved_Result_gets_its_own_file_and_can_be_read_back()
    {
        using var app = new VandingoApp();
        var client = app.CreateClient();

        var response = await client.PostAsJsonAsync("/api/results", new
        {
            participant = "Janka",
            subject = "history",
            difficultyFrom = 1,
            difficultyTo = 5,
            total = 20,
            correct = 17,
            incorrect = 3,
            scorePercent = 85,
            timeLimitSeconds = 200,
            elapsedSeconds = 156,
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var saved = await response.Content.ReadFromJsonAsync<JsonElement>();
        var id = saved.GetProperty("id").GetString()!;
        Assert.NotEmpty(id);
        Assert.True(saved.GetProperty("completedAt").GetDateTimeOffset() > DateTimeOffset.UtcNow.AddMinutes(-1));

        var file = JsonSerializer.Deserialize<JsonElement>(app.ReadData($"results/{id}.json"));
        Assert.Equal(
            ["id", "completedAt", "participant", "subject", "difficultyFrom", "difficultyTo", "total", "correct", "incorrect", "scorePercent", "timeLimitSeconds", "elapsedSeconds"],
            file.EnumerateObject().Select(property => property.Name));
        Assert.Equal("Janka", file.GetProperty("participant").GetString());
        Assert.Equal(156, file.GetProperty("elapsedSeconds").GetInt32());

        var readBack = await client.GetFromJsonAsync<JsonElement>($"/api/results/{id}");
        Assert.Equal(saved.ToString(), readBack.ToString());
    }

    [Fact]
    public async Task A_Result_with_Quiz_names_gives_them_back_in_the_file_the_list_and_the_details()
    {
        using var app = new VandingoApp();
        var client = app.CreateClient();

        var response = await client.PostAsJsonAsync("/api/results", new
        {
            participant = "Janka",
            subject = "history",
            difficultyFrom = 3,
            difficultyTo = 5,
            quizNameFrom = "Ókor",
            quizNameTo = "Középkor",
            total = 20,
            correct = 17,
            incorrect = 3,
            scorePercent = 85,
            timeLimitSeconds = 200,
            elapsedSeconds = 156,
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var id = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;

        var file = JsonSerializer.Deserialize<JsonElement>(app.ReadData($"results/{id}.json"));
        Assert.Equal("Ókor", file.GetProperty("quizNameFrom").GetString());
        Assert.Equal("Középkor", file.GetProperty("quizNameTo").GetString());

        var details = await client.GetFromJsonAsync<JsonElement>($"/api/results/{id}");
        Assert.Equal("Ókor", details.GetProperty("quizNameFrom").GetString());
        Assert.Equal("Középkor", details.GetProperty("quizNameTo").GetString());

        var list = await client.GetFromJsonAsync<JsonElement>("/api/results?participant=Janka&limit=10");
        Assert.Equal("Ókor", list[0].GetProperty("quizNameFrom").GetString());
        Assert.Equal("Középkor", list[0].GetProperty("quizNameTo").GetString());
    }

    [Fact]
    public async Task A_Result_without_Quiz_names_can_still_be_saved_and_listed()
    {
        using var app = new VandingoApp();
        var client = app.CreateClient();

        var response = await client.PostAsJsonAsync("/api/results", new
        {
            participant = "Janka",
            subject = "history",
            difficultyFrom = 1,
            difficultyTo = 1,
            total = 4,
            correct = 4,
            incorrect = 0,
            scorePercent = 100,
            timeLimitSeconds = 60,
            elapsedSeconds = 30,
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        app.WriteData("results/old.json", StoredResult("old", "2026-10-20T08:00:00+00:00", "Janka", "history"));
        var list = await client.GetFromJsonAsync<JsonElement>("/api/results?participant=Janka&limit=10");

        Assert.Equal(2, list.GetArrayLength());
        Assert.All(list.EnumerateArray(), result => Assert.False(result.TryGetProperty("quizNameFrom", out var name) && name.ValueKind != JsonValueKind.Null));
    }

    [Fact]
    public async Task Result_list_gives_only_the_Participants_Results_newest_first_up_to_the_limit()
    {
        using var app = new VandingoApp();
        app.WriteData("results/a.json", StoredResult("a", "2026-10-20T08:00:00+00:00", "Janka", "history"));
        app.WriteData("results/b.json", StoredResult("b", "2026-10-22T08:00:00+00:00", "Janka", "english"));
        app.WriteData("results/c.json", StoredResult("c", "2026-10-23T08:00:00+00:00", "Vanda", "history"));
        app.WriteData("results/d.json", StoredResult("d", "2026-10-21T08:00:00+00:00", "Janka", "history"));
        app.WriteData("results/e.json", StoredResult("e", "2026-10-19T08:00:00+00:00", "Janka", "history"));

        var results = await app.CreateClient().GetFromJsonAsync<JsonElement>("/api/results?participant=Janka&limit=3");

        Assert.Equal(["b", "d", "a"], results.EnumerateArray().Select(r => r.GetProperty("id").GetString()));
        Assert.Equal("english", results[0].GetProperty("subject").GetString());
    }

    [Fact]
    public async Task Result_list_of_a_Participant_without_Results_is_empty()
    {
        using var app = new VandingoApp();
        app.WriteData("results/a.json", StoredResult("a", "2026-10-20T08:00:00+00:00", "Janka", "history"));

        var results = await app.CreateClient().GetFromJsonAsync<JsonElement>("/api/results?participant=Gréta&limit=10");

        Assert.Empty(results.EnumerateArray());
    }

    private static string StoredResult(string id, string completedAt, string participant, string subject) => $$"""
        { "id": "{{id}}", "completedAt": "{{completedAt}}", "participant": "{{participant}}", "subject": "{{subject}}",
          "difficultyFrom": 1, "difficultyTo": 5, "total": 20, "correct": 17, "incorrect": 3, "scorePercent": 85,
          "timeLimitSeconds": 200, "elapsedSeconds": 156 }
        """;

    [Fact]
    public async Task The_server_gives_a_Result_its_id_and_completion_time_whatever_the_client_sends()
    {
        using var app = new VandingoApp();
        app.WriteData("results/taken.json", StoredResult("taken", "2026-10-20T08:00:00+00:00", "Vanda", "history"));
        var client = app.CreateClient();

        var response = await client.PostAsJsonAsync("/api/results", new
        {
            id = "taken",
            completedAt = "2000-01-01T00:00:00+00:00",
            participant = "Janka",
            subject = "history",
            difficultyFrom = 1,
            difficultyTo = 5,
            total = 20,
            correct = 17,
            incorrect = 3,
            scorePercent = 85,
            timeLimitSeconds = 200,
            elapsedSeconds = 156,
        });

        var saved = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.NotEqual("taken", saved.GetProperty("id").GetString());
        Assert.True(saved.GetProperty("completedAt").GetDateTimeOffset() > DateTimeOffset.UtcNow.AddMinutes(-1));
        Assert.Contains("\"Vanda\"", app.ReadData("results/taken.json"));
    }

    [Theory]
    [InlineData("..%2Fsecret")]
    [InlineData("a.b")]
    public async Task A_Result_id_that_is_not_a_plain_name_is_not_found(string id)
    {
        using var app = new VandingoApp();
        app.WriteData("a.b.json", StoredResult("a.b", "2026-10-20T08:00:00+00:00", "Janka", "history"));
        app.WriteData("secret.json", StoredResult("secret", "2026-10-20T08:00:00+00:00", "Janka", "history"));

        var response = await app.CreateClient().GetAsync($"/api/results/{id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Unknown_Result_is_not_found()
    {
        using var app = new VandingoApp();

        var response = await app.CreateClient().GetAsync("/api/results/nosuch");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
