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
        var temporary = file + ".tmp";
        File.WriteAllText(temporary, json);
        File.Move(temporary, file, overwrite: true);
    }
}
