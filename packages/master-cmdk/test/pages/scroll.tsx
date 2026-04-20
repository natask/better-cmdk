import { Command } from 'cmdk'

const items = Array.from({ length: 30 }, (_, i) => ({
  value: `item-${i + 1}`,
  label: `Item ${i + 1}`,
}))

const Page = () => {
  return (
    <div>
      <Command>
        <Command.Input placeholder="Search..." />
        <Command.List style={{ maxHeight: 200, overflow: 'auto' }}>
          <Command.Empty>No results.</Command.Empty>
          {items.map((item) => (
            <Command.Item key={item.value} value={item.value}>
              {item.label}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  )
}

export default Page
