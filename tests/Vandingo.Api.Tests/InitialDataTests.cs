using System.Net.Http.Json;
using System.Text.Json;
using Vandingo.Api.Tests.Support;

namespace Vandingo.Api.Tests;

public class InitialDataTests
{
    private const string HistorySubject = """
        { "key": "history", "name": "Történelem", "max_questions": 20, "auto_advance": false }
        """;

    private const string HistoryQuiz = """
        { "name": "Egyiptom", "subject": "history", "difficulty": 3, "default_time": 14, "questions": [
          { "type": "true-false", "text": "Egy", "answer": ["true"] },
          { "type": "true-false", "text": "Kettő", "answer": ["false"] },
          { "type": "true-false", "text": "Három", "answer": ["true"] },
          { "type": "true-false", "text": "Négy", "answer": ["true"] },
          { "type": "true-false", "text": "Öt", "answer": ["true"] }
        ] }
        """;

    private static async Task<string[]> QuizListOf(VandingoApp app) =>
        (await app.CreateClient().GetFromJsonAsync<JsonElement>("/api/subjects/history/quizzes"))
            .EnumerateArray()
            .Select(quiz => $"{quiz.GetProperty("difficulty").GetInt32()} {quiz.GetProperty("name").GetString()}")
            .ToArray();

    [Fact]
    public async Task Empty_data_directory_receives_the_initial_quizzes_and_subjects_on_startup()
    {
        using var app = new VandingoApp();
        app.WriteSeed("history/subject.json", HistorySubject);
        app.WriteSeed("history/3.json", HistoryQuiz);

        var subjects = await app.CreateClient().GetFromJsonAsync<JsonElement>("/api/subjects");

        var subject = Assert.Single(subjects.EnumerateArray());
        Assert.Equal("history", subject.GetProperty("key").GetString());
        Assert.Equal("Történelem", subject.GetProperty("name").GetString());
        Assert.Equal(["3 Egyiptom"], await QuizListOf(app));
    }

    [Fact]
    public async Task Existing_but_empty_Quizzes_folder_counts_as_empty()
    {
        using var app = new VandingoApp();
        Directory.CreateDirectory(Path.Combine(app.DataDirectory, "Quizzes"));
        app.WriteSeed("history/subject.json", HistorySubject);
        app.WriteSeed("history/3.json", HistoryQuiz);

        Assert.Equal(["3 Egyiptom"], await QuizListOf(app));
    }

    [Fact]
    public async Task Non_empty_data_directory_is_left_untouched_on_startup()
    {
        using var app = new VandingoApp();
        const string editedQuiz = """
            { "name": "Szerkesztett", "subject": "history", "difficulty": 3, "default_time": 10, "questions": [] }
            """;
        app.WriteData("Quizzes/history/subject.json", HistorySubject);
        app.WriteData("Quizzes/history/3.json", editedQuiz);
        app.WriteSeed("history/subject.json", HistorySubject);
        app.WriteSeed("history/3.json", HistoryQuiz);
        app.WriteSeed("english/subject.json", """
            { "key": "english", "name": "Angol", "max_questions": 20, "auto_advance": false }
            """);

        var subjects = await app.CreateClient().GetFromJsonAsync<JsonElement>("/api/subjects");

        Assert.Equal(["history"], subjects.EnumerateArray().Select(s => s.GetProperty("key").GetString()));
        Assert.Equal(editedQuiz, app.ReadData("Quizzes/history/3.json"));
        Assert.False(Directory.Exists(Path.Combine(app.DataDirectory, "Quizzes", "english")));
    }
}
