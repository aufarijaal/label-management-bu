import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import { alpha, useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import NewReleasesIcon from '@mui/icons-material/NewReleases'

// ── Change this value whenever you release a new update ───────────────────────
// Bump this string to make the banner reappear for all users.
export const CURRENT_UPDATE_ID = '2026-07-12'

const LS_KEY = 'slcm-whats-new-seen'

const CONTENT: Record<'en' | 'id', { title: string; items: string[] }> = {
  en: {
    title: "What's New · 12 Jul 2026",
    items: [
      'Card flow direction — choose horizontal (row) or vertical (column) grid layout for print',
      'EN / ID translation — switch the UI language at any time',
      'Configurable column names — map fields to any Excel header',
      'Dark mode — follows your system preference or toggle manually',
    ],
  },
  id: {
    title: 'Yang Baru · 12 Jul 2026',
    items: [
      'Arah aliran kartu — pilih horizontal (baris) atau vertikal (kolom) saat cetak',
      'Terjemahan EN / ID — ganti bahasa UI kapan aja',
      'Nama kolom bisa diatur — cocokin field ke header Excel apa aja',
      'Dark mode — ngikutin preferensi sistem atau toggle manual',
    ],
  },
}

export default function WhatsNewBanner({ lang }: { lang: 'en' | 'id' }) {
  const theme = useTheme()

  const [visible, setVisible] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_KEY) !== CURRENT_UPDATE_ID
    } catch {
      return true
    }
  })

  const dismiss = () => {
    try { localStorage.setItem(LS_KEY, CURRENT_UPDATE_ID) } catch { /* ignore */ }
    setVisible(false)
  }

  const content = CONTENT[lang]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, scaleY: 0.92 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -6, scaleY: 0.92 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{ transformOrigin: 'top' }}
        >
          <Paper
            variant="outlined"
            sx={{
              px: 2,
              py: 1.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              borderColor: alpha(theme.palette.primary.main, 0.35),
              bgcolor: alpha(
                theme.palette.primary.main,
                theme.palette.mode === 'dark' ? 0.08 : 0.04,
              ),
              borderRadius: 2,
            }}
          >
            <NewReleasesIcon
              sx={{ color: 'primary.main', fontSize: 20, mt: 0.25, flexShrink: 0 }}
            />

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: 'primary.main', mb: 0.25 }}
              >
                {content.title}
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {content.items.map((item, i) => (
                  <Typography
                    key={i}
                    component="li"
                    variant="caption"
                    sx={{ color: 'text.secondary', lineHeight: 1.7 }}
                  >
                    {item}
                  </Typography>
                ))}
              </Box>
            </Box>

            <IconButton
              size="small"
              onClick={dismiss}
              aria-label="dismiss update notification"
              sx={{ color: 'text.disabled', flexShrink: 0, mt: -0.25 }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Paper>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
