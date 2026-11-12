using Vandingo.Api.Storage;

namespace Vandingo.Api.Results;

/// <summary>Keeps every Result in its own file, <c>results/&lt;id&gt;.json</c> in the data directory.</summary>
public sealed class ResultStore(DataPaths paths, ILogger<ResultStore> logger)
{
    /// <summary>Saves a submitted Result under a new id, completed now; whatever id and time the client sent are ignored.</summary>
    public Result Save(Result submitted)
    {
        var saved = submitted with { Id = Guid.NewGuid().ToString("N"), CompletedAt = DateTimeOffset.UtcNow };
        JsonFile.Write(FileOf(saved.Id), saved);
        return saved;
    }

    /// <summary>The Participant's latest Results, whatever their Subject, newest first; a broken file is left out.</summary>
    public IReadOnlyList<Result> List(string participant, int limit)
    {
        if (!Directory.Exists(paths.ResultsDirectory)) return [];

        return Directory.EnumerateFiles(paths.ResultsDirectory, "*.json")
            .Select(file => JsonFile.TryRead<Result>(file, logger))
            .OfType<Result>()
            .Where(result => result.Participant == participant)
            .OrderByDescending(result => result.CompletedAt)
            .Take(limit)
            .ToList();
    }

    /// <summary>The Result with this id, or null if there is none or its file is broken.</summary>
    public Result? Find(string id) => DataPaths.IsPlainName(id) ? JsonFile.TryRead<Result>(FileOf(id), logger) : null;

    private string FileOf(string id) => Path.Combine(paths.ResultsDirectory, $"{id}.json");
}
