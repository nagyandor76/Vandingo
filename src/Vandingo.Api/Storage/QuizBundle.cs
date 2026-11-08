using System.IO.Compression;
using System.Text.Json;
using Vandingo.Api.Quizzes;
using Vandingo.Api.Validation;

namespace Vandingo.Api.Storage;

/// <summary>
/// One file of a Quiz bundle: <c>&lt;subject&gt;/subject.json</c> (no <see cref="Difficulty"/>)
/// or <c>&lt;subject&gt;/&lt;difficulty&gt;.json</c>, named by its <see cref="Path"/> inside the bundle.
/// The folder name may still be an invalid Subject key; what to do about that is up to the reader.
/// </summary>
public sealed record BundleFile(string Path, string Subject, int? Difficulty, Func<Stream> Open)
{
    public bool IsSubjectFile => Difficulty is null;
}

/// <summary>
/// A set of Subject and Quiz files laid out as <see cref="QuizLayout"/> says, from either of its two sources:
/// a folder (the initial-quiz source) or an uploaded ZIP. Every other file is left out.
/// </summary>
public static class QuizBundle
{
    private const string QuizzesFolder = "Quizzes";
    private const string ResultsFolder = "results";

    public static IReadOnlyList<BundleFile> FromDirectory(string root) =>
        Directory.EnumerateFiles(root, "*.json", SearchOption.AllDirectories)
            .Select(file => FileOf(System.IO.Path.GetRelativePath(root, file), () => File.OpenRead(file)))
            .OfType<BundleFile>()
            .ToList();

    /// <summary>The ZIP's Subject and Quiz files, in its root or in a <c>Quizzes/</c> folder; <c>results/</c> is left out.</summary>
    public static IReadOnlyList<BundleFile> FromZip(ZipArchive zip) =>
        zip.Entries
            .Where(entry => entry.Name != "")
            .Select(entry => FileOf(entry.FullName, entry.Open))
            .OfType<BundleFile>()
            .ToList();

    /// <summary>The file's content as <typeparamref name="T"/>, or null and why it cannot be read.</summary>
    public static T? Read<T>(BundleFile file, out FileError? error) where T : class
    {
        error = null;
        try
        {
            using var stream = file.Open();
            if (JsonSerializer.Deserialize<T>(stream) is { } value) return value;
            error = new(file.Path, null, "json", "A fájl üres.");
        }
        catch (Exception exception) when (exception is InvalidDataException or IOException)
        {
            error = new(file.Path, null, "file", $"A fájl sérült vagy nem olvasható: {exception.Message}");
        }
        catch (JsonException exception)
        {
            var line = exception.LineNumber is { } n ? $" ({n + 1}. sor)" : "";
            error = new(file.Path, null, "json", $"Hibás JSON{line}: {exception.Message}");
        }
        return null;
    }

    private static BundleFile? FileOf(string relativePath, Func<Stream> open)
    {
        var parts = relativePath.Replace('\\', '/').Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (parts is [QuizzesFolder, .. var rest] && rest.Length == 2) parts = rest;
        if (parts is not [var subject, var name] || subject == ResultsFolder) return null;

        var path = $"{subject}/{name}";
        if (name == QuizLayout.SubjectFileName) return new(path, subject, null, open);
        return QuizLayout.TryDifficultyOf(name, out var difficulty) ? new(path, subject, difficulty, open) : null;
    }
}
