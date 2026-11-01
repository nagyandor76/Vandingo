import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'
import { Button, Container, Stack, Typography } from '@mui/material'

/** Common frame of every screen: title, content, and a way back to the home screen. */
export default function Screen({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        {children}
        <Button component={RouterLink} to="/" variant="text" sx={{ alignSelf: 'flex-start' }}>
          Vissza a kezdőképernyőre
        </Button>
      </Stack>
    </Container>
  )
}
