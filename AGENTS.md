# Vandingo

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Running and testing

- **Start locally:** `npm start` (repo root). Builds the React frontend into `src/Vandingo.Api/wwwroot`, then runs the app at http://localhost:5215. Local data lives in `data/` (gitignored); on first start the repo's `Quizzes/` is copied into `data/Quizzes`.
- **Frontend dev server (hot reload):** `dotnet run --project src/Vandingo.Api` in one terminal, `cd web && npm run dev` in another (proxies `/api` to the backend).
- **Backend HTTP API tests:** `dotnet test` (repo root).
- **Practice engine tests:** `cd web && npm test`.
- **Typecheck frontend:** `cd web && npm run typecheck`.

The data directory is set by `Vandingo:DataDirectory` (env var `Vandingo__DataDirectory`; default `/data`, `../../data` in Development; relative paths resolve against `src/Vandingo.Api`). The initial-quiz source is `Vandingo:SeedDirectory` (default: the `Quizzes/` copied next to the app at build).
