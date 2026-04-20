import { Command } from 'cmdk'
import * as React from 'react'

const alwaysMatch = () => 1

const Page = () => {
  const [search, setSearch] = React.useState('')
  const [forceMount, setForceMount] = React.useState(false)
  const specialGroupValue = 'a.b:c#d"e'

  return (
    <div>
      <button data-testid="forceMount" onClick={() => setForceMount(!forceMount)}>
        Force mount Group Letters
      </button>

      <Command>
        <Command.Input placeholder="Search…" value={search} onValueChange={setSearch} />
        <Command.List>
          <Command.Empty>No results.</Command.Empty>
          <Command.Group heading="Animals">
            <Command.Item>Giraffe</Command.Item>
            <Command.Item>Chicken</Command.Item>
          </Command.Group>

          <Command.Group forceMount={forceMount} heading="Letters">
            <Command.Item>A</Command.Item>
            <Command.Item>B</Command.Item>
            <Command.Item>Z</Command.Item>
          </Command.Group>

          <Command.Group value={specialGroupValue} heading="Special Characters">
            <Command.Item>Special Needle</Command.Item>
          </Command.Group>

          {!!search && (
            <Command.Group heading="Numbers">
              <Command.Item>One</Command.Item>
              <Command.Item>Two</Command.Item>
              <Command.Item>Three</Command.Item>
            </Command.Group>
          )}
        </Command.List>
      </Command>

      <div data-testid="restore-order-demo">
        <Command>
          <Command.Input data-testid="restore-order-input" placeholder="Type banana then clear..." />
          <Command.List>
            <Command.Group heading="A">
              <Command.Item>Apple</Command.Item>
            </Command.Group>
            <Command.Group heading="B">
              <Command.Item>Banana</Command.Item>
            </Command.Group>
            <Command.Group heading="C">
              <Command.Item>Cherry</Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>

      <div data-testid="group-filter-demo">
        <Command>
          <Command.Input data-testid="group-filter-input" placeholder="Type nonmatch..." />
          <Command.List>
            <Command.Group heading="Always Match" filter={alwaysMatch}>
              <Command.Item>Pinned One</Command.Item>
              <Command.Item>Pinned Two</Command.Item>
            </Command.Group>
            <Command.Group heading="Default Match">
              <Command.Item>Standard Alpha</Command.Item>
              <Command.Item>Standard Beta</Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}

export default Page
