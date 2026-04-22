import { Command } from 'cmdk'
import * as React from 'react'

const fileItems = Array.from({ length: 140 }, (_, index) => {
  const n = String(index + 1).padStart(3, '0')
  return `src/file-${n}.ts`
})

const Page = () => {
  const [mode, setMode] = React.useState('commands')
  const [selectedValues, setSelectedValues] = React.useState<string[]>([])

  return (
    <div>
      <div>
        <button data-testid="mode-commands" onClick={() => setMode('commands')}>
          Commands
        </button>
        <button data-testid="mode-files" onClick={() => setMode('files')}>
          Files
        </button>
      </div>

      <div data-testid="mode-value">{mode}</div>
      <div data-testid="checked-values">{selectedValues.join('|')}</div>

      <Command
        mode={mode}
        onModeChange={setMode}
        selectionMode="multiple"
        selectedValues={selectedValues}
        onSelectedValuesChange={setSelectedValues}
      >
        <Command.Input data-testid="mode-input" placeholder="Search current mode..." />
        <Command.List
          data-testid="mode-list"
          virtualized
          itemHeight={32}
          overscan={2}
          style={{ maxHeight: 176, overflow: 'auto' }}
        >
          <Command.Mode value="commands">
            <Command.Item value="open-repo">Open Repository</Command.Item>
            <Command.Item value="deploy">Deploy</Command.Item>
            <Command.Item value="theme-dark">Theme: Dark</Command.Item>
          </Command.Mode>

          <Command.Mode value="files">
            {fileItems.map((filePath) => (
              <Command.Item key={filePath} value={`file-${filePath.slice(9, 12)}`}>
                {filePath}
              </Command.Item>
            ))}
          </Command.Mode>
        </Command.List>
      </Command>
    </div>
  )
}

export default Page
