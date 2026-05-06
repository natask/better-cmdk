/**
 * TEACHING SCAFFOLD — build your own Command-K palette.
 *
 * Open http://localhost:5173/?mycmdk to run this file.
 *
 * ================================================================
 * MENTAL MODEL
 * ================================================================
 * Three pieces of state live at the root:
 *
 *   search   — the string in the input
 *   selected — which item id the keyboard cursor is on
 *   items    — a registry Map<id, {label, el}> that Items fill in themselves
 *
 * The reactive loop on every keystroke:
 *
 *   setSearch(...)  →  root re-renders
 *                   →  each <Item> re-scores itself against `search`
 *                   →  zero-score items hide
 *                   →  if `selected` is now hidden, root moves cursor
 *                      to the top match
 *                   →  the selected element scrolls into view
 *
 * ================================================================
 * YOUR JOB
 * ================================================================
 * Six TODOs, marked `TODO 1`..`TODO 6`. Fill them in, in order.
 * The file will compile as-is — all TODOs have a safe stub that
 * "works but is wrong." You'll see the behavior get smarter each
 * time you replace a stub with the real thing.
 */

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

// ---------------------------------------------------------------
// 1. Context shape
// ---------------------------------------------------------------

type ItemRecord = { id: string; label: string; el: HTMLElement | null }

type Ctx = {
  search: string
  setSearch: (s: string) => void
  selected: string | null
  setSelected: (id: string | null) => void

  /** Item → registry, returns an unregister cleanup. */
  register: (id: string, label: string, el: HTMLElement | null) => () => void

  /** Ordered list of ids that currently match `search`, best-first. */
  getVisible: () => string[]

  /** Called when a user commits with Enter or click. */
  commit: (id: string) => void

  /** Bumped whenever the registry changes so subscribers can re-render. */
  version: number
}

const CommandCtx = createContext<Ctx | null>(null)
const useCmd = () => {
  const v = useContext(CommandCtx)
  if (!v) throw new Error('Command.* components must render inside <Command>')
  return v
}

// ---------------------------------------------------------------
// 2. Scorer — TODO 1
// ---------------------------------------------------------------
//
// Return a number in [0, 1]. Zero means "no match" (the item will
// hide). Higher is better. The root sorts by this score descending.
//
// Start with a substring check (case-insensitive). Once everything
// else works, come back and upgrade this to a real fuzzy score
// The production scorer lives in master-cmdk-core.
//
// Contract:
//   - empty search ⇒ return 1 (everything passes)
//   - haystack contains search (case-insensitive) ⇒ return 1
//   - otherwise ⇒ return 0
//
function score(haystack: string, search: string): number {
  // TODO 1: replace this stub.
  return  haystack.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
}

// ---------------------------------------------------------------
// 3. Root
// ---------------------------------------------------------------

export function Command({
  children,
  onValueChange,
}: {
  children: ReactNode
  onValueChange?: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const items = useRef(new Map<string, ItemRecord>())

  const register: Ctx['register'] = (id, label, el) => {
    items.current.set(id, { id, label, el })
    setVersion((v) => v + 1)
    return () => {
      items.current.delete(id)
      setVersion((v) => v + 1)
    }
  }

  const getVisible = () => {
    const hits: { id: string; s: number }[] = []
    items.current.forEach((it) => {
      const s = score(it.label, search)
      if (s > 0) hits.push({ id: it.id, s })
    })
    hits.sort((a, b) => b.s - a.s)
    return hits.map((h) => h.id)
  }

  // ----- TODO 5: repair selection when search changes --------
  //
  // When `search` changes (or the registry changes), the current
  // `selected` id may no longer be in the visible set. In that
  // case, move the cursor to the first visible id (or null if
  // nothing is visible).
  //
  // Hint: read `getVisible()` here. If `selected` is not in that
  // list, call `setSelected(visible[0] ?? null)`.
  //
  useEffect(() => {
    // TODO 5: replace this stub.
  }, [search, version])

  const ctx: Ctx = {
    search,
    setSearch,
    selected,
    setSelected,
    register,
    getVisible,
    version,
    commit: (id) => onValueChange?.(id),
  }

  return (
    <div
      data-my-cmd
      style={{
        border: '1px solid #333',
        borderRadius: 8,
        background: '#0a0a0a',
        color: '#e5e5e5',
        fontFamily: 'ui-monospace, monospace',
        width: 420,
      }}
    >
      <CommandCtx.Provider value={ctx}>{children}</CommandCtx.Provider>
    </div>
  )
}

// ---------------------------------------------------------------
// 4. Input — owns the keyboard
// ---------------------------------------------------------------

Command.Input = function Input(
  props: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>,
) {
  const cmd = useCmd()
  const { search, setSearch, selected, setSelected, getVisible, commit } = cmd

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const visible = getVisible()
    if (visible.length === 0) return
    const i = selected ? visible.indexOf(selected) : -1

    // --------- TODO 2: ArrowDown = next, wrap at end -----------
    //
    // Hint: `visible[(i + 1) % visible.length]` — but first call
    // `e.preventDefault()` so the caret doesn't jump in the input.
    //
    if (e.key === 'ArrowDown') {
      // TODO 2: replace this stub.
    }

    // --------- TODO 3: ArrowUp = prev, wrap at start -----------
    //
    // Hint: the "prev index" when i === -1 or i === 0 should be
    // the LAST item (visible.length - 1). Think about modular arithmetic.
    //
    if (e.key === 'ArrowUp') {
      // TODO 3: replace this stub.
    }

    // --------- TODO 4: Enter = commit selected -----------------
    //
    // Hint: if `selected` is non-null, call `commit(selected)`.
    // Don't forget `e.preventDefault()`.
    //
    if (e.key === 'Enter') {
      // TODO 4: replace this stub.
    }
  }

  return (
    <input
      {...props}
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      onKeyDown={onKeyDown}
      role="combobox"
      aria-autocomplete="list"
      aria-expanded="true"
      style={{
        width: '100%',
        padding: '12px 14px',
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid #222',
        color: 'inherit',
        fontFamily: 'inherit',
        fontSize: 14,
        outline: 'none',
        ...props.style,
      }}
    />
  )
}

