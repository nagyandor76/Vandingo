import { useRef, useState } from 'react'
import { Alert, Button, List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material'
import { importZip, type ImportOutcome } from '../api.ts'

type State =
  | { step: 'idle' }
  | { step: 'sending' }
  | { step: 'failed' }
  | { step: 'result'; outcome: ImportOutcome }

/** Uploads several Quizzes (and new Subjects) at once from a ZIP; asks before overwriting taken Difficulties. */
export default function ZipUpload({ onImported }: { onImported: () => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File>()
  const [state, setState] = useState<State>({ step: 'idle' })

  const send = async (selected: File, overwrite: boolean) => {
    setState({ step: 'sending' })
    try {
      const outcome = await importZip(selected, overwrite)
      setState({ step: 'result', outcome })
      if (outcome.status === 'imported') onImported()
    } catch {
      setState({ step: 'failed' })
    }
  }

  const outcome = state.step === 'result' ? state.outcome : undefined
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography color="text.secondary">
          Több kvíz egyszerre: a ZIP szerkezete <code>tantárgy/szint.json</code> (új tantárgyhoz <code>tantárgy/subject.json</code>
          is), a gyökérben vagy egy <code>Quizzes</code> mappában. A letöltött biztonsági mentés is visszatölthető.
        </Typography>
        <input
          ref={input}
          type="file"
          accept=".zip,application/zip"
          hidden
          onChange={(event) => {
            const selected = event.target.files?.[0]
            event.target.value = ''
            if (!selected) return
            setFile(selected)
            void send(selected, false)
          }}
        />
        <Button variant="outlined" disabled={state.step === 'sending'} onClick={() => input.current?.click()}>
          Quizek feltöltése ZIP-ben
        </Button>
        {state.step === 'failed' && <Alert severity="error">Nem sikerült feltölteni.</Alert>}
        {outcome?.status === 'invalid' && (
          <Alert severity="error">
            A feltöltés hibás, semmi nem mentődött:
            <List dense disablePadding>
              {outcome.errors.map((error, index) => (
                <ListItem key={index} disableGutters>
                  <ListItemText
                    primary={`${error.file || 'ZIP'}${error.row !== undefined ? `, ${error.row + 1}. sor` : ''}${error.field ? ` (${error.field})` : ''}`}
                    secondary={error.message}
                  />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}
        {outcome?.status === 'occupied' && file && (
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={() => void send(file, true)}>
                Felülírás
              </Button>
            }
          >
            Ezek a szintek már foglaltak, felülírjam őket? Semmi nem mentődött.
            <List dense disablePadding>
              {outcome.occupied.map(({ subject, difficulty, name }) => (
                <ListItem key={`${subject}/${difficulty}`} disableGutters>
                  <ListItemText primary={`${subject}, ${difficulty}. szint`} secondary={`Meglévő: ${name}`} />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}
        {outcome?.status === 'imported' && (
          <Alert severity="success">
            Feltöltve: {outcome.quizzes.length} kvíz.
            {outcome.subjects.length > 0 && ` Új tantárgy: ${outcome.subjects.map(({ name }) => name).join(', ')}.`}
            <List dense disablePadding>
              {outcome.quizzes.map(({ subject, difficulty, name }) => (
                <ListItem key={`${subject}/${difficulty}`} disableGutters>
                  <ListItemText primary={`${subject}, ${difficulty}. szint: ${name}`} />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}
      </Stack>
    </Paper>
  )
}
