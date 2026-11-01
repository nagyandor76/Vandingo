// Thin client for the backend's /api endpoints.

export interface Subject {
  key: string
  name: string
  max_questions: number
  auto_advance: boolean
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`${path}: ${response.status}`)
  return (await response.json()) as T
}

export const fetchSubjects = () => getJson<Subject[]>('/api/subjects')
