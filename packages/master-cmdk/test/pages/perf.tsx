import { Command } from 'cmdk'

const items = Array.from({ length: 500 }, (_, i) => `item-${i + 1}`)

const Page = () => {
  return (
    <div>
      <Command>
        <Command.Input placeholder="Search..." />
        <Command.List style={{ maxHeight: 220, overflow: 'auto' }}>
          {items.map((value) => (
            <Command.Item key={value} value={value}>
              {value}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  )
}

export default Page
