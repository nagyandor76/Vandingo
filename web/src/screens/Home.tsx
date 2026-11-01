import { Link as RouterLink } from 'react-router'
import { Box, Button, ButtonBase, Paper, Stack, Typography } from '@mui/material'

const otherEntryPoints = [
  { label: 'Eredmény böngésző', description: 'A legutóbbi eredmények', to: '/eredmenyek' },
  { label: 'Szerkesztő mód', description: 'Kérdések felvitele, Excelből is', to: '/szerkeszto' },
  { label: 'Beállítások', description: 'Tantárgyak, letöltés ZIP-ben', to: '/beallitasok' },
]

export default function Home() {
  return (
    <Stack spacing={2.5} sx={{ maxWidth: 480, mx: 'auto', px: 2, py: 3 }}>
      <Typography variant="h1" sx={{ color: 'primary.dark' }}>
        Vandingo
      </Typography>
      <Button component={RouterLink} to="/kitoltes" variant="contained" size="large" fullWidth sx={{ minHeight: 64 }}>
        Kitöltés
      </Button>
      <Paper sx={{ overflow: 'hidden' }}>
        {otherEntryPoints.map(({ label, description, to }, i) => (
          <ButtonBase
            key={to}
            component={RouterLink}
            to={to}
            sx={{
              width: '100%', minHeight: 64, px: 2, py: 1.25, gap: 1, justifyContent: 'space-between', textAlign: 'left',
              borderTop: i > 0 ? 1 : 0, borderColor: 'divider', '&:hover': { bgcolor: 'grey.50' },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
              <Typography variant="caption" component="p" color="text.secondary">
                {description}
              </Typography>
            </Box>
            <Typography color="text.secondary" aria-hidden>
              ›
            </Typography>
          </ButtonBase>
        ))}
      </Paper>
    </Stack>
  )
}
