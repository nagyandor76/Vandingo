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
    public async Task Quiz_list_of_unknown_subject_is_not_found()
    {
        using var app = new VandingoApp();
        app.WriteData("Quizzes/history/subject.json", HistorySubject);

        var response = await app.CreateClient().GetAsync("/api/subjects/nosuch/quizzes");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
