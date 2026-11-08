using Vandingo.Api.Storage;

namespace Vandingo.Api.Results;

/// <summary>Keeps every Result in its own file, <c>results/&lt;id&gt;.json</c> in the data directory.</summary>
public sealed class ResultStore(DataPaths paths)
{
    /// <summary>Saves a submitted Result under a new id, completed now; whatever id and time the client sent are ignored.</summary>
    public Result Save(Result submitted)
    {
        var saved = submitted with { Id = Guid.NewGuid().ToString("N"), CompletedAt = DateTimeOffset.UtcNow };
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
        if (!DataPaths.IsPlainName(id)) return null;
        var file = FileOf(id);
        return File.Exists(file) ? JsonFile.Read<Result>(file) : null;
    }

    private string FileOf(string id) => Path.Combine(paths.ResultsDirectory, $"{id}.json");
}
