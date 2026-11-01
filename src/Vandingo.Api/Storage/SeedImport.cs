using System.Text.Json;

namespace Vandingo.Api.Storage;

/// <summary>One Quiz or Subject taken over from the source; <see cref="Difficulty"/> is null for a Subject.</summary>
public sealed record SeedItem(string Subject, int? Difficulty, string Name);

/// <summary>
/// Copies the Quiz and Subject files that the data directory lacks from the initial-data source.
/// Existing files are never overwritten.
/// </summary>
public static class SeedImport
{
    public static IReadOnlyList<SeedItem> CopyMissing(DataPaths paths)
    {
        var copied = new List<SeedItem>();
        if (!Directory.Exists(paths.SeedDirectory)) return copied;

        foreach (var directory in Directory.EnumerateDirectories(paths.SeedDirectory).Order(StringComparer.Ordinal))
        {
            var subject = Path.GetFileName(directory);
            foreach (var source in Directory.EnumerateFiles(directory, "*.json").Order(StringComparer.Ordinal))
            {
                var fileName = Path.GetFileNameWithoutExtension(source);
                var isSubject = fileName == "subject";
                if (!isSubject && !int.TryParse(fileName, out _)) continue;

                var destination = Path.Combine(paths.QuizzesDirectory, subject, Path.GetFileName(source));
                if (File.Exists(destination)) continue;

                // Read and check the source before writing, so a faulty file is left out whole instead of half copied.
                string text, name;
                try
                {
                    text = File.ReadAllText(source);
                    name = DisplayName(text);
                }
                catch (Exception exception) when (exception is JsonException or IOException)
                {
                    continue;
                }

                JsonFile.WriteText(destination, text);
                copied.Add(new SeedItem(subject, isSubject ? null : int.Parse(fileName), name));
            }
        }
        return copied;
    }

    private static string DisplayName(string json)
    {
        using var document = JsonDocument.Parse(json);
        return document.RootElement.ValueKind == JsonValueKind.Object
            && document.RootElement.TryGetProperty("name", out var name)
            && name.ValueKind == JsonValueKind.String ? name.GetString()! : "";
    }
}
