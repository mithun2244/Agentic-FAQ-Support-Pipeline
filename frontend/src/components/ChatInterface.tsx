import { useState, type FormEvent } from 'react'
import { ask, createTicket } from '../api/client'
import type { AskSource } from '../types'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  source?: AskSource
}

let nextId = 1

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fallbackQuestion, setFallbackQuestion] = useState<string | null>(null)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contact, setContact] = useState('')
  const [ticketMsg, setTicketMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    const question = input.trim()
    if (!question || loading) return

    setInput('')
    setError(null)
    setTicketMsg(null)
    setFallbackQuestion(null)
    setShowContactForm(false)
    setMessages((prev) => [...prev, { id: nextId++, role: 'user', content: question }])
    setLoading(true)

    try {
      const res = await ask(question)
      setMessages((prev) => [
        ...prev,
        { id: nextId++, role: 'assistant', content: res.answer, source: res.source },
      ])
      if (!res.resolved) setFallbackQuestion(question)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitTicket() {
    if (!fallbackQuestion) return
    try {
      await createTicket(fallbackQuestion, contact.trim() || undefined)
      setTicketMsg('Ticket submitted successfully! Our team will review it.')
      setFallbackQuestion(null)
      setShowContactForm(false)
      setContact('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit ticket')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 min-h-[50vh]">
        {messages.length === 0 && (
          <p className="text-slate-500 text-sm text-center mt-8">
            Ask a question about our courses to get started.
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
          >
            <div
              className={
                'max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ' +
                (msg.role === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-100')
              }
            >
              {msg.role === 'assistant' && msg.source === 'ticket' && (
                <span className="mb-1 block text-xs font-medium text-emerald-400">
                  ✅ Answered by our support team
                </span>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {loading && <div className="text-slate-500 text-sm">Thinking…</div>}
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {ticketMsg && (
        <div className="rounded-lg border border-emerald-800 bg-emerald-950/50 px-4 py-2 text-sm text-emerald-300">
          {ticketMsg}
        </div>
      )}

      {fallbackQuestion && !showContactForm && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3">
          <p className="mb-2 text-sm text-slate-400">I couldn't find this in our knowledge base.</p>
          <button
            type="button"
            onClick={() => setShowContactForm(true)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            📩 Contact Customer Service
          </button>
        </div>
      )}

      {fallbackQuestion && showContactForm && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3">
          <p className="mb-2 text-sm font-medium text-slate-200">
            Submit your question to our support team
          </p>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Your email or Discord tag (optional)"
            className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSubmitTicket}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Submit ticket
            </button>
            <button
              type="button"
              onClick={() => {
                setFallbackQuestion(null)
                setShowContactForm(false)
              }}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about our courses..."
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}
