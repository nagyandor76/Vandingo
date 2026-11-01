import { Link as RouterLink } from 'react-router'
import { Button, Container, Stack, Typography } from '@mui/material'

const entryPoints = [
  { label: 'Kitöltés', to: '/kitoltes' },
  { label: 'Szerkesztő mód', to: '/szerkeszto' },
  { label: 'Eredmény böngésző', to: '/eredmenyek' },
  { label: 'Beállítások', to: '/beallitasok' },
]

export default function Home() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ textAlign: 'center' }}>
          Vandingo
        </Typography>
        {entryPoints.map(({ label, to }) => (
          <Button key={to} component={RouterLink} to={to} variant="contained" size="large" sx={{ py: 2 }}>
            {label}
          </Button>
        ))}
      </Stack>
    </Container>
  )
}
