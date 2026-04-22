import { Command } from 'cmdk'
import * as React from 'react'

const DATA = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon']

const Page = () => {
  const [items, setItems] = React.useState(DATA)
  const [loading, setLoading] = React.useState(false)
  const [calls, setCalls] = React.useState(0)
  const [aborts, setAborts] = React.useState(0)
  const [resolved, setResolved] = React.useState(0)
  const [controlledSearch, setControlledSearch] = React.useState('')
  const [controlledCalls, setControlledCalls] = React.useState(0)
  const requestIdRef = React.useRef(0)

  const onValueChange = React.useCallback((search: string, signal?: AbortSignal) => {
    const requestId = ++requestIdRef.current
    setCalls((n) => n + 1)
    setLoading(true)

    const timer = setTimeout(() => {
      if (signal?.aborted) return
      if (requestId !== requestIdRef.current) return
      const next = DATA.filter((item) => item.toLowerCase().includes(search.toLowerCase()))
      setItems(next)
      setResolved((n) => n + 1)
      setLoading(false)
    }, 300)

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        setAborts((n) => n + 1)
      },
      { once: true },
    )
  }, [])

  const onControlledValueChange = React.useCallback((search: string) => {
    setControlledCalls((n) => n + 1)
    setControlledSearch(search)
  }, [])

  return (
    <div>
      <div data-testid="calls">{calls}</div>
      <div data-testid="aborts">{aborts}</div>
      <div data-testid="resolved">{resolved}</div>
      <div data-testid="controlled-calls">{controlledCalls}</div>
      <div data-testid="controlled-search">{controlledSearch}</div>
      <Command loading={loading}>
        <Command.Input data-testid="async-input" debounce={150} placeholder="Search..." onValueChange={onValueChange} />
        <Command.List>
          <Command.Loading data-testid="loading">Loading...</Command.Loading>
          <Command.Empty>No results.</Command.Empty>
          {items.map((item) => (
            <Command.Item key={item}>{item}</Command.Item>
          ))}
        </Command.List>
      </Command>

      <Command>
        <Command.Input
          data-testid="controlled-debounce-input"
          debounce={150}
          value={controlledSearch}
          onValueChange={onControlledValueChange}
          placeholder="Controlled debounce..."
        />
        <Command.List>
          <Command.Empty>No results.</Command.Empty>
          {DATA.map((item) => (
            <Command.Item key={`controlled-${item}`}>{item}</Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  )
}

export default Page
