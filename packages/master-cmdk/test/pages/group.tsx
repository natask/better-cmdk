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

      {/* upstream #264 / #375 — flat item order restore after clear */}
      <div data-testid="item-restore-demo">
        <Command>
          <Command.Input data-testid="item-restore-input" placeholder="Type e, then clear..." />
          <Command.List>
            {[
              'apple', 'banana', 'cherry', 'date', 'elderberry',
              'fig', 'grape', 'honeydew', 'kiwi', 'lemon',
            ].map((it) => (
              <Command.Item key={it} value={it}>
                {it}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>

      {/* Source-order interleaving: items between groups must stay between groups on clear */}
      <div data-testid="mixed-restore-demo">
        <Command>
          <Command.Input data-testid="mixed-restore-input" placeholder="Type c, then clear..." />
          <Command.List>
            <Command.Item value="standalone-top">top-standalone</Command.Item>
            <Command.Group heading="G1">
              <Command.Item value="g1-alpha">g1-alpha</Command.Item>
              <Command.Item value="g1-charlie">g1-charlie</Command.Item>
            </Command.Group>
            <Command.Item value="standalone-mid">mid-standalone</Command.Item>
            <Command.Group heading="G2">
              <Command.Item value="g2-cherry">g2-cherry</Command.Item>
              <Command.Item value="g2-zulu">g2-zulu</Command.Item>
            </Command.Group>
            <Command.Item value="standalone-bot">bot-standalone</Command.Item>
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

      <div data-testid="nested-group-demo">
        <Command>
          <Command.Input data-testid="nested-group-input" placeholder="Type needle then clear..." />
          <Command.List>
            <Command.Group heading="Parent">
              <Command.Group heading="Child">
                <Command.Item>Nested Needle</Command.Item>
              </Command.Group>
            </Command.Group>
            <Command.Group heading="Sibling">
              <Command.Item>Sibling Haystack</Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}

export default Page
