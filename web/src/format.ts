/** Seconds as m:ss, e.g. 156 → 2:36. */
export const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
