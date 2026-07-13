/**
 * Agent Trace — observability panel for the retrieval pipeline.
 *
 * Everything here is static mock data for layout purposes. Wiring it up means
 * having /ask return the retrieval trace (see TRACE below for the shape this
 * UI expects) instead of just the answer.
 */

interface RetrievedDoc {
  id: string
  question: string
  score: number
}

const TRACE = {
  vectorSearch: {
    index: 'faiss_index',
    status: 'healthy' as const,
    embedding: 'GoogleGenerativeAIEmbeddings',
    latencyMs: 42,
    topK: 3,
    vectors: 1284,
  },
  documents: [
    { id: 'FAQ-0142', question: 'Do you provide any job assistance?', score: 0.91 },
    { id: 'FAQ-0087', question: 'Will this course guarantee a placement?', score: 0.74 },
    { id: 'FAQ-0219', question: 'Is there a money back guarantee?', score: 0.52 },
  ] as RetrievedDoc[],
  routing: [
    { step: 'Resolved ticket lookup', outcome: 'miss', detail: 'No prior ticket matched' },
    { step: 'Vector retrieval', outcome: 'hit', detail: '3 chunks above threshold' },
    { step: 'RAG chain', outcome: 'hit', detail: 'gemini-1.5-flash · 0.4s' },
  ],
}

function scoreTone(score: number): string {
  if (score >= 0.8) return 'text-primary'
  if (score >= 0.6) return 'text-on-surface'
  return 'text-on-surface-variant'
}

function SectionHeading({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="material-symbols-outlined text-[18px] text-primary">{icon}</span>
      <h3 className="font-label text-label-caps text-on-surface-variant uppercase">{label}</h3>
    </div>
  )
}

export default function AgentTrace() {
  const { vectorSearch, documents, routing } = TRACE

  return (
    <div className="flex h-full flex-col gap-gutter overflow-y-auto px-5 py-6">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined fill-icon text-[20px] text-primary">
          network_intelligence
        </span>
        <h2 className="font-headline text-[18px] font-medium tracking-tight text-on-surface">
          Agent Trace
        </h2>
        <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 font-label text-label-caps text-primary">
          Mock
        </span>
      </div>

      {/* Vector Search Status */}
      <section className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl">
        <SectionHeading icon="database" label="Vector Search Status" />

        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="font-label text-mono-data text-primary">{vectorSearch.index}</span>
          <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 font-label text-label-caps text-primary">
            {vectorSearch.status}
          </span>
        </div>

        <dl className="space-y-2">
          {[
            ['Embeddings', vectorSearch.embedding],
            ['Vectors', vectorSearch.vectors.toLocaleString()],
            ['Top K', String(vectorSearch.topK)],
            ['Latency', `${vectorSearch.latencyMs}ms`],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <dt className="text-body-sm text-on-surface-variant">{label}</dt>
              <dd className="truncate font-label text-mono-data text-on-surface">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Retrieved Documents */}
      <section className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl">
        <SectionHeading icon="description" label="Retrieved Documents" />

        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="rounded-md border border-white/5 bg-black/20 p-3 transition-colors hover:border-primary/30"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="font-label text-mono-data text-on-surface-variant">{doc.id}</span>
                <span className={'font-label text-mono-data ' + scoreTone(doc.score)}>
                  {doc.score.toFixed(2)}
                </span>
              </div>
              <p className="mb-2 text-body-sm leading-snug text-on-surface">{doc.question}</p>
              {/* Similarity bar */}
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round(doc.score * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* LLM Routing Logic */}
      <section className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl">
        <SectionHeading icon="alt_route" label="LLM Routing Logic" />

        <ol className="space-y-3">
          {routing.map((step, i) => {
            const hit = step.outcome === 'hit'
            return (
              <li key={step.step} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ' +
                      (hit
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-white/10 bg-white/5 text-on-surface-variant')
                    }
                  >
                    <span className="material-symbols-outlined fill-icon text-[14px]">
                      {hit ? 'check' : 'remove'}
                    </span>
                  </span>
                  {i < routing.length - 1 && <span className="mt-1 w-px flex-1 bg-white/10" />}
                </div>
                <div className="min-w-0 pb-1">
                  <p
                    className={
                      'text-body-sm font-medium ' + (hit ? 'text-on-surface' : 'text-on-surface-variant')
                    }
                  >
                    {step.step}
                  </p>
                  <p className="font-label text-mono-data text-on-surface-variant/70">
                    {step.detail}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
