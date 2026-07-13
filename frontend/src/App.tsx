import { useState } from 'react'
import ChatInterface from './components/ChatInterface'
import AdminDashboard from './components/AdminDashboard'
import AgentTrace from './components/AgentTrace'

type View = 'chat' | 'admin'

interface NavItem {
  view: View
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { view: 'chat', label: 'Conversations', icon: 'chat_bubble' },
  { view: 'admin', label: 'Escalations', icon: 'priority_high' },
]

export default function App() {
  const [view, setView] = useState<View>('chat')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [traceOpen, setTraceOpen] = useState(true)

  function go(next: View) {
    setView(next)
    setDrawerOpen(false)
  }

  const showTrace = view === 'chat'

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas font-body text-body-lg text-on-background selection:bg-primary-container selection:text-on-primary-container">
      <header className="z-50 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-background/60 px-gutter backdrop-blur-md">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          className="-ml-2 flex items-center justify-center rounded-full p-2 text-primary transition-opacity hover:opacity-80"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <h1 className="font-headline text-headline-md font-bold tracking-tight text-primary">
          AI Support Hub
        </h1>

        <div className="flex items-center gap-3">
          {/* Trace toggle is desktop-only — the panel itself is hidden below lg. */}
          {showTrace && (
            <button
              type="button"
              onClick={() => setTraceOpen((open) => !open)}
              aria-label={traceOpen ? 'Hide agent trace' : 'Show agent trace'}
              aria-pressed={traceOpen}
              className={
                'hidden items-center justify-center rounded-full p-2 transition-colors lg:flex ' +
                (traceOpen
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:text-primary')
              }
            >
              <span className="material-symbols-outlined text-[22px]">network_intelligence</span>
            </button>
          )}

          <span className="hidden font-label text-label-caps text-on-surface-variant md:block">
            {view === 'chat' ? 'Customer' : 'Support Agent'}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-surface-container-high">
            <span className="material-symbols-outlined fill-icon text-[16px] text-primary">
              {view === 'chat' ? 'person' : 'shield_person'}
            </span>
          </div>
        </div>
      </header>

      {drawerOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm"
        />
      )}

      <aside
        className={
          'fixed top-0 left-0 z-70 flex h-full w-sidebar flex-col border-r border-white/5 bg-surface-container py-gutter backdrop-blur-xl transition-transform duration-300 ease-in-out ' +
          (drawerOpen ? 'translate-x-0' : '-translate-x-full')
        }
      >
        <div className="mb-4 border-b border-white/5 px-gutter pb-6">
          <div className="mb-3 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/30 bg-surface-container-high">
              <span className="material-symbols-outlined fill-icon text-[24px] text-primary">
                smart_toy
              </span>
            </div>
            <div>
              <h2 className="font-headline text-headline-md tracking-tight text-primary">
                FAQ Agent
              </h2>
              <p className="text-body-sm text-on-surface-variant">Agentic Support Pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="font-label text-label-caps text-primary/80">Active Now</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4">
          {NAV_ITEMS.map((item) => {
            const active = view === item.view
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => go(item.view)}
                aria-current={active ? 'page' : undefined}
                className={
                  'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors duration-200 ' +
                  (active
                    ? 'border-l-4 border-primary bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:bg-white/5')
                }
              >
                <span
                  className={
                    'material-symbols-outlined text-[20px] ' + (active ? 'fill-icon' : '')
                  }
                >
                  {item.icon}
                </span>
                <span className={'text-body-md ' + (active ? 'font-medium' : '')}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="flex min-h-0 flex-1">
        <main className="relative flex min-h-0 flex-1 flex-col bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-surface-container/40 via-background to-background">
          {view === 'chat' ? (
            <ChatInterface />
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
              <div className="mx-auto max-w-4xl">
                <AdminDashboard />
              </div>
            </div>
          )}
        </main>

        {showTrace && (
          <aside
            className={
              'hidden min-h-0 shrink-0 border-l border-white/[0.08] bg-surface-container/40 backdrop-blur-xl transition-[width] duration-300 ease-in-out lg:block ' +
              (traceOpen ? 'w-[340px]' : 'w-0 overflow-hidden border-l-0')
            }
            aria-hidden={!traceOpen}
          >
            <div className="h-full w-[340px]">
              <AgentTrace />
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
