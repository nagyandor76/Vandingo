using Vandingo.Api.Storage;

namespace Vandingo.Api.Results;

/// <summary>Keeps every Result in its own file, <c>results/&lt;id&gt;.json</c> in the data directory.</summary>
public sealed class ResultStore(DataPaths paths)
{
    public Result Save(NewResult result)
    {
        var saved = new Result(
            Guid.NewGuid().ToString("N"),
            DateTimeOffset.UtcNow,
            result.Participant,
            result.Subject,
            result.DifficultyFrom,
            result.DifficultyTo,
            result.QuizNameFrom,
            result.QuizNameTo,
            result.Total,
            result.Correct,
            result.Incorrect,
            result.ScorePercent,
            result.TimeLimitSeconds,
            result.ElapsedSeconds);

        JsonFile.Write(FileOf(saved.Id), saved);
        return saved;
    }

    /// <summary>The Participant's latest Results, whatever their Subject, newest first.</summary>
    public IReadOnlyList<Result> List(string participant, int limit)
    {
        if (!Directory.Exists(paths.ResultsDirectory)) return [];

        return Directory.EnumerateFiles(paths.ResultsDirectory, "*.json")
            .Select(JsonFile.Read<Result>)
            .Where(result => result.Participant == participant)
            .OrderByDescending(result => result.CompletedAt)
            .Take(limit)
            .ToList();
    }

    /// <summary>The Result with this id, or null if there is none.</summary>
    public Result? Find(string id)
    {
        if (id.IndexOfAny(['/', '\\', '.']) >= 0) return null;
        var file = FileOf(id);
        return File.Exists(file) ? JsonFile.Read<Result>(file) : null;
    }

    private string FileOf(string id) => Path.Combine(paths.ResultsDirectory, $"{id}.json");
}
