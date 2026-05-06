// Isolated reproductions of upstream cmdk bugs #264/#375 (sort-not-restored)
// and #387 (special-char item value crash).
// Served at /repro for diagnostic testing from Playwright.
import { useState } from 'react'
import { Command as OldCommand } from 'cmdk'
import { Command as NewCommand } from 'master-cmdk'

const FRUITS = [
  'apple', 'banana', 'cherry', 'date', 'elderberry',
  'fig', 'grape', 'honeydew', 'kiwi', 'lemon',
]

const HOSTILE_VALUE = '<a href="javascript:alert(1)">Click Me!</a>'

export function ReproPage() {
  const [sortOld, setSortOld] = useState('')
  const [sortNew, setSortNew] = useState('')

  return (
    <div style={{ padding: 24, display: 'grid', gap: 32, fontFamily: 'ui-monospace, monospace' }}>
      <h2>upstream #264 / #375 — item sort not restored on clear</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div data-testid="sort-old">
          <h3>upstream cmdk</h3>
          <OldCommand label="upstream #264">
            <OldCommand.Input value={sortOld} onValueChange={setSortOld} data-testid="sort-old-input" />
            <OldCommand.List>
              {FRUITS.map((f) => (
                <OldCommand.Item key={f} value={f}>{f}</OldCommand.Item>
              ))}
            </OldCommand.List>
          </OldCommand>
        </div>
        <div data-testid="sort-new">
          <h3>master-cmdk</h3>
          <NewCommand label="master #264">
            <NewCommand.Input value={sortNew} onValueChange={setSortNew} data-testid="sort-new-input" />
            <NewCommand.List>
              {FRUITS.map((f) => (
                <NewCommand.Item key={f} value={f}>{f}</NewCommand.Item>
              ))}
            </NewCommand.List>
          </NewCommand>
        </div>
      </div>

      <h2>upstream #387 — hostile item value crashes on hover</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div data-testid="hostile-old">
          <h3>upstream cmdk</h3>
          <OldCommand label="upstream #387">
            <OldCommand.Input data-testid="hostile-old-input" />
            <OldCommand.List>
              <OldCommand.Item value="normal" data-testid="hostile-old-normal">Normal item</OldCommand.Item>
              <OldCommand.Item value={HOSTILE_VALUE} data-testid="hostile-old-hostile">Hostile item</OldCommand.Item>
            </OldCommand.List>
          </OldCommand>
        </div>
        <div data-testid="hostile-new">
          <h3>master-cmdk</h3>
          <NewCommand label="master #387">
            <NewCommand.Input data-testid="hostile-new-input" />
            <NewCommand.List>
              <NewCommand.Item value="normal" data-testid="hostile-new-normal">Normal item</NewCommand.Item>
              <NewCommand.Item value={HOSTILE_VALUE} data-testid="hostile-new-hostile">Hostile item</NewCommand.Item>
            </NewCommand.List>
          </NewCommand>
        </div>
      </div>
    </div>
  )
}
