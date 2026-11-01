// Lists the tickets under .scratch/<feature>/issues/ with their status, read from each file's YAML frontmatter.
//
//   dotnet run scripts/tickets.cs                    writes .scratch/tickets.txt (done and open listed apart)
//                                                    and .scratch/tickets.mmd (Mermaid graph of every ticket)
//   dotnet run scripts/tickets.cs -- --list          every ticket, on the console
//   dotnet run scripts/tickets.cs -- --ready         only open tickets whose blockers are all done
//   dotnet run scripts/tickets.cs -- --json          machine-readable
//   dotnet run scripts/tickets.cs -- --mermaid       dependency graph as a Mermaid flowchart, coloured by status
//
// A .NET 10 file-based app: no project file, `dotnet run` builds it on first use.
// The frontmatter format is described in docs/agents/issue-tracker.md.

#:package YamlDotNet@18.1.0
// A local tool, never published: reflection-based JSON and YAML are fine.
#:property PublishAot=false

using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.RegularExpressions;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

Console.OutputEncoding = Encoding.UTF8;

var root = Path.GetFullPath(Path.Combine(ScriptDirectory(), "..", ".scratch"));
string[] openStatuses = ["ready-for-agent", "ready-for-human"];

var yaml = new DeserializerBuilder()
    .WithNamingConvention(UnderscoredNamingConvention.Instance)
    .IgnoreUnmatchedProperties()
    .Build();

var tickets = Directory.EnumerateDirectories(root)
    .Where(directory => Directory.Exists(Path.Combine(directory, "issues")))
    .Order(StringComparer.Ordinal)
    .SelectMany(directory => Directory.EnumerateFiles(Path.Combine(directory, "issues"), "*.md")
        .Where(file => Regex.IsMatch(Path.GetFileName(file), @"^\d+-"))
        .Order(StringComparer.Ordinal)
        .Select(file => Read(Path.GetFileName(directory), file)))
    .ToList();

var shown = args.Contains("--ready") ? tickets.Where(IsReady).ToList() : tickets;

if (args.Contains("--json"))
{
    var options = new JsonSerializerOptions
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    };
    Console.WriteLine(JsonSerializer.Serialize(
        shown.Select(t => new { t.Feature, t.Number, t.Title, t.Status, t.BlockedBy, t.File, WaitingOn = WaitingOn(t), Ready = IsReady(t) }),
        options));
}
else if (args.Contains("--mermaid"))
{
    Console.WriteLine(Mermaid(shown));
}
else if (args.Contains("--list") || args.Contains("--ready"))
{
    foreach (var line in Lines(shown)) Console.WriteLine(line);
}
else if (args.Length > 0)
{
    Console.Error.WriteLine($"Unknown option: {string.Join(' ', args)}. See the top of scripts/tickets.cs.");
    return 1;
}
else
{
    var done = tickets.Where(t => t.Status == "done").ToList();
    var open = tickets.Where(t => t.Status != "done").ToList();
    string[] text =
    [
        $"Kész ({done.Count})",
        .. Lines(done),
        "",
        $"Nyitott ({open.Count})",
        .. Lines(open),
    ];
    var textFile = Path.Combine(root, "tickets.txt");
    var mermaidFile = Path.Combine(root, "tickets.mmd");
    File.WriteAllText(textFile, string.Join('\n', text) + '\n');
    File.WriteAllText(mermaidFile, Mermaid(tickets) + '\n');
    Console.WriteLine($"{Path.GetRelativePath(Environment.CurrentDirectory, textFile)}: {done.Count} kész, {open.Count} nyitott");
    Console.WriteLine($"{Path.GetRelativePath(Environment.CurrentDirectory, mermaidFile)}: {tickets.Count} ticket");
}
return 0;

/// One line per ticket: feature, number, status, title, and what it waits on or that it can start.
IEnumerable<string> Lines(List<Ticket> list)
{
    var statusWidth = Math.Max(6, list.Select(t => t.Status.Length).DefaultIfEmpty(0).Max());
    return list.Select(t =>
    {
        var waitingOn = WaitingOn(t);
        var note = waitingOn.Count > 0 ? $"  (vár: {string.Join(", ", waitingOn)})" : IsReady(t) ? "  ← indítható" : "";
        return $"{t.Feature,-14} {t.Number:00}  {t.Status.PadRight(statusWidth)}  {t.Title}{note}";
    });
}

