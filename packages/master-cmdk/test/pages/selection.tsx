import { Command } from 'cmdk'

const items = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'bravo', label: 'Bravo' },
  { value: 'charlie', label: 'Charlie' },
  { value: 'delta', label: 'Delta' },
  { value: 'echo', label: 'Echo' },
  { value: 'foxtrot', label: 'Foxtrot' },
  { value: 'golf', label: 'Golf' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'india', label: 'India' },
  { value: 'juliet', label: 'Juliet' },
]

const Page = () => {
  return (
    <div>
      <Command>
        <Command.Input placeholder="Search..." />
        <Command.List>
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
