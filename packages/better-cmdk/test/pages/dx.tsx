import { Command } from 'cmdk'
import * as React from 'react'

const Page = () => {
  const [onEmptySearch, setOnEmptySearch] = React.useState('')
  const [onEmptyCount, setOnEmptyCount] = React.useState(0)
  const [imeCalls, setImeCalls] = React.useState<string[]>([])

  return (
    <div>
      <section data-testid="input-id-scope">
        <label htmlFor="custom-search-id">Search label</label>
        <Command label="Input id demo">
          <Command.Input data-testid="input-id-input" inputId="custom-search-id" />
          <Command.List>
            <Command.Item>alpha</Command.Item>
          </Command.List>
        </Command>
      </section>

      <section data-testid="on-empty-scope">
        <div data-testid="on-empty-count">{onEmptyCount}</div>
        <Command label="On empty demo" onEmpty={() => setOnEmptyCount((count) => count + 1)}>
          <Command.Input data-testid="on-empty-input" value={onEmptySearch} onValueChange={setOnEmptySearch} />
          <Command.List>
            <Command.Empty>No results.</Command.Empty>
            <Command.Item>alpha</Command.Item>
            <Command.Item>beta</Command.Item>
          </Command.List>
        </Command>
      </section>

      <section data-testid="default-search-scope">
        <Command label="Default search demo" defaultSearch="bet">
          <Command.Input data-testid="default-search-input" />
          <Command.List>
            <Command.Item>alpha</Command.Item>
            <Command.Item>beta</Command.Item>
          </Command.List>
        </Command>
      </section>

      <section data-testid="ime-scope">
        <div data-testid="ime-calls">{imeCalls.join('|')}</div>
        <Command label="IME demo">
          <Command.Input
            data-testid="ime-input"
            onValueChange={(value) => setImeCalls((calls) => [...calls, value])}
            placeholder="Start IME composition..."
          />
          <Command.List>
            <Command.Item>nihon</Command.Item>
            <Command.Item>neko</Command.Item>
          </Command.List>
        </Command>
      </section>
    </div>
  )
}

export default Page
