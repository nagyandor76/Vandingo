import { useEffect, useState } from 'react'
import { Alert, CircularProgress, List, ListItemButton, ListItemText, Paper } from '@mui/material'
import { fetchSubjects, type Subject } from '../api.ts'
import Screen from './Screen.tsx'

export default function PracticeStart() {
  const [subjects, setSubjects] = useState<Subject[]>()
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchSubjects().then(setSubjects, () => setError(true))
  }, [])

  return (
    <Screen title="Kitöltés">
      {error && <Alert severity="error">Nem sikerült betölteni a tantárgyakat.</Alert>}
      {!error && !subjects && <CircularProgress sx={{ alignSelf: 'center' }} />}
      {subjects?.length === 0 && <Alert severity="info">Még nincs egyetlen tantárgy sem.</Alert>}
      {subjects && subjects.length > 0 && (
        <Paper>
          <List>
            {subjects.map((subject) => (
              <ListItemButton key={subject.key}>
                <ListItemText primary={subject.name} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}
    </Screen>
  )
}
