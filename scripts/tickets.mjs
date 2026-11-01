// Lists the tickets under .scratch/<feature>/issues/ with their status, read from each file's YAML frontmatter.
//
//   npm run tickets                 every ticket
//   npm run tickets -- --ready      only open tickets whose blockers are all done
//   npm run tickets -- --json       machine-readable
//   npm run tickets -- --mermaid    dependency graph as a Mermaid flowchart, coloured by status
//
// The frontmatter format is described in docs/agents/issue-tracker.md.

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..', '.scratch')
const args = process.argv.slice(2)
const openStatuses = ['ready-for-agent', 'ready-for-human']

/** The frontmatter's flat `key: value` lines; `[a, b]` is a list, whole numbers are numbers. */
function frontmatter(text, file) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (!match) throw new Error(`${file}: no frontmatter`)
  const scalar = (value) => (/^\d+$/.test(value) ? Number(value) : value)
  return Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trimStart().startsWith('#'))
      .map((line) => {
        const [, key, value] = /^(\w+):\s*(.*)$/.exec(line) ?? [null, null, null]
        if (!key) throw new Error(`${file}: can't read frontmatter line "${line}"`)
        const list = /^\[(.*)\]$/.exec(value.trim())
        return [key, list ? list[1].split(',').map((item) => item.trim()).filter(Boolean).map(scalar) : scalar(value.trim())]
      }),
  )
}

const tickets = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(root, entry.name, 'issues')))
  .flatMap(({ name: feature }) =>
    readdirSync(join(root, feature, 'issues'))
      .filter((file) => /^\d+-.*\.md$/.test(file))
      .sort()
      .map((file) => {
        const path = join(root, feature, 'issues', file)
        const text = readFileSync(path, 'utf8')
        const meta = frontmatter(text, path)
        return {
          feature,
          number: Number(file.split('-')[0]),
          title: /^# (.*)$/m.exec(text)?.[1] ?? file,
          status: meta.status ?? '?',
          blockedBy: meta.blocked_by ?? [],
          file: join('.scratch', feature, 'issues', file),
        }
      }),
  )

for (const ticket of tickets) {
  const blockers = ticket.blockedBy.map((n) => tickets.find((t) => t.feature === ticket.feature && t.number === n))
  ticket.waitingOn = ticket.blockedBy.filter((n, i) => blockers[i]?.status !== 'done')
  ticket.ready = openStatuses.includes(ticket.status) && ticket.waitingOn.length === 0
}

const shown = args.includes('--ready') ? tickets.filter((t) => t.ready) : tickets

/** A Mermaid flowchart: one box per ticket coloured by status, an arrow from each blocker to what it blocks. */
function mermaid(list) {
  const id = (feature, number) => `${feature.replace(/\W/g, '_')}_${number}`
  const label = (t) => `${String(t.number).padStart(2, '0')}: ${t.title.replace(/^\d+:\s*/, '')}`.replaceAll('"', '#quot;')
  const statusClass = (status) => status.replace(/\W/g, '_')
  const lines = ['flowchart LR']
  for (const feature of new Set(list.map((t) => t.feature))) {
    lines.push(`  subgraph ${id(feature, 'feature')}["${feature}"]`)
    for (const t of list.filter((t) => t.feature === feature)) {
      lines.push(`    ${id(feature, t.number)}["${label(t)}<br/><small>${t.status}</small>"]:::${statusClass(t.status)}`)
    }
    lines.push('  end')
  }
  for (const t of list) {
    for (const n of t.blockedBy) {
      if (list.some((b) => b.feature === t.feature && b.number === n)) lines.push(`  ${id(t.feature, n)} --> ${id(t.feature, t.number)}`)
    }
  }
  lines.push(
    '  classDef done fill:#e8f5ec,stroke:#1f8a4c,color:#1f2933',
    '  classDef ready_for_agent fill:#e0f2fe,stroke:#0ea5e9,color:#1f2933',
    '  classDef ready_for_human fill:#fef3c7,stroke:#f59e0b,color:#1f2933',
    '  classDef needs_triage fill:#f3f4f6,stroke:#6b7480,color:#1f2933',
    '  classDef needs_info fill:#fbecea,stroke:#c2413b,color:#1f2933',
    '  classDef wontfix fill:#f3f4f6,stroke:#9ca3af,color:#6b7480,stroke-dasharray:4',
  )
  return lines.join('\n')
}

if (args.includes('--json')) {
  console.log(JSON.stringify(shown, null, 2))
} else if (args.includes('--mermaid')) {
  console.log(mermaid(shown))
} else {
  const pad = (text, width) => String(text).padEnd(width)
  const statusWidth = Math.max(6, ...shown.map((t) => t.status.length))
  for (const t of shown) {
    const waiting = t.waitingOn.length ? `  (vár: ${t.waitingOn.join(', ')})` : t.ready ? '  ← indítható' : ''
    console.log(`${pad(t.feature, 14)} ${pad(String(t.number).padStart(2, '0'), 3)} ${pad(t.status, statusWidth)}  ${t.title}${waiting}`)
  }
}
