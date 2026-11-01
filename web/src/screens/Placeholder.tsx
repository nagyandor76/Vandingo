import { Typography } from '@mui/material'
import Screen from './Screen.tsx'

export default function Placeholder({ title }: { title: string }) {
  return (
    <Screen title={title}>
      <Typography color="text.secondary">Hamarosan.</Typography>
    </Screen>
  )
}
