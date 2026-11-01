using System.Text.Json;
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
            result.Total,
            result.Correct,
            result.Incorrect,
            result.ScorePercent,
            result.TimeLimitSeconds,
            result.ElapsedSeconds);

        Directory.CreateDirectory(paths.ResultsDirectory);
        // Written to a temporary file first, so an interrupted write never leaves a broken Result.
        var file = FileOf(saved.Id);
        var temporary = file + ".tmp";
        File.WriteAllText(temporary, JsonSerializer.Serialize(saved));
        File.Move(temporary, file, overwrite: true);
        return saved;
    }

    /// <summary>The Result with this id, or null if there is none.</summary>
    public Result? Find(string id)
    {
        if (id.IndexOfAny(['/', '\\', '.']) >= 0) return null;
        var file = FileOf(id);
        return File.Exists(file) ? JsonSerializer.Deserialize<Result>(File.ReadAllText(file)) : null;
    }

    private string FileOf(string id) => Path.Combine(paths.ResultsDirectory, $"{id}.json");
}
