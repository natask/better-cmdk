# master-cmdk

A drop-in replacement for [cmdk](https://github.com/pacocoursey/cmdk) — same API,
smarter matcher, accumulated bug fixes, and a few capabilities the upstream
project hasn't merged.

```bash
pnpm add master-cmdk
# or
npm install master-cmdk
```

```tsx
import { Command } from 'master-cmdk'

<Command label="Command Menu">
  <Command.Input placeholder="Type to search…" />
  <Command.List>
    <Command.Empty>No results.</Command.Empty>
    <Command.Item value="new">New File</Command.Item>
    <Command.Item value="open">Open File</Command.Item>
  </Command.List>
</Command>
```

## What's different from `cmdk`

- **Diacritic-folded matcher by default** — `cafe` matches `Café` out of the box (upstream: exact bytes only).
- **IME-safe input** — `onValueChange` suppressed during `compositionstart` / `compositionend` windows.
- **Stable selection** — keyboard selection preserved across filter changes when the value still matches.
- **Stable group order** — clearing the search restores source order; upstream drifts based on last score.
- **Special-character group `value`** — selectors are escaped; quotes/hashes don't break the internal querySelector.
- **Per-group `filter` prop** — override scoring per `Command.Group` (e.g. "always pin this group").
- **Async input** — `Command.Input` accepts `debounce` and delivers an `AbortSignal` to `onValueChange`.
- **DX props** — `inputId`, `defaultSearch`, `onEmpty` callback, `cspNonce` forwarded to Radix Dialog.
- **`pointerBehavior`** — `fused` | `split` | `locked` (see below).

## `pointerBehavior`

Controls how pointer and keyboard interact with selection:

| mode | keyboard writes | pointer writes | hover visual | click |
|---|---|---|---|---|
| `"fused"` *(default)* | ✓ selection | ✓ selection | same as selected | commits |
| `"split"` *(Raycast)* | ✓ `aria-selected` | ✓ `data-pointer-over` | separate, stylable | reconciles (pointer wins) |
| `"locked"` | ✓ selection | ✗ | none | commits |

```tsx
<Command pointerBehavior="split">
  {/* keyboard → aria-selected="true" (amber, for example) */}
  {/* pointer → data-pointer-over (violet, for example) */}
  {/* click → fires onSelect with the pointer's row */}
</Command>
```

```css
[cmdk-item][aria-selected='true'] { background: rgba(244,185,66,0.08); }
[cmdk-item][data-pointer-over]   { background: rgba(180,138,255,0.06); }
```

`disablePointerSelection` is retained as a deprecated alias for `pointerBehavior="locked"`.

## License

MIT
