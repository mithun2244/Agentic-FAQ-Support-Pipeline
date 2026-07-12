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
      <form onSubmit={handleLogin} className="mx-auto mt-12 max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-1 text-lg font-semibold text-slate-100">🔐 Admin Portal</h2>
        <p className="mb-4 text-sm text-slate-400">Enter the admin password to manage tickets.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Login
        </button>
      </form>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">🛠️ Pending Tickets</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {notice && (
        <div className="rounded-lg border border-emerald-800 bg-emerald-950/50 px-4 py-2 text-sm text-emerald-300">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-slate-500">Loading…</p>}

      {!loading && tickets.length === 0 && (
        <p className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-6 text-center text-sm text-slate-400">
          No pending tickets right now. 🎉
        </p>
      )}

      {tickets.map((ticket) => (
        <div key={ticket.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200">Ticket #{ticket.id}</span>
            {ticket.created_at && (
              <span className="text-xs text-slate-500">{ticket.created_at}</span>
            )}
          </div>
          <p className="mb-1 text-sm text-slate-100">
            <span className="font-medium text-slate-400">Question:</span> {ticket.question}
          </p>
          {ticket.contact && (
            <p className="mb-2 text-xs text-slate-500">📇 Contact: {ticket.contact}</p>
          )}
          <textarea
            value={answers[ticket.id] ?? ''}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
            placeholder="Type the resolution here..."
            rows={3}
            className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void handleAnswer(ticket.id)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Send Answer
          </button>
        </div>
      ))}
    </div>
  )
}