// ---------------------------------------------------------------
// 5. List — wrapper
// ---------------------------------------------------------------

Command.List = function List({ children }: { children: ReactNode }) {
  return (
    <div
      role="listbox"
      style={{ maxHeight: 280, overflowY: 'auto', padding: 6 }}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------
// 6. Item — registers itself, renders with aria-selected
// ---------------------------------------------------------------

Command.Item = function Item({
  children,
  value,
  onSelect,
}: {
  children: string
  value?: string
  onSelect?: (id: string) => void
}) {
  const id = useId()
  const label = children
  const { register, selected, setSelected, commit, search } = useCmd()
  const ref = useRef<HTMLDivElement>(null)

  // Register once on mount, unregister on unmount. Label/el updates
  // flow through the ref on every render — we re-register on label
  // changes so the scorer sees the latest text.
  useEffect(() => register(id, label, ref.current), [id, label])

  const isSelected = selected === id
  const visible = score(label, search) > 0

  // ----- TODO 6: scrollIntoView on selection ------------------
  //
  // When `isSelected` flips to true, scroll our element into view.
  //
  // Hint: `ref.current?.scrollIntoView({ block: 'nearest' })`.
  // Skip if not selected.
  //
  useEffect(() => {
    // TODO 6: replace this stub.
  }, [isSelected])

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={isSelected}
      onMouseMove={() => setSelected(id)}
      onClick={() => {
        const v = value ?? id
        onSelect?.(v)
        commit(v)
      }}
      style={{
        display: visible ? 'flex' : 'none',
        alignItems: 'center',
        padding: '8px 10px',
        borderRadius: 4,
        cursor: 'pointer',
        background: isSelected ? '#1c1c1c' : 'transparent',
        color: isSelected ? '#fbbf24' : '#e5e5e5',
        fontSize: 13,
      }}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------
// 7. Empty — shown when nothing matches
// ---------------------------------------------------------------

Command.Empty = function Empty({ children }: { children: ReactNode }) {
  const { getVisible } = useCmd()
  if (getVisible().length > 0) return null
  return (
    <div role="status" style={{ padding: '12px 14px', color: '#666', fontSize: 13 }}>
      {children}
    </div>
  )
}

// ===============================================================
// DEMO — what you'll see at http://localhost:5173/?mycmdk
// ===============================================================

export function MyCmdkDemo() {
  const [last, setLast] = useState<string | null>(null)

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        background: '#050505',
        color: '#e5e5e5',
        fontFamily: 'ui-monospace, monospace',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>
          my-cmdk · teaching scaffold
        </h1>
        <p style={{ color: '#666', fontSize: 13, marginTop: 8 }}>
          open <code>apps/playground/src/MyCmdk.tsx</code> and fill the 6 TODOs
        </p>
      </div>

      <Command onValueChange={setLast}>
        <Command.Input placeholder="type to filter…" autoFocus />
        <Command.List>
          <Command.Empty>no results</Command.Empty>
          <Command.Item value="new-file">New File</Command.Item>
          <Command.Item value="open-file">Open File</Command.Item>
          <Command.Item value="save-file">Save File</Command.Item>
          <Command.Item value="git-push">Git Push</Command.Item>
          <Command.Item value="git-pull">Git Pull</Command.Item>
          <Command.Item value="settings">Settings</Command.Item>
          <Command.Item value="toggle-theme">Toggle Theme</Command.Item>
          <Command.Item value="deploy">Deploy</Command.Item>
        </Command.List>
      </Command>

      <p style={{ color: '#666', fontSize: 12 }}>
        last committed: <code style={{ color: '#fbbf24' }}>{last ?? '—'}</code>
      </p>
    </div>
  )
}
