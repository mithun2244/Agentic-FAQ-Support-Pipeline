import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ask, createTicket } from '../api/client'
import type { AskSource } from '../types'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  source?: AskSource
  time: string
}

interface QuickStart {
  title: string
  subtitle: string
  icon: string
  /** Sent to /ask verbatim. Null routes straight to the support-ticket flow. */
  prompt: string | null
}

const QUICK_START: QuickStart[] = [
  {
    title: 'Machine Learning Syllabuses',
    subtitle: 'What the ML track covers',
    icon: 'neurology',
    prompt: 'What topics are covered in the machine learning course syllabus?',
  },
  {
    title: 'Course Prerequisites',
    subtitle: 'What you need to start',
    icon: 'checklist',
    prompt: 'What are the prerequisites for taking this course?',
  },
  {
    title: 'Refund Policies',
    subtitle: 'Money-back guarantee',
    icon: 'receipt_long',
    prompt: 'What is the refund policy?',
  },
  {
    title: 'Talk to an Advisor',
    subtitle: 'Reach a human on the team',
    icon: 'support_agent',
    prompt: null,
  },
]

const ADVISOR_QUESTION = 'I would like to speak with a course advisor.'

let nextId = 1

function now(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fallbackQuestion, setFallbackQuestion] = useState<string | null>(null)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contact, setContact] = useState('')
  const [ticketMsg, setTicketMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, fallbackQuestion, showContactForm, ticketMsg, error])

  async function send(question: string) {
    if (!question || loading) return

    setInput('')
    setError(null)
    setTicketMsg(null)
    setFallbackQuestion(null)
    setShowContactForm(false)
    setMessages((prev) => [...prev, { id: nextId++, role: 'user', content: question, time: now() }])
    setLoading(true)

    try {
      const res = await ask(question)
      setMessages((prev) => [
        ...prev,
        { id: nextId++, role: 'assistant', content: res.answer, source: res.source, time: now() },
      ])
      if (!res.resolved) setFallbackQuestion(question)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  function handleSend(e: FormEvent) {
    e.preventDefault()
    void send(input.trim())
  }

  function handleQuickStart(card: QuickStart) {
    // The advisor card skips retrieval — it is an escalation by definition.
    if (card.prompt === null) {
      setFallbackQuestion(ADVISOR_QUESTION)
      setShowContactForm(true)
      return
    }
    void send(card.prompt)
  }

  async function handleSubmitTicket() {
    if (!fallbackQuestion) return
    try {
      await createTicket(fallbackQuestion, contact.trim() || undefined)
      setTicketMsg('Ticket submitted. Our team will review it and reply.')
      setFallbackQuestion(null)
      setShowContactForm(false)
      setContact('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit ticket')
    }
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-4xl flex-1 space-y-6 overflow-y-auto scroll-smooth px-4 pt-8 pb-40 sm:px-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center pt-16 text-center">
            <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-surface-container-high glow-primary">
              <span className="material-symbols-outlined fill-icon text-[40px] text-primary">
                smart_toy
              </span>
            </div>
            <h2 className="mb-4 font-headline text-4xl font-bold tracking-tight text-on-surface sm:text-5xl">
              How can I help?
            </h2>
            <p className="max-w-2xl text-xl leading-relaxed text-on-surface-variant/80 sm:text-2xl">
              Ask anything about our courses. If I can&apos;t answer it, I&apos;ll escalate it to
              the support team.
            </p>

            <div
              className={
                'mt-12 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 ' +
                // Hide once the advisor card has opened the escalation flow.
                (fallbackQuestion || ticketMsg ? 'hidden' : '')
              }
            >
              {QUICK_START.map((card) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => handleQuickStart(card)}
                  disabled={loading}
                  className="group flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 text-left backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-white/[0.06] hover:glow-primary focus-visible:border-primary focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-surface-container-high transition-colors group-hover:bg-primary/10">
                    <span className="material-symbols-outlined text-[22px] text-primary">
                      {card.icon}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-lg font-medium text-on-surface transition-colors group-hover:text-primary">
                      {card.title}
                    </span>
                    <span className="block text-body-sm text-on-surface-variant">
                      {card.subtitle}
                    </span>
                  </span>
                  <span className="material-symbols-outlined ml-auto shrink-0 text-[20px] text-on-surface-variant/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary">
                    arrow_forward
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-8 text-center">
            <span className="inline-block rounded-full border border-white/5 bg-surface-container/50 px-3 py-1 font-label text-label-caps text-on-surface-variant backdrop-blur-md">
              Session started at {messages[0].time}
            </span>
          </div>
        )}

        {messages.map((msg) =>
          msg.role === 'user' ? (
            <div key={msg.id} className="flex w-full animate-fade-in-up flex-col items-end">
              <div className="max-w-[85%] rounded-xl rounded-tr-sm bg-primary-container px-6 py-4 text-on-primary-container shadow-[0_4px_20px_rgba(16,185,129,0.15)]">
                <p className="text-xl leading-relaxed">{msg.content}</p>
              </div>
              <span className="mt-1 mr-2 font-label text-mono-data text-on-surface-variant/50">
                {msg.time}
              </span>
            </div>
          ) : (
            <div key={msg.id} className="flex w-full animate-fade-in-up flex-col items-start">
              <div className="flex max-w-[85%] items-end gap-3">
                <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-surface-container-high">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    smart_toy
                  </span>
                </div>
                <div className="rounded-xl rounded-tl-sm border border-l-2 border-white/[0.08] border-l-primary bg-white/[0.03] px-6 py-5 backdrop-blur-xl">
                  {msg.source === 'ticket' && (
                    <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-label text-label-caps text-primary">
                      <span className="material-symbols-outlined fill-icon text-[14px]">
                        verified
                      </span>
                      Answered by our support team
                    </span>
                  )}
                  <p className="text-xl leading-relaxed text-on-surface">{msg.content}</p>
                </div>
              </div>
              <span className="mt-1 ml-11 font-label text-mono-data text-on-surface-variant/50">
                {msg.time}
              </span>
            </div>
          ),
        )}

        {loading && (
          <div className="flex w-full flex-col items-start">
            <div className="flex items-end gap-3">
              <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-surface-container-high">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  smart_toy
                </span>
              </div>
              <div className="flex gap-1 rounded-xl rounded-tl-sm border border-white/[0.08] bg-white/[0.03] px-4 py-3 backdrop-blur-xl">
                <div className="h-2 w-2 animate-bounce rounded-full bg-on-surface-variant" />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-on-surface-variant"
                  style={{ animationDelay: '0.2s' }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-on-surface-variant"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="animate-fade-in-up rounded-xl border border-error/20 bg-error/5 px-5 py-4 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined fill-icon text-[20px] text-error">
                warning
              </span>
              <p className="text-lg text-error">{error}</p>
            </div>
          </div>
        )}

        {ticketMsg && (
          <div className="animate-fade-in-up rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined fill-icon text-[20px] text-primary">
                task_alt
              </span>
              <p className="text-lg text-primary">{ticketMsg}</p>
            </div>
          </div>
        )}

        {/* Escalation card — the knowledge base missed, so offer a human. */}
        {fallbackQuestion && (
          <div className="mx-auto w-full max-w-[90%] animate-fade-in-up">
            <div className="rounded-xl border border-error/20 bg-surface-container-high/80 p-[1px] backdrop-blur-2xl">
              <div className="rounded-xl bg-background/90 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-error/20 bg-error/10">
                    <span className="material-symbols-outlined fill-icon text-[20px] text-error">
                      help
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1.5 font-headline text-2xl font-semibold text-error">
                      Not in the knowledge base
                    </h3>
                    <p className="text-lg leading-relaxed text-on-surface-variant">
                      I couldn&apos;t find a confident answer. Send this to the support team and
                      they&apos;ll get back to you.
                    </p>

                    {showContactForm ? (
                      <div className="mt-4">
                        <input
                          type="text"
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          placeholder="Your email or Discord tag (optional)"
                          className="mb-3 w-full rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-lg text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void handleSubmitTicket()}
                            className="rounded-full bg-primary px-6 py-3 text-lg font-medium text-on-primary transition-all hover:bg-primary-fixed active:scale-95 hover:glow-primary"
                          >
                            Submit ticket
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFallbackQuestion(null)
                              setShowContactForm(false)
                            }}
                            className="rounded-full border border-white/10 px-6 py-3 text-lg text-on-surface-variant transition-colors hover:bg-white/5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowContactForm(true)}
                        className="mt-4 flex items-center justify-center gap-2 rounded-full bg-error px-6 py-3 text-lg font-medium text-on-error transition-all hover:bg-error/90 active:scale-95"
                      >
                        <span>Contact customer service</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Floating input — fades the conversation out behind it. */}
      <div className="pointer-events-none absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background/90 to-transparent p-4 sm:p-6">
        <div className="pointer-events-auto relative mx-auto max-w-3xl">
          <form
            onSubmit={handleSend}
            className="relative flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1.5 shadow-2xl backdrop-blur-2xl transition-all duration-300 focus-within:border-primary focus-within:bg-white/[0.06]"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about our courses..."
              aria-label="Ask a question"
              className="min-w-0 flex-1 border-none bg-transparent px-5 py-2.5 text-lg text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="ml-1 flex shrink-0 items-center justify-center rounded-full bg-primary p-3.5 text-on-primary transition-all duration-200 hover:bg-primary-fixed active:scale-95 disabled:opacity-40 disabled:hover:bg-primary hover:glow-primary"
            >
              <span className="material-symbols-outlined fill-icon text-[24px]">send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
