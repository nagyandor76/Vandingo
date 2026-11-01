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
    public async Task Unknown_Result_is_not_found()
    {
        using var app = new VandingoApp();

        var response = await app.CreateClient().GetAsync("/api/results/nosuch");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
