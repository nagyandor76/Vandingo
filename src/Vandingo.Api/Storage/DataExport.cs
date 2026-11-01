using System.IO.Compression;

namespace Vandingo.Api.Storage;

/// <summary>The whole data directory (Subjects, Quizzes, Results) as one ZIP, for manual backup.</summary>
public static class DataExport
{
    public static IResult Download(DataPaths paths)
    {
        var zip = new MemoryStream();
        ZipFile.CreateFromDirectory(paths.DataDirectory, zip, CompressionLevel.Optimal, includeBaseDirectory: false);
        zip.Position = 0;
        return TypedResults.File(zip, "application/zip", $"vandingo-adatok-{DateTime.Now:yyyy-MM-dd}.zip");
    }
}
