import type { AskResponse, MutationResult, Ticket } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`API ${res.status}: ${detail}`)
  }
  return (await res.json()) as T
}

/** Ask a question: resolved-ticket lookup first, then the RAG chain. */
export function ask(question: string): Promise<AskResponse> {
  return request<AskResponse>('/ask', {
    method: 'POST',
    body: JSON.stringify({ question }),
  })
}

/** Escalate an unanswered question to a support ticket. */
export function createTicket(question: string, contact?: string): Promise<MutationResult> {
  return request<MutationResult>('/tickets', {
    method: 'POST',
    body: JSON.stringify({ question, contact: contact ?? null }),
  })
}

/** List all pending tickets (admin). */
export function getPendingTickets(): Promise<Ticket[]> {
  return request<Ticket[]>('/tickets/pending')
}

/** Answer a ticket and mark it resolved (admin). */
export function answerTicket(ticketId: number, answer: string): Promise<MutationResult> {
  return request<MutationResult>('/tickets/answer', {
    method: 'POST',
    body: JSON.stringify({ ticket_id: ticketId, answer }),
  })
}
