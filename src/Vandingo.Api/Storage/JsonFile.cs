using System.Text.Encodings.Web;
using System.Text.Json;

namespace Vandingo.Api.Storage;

/// <summary>Reads and writes the data directory's JSON files; each record type names its own keys.</summary>
public static class JsonFile
{
    // Indented and with accented letters kept as they are, so the files stay readable by hand.
    private static readonly JsonSerializerOptions Options = new()
    {
        WriteIndented = true,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    };

    public static T Read<T>(string file) => JsonSerializer.Deserialize<T>(File.ReadAllText(file))!;

    /// <summary>
    /// Writes to a temporary file first and then moves it into place,
    /// so an interrupted write never leaves a broken file.
    /// </summary>
    public static void Write<T>(string file, T value) => WriteText(file, JsonSerializer.Serialize(value, Options));

    /// <summary>The same atomic write for text that is already JSON (e.g. a file taken over as it is).</summary>
    public static void WriteText(string file, string json)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(file)!);
        // Each write has a temporary file of its own, so writes of the same file at once do not collide: the last one wins.
        var temporary = $"{file}.{Guid.NewGuid():N}.tmp";
        try
        {
            File.WriteAllText(temporary, json);
            MoveIntoPlace(temporary, file);
        }
        finally
        {
            File.Delete(temporary);
        }
    }

    /// <summary>
    /// Replaces the file with the temporary one. On Linux this never collides; on Windows replacing a file that
    /// another write is replacing at that very moment is denied, so it is tried again a few times.
    /// </summary>
    private static void MoveIntoPlace(string temporary, string file)
    {
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                File.Move(temporary, file, overwrite: true);
                return;
            }
            catch (Exception exception) when (exception is UnauthorizedAccessException or IOException && attempt < 20)
            {
                Thread.Sleep(attempt * 5);
            }
        }
    }
}
