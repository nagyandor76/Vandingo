import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import { participants, type Participant } from '../participants.ts'

/** One button per Participant; once one is picked, there is always one picked. */
export default function ParticipantPicker({ value, onChange }: {
  value: Participant | null
  onChange: (participant: Participant) => void
}) {
  return (
    <ToggleButtonGroup
      exclusive
      fullWidth
      color="primary"
      value={value}
      onChange={(_, picked: Participant | null) => picked && onChange(picked)}
      aria-label="Kitöltő"
    >
      {participants.map((name) => (
        <ToggleButton key={name} value={name} sx={{ minHeight: 48 }}>
          {name}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
