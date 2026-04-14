import { useState } from 'react'
import { Command } from 'better-cmdk'

const items = [
  { id: 'new-file', label: 'New File', keywords: ['create', 'add'] },
  { id: 'open-file', label: 'Open File', keywords: ['load'] },
  { id: 'save-file', label: 'Save File', keywords: ['write'] },
  { id: 'cafe', label: 'Café', keywords: ['coffee'] },
  { id: 'github', label: 'GitHub', keywords: ['gh', 'git'] },
  { id: 'settings', label: 'Settings', keywords: ['prefs', 'config'] },
]

export function App() {
  const [value, setValue] = useState('')
  const [accentSearch, setAccentSearch] = useState('')
  const [groupSearch, setGroupSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const specialGroupValue = 'a.b:c#d"e'

  return (
    <div style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 560 }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>better-cmdk playground</h1>
      <Command label="Command Menu" style={{ border: '1px solid #ddd', borderRadius: 8, padding: 8 }}>
        <Command.Input
          value={value}
          onValueChange={setValue}
          type="search"
          autoComplete="off"
          data-testid="playground-search-input"
          placeholder="Type to search…"
          style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 6 }}
        />
        <Command.List style={{ marginTop: 8, maxHeight: 300, overflow: 'auto' }}>
          <Command.Empty>No results.</Command.Empty>
          {items.map((it) => (
            <Command.Item key={it.id} value={it.id} keywords={[it.label, ...(it.keywords ?? [])]}>
              {it.label}
            </Command.Item>
          ))}
        </Command.List>
      </Command>

      <div style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Diacritic folding (type "cafe" to match "Café")</h2>
        <Command label="Diacritic matcher demo" style={{ border: '1px solid #ddd', borderRadius: 8, padding: 8 }}>
          <Command.Input
            value={accentSearch}
            onValueChange={setAccentSearch}
            placeholder='Try typing "cafe"...'
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 6 }}
          />
          <Command.List style={{ marginTop: 8 }}>
            <Command.Empty>No results.</Command.Empty>
            <Command.Item value="Café">Café</Command.Item>
            <Command.Item value="Tea">Tea</Command.Item>
          </Command.List>
        </Command>
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => setDialogOpen((open) => !open)}>{dialogOpen ? 'Close' : 'Open'} dialog</button>
        <Command.Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          label="Dialog Command Menu"
          description="A dialog-wrapped command menu with hidden title and description."
        >
          <Command.Input placeholder="Search in dialog…" />
          <Command.List>
            <Command.Empty>No results.</Command.Empty>
            <Command.Item value="dialog-open">Open Dialog</Command.Item>
            <Command.Item value="dialog-close">Close Dialog</Command.Item>
          </Command.List>
        </Command.Dialog>
      </div>

      <div style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Group value with special characters</h2>
        <Command label="Grouped Menu" style={{ border: '1px solid #ddd', borderRadius: 8, padding: 8 }}>
          <Command.Input
            value={groupSearch}
            onValueChange={setGroupSearch}
            placeholder="Type needle…"
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 6 }}
          />
          <Command.List style={{ marginTop: 8, maxHeight: 180, overflow: 'auto' }}>
            <Command.Empty>No results.</Command.Empty>
            <Command.Group heading="General">
              <Command.Item value="alpha-item">Alpha item</Command.Item>
            </Command.Group>
            <Command.Group heading="Special characters" value={specialGroupValue}>
              <Command.Item value="needle-item">Special Needle</Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
