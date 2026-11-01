using System.Text.RegularExpressions;
using Vandingo.Api.Storage;
using Vandingo.Api.Validation;

namespace Vandingo.Api.Subjects;

/// <summary>Keeps Subjects in <c>Quizzes/&lt;subject&gt;/subject.json</c> in the data directory.</summary>
public sealed partial class SubjectStore(DataPaths paths)
{
    public IReadOnlyList<Subject> List()
    {
        if (!Directory.Exists(paths.QuizzesDirectory)) return [];

        return Directory.EnumerateDirectories(paths.QuizzesDirectory)
            .Select(directory => Path.Combine(directory, "subject.json"))
            .Where(File.Exists)
            .Select(JsonFile.Read<Subject>)
            .OrderBy(subject => subject.Key, StringComparer.Ordinal)
            .ToList();
    }

    /// <summary>What is wrong with a Subject to be created; empty if nothing.</summary>
    public static IReadOnlyList<ValidationError> Check(NewSubject subject)
    {
        var errors = new List<ValidationError>();
        if (subject.Key is null || !KeyPattern().IsMatch(subject.Key))
            errors.Add(new(null, "key", "A kulcs csak kisbetű (a–z), számjegy (0–9) és - jel lehet."));
        if (string.IsNullOrWhiteSpace(subject.Name))
            errors.Add(new(null, "name", "A név nem lehet üres."));
        return errors;
    }

    /// <summary>Creates a valid Subject with the default settings; null if its key is taken.</summary>
    public Subject? Create(NewSubject subject)
    {
        if (File.Exists(FileOf(subject.Key))) return null;

        var created = new Subject(subject.Key, subject.Name.Trim(), MaxQuestions: 20, AutoAdvance: false);
        JsonFile.Write(FileOf(created.Key), created);
        return created;
    }

    public bool Exists(string key) => KeyPattern().IsMatch(key) && File.Exists(FileOf(key));

    /// <summary>Stores an already checked Subject with its own settings (for an upload); its key must not be taken.</summary>
    public void Import(Subject subject) => JsonFile.Write(FileOf(subject.Key), subject);

    /// <summary>Changes a Subject's settings, never its key or name; null if there is no such Subject.</summary>
    public Subject? Update(string key, SubjectSettings settings)
    {
        if (!KeyPattern().IsMatch(key) || !File.Exists(FileOf(key))) return null;

        var updated = JsonFile.Read<Subject>(FileOf(key)) with
        {
            MaxQuestions = settings.MaxQuestions,
            AutoAdvance = settings.AutoAdvance,
        };
        JsonFile.Write(FileOf(key), updated);
        return updated;
    }

    private string FileOf(string key) => Path.Combine(paths.QuizzesDirectory, key, "subject.json");

    [GeneratedRegex("^[a-z0-9-]+$")]
    private static partial Regex KeyPattern();
}
