import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { CircularProgress } from '@mui/material'
import Editor from './screens/Editor.tsx'
import Home from './screens/Home.tsx'
import Practice from './screens/Practice.tsx'
import PracticeStart from './screens/PracticeStart.tsx'
import Placeholder from './screens/Placeholder.tsx'
import { ResultDetails, ResultList } from './screens/Results.tsx'
import Settings from './screens/Settings.tsx'

// The grid is big and only needed on a computer, so phones playing a Practice never download it.
const QuizEditor = lazy(() => import('./screens/QuizEditor.tsx'))

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/kitoltes" element={<PracticeStart />} />
      <Route path="/kitoltes/gyakorlas" element={<Practice />} />
      <Route path="/szerkeszto" element={<Editor />} />
      <Route
        path="/szerkeszto/:subject/:difficulty"
        element={
          <Suspense fallback={<CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />}>
            <QuizEditor />
          </Suspense>
        }
      />
      <Route path="/eredmenyek" element={<ResultList />} />
      <Route path="/eredmenyek/:id" element={<ResultDetails />} />
      <Route path="/beallitasok" element={<Settings />} />
      <Route path="*" element={<Placeholder title="Nincs ilyen oldal" />} />
    </Routes>
  )
}
