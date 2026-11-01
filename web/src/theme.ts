// The app's single visual style ("Vidám", ticket 13): colours, type, radius and button look live here.
import { createTheme, lighten } from '@mui/material'

declare module '@mui/material/styles' {
  interface PaletteColor {
    /** Very light tint for backgrounds, e.g. a statement marked correct or wrong. */
    soft: string
  }
  interface SimplePaletteColorOptions {
    soft?: string
  }
  interface Palette {
    /** Colours telling the pairs of an open word-matching Block apart; never green or red. */
    pairs: string[]
  }
  interface PaletteOptions {
    pairs?: string[]
  }
}

const radius = 12
const springy = 'cubic-bezier(.3,1.6,.6,1)'

const glow = (main: string) => ({
  background: `linear-gradient(180deg, ${lighten(main, 0.15)}, ${main})`,
  boxShadow: `0 6px 16px -6px ${main}, inset 0 1px 0 rgba(255,255,255,0.35)`,
  '&:hover': { boxShadow: `0 10px 20px -8px ${main}, inset 0 1px 0 rgba(255,255,255,0.35)` },
  '&:active': { boxShadow: 'none' },
})

export const theme = createTheme({
  palette: {
    // Cheerful mint green; `dark` is the readable shade used for green text.
    primary: { main: '#12b76a', dark: '#0b7a47', soft: '#e7f8ef', contrastText: '#fff' },
    // Answer feedback: correct is green, wrong (or missing) is red.
    success: { main: '#1f8a4c', soft: '#e8f5ec', contrastText: '#fff' },
    error: { main: '#c2413b', soft: '#fbecea', contrastText: '#fff' },
    pairs: ['#7c5cff', '#f59e0b', '#0ea5e9', '#ec4899', '#475569'],
    text: { primary: '#1f2933', secondary: '#6b7480' },
    divider: '#dcdfe3',
    background: { default: '#fff', paper: '#fff' },
  },
  // The browser's own font, no web font download.
  typography: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: 26, fontWeight: 700, letterSpacing: -0.3 },
    h2: { fontSize: 22, fontWeight: 700, letterSpacing: -0.3 },
    h3: { fontSize: 18, fontWeight: 700 },
    body1: { fontSize: 16, lineHeight: 1.4 },
    body2: { fontSize: 14 },
    caption: { fontSize: 13 },
    button: { fontSize: 16, fontWeight: 700, textTransform: 'none' },
  },
  shape: { borderRadius: radius },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        // Soft coloured glow instead of a hard shadow; lifts on hover, springs in when pressed.
        root: ({ theme }) => ({
          minHeight: 48,
          padding: theme.spacing(1.1, 2),
          transition: `transform 140ms ${springy}, box-shadow 140ms, background-color 120ms, border-color 120ms`,
          // Only on real hover: on phones :hover sticks after a tap.
          '@media (hover: hover)': { '&:hover': { transform: 'translateY(-2px)' } },
          '&:active': { transform: 'scale(0.96)', boxShadow: 'none' },
          '&.Mui-disabled': { opacity: 0.4, boxShadow: 'none' },
          variants: [
            ...(['primary', 'success', 'error'] as const).map((color) => ({
              props: { variant: 'contained' as const, color },
              style: glow(theme.palette[color].main),
            })),
            {
              props: { variant: 'outlined' },
              style: ({ theme }) => ({
                border: `1.5px solid ${theme.palette.divider}`,
                color: theme.palette.text.primary,
                boxShadow: '0 1px 2px rgba(16,24,40,0.06), 0 2px 6px rgba(16,24,40,0.06)',
                '&:hover': { borderColor: theme.palette.primary.main, borderWidth: 1.5, backgroundColor: theme.palette.background.paper },
              }),
            },
            { props: { size: 'large' }, style: { minHeight: 56, fontSize: 17 } },
          ],
        }),
      },
    },
    MuiPaper: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { outlined: ({ theme }) => ({ borderColor: theme.palette.divider }) },
    },
  },
})
