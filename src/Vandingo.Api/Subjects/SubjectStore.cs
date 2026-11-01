using System.Text.Json;
using Vandingo.Api.Storage;

namespace Vandingo.Api.Subjects;

/// <summary>Reads Subjects from <c>Quizzes/&lt;subject&gt;/subject.json</c> in the data directory.</summary>
public sealed class SubjectStore(DataPaths paths)
{
    public IReadOnlyList<Subject> List()
    {
        if (!Directory.Exists(paths.QuizzesDirectory)) return [];

        return Directory.EnumerateDirectories(paths.QuizzesDirectory)
            .Select(directory => Path.Combine(directory, "subject.json"))
            .Where(File.Exists)
            .Select(file => JsonSerializer.Deserialize<Subject>(File.ReadAllText(file))!)
            .OrderBy(subject => subject.Key, StringComparer.Ordinal)
            .ToList();
    }
}
