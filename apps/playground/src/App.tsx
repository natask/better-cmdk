import { Component, forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Command, betterMatch } from 'master-cmdk'
import { Command as OldCommand } from 'cmdk'

// --- data ---------------------------------------------------------------

const items = [
  { id: 'new-file',  label: 'New File',      icon: '+',  meta: '⌘N',  keywords: ['create', 'add'] },
  { id: 'open-file', label: 'Open File',     icon: '↗',  meta: '⌘O',  keywords: ['load'] },
  { id: 'save-file', label: 'Save File',     icon: '⤓',  meta: '⌘S',  keywords: ['write'] },
  { id: 'cafe',      label: 'Café',          icon: '◷',  meta: '',    keywords: ['coffee'] },
  { id: 'github',    label: 'GitHub',        icon: '⎇',  meta: '⌘G',  keywords: ['gh', 'git'] },
  { id: 'settings',  label: 'Settings',      icon: '⚙',  meta: '⌘,',  keywords: ['prefs', 'config'] },
]

const selectionDemoItems = [
  { value: 'alpha',   label: 'Alpha'   },
  { value: 'bravo',   label: 'Bravo'   },
  { value: 'charlie', label: 'Charlie' },
  { value: 'delta',   label: 'Delta'   },
  { value: 'echo',    label: 'Echo'    },
  { value: 'foxtrot', label: 'Foxtrot' },
  { value: 'golf',    label: 'Golf'    },
  { value: 'hotel',   label: 'Hotel'   },
]
const scrollDemoItems = Array.from({ length: 100 }, (_, i) => ({ value: `item-${i + 1}`,      label: `Item ${i + 1}`      }))
const PERF_SIZES = [5_000, 50_000, 500_000] as const
type PerfItem = { value: string; label: string }
// Build `count` items without blocking the main thread: write in CHUNK-sized
// slices and yield via requestIdleCallback (or setTimeout fallback). Returns
// a cancel fn so an in-flight build can be dropped when size/arm toggles.
function buildPerfItemsAsync(
  count: number,
  onProgress: (done: number, result: PerfItem[]) => void,
  onDone: (result: PerfItem[]) => void,
): () => void {
  const CHUNK = 5_000
  const schedule: (cb: () => void) => number =
    typeof (globalThis as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback === 'function'
      ? (globalThis as { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback
      : (cb) => setTimeout(cb, 0) as unknown as number
  const result: PerfItem[] = new Array(count)
  let i = 0
  let cancelled = false
  const step = () => {
    if (cancelled) return
    const end = Math.min(i + CHUNK, count)
    for (; i < end; i++) {
      result[i] = { value: `perf-item-${i + 1}`, label: `Perf Item ${i + 1}` }
    }
    if (i < count) {
      onProgress(i, result)
      schedule(step)
    } else {
      onDone(result)
    }
  }
  schedule(step)
  return () => {
    cancelled = true
  }
}
const asyncDemoItems  = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon']
const ingestionRows = [
  { value: 'open-repo', label: 'Open Repository' },
  { value: 'deploy', label: 'Deploy' },
  { value: 'run-tests', label: 'Run Tests' },
  { value: 'toggle-theme', label: 'Toggle Theme' },
]
const alwaysMatch = () => 1

// --- small pieces -------------------------------------------------------

function Kbd({ children, hot }: { children: React.ReactNode; hot?: boolean }) {
  return <kbd className={hot ? 'hot' : undefined}>{children}</kbd>
}

const CmdInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Command.Input> & { hint?: React.ReactNode }
>(function CmdInput(props, ref) {
  const { hint, ...rest } = props
  return (
    <div className="pg-input">
      <span className="pg-input__glyph" aria-hidden>❯</span>
      <Command.Input ref={ref} {...rest} />
      {hint ? <div className="pg-input__kbd">{hint}</div> : null}
    </div>
  )
})

function SxS({
  oldNode,
  newNode,
  oldNote,
  newNote,
  oldTag = 'pointer steals selection',
  newTag = 'fixed in master-cmdk',
  oldLabel = 'old · cmdk',
  newLabel = 'new · master-cmdk',
}: {
  oldNode: React.ReactNode
  newNode: React.ReactNode
  oldNote?: React.ReactNode
  newNote?: React.ReactNode
  oldTag?: string
  newTag?: string
  oldLabel?: string
  newLabel?: string
}) {
  return (
    <div className="pg-sxs">
      <div className="pg-sxs__col">
        <div className="pg-sxs__tag pg-sxs__tag--old">
          <span>{oldLabel}</span>
          <span className="pg-sxs__tagdot" />
          <span>{oldTag}</span>
        </div>
        {oldNode}
        {oldNote ? <p className="pg-sxs__note">{oldNote}</p> : null}
      </div>
      <div className="pg-sxs__col">
        <div className="pg-sxs__tag pg-sxs__tag--new">
          <span>{newLabel}</span>
          <span className="pg-sxs__tagdot" />
          <span>{newTag}</span>
        </div>
        {newNode}
        {newNote ? <p className="pg-sxs__note">{newNote}</p> : null}
      </div>
    </div>
  )
}

function NAStub({ reason }: { reason: React.ReactNode }) {
  return (
    <div className="pg-na">
      <div className="pg-na__tag">N / A</div>
      <p className="pg-na__body">{reason}</p>
    </div>
  )
}

// Monkey-patches Element.prototype.scrollIntoView once and returns per-side counts.
// The call is attributed to the closest ancestor bearing data-scroll-side="old|new".
// The sentinel lives on the patched function itself so Vite HMR re-evaluating this
// module does not wrap an already-wrapped method (which would double-count).
const scrollIntoViewCounters = { old: 0, new: 0 }
const scrollIntoViewListeners = new Set<() => void>()
type PatchedScrollIntoView = typeof Element.prototype.scrollIntoView & {
  __cmdkPatched?: true
  __cmdkCounters?: typeof scrollIntoViewCounters
  __cmdkListeners?: typeof scrollIntoViewListeners
}
function patchScrollIntoViewOnce() {
  if (typeof Element === 'undefined') return
  const current = Element.prototype.scrollIntoView as PatchedScrollIntoView
  if (current.__cmdkPatched) {
    // Reuse the existing patch's counters/listeners so HMR re-evals share state.
    Object.assign(scrollIntoViewCounters, current.__cmdkCounters)
    current.__cmdkCounters = scrollIntoViewCounters
    current.__cmdkListeners?.forEach((fn) => scrollIntoViewListeners.add(fn))
    current.__cmdkListeners = scrollIntoViewListeners
    return
  }
  const original = current
  const patched: PatchedScrollIntoView = function (
    this: Element,
    ...args: Parameters<typeof original>
  ) {
    const host = this.closest?.('[data-scroll-side]') as HTMLElement | null
    const side = host?.dataset.scrollSide as 'old' | 'new' | undefined
    const counters = patched.__cmdkCounters!
    const listeners = patched.__cmdkListeners!
    if (side) {
      counters[side] += 1
      listeners.forEach((fn) => fn())
    }
    return original.apply(this, args)
  }
  patched.__cmdkPatched = true
  patched.__cmdkCounters = scrollIntoViewCounters
  patched.__cmdkListeners = scrollIntoViewListeners
  Element.prototype.scrollIntoView = patched
}
function useScrollIntoViewCounter() {
  const [tick, setTick] = useState(0)
  useLayoutEffect(() => {
    patchScrollIntoViewOnce()
    const fn = () => setTick((n) => n + 1)
    scrollIntoViewListeners.add(fn)
    return () => {
      scrollIntoViewListeners.delete(fn)
    }
  }, [])
  return {
    old: scrollIntoViewCounters.old,
    new: scrollIntoViewCounters.new,
    reset: () => {
      scrollIntoViewCounters.old = 0
      scrollIntoViewCounters.new = 0
      setTick((n) => n + 1)
    },
    tick,
  }
}

class CrashBoundary extends Component<
  { fallback: (err: Error) => ReactNode; children: ReactNode },
  { err: Error | null }
> {
  state = { err: null as Error | null }
  static getDerivedStateFromError(err: Error) {
    return { err }
  }
  render() {
    if (this.state.err) return this.props.fallback(this.state.err)
    return this.props.children
  }
}

// Approximates cost between first render start and first commit via
// useLayoutEffect (after DOM mutations, before paint). StrictMode in dev
// double-renders, which would over-count; `measuredRef` guards against that.
// This is not a precise paint-to-paint number — for that, use the Performance
// panel. It does reliably show the order-of-magnitude difference between
// mounting 500k items vs rendering ~30.
function PerfMountTimer({ onMount, children }: { onMount: (ms: number) => void; children: ReactNode }) {
  const start = useRef(typeof performance !== 'undefined' ? performance.now() : Date.now())
  const measuredRef = useRef(false)
  useLayoutEffect(() => {
    if (measuredRef.current) return
    measuredRef.current = true
    const end = typeof performance !== 'undefined' ? performance.now() : Date.now()
    onMount(Math.round(end - start.current))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <>{children}</>
}

// Fires a synthetic CompositionEvent sequence at a native input element.
// updates = intermediate composition states; final = committed string at compositionend.
// Each intermediate `input` event carries `isComposing=true` so both the ref-based
// and the nativeEvent.isComposing branches in master-cmdk's Input are exercised;
// upstream cmdk sees the same events but only suppresses via its own composition
// handlers, so it still fires onValueChange per update (the behavior we demo).
function playComposition(input: HTMLInputElement, updates: string[], final: string) {
  const setNativeValue = (el: HTMLInputElement, val: string) => {
    const desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
    desc?.set?.call(el, val)
  }
  const makeInputEvent = (composing: boolean) => {
    const ev = new Event('input', { bubbles: true })
    Object.defineProperty(ev, 'isComposing', { value: composing, configurable: true })
    return ev
  }
  input.focus()
  input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
  for (const frag of updates) {
    setNativeValue(input, frag)
    input.dispatchEvent(makeInputEvent(true))
    input.dispatchEvent(new CompositionEvent('compositionupdate', { data: frag, bubbles: true }))
  }
  setNativeValue(input, final)
  input.dispatchEvent(new CompositionEvent('compositionend', { data: final, bubbles: true }))
  // A real IME commits the final value after compositionend via one more input
  // event with isComposing=false. Fire that too so the store/display update.
  input.dispatchEvent(makeInputEvent(false))
}

const MATCHER_SAMPLES = [
  { label: 'GitHub',            note: 'exact / prefix / acronym' },
  { label: 'Git Hub',           note: 'word-prefix for "hub"' },
  { label: 'NewFileDialog',     note: 'camelCase word split' },
  { label: 'open-repo',         note: 'kebab word split' },
  { label: 'Café',              note: 'diacritic fold to "cafe"' },
  { label: 'ሰላም · hello',       note: 'leading non-Latin, Latin fuzzy from alias' },
  { label: 'Settings',          note: 'prefix for "se" / "set"' },
  { label: 'Debug',             note: 'fuzzy fallback' },
]

function tierLabel(score: number): string {
  if (score === 0) return '—'
  if (score >= 1) return 'exact'
  if (score >= 0.9) return 'prefix'
  if (score >= 0.8) return 'word-prefix'
  if (score >= 0.7) return 'acronym'
  if (score >= 0.6) return 'substring'
  return 'fuzzy'
}

function MatcherTable({ search }: { search: string }) {
  const rows = useMemo(() => {
    return MATCHER_SAMPLES.map((s) => ({
      ...s,
      score: search ? betterMatch(s.label, search) : 0,
    })).sort((a, b) => b.score - a.score)
  }, [search])
  return (
    <div className="pg-matcher">
      <div className="pg-matcher__head">
        <span>haystack</span>
        <span>tier</span>
        <span>score</span>
        <span>why</span>
      </div>
      {rows.map((r) => (
        <div className="pg-matcher__row" key={r.label} data-score={r.score > 0 ? 'hit' : 'miss'}>
          <span>{r.label}</span>
          <span>{tierLabel(r.score)}</span>
          <span>{r.score.toFixed(2)}</span>
          <span style={{ color: 'var(--text-mute)' }}>{r.note}</span>
        </div>
      ))}
    </div>
  )
}

type PaneProps = {
  num: string
  title: string
  desc?: React.ReactNode
  chip?: string
  status?: React.ReactNode
  foot?: React.ReactNode
  children: React.ReactNode
  id?: string
}
function Pane({ num, title, desc, chip, status, foot, children, id }: PaneProps) {
  return (
    <section className="pg-pane" id={id}>
      <div className="pg-pane__head">
        <span className="pg-pane__num">{num}</span>
        <span className="pg-pane__prompt">❯</span>
        <span className="pg-pane__title">{title}</span>
        {chip ? <span className="pg-pane__chip">{chip}</span> : null}
      </div>
      {desc ? <p className="pg-pane__desc">{desc}</p> : null}
      {status ? <p className="pg-pane__status">{status}</p> : null}
      {children}
      {foot ? <div className="pg-pane__foot">{foot}</div> : null}
    </section>
  )
}

// --- app ----------------------------------------------------------------

export function App() {
  const [value, setValue] = useState('')
  const [pointerSearch, setPointerSearch] = useState('')
  const [accentSearch, setAccentSearch] = useState('')
  const [groupSearch, setGroupSearch] = useState('')
  const [groupOrderSearch, setGroupOrderSearch] = useState('')
  const [scrollSearch, setScrollSearch] = useState('')
  const [perfSearch, setPerfSearch] = useState('')
  const [perfNewOn, setPerfNewOn] = useState(false)
  const [perfOldOn, setPerfOldOn] = useState(false)
  const [perfMount, setPerfMount] = useState<{ old?: number; new?: number }>({})
  const [perfSize, setPerfSize] = useState<number>(5_000)
  const [perfItems, setPerfItems] = useState<PerfItem[]>([])
  const [perfBuilt, setPerfBuilt] = useState(0)
  const [perfBuilding, setPerfBuilding] = useState(false)
  const [groupFilterSearch, setGroupFilterSearch] = useState('')
  const [asyncItems, setAsyncItems] = useState(asyncDemoItems)
  const [asyncLoading, setAsyncLoading] = useState(false)
  const [asyncStatus, setAsyncStatus] = useState('idle')
  const [asyncControlledQuery, setAsyncControlledQuery] = useState('')
  const [asyncControlledCalls, setAsyncControlledCalls] = useState(0)
  const [dxEmptyHits, setDxEmptyHits] = useState(0)
  const [dxSearchEcho, setDxSearchEcho] = useState('')
  const [imeOldCalls, setImeOldCalls] = useState<string[]>([])
  const [imeNewCalls, setImeNewCalls] = useState<string[]>([])
  const [matcherSearch, setMatcherSearch] = useState('')
  const [ingestionSearch, setIngestionSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const asyncRequestId = useRef(0)
  const specialGroupValue = 'a.b:c#d"e'
  const scrollOldRef = useRef<HTMLInputElement>(null)
  const scrollNewRef = useRef<HTMLInputElement>(null)
  const imeOldRef = useRef<HTMLInputElement>(null)
  const imeNewRef = useRef<HTMLInputElement>(null)
  const scrollCounter = useScrollIntoViewCounter()

  // Build the perf list asynchronously, in 5k-item slices, when either panel
  // is armed or the size selector changes. Cancels any in-flight build on
  // disarm / size change so we never retain dead work. One shared build feeds
  // both panels.
  const perfArmed = perfNewOn || perfOldOn
  useEffect(() => {
    if (!perfArmed) {
      setPerfItems([])
      setPerfBuilt(0)
      setPerfBuilding(false)
      return
    }
    setPerfBuilding(true)
    setPerfBuilt(0)
    setPerfItems([])
    setPerfMount({})
    const cancel = buildPerfItemsAsync(
      perfSize,
      (done) => setPerfBuilt(done),
      (items) => {
        setPerfItems(items)
        setPerfBuilt(items.length)
        setPerfBuilding(false)
      },
    )
    return cancel
  }, [perfArmed, perfSize])

  // ⌘K / Ctrl+K opens the hero dialog globally
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setDialogOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const onAsyncValueChange = (search: string, signal?: AbortSignal) => {
    const requestId = ++asyncRequestId.current
    setAsyncLoading(true)
    setAsyncStatus(`searching "${search || '(all)'}"…`)

    const timer = setTimeout(() => {
      if (signal?.aborted) return
      if (requestId !== asyncRequestId.current) return
      const next = asyncDemoItems.filter((item) => item.toLowerCase().includes(search.toLowerCase()))
      setAsyncItems(next)
      setAsyncLoading(false)
      setAsyncStatus(`loaded ${next.length} result${next.length === 1 ? '' : 's'}`)
    }, 300)

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        if (requestId !== asyncRequestId.current) return
        setAsyncStatus(`cancelled "${search || '(all)'}"`)
      },
      { once: true },
    )
  }

  const onAsyncControlledValueChange = (search: string) => {
    setAsyncControlledCalls((n) => n + 1)
    setAsyncControlledQuery(search)
  }

  const navHints = (
    <>
      <span><Kbd>↑</Kbd><Kbd>↓</Kbd>&nbsp;navigate</span>
      <span><Kbd>⌃</Kbd><Kbd>P</Kbd> / <Kbd>⌃</Kbd><Kbd>N</Kbd>&nbsp;prev · next</span>
      <span><Kbd hot>↵</Kbd>&nbsp;select</span>
    </>
  )

  return (
    <div className="pg-shell">
      {/* ======================  HERO  ====================== */}
      <header className="pg-hero">
        <div className="pg-hero__meta">
          <span className="dot" />
          <span>playground · v1.0 · master-cmdk</span>
          <span style={{ color: 'var(--text-mute)' }}>—</span>
          <span>11 demos loaded</span>
        </div>
        <h1 className="pg-hero__title">
          The command palette,<br />
          <em>re</em>·imagined<span className="slash">.</span>
        </h1>
        <p className="pg-hero__sub">
          A keyboard-first tour through <code>master-cmdk</code> — filtering, grouping, async, a11y,
          diacritic folding, IME, CSP nonces, and the kind of micro-interactions you normally have to
          fight the framework for. Press <code>⌘K</code> or click below to summon the dialog.
        </p>
        <button className="pg-hero__cta" onClick={() => setDialogOpen(true)}>
          <span className="prompt">❯</span>
          <span>open command palette</span>
          <span style={{ display: 'inline-flex', gap: 4 }}>
            <Kbd hot>⌘</Kbd><Kbd hot>K</Kbd>
          </span>
        </button>
      </header>
      <div className="pg-hero__rule" />

      {/* ======================  LAYOUT  ==================== */}
      <div className="pg-grid">
        {/* --- sidebar index --- */}
        <aside className="pg-side">
          <div className="pg-side__label">Demos ─────────</div>
          <nav className="pg-side__list">
            {[
              ['01', 'Command menu',      'menu'],
              ['02', 'Pointer vs keyboard', 'pointer-keyboard'],
              ['03', 'Diacritic folding', 'diacritic'],
              ['04', 'Dialog',            'dialog'],
              ['05', 'Group · special',   'group-special'],
              ['06', 'Group order',       'group-order'],
              ['07', 'Scroll counters',   'scroll'],
              ['08', '500k perf',         'perf'],
              ['09', 'Group filter',      'group-filter'],
              ['10', 'Async',             'async'],
              ['11', 'inputId',           'dx-input-id'],
              ['12', 'defaultSearch',     'dx-default-search'],
              ['13', 'onEmpty',           'dx-on-empty'],
              ['14', 'IME · synthetic',   'ime'],
              ['15', 'Search matcher',    'search'],
              ['16', 'Ingestion',         'ingestion'],
            ].map(([n, label, slug]) => (
              <a key={slug} href={`#${slug}`} className="pg-side__link">
                <span>{n}</span>
                <span>{label}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* --- main --- */}
        <main className="pg-main">
          {/* 01 */}
          <Pane
            id="menu"
            num="01"
            title="Command menu"
            chip="basic"
            desc={<>Type to filter. Keywords boost matches: try <code>git</code>, <code>create</code>, or <code>coffee</code>.</>}
            foot={navHints}
          >
            <Command label="Command Menu">
              <CmdInput
                value={value}
                onValueChange={setValue}
                type="search"
                autoComplete="off"
                data-testid="playground-search-input"
                placeholder="type to search…"
                hint={<><Kbd>⌃</Kbd><Kbd>P</Kbd>/<Kbd>⌃</Kbd><Kbd>N</Kbd></>}
              />
              <Command.List>
                <Command.Empty>no results · 0 matches</Command.Empty>
                {items.map((it) => (
                  <Command.Item key={it.id} value={it.id} keywords={[it.label, ...(it.keywords ?? [])]}>
                    <span className="pg-item__icon">{it.icon}</span>
                    <span className="pg-item__label">{it.label}</span>
                    {it.meta ? <span className="pg-item__meta">{it.meta}</span> : null}
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
          </Pane>

          {/* 02 — old vs new pointer/keyboard behavior (cmdk#49) */}
          <Pane
            id="pointer-keyboard"
            num="02"
            title="Pointer vs keyboard · three modes"
            chip="pointerBehavior"
            desc={
              <>
                Three models exposed via <code>pointerBehavior</code>:{' '}
                <code>fused</code> (upstream-compatible default, one cursor),{' '}
                <code>split</code> (Raycast — keyboard owns <code>aria-selected</code> in amber,
                pointer owns <code>data-pointer-over</code> in violet, click reconciles), and{' '}
                <code>locked</code> (pointer is inert; keyboard only).
              </>
            }
            foot={
              <>
                <span><b style={{ color: 'var(--text)' }}>Try:</b> focus the input, press <Kbd>↓</Kbd> a few times, then jiggle the mouse over another row.</span>
              </>
            }
          >
            <div className="pg-sxs pg-sxs--3">
              {/* fused — upstream-compatible default */}
              <div className="pg-sxs__col">
                <div className="pg-sxs__tag pg-sxs__tag--old">
                  <span>fused</span>
                  <span className="pg-sxs__tagdot" />
                  <span>default · pointer = keyboard</span>
                </div>
                <Command label="Fused pointer behavior" pointerBehavior="fused">
                  <CmdInput value={pointerSearch} onValueChange={setPointerSearch} placeholder="hover moves selection" />
                  <Command.List>
                    <Command.Empty>no results · 0 matches</Command.Empty>
                    {selectionDemoItems.map((item) => (
                      <Command.Item key={`f-${item.value}`} value={item.value}>
                        <span className="pg-item__icon">·</span>
                        <span className="pg-item__label">{item.label}</span>
                      </Command.Item>
                    ))}
                  </Command.List>
                </Command>
                <p className="pg-sxs__note"><code>pointerBehavior="fused"</code> · one cursor, writes on both.</p>
              </div>

              {/* split — Raycast */}
              <div className="pg-sxs__col">
                <div className="pg-sxs__tag pg-sxs__tag--new">
                  <span>split</span>
                  <span className="pg-sxs__tagdot" />
                  <span>Raycast · two cursors</span>
                </div>
                <Command label="Split pointer behavior" pointerBehavior="split">
                  <CmdInput value={pointerSearch} onValueChange={setPointerSearch} placeholder="keyboard = amber, hover = violet" />
                  <Command.List>
                    <Command.Empty>no results · 0 matches</Command.Empty>
                    {selectionDemoItems.map((item) => (
                      <Command.Item key={`s-${item.value}`} value={item.value}>
                        <span className="pg-item__icon">·</span>
                        <span className="pg-item__label">{item.label}</span>
                      </Command.Item>
                    ))}
                  </Command.List>
                </Command>
                <p className="pg-sxs__note"><code>pointerBehavior="split"</code> · keyboard owns <code>aria-selected</code>; pointer writes <code>data-pointer-over</code>; click reconciles.</p>
              </div>

              {/* locked */}
              <div className="pg-sxs__col">
                <div className="pg-sxs__tag">
                  <span>locked</span>
                  <span className="pg-sxs__tagdot" />
                  <span>keyboard only</span>
                </div>
                <Command label="Locked pointer behavior" pointerBehavior="locked">
                  <CmdInput value={pointerSearch} onValueChange={setPointerSearch} placeholder="pointer is inert · click still commits" />
                  <Command.List>
                    <Command.Empty>no results · 0 matches</Command.Empty>
                    {selectionDemoItems.map((item) => (
                      <Command.Item key={`l-${item.value}`} value={item.value}>
                        <span className="pg-item__icon">·</span>
                        <span className="pg-item__label">{item.label}</span>
                      </Command.Item>
                    ))}
                  </Command.List>
                </Command>
                <p className="pg-sxs__note"><code>pointerBehavior="locked"</code> · no hover writes; click still commits.</p>
              </div>
            </div>
          </Pane>

          {/* 03 */}
          <Pane
            id="diacritic"
            num="03"
            title="Diacritic folding"
            chip="matcher"
            desc={<>Type <code>cafe</code>, match <code>Café</code>. Unicode NFD + combining-mark stripping, by default.</>}
          >
            <SxS
              oldTag="accent-blind · cafe ≠ Café"
              newTag="NFD-folded by default"
              oldNote={<>upstream default matcher — accented chars require exact bytes.</>}
              newNote={<>combining marks stripped before scoring.</>}
              oldNode={
                <OldCommand label="Old diacritic demo">
                  <div className="pg-input">
                    <span className="pg-input__glyph" aria-hidden>❯</span>
                    <OldCommand.Input value={accentSearch} onValueChange={setAccentSearch} placeholder='try "cafe"… no match' />
                  </div>
                  <OldCommand.List>
                    <OldCommand.Empty>no results · 0 matches</OldCommand.Empty>
                    <OldCommand.Item value="Café"><span className="pg-item__icon">◷</span><span className="pg-item__label">Café</span></OldCommand.Item>
                    <OldCommand.Item value="Tea"><span className="pg-item__icon">☕</span><span className="pg-item__label">Tea</span></OldCommand.Item>
                  </OldCommand.List>
                </OldCommand>
              }
              newNode={
                <Command label="Diacritic matcher demo">
                  <CmdInput
                    value={accentSearch}
                    onValueChange={setAccentSearch}
                    placeholder='try "cafe"… matches'
                  />
                  <Command.List>
                    <Command.Empty>no results · 0 matches</Command.Empty>
                    <Command.Item value="Café"><span className="pg-item__icon">◷</span><span className="pg-item__label">Café</span></Command.Item>
                    <Command.Item value="Tea"><span className="pg-item__icon">☕</span><span className="pg-item__label">Tea</span></Command.Item>
                  </Command.List>
                </Command>
              }
            />
          </Pane>

          {/* 03 dialog */}
          <Pane
            id="dialog"
            num="04"
            title="Dialog · Radix-powered"
            chip="cspNonce"
            desc={<>Portaled overlay, focus trap, CSP nonce forwarded to Radix. Global <Kbd hot>⌘</Kbd><Kbd hot>K</Kbd> binding also toggles it.</>}
            foot={<span>cspNonce=<code style={{ color: 'var(--amber)' }}>playground-nonce</code></span>}
          >
            <button className="pg-btn" onClick={() => setDialogOpen((o) => !o)}>
              {dialogOpen ? '■ close dialog' : '▶ open dialog'}
            </button>
            <Command.Dialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              cspNonce="playground-nonce"
              label="Dialog Command Menu"
              description="A dialog-wrapped command menu with hidden title and description."
            >
              <CmdInput
                placeholder="search in dialog…"
                hint={<Kbd>esc</Kbd>}
              />
              <Command.List>
                <Command.Empty>no results · 0 matches</Command.Empty>
                <Command.Item value="dialog-open">
                  <span className="pg-item__icon">▶</span>
                  <span className="pg-item__label">Open Dialog</span>
                  <span className="pg-item__meta">⌘K</span>
                </Command.Item>
                <Command.Item value="dialog-close">
                  <span className="pg-item__icon">■</span>
                  <span className="pg-item__label">Close Dialog</span>
                  <span className="pg-item__meta">esc</span>
                </Command.Item>
              </Command.List>
            </Command.Dialog>
          </Pane>

          {/* 04 */}
          <Pane
            id="group-special"
            num="05"
            title="Group value · special characters"
            chip="grouping"
            desc={<>Group carries <code>value={'"a.b:c#d\\"e"'}</code>. Try <code>needle</code>.</>}
          >
            <SxS
              oldTag="selector breaks on quotes"
              newTag="values escaped safely"
              oldNote={<>upstream builds CSS selectors from raw group <code>value</code> — quotes/hashes break the query.</>}
              newNote={<>attribute values escaped before selector construction.</>}
              oldNode={
                <OldCommand label="Old grouped menu">
                  <div className="pg-input">
                    <span className="pg-input__glyph" aria-hidden>❯</span>
                    <OldCommand.Input value={groupSearch} onValueChange={setGroupSearch} placeholder="type needle…" />
                  </div>
                  <OldCommand.List>
                    <OldCommand.Empty>no results · 0 matches</OldCommand.Empty>
                    <OldCommand.Group heading="General">
                      <OldCommand.Item value="alpha-item"><span className="pg-item__icon">·</span><span className="pg-item__label">Alpha item</span></OldCommand.Item>
                    </OldCommand.Group>
                    <OldCommand.Group heading="Special characters" value={specialGroupValue}>
                      <OldCommand.Item value="needle-item"><span className="pg-item__icon">✦</span><span className="pg-item__label">Special Needle</span></OldCommand.Item>
                    </OldCommand.Group>
                  </OldCommand.List>
                </OldCommand>
              }
              newNode={
                <Command label="Grouped Menu">
                  <CmdInput
                    value={groupSearch}
                    onValueChange={setGroupSearch}
                    placeholder="type needle…"
                  />
                  <Command.List>
                    <Command.Empty>no results · 0 matches</Command.Empty>
                    <Command.Group heading="General">
                      <Command.Item value="alpha-item"><span className="pg-item__icon">·</span><span className="pg-item__label">Alpha item</span></Command.Item>
                    </Command.Group>
                    <Command.Group heading="Special characters" value={specialGroupValue}>
                      <Command.Item value="needle-item"><span className="pg-item__icon">✦</span><span className="pg-item__label">Special Needle</span></Command.Item>
                    </Command.Group>
                  </Command.List>
                </Command>
              }
            />
          </Pane>

          {/* 05 */}
          <Pane
            id="group-order"
            num="06"
            title="Group order restores after clear"
            chip="stability"
            desc={<>Type <code>banana</code>, then clear — ordering of A/B/C returns to source.</>}
          >
            <SxS
              oldTag="groups reshuffle after clear"
              newTag="source order preserved"
              oldNote={<>upstream sorts by last-match rank and keeps it — order drifts.</>}
              newNote={<>restores original DOM order when search is cleared.</>}
              oldNode={
                <OldCommand label="Old group order demo">
                  <div className="pg-input">
                    <span className="pg-input__glyph" aria-hidden>❯</span>
                    <OldCommand.Input value={groupOrderSearch} onValueChange={setGroupOrderSearch} placeholder='type "banana", then clear' />
                  </div>
                  <OldCommand.List>
                    <OldCommand.Group heading="A"><OldCommand.Item><span className="pg-item__icon">·</span><span className="pg-item__label">Apple</span></OldCommand.Item></OldCommand.Group>
                    <OldCommand.Group heading="B"><OldCommand.Item><span className="pg-item__icon">·</span><span className="pg-item__label">Banana</span></OldCommand.Item></OldCommand.Group>
                    <OldCommand.Group heading="C"><OldCommand.Item><span className="pg-item__icon">·</span><span className="pg-item__label">Cherry</span></OldCommand.Item></OldCommand.Group>
                  </OldCommand.List>
                </OldCommand>
              }
              newNode={
                <Command label="Group Order Demo">
                  <CmdInput
                    value={groupOrderSearch}
                    onValueChange={setGroupOrderSearch}
                    placeholder='type "banana", then clear'
                  />
                  <Command.List>
                    <Command.Group heading="A"><Command.Item><span className="pg-item__icon">·</span><span className="pg-item__label">Apple</span></Command.Item></Command.Group>
                    <Command.Group heading="B"><Command.Item><span className="pg-item__icon">·</span><span className="pg-item__label">Banana</span></Command.Item></Command.Group>
                    <Command.Group heading="C"><Command.Item><span className="pg-item__icon">·</span><span className="pg-item__label">Cherry</span></Command.Item></Command.Group>
                  </Command.List>
                </Command>
              }
            />
          </Pane>

          {/* 07 scroll */}
          <Pane
            id="scroll"
            num="07"
            title="Keyboard scrolling · scrollIntoView calls per arrow"
            chip="100 items"
            desc={
              <>
                Both panels call <code>scrollIntoView</code> when you arrow through. Upstream fires it on every
                keydown; master-cmdk first checks whether the selection is already inside the viewport rect and
                skips the call when it is. Run 70 arrows and read the counters below.
              </>
            }
            status={
              <>
                <b>scrollIntoView calls</b> · old · <code style={{ color: 'var(--rose)' }}>{scrollCounter.old}</code>
                &nbsp;·&nbsp; new · <code style={{ color: 'var(--amber)' }}>{scrollCounter.new}</code>
              </>
            }
            foot={
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="pg-btn"
                  onClick={async () => {
                    scrollCounter.reset()
                    for (const input of [scrollOldRef.current, scrollNewRef.current]) {
                      if (!input) continue
                      input.focus()
                      for (let i = 0; i < 70; i++) {
                        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
                        await new Promise((r) => setTimeout(r, 4))
                      }
                    }
                  }}
                >
                  ▶ Run 70 arrow-downs on both
                </button>
                <button className="pg-btn" onClick={() => scrollCounter.reset()}>reset counters</button>
              </div>
            }
          >
            <SxS
              oldTag="calls scrollIntoView every keydown"
              newTag="skips when already in view"
              oldNode={
                <div data-scroll-side="old">
                  <OldCommand label="Old scroll demo">
                    <div className="pg-input">
                      <span className="pg-input__glyph" aria-hidden>❯</span>
                      <OldCommand.Input ref={scrollOldRef} value={scrollSearch} onValueChange={setScrollSearch} placeholder="arrow down through the list…" />
                    </div>
                    <OldCommand.List>
                      <OldCommand.Empty>no results · 0 matches</OldCommand.Empty>
                      {scrollDemoItems.map((item) => (
                        <OldCommand.Item key={`o-${item.value}`} value={item.value}>
                          <span className="pg-item__icon">·</span>
                          <span className="pg-item__label">{item.label}</span>
                        </OldCommand.Item>
                      ))}
                    </OldCommand.List>
                  </OldCommand>
                </div>
              }
              newNode={
                <div data-scroll-side="new">
                  <Command label="Scroll Demo">
                    <CmdInput
                      ref={scrollNewRef}
                      value={scrollSearch}
                      onValueChange={setScrollSearch}
                      placeholder="arrow down through the list…"
                    />
                    <Command.List>
                      <Command.Empty>no results · 0 matches</Command.Empty>
                      {scrollDemoItems.map((item) => (
                        <Command.Item key={item.value} value={item.value}>
                          <span className="pg-item__icon">·</span>
                          <span className="pg-item__label">{item.label}</span>
                        </Command.Item>
                      ))}
                    </Command.List>
                  </Command>
                </div>
              }
            />
          </Pane>

          {/* 08 perf */}
          <Pane
            id="perf"
            num="08"
            title="Large list · virtualization vs full DOM"
            chip="perf"
            desc={
              <>
                Upstream mounts every <code>Command.Item</code>. Master-cmdk's{' '}
                <code>&lt;Command.List virtualized itemHeight={36} /&gt;</code> renders only the ~30 rows in
                view. Start at 5k; step up as your machine tolerates. The item array is built in 5k-row
                slices via <code>requestIdleCallback</code> so the page never freezes during mount.
                Each panel has its own mount button — the old-cmdk side renders every row into the DOM,
                so at 500k it will hang.
              </>
            }
            status={
              <>
                <b>size</b> · <code style={{ color: 'var(--amber)' }}>{perfSize.toLocaleString()}</code>
                &nbsp;·&nbsp; <b>built</b> ·{' '}
                <code>
                  {perfBuilding
                    ? `${perfBuilt.toLocaleString()} / ${perfSize.toLocaleString()}`
                    : perfArmed
                      ? `${perfItems.length.toLocaleString()} ready`
                      : 'disarmed'}
                </code>
                <br />
                <b>t_mount</b> · old ·{' '}
                <code style={{ color: 'var(--rose)' }}>
                  {perfMount.old != null ? `${perfMount.old} ms` : '—'}
                </code>
                &nbsp;·&nbsp; new ·{' '}
                <code style={{ color: 'var(--amber)' }}>
                  {perfMount.new != null ? `${perfMount.new} ms` : '—'}
                </code>
              </>
            }
            foot={
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-mute)' }}>size:</span>
                {PERF_SIZES.map((n) => (
                  <button
                    key={n}
                    className="pg-btn"
                    aria-pressed={perfSize === n}
                    style={perfSize === n ? { borderColor: 'var(--amber)', color: 'var(--amber)' } : undefined}
                    onClick={() => setPerfSize(n)}
                  >
                    {n >= 1000 ? `${n / 1000}k` : n}
                  </button>
                ))}
                <span style={{ color: 'var(--text-mute)' }}>│</span>
                <button
                  className="pg-btn"
                  aria-pressed={perfNewOn}
                  style={perfNewOn ? { borderColor: 'var(--amber)', color: 'var(--amber)' } : undefined}
                  onClick={() => setPerfNewOn((on) => !on)}
                >
                  {perfNewOn ? '■ unmount new' : '▶ mount new (virtualized)'}
                </button>
                <button
                  className="pg-btn"
                  aria-pressed={perfOldOn}
                  style={perfOldOn ? { borderColor: 'var(--rose)', color: 'var(--rose)' } : undefined}
                  onClick={() => setPerfOldOn((on) => !on)}
                >
                  {perfOldOn ? '■ unmount old' : '▶ mount old (full DOM)'}
                </button>
                {perfOldOn && perfSize > 50_000 ? (
                  <span style={{ color: 'var(--rose)' }}>· old at {perfSize.toLocaleString()} will freeze tab</span>
                ) : null}
              </div>
            }
          >
            <SxS
              oldTag="all items rendered · may freeze"
              newTag="virtualized · renders window"
              oldNode={
                <CrashBoundary
                  fallback={(err) => (
                    <NAStub reason={<>upstream threw during mount · <code>{err.message}</code></>} />
                  )}
                >
                  {perfOldOn && !perfBuilding && perfItems.length > 0 ? (
                    <PerfMountTimer onMount={(ms) => setPerfMount((m) => ({ ...m, old: ms }))}>
                      <OldCommand label="Old perf demo">
                        <div className="pg-input">
                          <span className="pg-input__glyph" aria-hidden>❯</span>
                          <OldCommand.Input value={perfSearch} onValueChange={setPerfSearch} placeholder="hover and arrow through items…" />
                        </div>
                        <OldCommand.List>
                          <OldCommand.Empty>no results · 0 matches</OldCommand.Empty>
                          {perfItems.map((item) => (
                            <OldCommand.Item key={`o-${item.value}`} value={item.value}>
                              <span className="pg-item__icon">·</span>
                              <span className="pg-item__label">{item.label}</span>
                            </OldCommand.Item>
                          ))}
                        </OldCommand.List>
                      </OldCommand>
                    </PerfMountTimer>
                  ) : (
                    <NAStub
                      reason={
                        !perfOldOn ? (
                          <>
                            click <b>▶ mount old (full DOM)</b> to render {perfSize.toLocaleString()} nodes here.
                          </>
                        ) : perfBuilding ? (
                          <>
                            building items ·{' '}
                            <code>{Math.round((perfBuilt / perfSize) * 100)}%</code> ·{' '}
                            <code>{perfBuilt.toLocaleString()}</code> / {perfSize.toLocaleString()}
                          </>
                        ) : (
                          <>idle.</>
                        )
                      }
                    />
                  )}
                </CrashBoundary>
              }
              newNode={
                perfNewOn && !perfBuilding && perfItems.length > 0 ? (
                  <PerfMountTimer onMount={(ms) => setPerfMount((m) => ({ ...m, new: ms }))}>
                    <Command label="Perf Demo">
                      <CmdInput value={perfSearch} onValueChange={setPerfSearch} placeholder="hover and arrow through items…" />
                      <Command.List virtualized itemHeight={36}>
                        <Command.Empty>no results · 0 matches</Command.Empty>
                        {perfItems.map((item) => (
                          <Command.Item key={item.value} value={item.value}>
                            <span className="pg-item__icon">·</span>
                            <span className="pg-item__label">{item.label}</span>
                          </Command.Item>
                        ))}
                      </Command.List>
                    </Command>
                  </PerfMountTimer>
                ) : (
                  <NAStub
                    reason={
                      !perfNewOn ? (
                        <>
                          click <b>▶ mount new (virtualized)</b> to build {perfSize.toLocaleString()} items.
                        </>
                      ) : (
                        <>
                          building items ·{' '}
                          <code>{Math.round((perfBuilt / perfSize) * 100)}%</code> ·{' '}
                          <code>{perfBuilt.toLocaleString()}</code> / {perfSize.toLocaleString()}
                        </>
                      )
                    }
                  />
                )
              }
            />
          </Pane>

          {/* 09 */}
          <Pane
            id="group-filter"
            num="10"
            title="Per-group filter override"
            chip="filter"
            desc={<>The top group passes <code>filter={'{() => 1}'}</code> — it always matches. Type <code>nonmatch</code> to watch the bottom group drop out.</>}
          >
            <SxS
              oldTag="no per-group filter API"
              newTag="filter per group"
              oldNode={
                <NAStub reason={<><code>cmdk</code> has no per-<code>Group</code> <code>filter</code> prop — global matcher only. Pin-lists require manual workaround.</>} />
              }
              newNode={
                <Command label="Group Filter Demo">
                  <CmdInput
                    value={groupFilterSearch}
                    onValueChange={setGroupFilterSearch}
                    placeholder='type "nonmatch"…'
                  />
                  <Command.List>
                    <Command.Empty>no results · 0 matches</Command.Empty>
                    <Command.Group heading="Always Match" filter={alwaysMatch}>
                      <Command.Item><span className="pg-item__icon">★</span><span className="pg-item__label">Pinned One</span><span className="pg-item__meta">pinned</span></Command.Item>
                      <Command.Item><span className="pg-item__icon">★</span><span className="pg-item__label">Pinned Two</span><span className="pg-item__meta">pinned</span></Command.Item>
                    </Command.Group>
                    <Command.Group heading="Default Match">
                      <Command.Item><span className="pg-item__icon">·</span><span className="pg-item__label">Standard Alpha</span></Command.Item>
                      <Command.Item><span className="pg-item__icon">·</span><span className="pg-item__label">Standard Beta</span></Command.Item>
                    </Command.Group>
                  </Command.List>
                </Command>
              }
            />
          </Pane>

          {/* 10 async */}
          <Pane
            id="async"
            num="11"
            title="Async · debounce + AbortSignal"
            chip="async"
            desc={<>Debounce at <code>150ms</code>, AbortSignal cancels superseded requests — try mashing keys quickly.</>}
            status={<><b>status</b> · {asyncStatus}</>}
          >
            <SxS
              oldTag="no debounce · no AbortSignal"
              newTag="debounce + AbortSignal on Input"
              oldNode={
                <NAStub reason={<><code>cmdk</code>'s <code>Command.Input</code> has no <code>debounce</code> prop and <code>onValueChange</code> receives no <code>AbortSignal</code>. Users wire their own.</>} />
              }
              newNode={
                <>
                  <Command label="Async Demo" loading={asyncLoading}>
                    <CmdInput
                      debounce={150}
                      onValueChange={onAsyncValueChange}
                      placeholder='type quickly, e.g. "alp"…'
                    />
                    <Command.List>
                      <Command.Loading>loading async results…</Command.Loading>
                      <Command.Empty>no results · 0 matches</Command.Empty>
                      {asyncItems.map((item) => (
                        <Command.Item key={item}>
                          <span className="pg-item__icon">◌</span>
                          <span className="pg-item__label">{item}</span>
                        </Command.Item>
                      ))}
                    </Command.List>
                  </Command>

                  <p className="pg-sxs__note" style={{ marginTop: 14 }}>
                    controlled + debounce echo guard · callbacks <code>{asyncControlledCalls}</code> · state{' '}
                    <code>{asyncControlledQuery || '(empty)'}</code>
                  </p>
                  <Command label="Async Controlled Echo Demo">
                    <CmdInput
                      value={asyncControlledQuery}
                      debounce={150}
                      onValueChange={onAsyncControlledValueChange}
                      placeholder='controlled + debounce · type quickly'
                    />
                    <Command.List>
                      <Command.Empty>no results · 0 matches</Command.Empty>
                      {asyncDemoItems.map((item) => (
                        <Command.Item key={`controlled-${item}`}>
                          <span className="pg-item__icon">◌</span>
                          <span className="pg-item__label">{item}</span>
                        </Command.Item>
                      ))}
                    </Command.List>
                  </Command>
                </>
              }
            />
          </Pane>

          {/* 11 dx · inputId */}
          <Pane
            id="dx-input-id"
            num="11"
            title="inputId · external <label htmlFor> binding"
            chip="dx"
            desc={<>Forward a stable <code>id</code> to the underlying <code>input</code> so an external <code>&lt;label&gt;</code> can wire up without ref surgery.</>}
          >
            <label htmlFor="playground-dx-input" className="pg-extlabel">
              external label · for inputId
            </label>
            <SxS
              oldTag="no inputId prop"
              newTag="inputId prop"
              oldNode={<NAStub reason={<>upstream has no <code>inputId</code>; binding an external label to the input requires wrangling a ref + effect.</>} />}
              newNode={
                <Command label="inputId demo">
                  <CmdInput inputId="playground-dx-input" placeholder="click the external label to focus me" />
                  <Command.List>
                    <Command.Empty>no results · 0 matches</Command.Empty>
                    <Command.Item><span className="pg-item__icon">⚙</span><span className="pg-item__label">settings</span></Command.Item>
                    <Command.Item><span className="pg-item__icon">?</span><span className="pg-item__label">help</span></Command.Item>
                  </Command.List>
                </Command>
              }
            />
          </Pane>

          {/* 12 dx · defaultSearch */}
          <Pane
            id="dx-default-search"
            num="12"
            title="defaultSearch · seed the search on mount"
            chip="dx"
            desc={<>The store is seeded with <code>defaultSearch="set"</code> before first paint — filtering is immediate, no one-tick flash.</>}
          >
            <SxS
              oldTag="no defaultSearch"
              newTag="defaultSearch='set'"
              oldNode={<NAStub reason={<>upstream only accepts <code>value</code>/<code>onValueChange</code>; to pre-seed you must render controlled and wire initial state yourself.</>} />}
              newNode={
                <Command label="defaultSearch demo" defaultSearch="set">
                  <CmdInput placeholder='pre-filled with "set"…' />
                  <Command.List>
                    <Command.Empty>no results · 0 matches</Command.Empty>
                    <Command.Item><span className="pg-item__icon">⚙</span><span className="pg-item__label">settings</span></Command.Item>
                    <Command.Item><span className="pg-item__icon">⚡</span><span className="pg-item__label">setup</span></Command.Item>
                    <Command.Item><span className="pg-item__icon">?</span><span className="pg-item__label">help</span></Command.Item>
                  </Command.List>
                </Command>
              }
            />
          </Pane>

          {/* 13 dx · onEmpty */}
          <Pane
            id="dx-on-empty"
            num="13"
            title="onEmpty · fire when the filtered list is empty"
            chip="dx"
            desc={<>Type <code>zzz</code> — no items match, <code>onEmpty</code> fires. Useful for "no results" analytics or triggering async fallbacks.</>}
            status={<><b>onEmpty hits</b> · <code style={{ color: 'var(--amber)' }}>{dxEmptyHits}</code> &nbsp;·&nbsp; <b>last value</b> · {dxSearchEcho || '(empty)'}</>}
          >
            <SxS
              oldTag="no onEmpty hook"
              newTag="onEmpty fires when filtered.count==0"
              oldNode={<NAStub reason={<>upstream has no <code>onEmpty</code>; detect empty state via <code>filtered.count</code> or a visible <code>Command.Empty</code>.</>} />}
              newNode={
                <Command label="onEmpty demo" onEmpty={() => setDxEmptyHits((hits) => hits + 1)}>
                  <CmdInput onValueChange={setDxSearchEcho} placeholder='type "zzz" to trigger onEmpty…' />
                  <Command.List>
                    <Command.Empty>no results · 0 matches</Command.Empty>
                    <Command.Item><span className="pg-item__icon">⚙</span><span className="pg-item__label">settings</span></Command.Item>
                    <Command.Item><span className="pg-item__icon">⚡</span><span className="pg-item__label">setup</span></Command.Item>
                    <Command.Item><span className="pg-item__icon">?</span><span className="pg-item__label">help</span></Command.Item>
                  </Command.List>
                </Command>
              }
            />
          </Pane>

          {/* 14 IME · synthetic */}
          <Pane
            id="ime"
            num="14"
            title="IME · onValueChange during composition"
            chip="ime"
            desc={
              <>
                Click <b>▶ Play ሰላም</b> to synthetically fire the <code>compositionstart</code> →{' '}
                <code>compositionupdate</code>… → <code>compositionend</code> sequence at both inputs. Upstream
                fires <code>onValueChange</code> on every update; master-cmdk holds until <code>compositionend</code>.
                No Japanese/Amharic/Chinese IME install required.
              </>
            }
            status={
              <>
                <b>onValueChange calls</b> · old · <code style={{ color: 'var(--rose)' }}>
                  {imeOldCalls.length === 0 ? '0 · (none)' : `${imeOldCalls.length} · ${imeOldCalls.join(' │ ')}`}
                </code>
                <br />
                <span style={{ paddingLeft: '11rem', display: 'inline-block' }}>
                  new · <code style={{ color: 'var(--amber)' }}>
                    {imeNewCalls.length === 0 ? '0 · (none)' : `${imeNewCalls.length} · ${imeNewCalls.join(' │ ')}`}
                  </code>
                </span>
              </>
            }
            foot={
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="pg-btn"
                  onClick={() => {
                    setImeOldCalls([])
                    setImeNewCalls([])
                    for (const input of [imeOldRef.current, imeNewRef.current]) {
                      if (!input) continue
                      playComposition(input, ['ሰ', 'ሰላ', 'ሰላም'], 'ሰላም')
                    }
                  }}
                >
                  ▶ Play ሰላም
                </button>
                <button
                  className="pg-btn"
                  onClick={() => {
                    setImeOldCalls([])
                    setImeNewCalls([])
                    for (const input of [imeOldRef.current, imeNewRef.current]) {
                      if (!input) continue
                      playComposition(input, ['n', 'ni', 'nih', 'niho', 'nihon'], '日本')
                    }
                  }}
                >
                  ▶ Play 日本 (nihon)
                </button>
                <button
                  className="pg-btn"
                  onClick={() => {
                    setImeOldCalls([])
                    setImeNewCalls([])
                  }}
                >
                  reset
                </button>
              </div>
            }
          >
            <SxS
              oldTag="fires onValueChange on every compositionupdate"
              newTag="holds until compositionend"
              oldNode={
                <OldCommand label="Old IME demo">
                  <div className="pg-input">
                    <span className="pg-input__glyph" aria-hidden>❯</span>
                    <OldCommand.Input
                      ref={imeOldRef}
                      onValueChange={(val) => setImeOldCalls((calls) => [...calls, val])}
                      placeholder="synthetic composition target…"
                    />
                  </div>
                  <OldCommand.List>
                    <OldCommand.Item><span className="pg-item__icon">あ</span><span className="pg-item__label">nihon</span></OldCommand.Item>
                    <OldCommand.Item><span className="pg-item__icon">ነ</span><span className="pg-item__label">selam</span></OldCommand.Item>
                  </OldCommand.List>
                </OldCommand>
              }
              newNode={
                <Command label="IME Demo">
                  <CmdInput
                    ref={imeNewRef}
                    placeholder="synthetic composition target…"
                    onValueChange={(val) => setImeNewCalls((calls) => [...calls, val])}
                  />
                  <Command.List>
                    <Command.Item><span className="pg-item__icon">あ</span><span className="pg-item__label">nihon</span></Command.Item>
                    <Command.Item><span className="pg-item__icon">ነ</span><span className="pg-item__label">selam</span></Command.Item>
                  </Command.List>
                </Command>
              }
            />
          </Pane>

          {/* 15 search matcher */}
          <Pane
            id="search"
            num="15"
            title="Tiered matcher · score per tier"
            chip="matcher"
            desc={
              <>
                Upstream's matcher is a single fuzzy score. Master-cmdk uses tiered scoring with diacritic
                folding: <b>exact</b> 1.0 &gt; <b>prefix</b> 0.9 &gt; <b>word prefix</b> 0.8 &gt;{' '}
                <b>acronym</b> 0.7 &gt; <b>substring</b> 0.6 &gt; <b>fuzzy</b> 0–0.5. Type below to see live scores.
              </>
            }
          >
            <div className="pg-input">
              <span className="pg-input__glyph" aria-hidden>❯</span>
              <input
                type="search"
                value={matcherSearch}
                onChange={(e) => setMatcherSearch(e.target.value)}
                placeholder='try "github", "gh", "itH", "cafe", "se"…'
                autoComplete="off"
                spellCheck={false}
                style={{ width: '100%' }}
              />
            </div>
            <MatcherTable search={matcherSearch} />
          </Pane>

          {/* 16 — ingestion roadmap */}
          <Pane
            id="ingestion"
            num="16"
            title="Ingestion · JSX today, array roadmap"
            chip="dx surface"
            desc={
              <>
                A DX choice, not a framework choice. Today items are authored as JSX children that register
                themselves into the store. The roadmap adds <code>{'<Command items={rows} />'}</code> so data
                sources can feed the engine without writing JSX per row. React-only in both cases; this pane
                implies nothing about Vue/Svelte/vanilla support.
              </>
            }
            status={
              <>
                <b>today</b> · JSX registry live · <b>roadmap</b> · array ingestion not implemented yet
              </>
            }
          >
            <SxS
              oldLabel="today · working"
              newLabel="roadmap · stub"
              oldTag="JSX as registry"
              newTag="array ingestion"
              oldNote={
                <>
                  Items are authored as JSX children and register themselves into the command store today.
                </>
              }
              newNote={
                <>
                  Array ingestion is not implemented yet. This is only the intended API shape, shown honestly.
                </>
              }
              oldNode={
                <Command label="JSX ingestion demo">
                  <div className="pg-input">
                    <span className="pg-input__glyph" aria-hidden>❯</span>
                    <Command.Input
                      value={ingestionSearch}
                      onValueChange={setIngestionSearch}
                      placeholder="search JSX items…"
                    />
                  </div>
                  <Command.List>
                    <Command.Empty>no results · 0 matches</Command.Empty>
                    {ingestionRows.map((item) => (
                      <Command.Item key={item.value} value={item.value}>
                        <span className="pg-item__icon">·</span>
                        <span className="pg-item__label">{item.label}</span>
                      </Command.Item>
                    ))}
                  </Command.List>
                </Command>
              }
              newNode={
                <NAStub
                  reason={
                    <>
                      Roadmap sketch only: <code>{'<Command items={rows} renderItem={...} />'}</code> is not
                      implemented yet. Data-driven ingestion inside React — not a cross-framework claim.
                    </>
                  }
                />
              }
            />
          </Pane>
        </main>
      </div>

      {/* ======================  STATUS BAR  ==================== */}
      <footer className="pg-statusbar">
        <span className="mode">NORMAL</span>
        <span><Kbd>↑</Kbd><Kbd>↓</Kbd> nav</span>
        <span className="sep">·</span>
        <span><Kbd>⌃</Kbd><Kbd>P</Kbd>/<Kbd>⌃</Kbd><Kbd>N</Kbd> prev · next</span>
        <span className="sep">·</span>
        <span><Kbd hot>↵</Kbd> select</span>
        <span className="sep">·</span>
        <span><Kbd>⎋</Kbd> close</span>
        <span className="sep">·</span>
        <span><Kbd hot>⌘</Kbd><Kbd hot>K</Kbd> palette</span>
        <span className="spacer" />
        <span className="branch">● master</span>
        <span className="sep">·</span>
        <span>master-cmdk@1.0.0</span>
      </footer>
    </div>
  )
}
