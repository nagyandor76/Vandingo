import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'
import { Box, IconButton, Stack, Typography } from '@mui/material'

/** Common frame of every screen: a header with a way back, then the content in a phone-width column. */
export default function Screen({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, pt: 1.5, pb: 4 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
        <IconButton
          component={RouterLink}
          to="/"
          aria-label="Vissza"
          sx={{ width: 48, height: 48, ml: -1, fontSize: 34, lineHeight: 1, color: 'text.primary' }}
        >
          ‹
        </IconButton>
        <Typography variant="h2" component="h1" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
          {title}
        </Typography>
      </Stack>
      <Stack spacing={2}>{children}</Stack>
    </Box>
  )
}
