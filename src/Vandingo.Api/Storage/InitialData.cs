namespace Vandingo.Api.Storage;

/// <summary>
/// On startup, copies the repo's initial quizzes into the data directory once:
/// only while the data directory's Quizzes folder is empty, so edits are never overwritten.
/// </summary>
public static class InitialData
{
    public static void CopyIfEmpty(DataPaths paths, ILogger logger)
    {
        var target = paths.QuizzesDirectory;
        if (Directory.Exists(target) && Directory.EnumerateFileSystemEntries(target).Any()) return;
        if (!Directory.Exists(paths.SeedDirectory))
        {
            logger.LogWarning("Initial quiz directory {SeedDirectory} not found; starting with no Quizzes", paths.SeedDirectory);
            return;
        }

        foreach (var source in Directory.EnumerateFiles(paths.SeedDirectory, "*", SearchOption.AllDirectories))
        {
            var destination = Path.Combine(target, Path.GetRelativePath(paths.SeedDirectory, source));
            Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
            File.Copy(source, destination);
        }
    }
}
