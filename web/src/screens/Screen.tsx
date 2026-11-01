import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'
import { Box, IconButton, Stack, Typography } from '@mui/material'

/**
 * Common frame of every screen: a header with a way back (to the home screen unless `back` says otherwise),
 * then the content in a phone-width column, or a desktop-width one if `wide`.
 */
export default function Screen({ title, back = '/', wide = false, children }: {
  title: string
  back?: string
  wide?: boolean
  children?: ReactNode
}) {
  return (
    <Box sx={{ maxWidth: wide ? 1400 : 600, mx: 'auto', px: 2, pt: 1.5, pb: 4 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
        <IconButton
          component={RouterLink}
          to={back}
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