Ticket Read(string feature, string path)
{
    var text = File.ReadAllText(path);
    var match = Regex.Match(text, @"\A---\r?\n(.*?)\r?\n---", RegexOptions.Singleline);
    if (!match.Success) throw new InvalidDataException($"{path}: no frontmatter");

    Frontmatter meta;
    try
    {
        meta = yaml.Deserialize<Frontmatter?>(match.Groups[1].Value) ?? new Frontmatter();
    }
    catch (YamlDotNet.Core.YamlException error)
    {
        throw new InvalidDataException($"{path}: unreadable frontmatter ({error.InnerException?.Message ?? error.Message})", error);
    }
    return new Ticket(
        feature,
        int.Parse(Path.GetFileName(path).Split('-')[0]),
        Regex.Match(text, @"^# (.*)$", RegexOptions.Multiline) is { Success: true } title ? title.Groups[1].Value.Trim() : Path.GetFileName(path),
        meta.Status ?? "?",
        meta.BlockedBy ?? [],
        Path.GetRelativePath(Path.GetDirectoryName(root)!, path));
}

/// The blockers that are not done yet.
List<int> WaitingOn(Ticket ticket) =>
    ticket.BlockedBy
        .Where(n => tickets.FirstOrDefault(t => t.Feature == ticket.Feature && t.Number == n)?.Status != "done")
        .ToList();

/// Open, and nothing it waits on.
bool IsReady(Ticket ticket) => openStatuses.Contains(ticket.Status) && WaitingOn(ticket).Count == 0;

/// A Mermaid flowchart: one box per ticket coloured by status, an arrow from each blocker to what it blocks.
string Mermaid(List<Ticket> list)
{
    static string Id(string feature, object number) => $"{Regex.Replace(feature, @"\W", "_")}_{number}";
    static string Label(Ticket t) => $"{t.Number:00}: {Regex.Replace(t.Title, @"^\d+:\s*", "")}".Replace("\"", "#quot;");
    static string StatusClass(string status) => Regex.Replace(status, @"\W", "_");

    var lines = new List<string> { "flowchart LR" };
    foreach (var feature in list.Select(t => t.Feature).Distinct())
    {
        lines.Add($"  subgraph {Id(feature, "feature")}[\"{feature}\"]");
        lines.AddRange(list
            .Where(t => t.Feature == feature)
            .Select(t => $"    {Id(feature, t.Number)}[\"{Label(t)}<br/><small>{t.Status}</small>\"]:::{StatusClass(t.Status)}"));
        lines.Add("  end");
    }
    foreach (var t in list)
    {
        lines.AddRange(t.BlockedBy
            .Where(n => list.Any(b => b.Feature == t.Feature && b.Number == n))
            .Select(n => $"  {Id(t.Feature, n)} --> {Id(t.Feature, t.Number)}"));
    }
    lines.AddRange(
    [
        "  classDef done fill:#e8f5ec,stroke:#1f8a4c,color:#1f2933",
        "  classDef ready_for_agent fill:#e0f2fe,stroke:#0ea5e9,color:#1f2933",
        "  classDef ready_for_human fill:#fef3c7,stroke:#f59e0b,color:#1f2933",
        "  classDef needs_triage fill:#f3f4f6,stroke:#6b7480,color:#1f2933",
        "  classDef needs_info fill:#fbecea,stroke:#c2413b,color:#1f2933",
        "  classDef wontfix fill:#f3f4f6,stroke:#9ca3af,color:#6b7480,stroke-dasharray:4",
    ]);
    return string.Join('\n', lines);
}

// The directory of this source file, wherever `dotnet run` is started from.
static string ScriptDirectory([CallerFilePath] string path = "") => Path.GetDirectoryName(path)!;

/// The keys a ticket's frontmatter may have; see docs/agents/issue-tracker.md.
sealed class Frontmatter
{
    public string? Status { get; set; }
    public List<int>? BlockedBy { get; set; }
    public string? Type { get; set; }
}

sealed record Ticket(string Feature, int Number, string Title, string Status, List<int> BlockedBy, string File);
