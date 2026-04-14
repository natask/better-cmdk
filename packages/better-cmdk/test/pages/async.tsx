import { Command } from 'cmdk'
import * as React from 'react'

const DATA = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon']

const Page = () => {
  const [items, setItems] = React.useState(DATA)
  const [loading, setLoading] = React.useState(false)
  const [calls, setCalls] = React.useState(0)
  const [aborts, setAborts] = React.useState(0)
  const [resolved, setResolved] = React.useState(0)
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

  return (
    <div>
      <div data-testid="calls">{calls}</div>
      <div data-testid="aborts">{aborts}</div>
      <div data-testid="resolved">{resolved}</div>
      <Command loading={loading}>
        <Command.Input debounce={150} placeholder="Search..." onValueChange={onValueChange} />
        <Command.List>
          <Command.Loading data-testid="loading">Loading...</Command.Loading>
          <Command.Empty>No results.</Command.Empty>
          {items.map((item) => (
            <Command.Item key={item}>{item}</Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  )
}

export default Page
