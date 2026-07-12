export type AskSource = 'ticket' | 'rag'

export interface AskResponse {
  question: string
  answer: string
  source: AskSource
  resolved: boolean
}

export interface Ticket {
  id: number
  question: string
  answer: string | null
  status: string
  contact: string | null
  created_at: string | null
}

export interface MutationResult {
  id: number
  status: string
}
