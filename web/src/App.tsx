import { Route, Routes } from 'react-router'
import Home from './screens/Home.tsx'
import PracticeStart from './screens/PracticeStart.tsx'
import Placeholder from './screens/Placeholder.tsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/kitoltes" element={<PracticeStart />} />
      <Route path="/szerkeszto" element={<Placeholder title="Szerkesztő mód" />} />
      <Route path="/eredmenyek" element={<Placeholder title="Eredmény böngésző" />} />
      <Route path="/beallitasok" element={<Placeholder title="Beállítások" />} />
      <Route path="*" element={<Placeholder title="Nincs ilyen oldal" />} />
    </Routes>
  )
}
