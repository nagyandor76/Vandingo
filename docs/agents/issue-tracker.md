# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- Ticket metadata lives in YAML frontmatter at the very top of the file (see below); the body starts with the `# NN: Title` heading
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## Frontmatter

Every ticket and spec starts with a frontmatter block:

```yaml
---
status: ready-for-agent
blocked_by: [1, 7]
---
```

- `status`: one of the strings in `triage-labels.md`. A finished ticket is `done`.
- `blocked_by`: the numbers of the tickets in the same feature that must be `done` first, as plain integers (`7`, not `07`). `[]` when nothing blocks it. Specs have no `blocked_by`.
- `type` (wayfinding tickets only): `research`, `prototype`, `grilling` or `task`.

Keep it flat: one `key: value` per line, values are a single word or number, or an inline list `[a, b]`. No nested keys, no multi-line values, no free text: notes belong in the body (e.g. a `**Megjegyzés:**` line). `scripts/tickets.cs` reads it as YAML (YamlDotNet) and stops with the file name if a value has the wrong type.

To see where things stand: `dotnet run scripts/tickets.cs` (from the repo root; a .NET 10 file-based app, the first run takes a while to build) lists every ticket with its status; `dotnet run scripts/tickets.cs -- --ready` only the open ones whose blockers are all done; add `--json` for machine-readable output, or `--mermaid` for the dependency graph as a Mermaid flowchart coloured by status.

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed), starting with the frontmatter above.

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## When a skill says "apply a label" or "set the status"

Change the `status:` value in the frontmatter. When a ticket is finished, set `status: done`, tick its checkboxes and add a dated entry under `## Comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. The frontmatter's `type` records the ticket type (`research`/`prototype`/`grilling`/`task`); its `status` records `claimed`/`resolved`.
- **Blocking**: the frontmatter's `blocked_by` list. A ticket is unblocked when every ticket it lists is `resolved` (or `done`).
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
