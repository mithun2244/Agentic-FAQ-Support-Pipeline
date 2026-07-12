import { useState } from 'react'
import ChatInterface from './components/ChatInterface'
import AdminDashboard from './components/AdminDashboard'

type View = 'chat' | 'admin'

export default function App() {
  const [view, setView] = useState<View>('chat')

  const tabClass = (active: boolean) =>
    'rounded-lg px-3 py-1.5 text-sm font-medium transition ' +
    (active ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold">
            Agentic FAQ Support Pipeline <span aria-hidden>🌱</span>
          </h1>
          <nav className="flex gap-1">
            <button type="button" className={tabClass(view === 'chat')} onClick={() => setView('chat')}>
              Chat
            </button>
            <button type="button" className={tabClass(view === 'admin')} onClick={() => setView('admin')}>
              Admin Portal
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {view === 'chat' ? <ChatInterface /> : <AdminDashboard />}
      </main>
    </div>
  )
}
