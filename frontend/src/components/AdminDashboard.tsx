import { useEffect, useState, type FormEvent } from 'react'
import { answerTicket, getPendingTickets } from '../api/client'
import type { Ticket } from '../types'

// NOTE: this is a client-side gate for the demo only. The FastAPI /tickets
// endpoints are currently unauthenticated — add real auth to the backend
// before exposing the admin portal in production.
const ADMIN_PASSWORD = 'admin123'

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setTickets(await getPendingTickets())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authed) void load()
  }, [authed])

  function handleLogin(e: FormEvent) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
      setError(null)
    } else {
      setError('Incorrect password.')
    }
  }

  async function handleAnswer(id: number) {
    const text = (answers[id] ?? '').trim()
    if (!text) return
    try {
      await answerTicket(id, text)
      setNotice(`Ticket #${id} answered and marked resolved.`)
      setAnswers((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to answer ticket')
    }
  }

  if (!authed) {
    return (
      <form
        onSubmit={handleLogin}
        className="mx-auto mt-12 max-w-sm animate-fade-in-up rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-surface-container-high">
            <span className="material-symbols-outlined fill-icon text-[20px] text-primary">
              shield_person
            </span>
          </div>
          <div>
            <h2 className="font-headline text-[18px] font-medium tracking-tight text-on-surface">
              Admin Portal
            </h2>
            <p className="text-body-sm text-on-surface-variant">Sign in to manage escalations.</p>
          </div>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          aria-label="Admin password"
          className="mb-3 w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
        />

        {error && (
          <p className="mb-3 flex items-center gap-2 text-body-sm text-error">
            <span className="material-symbols-outlined fill-icon text-[16px]">warning</span>
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-full bg-primary px-5 py-2.5 text-body-sm font-medium text-on-primary transition-all hover:bg-primary-fixed hover:glow-primary active:scale-95"
        >
          Login
        </button>
      </form>
    )
  }

  return (
    <div className="flex flex-col gap-gutter">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline text-headline-md tracking-tight text-on-surface">
            Escalations
          </h2>
          <p className="font-label text-label-caps text-on-surface-variant">
            {tickets.length} pending
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-body-sm text-on-surface-variant transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh
        </button>
      </div>

      {notice && (
        <div className="animate-fade-in-up rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined fill-icon text-[20px] text-primary">
              task_alt
            </span>
            <p className="text-body-sm text-primary">{notice}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="animate-fade-in-up rounded-xl border border-error/20 bg-error/5 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined fill-icon text-[20px] text-error">
              warning
            </span>
            <p className="text-body-sm text-error">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Loading tickets…
        </div>
      )}

      {!loading && tickets.length === 0 && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-12 text-center backdrop-blur-xl">
          <span className="material-symbols-outlined mb-2 block text-[32px] text-primary">
            inbox
          </span>
          <p className="text-body-md text-on-surface">Queue is clear</p>
          <p className="text-body-sm text-on-surface-variant">No pending tickets right now.</p>
        </div>
      )}

      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          className="animate-fade-in-up rounded-xl border border-white/[0.08] bg-white/[0.03] p-gutter backdrop-blur-xl"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-label text-mono-data text-on-surface-variant">
                #{ticket.id}
              </span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-label text-label-caps text-primary">
                {ticket.status}
              </span>
            </div>
            {ticket.created_at && (
              <span className="font-label text-mono-data text-on-surface-variant/50">
                {ticket.created_at}
              </span>
            )}
          </div>

          <p className="mb-3 text-body-md leading-relaxed text-on-surface">{ticket.question}</p>

          {ticket.contact && (
            <div className="mb-3 flex items-center gap-2 rounded-md border border-white/5 bg-black/20 px-3 py-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                alternate_email
              </span>
              <span className="font-label text-mono-data text-on-surface-variant">
                {ticket.contact}
              </span>
            </div>
          )}

          <textarea
            value={answers[ticket.id] ?? ''}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
            placeholder="Type the resolution here..."
            rows={3}
            aria-label={`Answer for ticket ${ticket.id}`}
            className="mb-3 w-full resize-y rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
          />

          <button
            type="button"
            onClick={() => void handleAnswer(ticket.id)}
            disabled={!(answers[ticket.id] ?? '').trim()}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-body-sm font-medium text-on-primary transition-all hover:bg-primary-fixed hover:glow-primary active:scale-95 disabled:opacity-40 disabled:hover:bg-primary"
          >
            <span className="material-symbols-outlined fill-icon text-[18px]">send</span>
            Send answer
          </button>
        </div>
      ))}
    </div>
  )
}
