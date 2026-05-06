# cmdk Knowledge Base

This is a concise reference for understanding upstream `cmdk` and rebuilding a compatible implementation.

## Master Search Stack

`master-cmdk` should stay a drop-in `cmdk` replacement at the React API layer, while `master-cmdk-core` becomes the reusable search/navigation engine underneath it.

Current implemented layers:

- Exact match: full normalized label/search equality scores highest.
- Prefix match: label prefix and word-prefix matching.
- Acronym match: examples like `gh` -> `GitHub`.
- Substring match: contained text still matches, below prefix/word-prefix.
- Fuzzy abbreviation match: compact in-order tokens inside words, like `lnr` -> `Linear` and `brws` -> `browser`.
- Typo-tolerant token match: examples like `serach` -> `Search` and `renwel strat` -> `renewal strategy`.
- Diacritic folding: `cafe` -> `Café`.
- Keyword/body matching: `Command.Item keywords` are searched separately from the public item value, so opaque ids can still match human text.
- Group/mode scoped filtering: group and mode filters can override the default scorer.
- Keyboard navigation: arrows, Home/End, optional vim `ctrl+j/k`, and `ctrl+n/p` behavior are covered by Playwright.
- Async search plumbing: debounced input, immediate input echo, `AbortSignal`, and loading state.

Known boundary:

- The built-in scorer is local lexical search. It does not yet build or query vector embeddings.
- Semantic search should be a separate optional package/plugin that produces client-side scores and feeds them into the same filter contract.
- Agent search should be its own command surface: the agent receives the same query, item registry, tools, and semantic results, then proposes commands/results. It should not replace the deterministic local matcher; it should sit after local/semantic retrieval.

Roadmap:

1. Keep `master-cmdk-core` as the canonical scoring/navigation engine.
2. Add a formal ranker interface that can merge lexical, semantic, recency, frequency, and agent scores.
3. Add build-time semantic indexing for static command sets.
4. Add a client vector runtime for local comparison.
5. Add agent search as a higher-level command surface with tool access, multi-step state, back/forward history, and previews.
6. Keep React `master-cmdk` API-compatible with `cmdk`; expose new power only through additive props/packages.

## React Context Semantics

`React.createContext<T>(defaultValue)` creates a named channel for passing a value through the React tree without manually threading props through every component.

```tsx
const SomeContext = React.createContext<Value>(fallback)
```

The context object itself does not hold per-component state. It defines the channel. A component higher in the tree provides the current value:

```tsx
<SomeContext.Provider value={value}>
  <Child />
</SomeContext.Provider>
```

A descendant reads the nearest provider value:

```tsx
const value = React.useContext(SomeContext)
```

If there is no provider above the reader, React returns the default passed to `createContext`.

In cmdk:

```ts
const CommandContext = React.createContext<Context>(undefined)
const useCommand = () => React.useContext(CommandContext)
```

means child components can call parent `Command` methods without receiving them as props.

`CommandContext` is the parent API channel. Items/groups/input/list use it to register themselves and access shared ids/refs.

`StoreContext` is the state channel. Children use it to subscribe to command state and update state.

`GroupContext` is the nearest group channel. Items use it to know whether they are inside a group.

## Upstream Shape

The upstream implementation is mostly one file:

- `reference-projects/upstream-cmdk/cmdk/src/index.tsx`
- `reference-projects/upstream-cmdk/cmdk/src/command-score.ts`

The root `Command` component owns a private mutable store:

```ts
state = {
  search,
  value,
  selectedItemId,
  filtered: {
    count,
    items,
    groups,
  },
}
```

The store is kept in refs, not normal React state. Updates do not automatically render. cmdk manually notifies subscribers through a `listeners` set.

The implementation treats the DOM as part of the model. It queries `[cmdk-item]`, reads `data-value`, moves DOM nodes to sort results, and dispatches a custom `cmdk-item-select` event to activate the selected row.

## Core Data Structures

- `state.search`: current input text.
- `state.value`: currently selected item value.
- `state.selectedItemId`: DOM id for the active descendant.
- `state.filtered.count`: number of matching visible items.
- `state.filtered.items`: `Map<itemId, score>`.
- `state.filtered.groups`: `Set<groupId>` for groups with at least one match.
- `allItems`: `Set<itemId>` of mounted items.
- `allGroups`: `Map<groupId, Set<itemId>>`.
- `ids`: `Map<itemId, { value, keywords }>` mapping internal ids to public values.
- `listeners`: callbacks to rerender subscribers.
- `propsRef`: latest props inside stable callbacks.

## Component Responsibilities

`Command`

- Creates state, registry maps, ids, refs, and contexts.
- Handles controlled selected `value`.
- Provides store methods.
- Handles root keyboard navigation.
- Filters, sorts, selects, and scrolls.

`Command.Input`

- Reads/writes `state.search`.
- Calls input `onValueChange`.
- Renders `[cmdk-input]`.

`Command.List`

- Owns the listbox DOM.
- Provides the inner sizer ref.
- Exposes `aria-activedescendant`.
- Updates `--cmdk-list-height`.

`Command.Item`

- Gets an internal id.
- Infers or receives public `value`.
- Registers with `Command`.
- Reads selection/filter state.
- Renders or returns `null`.
- Handles pointer selection and click/selection event.

`Command.Group`

- Gets a group id/value.
- Registers with `Command`.
- Provides `GroupContext`.
- Hides when no child item matches.

`Command.Empty`

- Renders only when search is non-empty and filtered count is zero.

`Command.Loading`

- Renders loading content/progress.

`Command.Separator`

- Usually renders only when search is empty unless `alwaysRender` is true.

`Command.Dialog`

- Wraps `Command` inside Radix Dialog.

## Behavioral Pipeline

On item mount:

1. `Item` gets an id.
2. `Item` registers with `context.item(id, groupId)`.
3. `useValue` records `id -> value/keywords`.
4. Scheduled work filters, sorts, selects first item if needed, and emits.

On search change:

1. `Input` calls `store.setState('search', search)`.
2. `filterItems()` computes scores and visible groups.
3. `sort()` reorders DOM nodes by score.
4. `selectFirstItem()` selects the first valid visible item.
5. Subscribers rerender.

On keyboard navigation:

1. Root `Command` handles arrow/Home/End/vim keys.
2. It finds valid DOM items with `[cmdk-item]:not([aria-disabled="true"])`.
3. It updates `state.value`.
4. The selected item gets `aria-selected="true"` / `data-selected="true"`.
5. The selected row is scrolled into view.

On Enter:

1. Command finds the selected item DOM node.
2. It dispatches `cmdk-item-select`.
3. `Item` hears the event and calls `onSelect(value)`.

## Public Contract To Preserve

Every JSX snippet that works against `cmdk@1.1.1` should compile unchanged.

Required public components:

- `Command`
- `Command.Dialog`
- `Command.Input`
- `Command.List`
- `Command.Item`
- `Command.Group`
- `Command.Separator`
- `Command.Empty`
- `Command.Loading`

Important public props:

- `Command`: `label`, `shouldFilter`, `filter`, `defaultValue`, `value`, `onValueChange`, `loop`, `disablePointerSelection`, `vimBindings`
- `Input`: `value`, `onValueChange`
- `Item`: `value`, `keywords`, `disabled`, `forceMount`, `onSelect`
- `Group`: `heading`, `value`, `forceMount`
- `Separator`: `alwaysRender`
- `List`: `label`
- `Dialog`: Radix dialog props plus `overlayClassName`, `contentClassName`, `container`

Required DOM attributes/selectors:

- `[cmdk-root]`
- `[cmdk-input]`
- `[cmdk-list]`
- `[cmdk-item]`
- `[cmdk-group]`
- `[cmdk-group-heading]`
- `[cmdk-group-items]`
- `[cmdk-separator]`
- `[cmdk-empty]`
- `[cmdk-loading]`
- `[cmdk-label]`
- `data-value`
- `data-selected`
- `data-disabled`
- `aria-selected`
- `aria-disabled`
- `hidden`

## Implementation Names

Selectors:

- `GROUP_SELECTOR = '[cmdk-group=""]'`
- `GROUP_ITEMS_SELECTOR = '[cmdk-group-items=""]'`
- `GROUP_HEADING_SELECTOR = '[cmdk-group-heading=""]'`
- `ITEM_SELECTOR = '[cmdk-item=""]'`
- `VALID_ITEM_SELECTOR = '[cmdk-item=""]:not([aria-disabled="true"])'`
- `VALUE_ATTR = 'data-value'`
- `SELECT_EVENT = 'cmdk-item-select'`

Contexts:

- `CommandContext`: command methods and shared ids/refs.
- `StoreContext`: mutable state store and subscription API.
- `GroupContext`: nearest group identity and force-mount flag.

Core helpers:

- `filterItems()`
- `sort()`
- `selectFirstItem()`
- `getSelectedItem()`
- `getValidItems()`
- `updateSelectedToIndex()`
- `updateSelectedByItem()`
- `scrollSelectedIntoView()`
- `getItemValue()`
- `useCmdk()`
- `useValue()`
- `useLazyRef()`
- `useAsRef()`
- `useScheduleLayoutEffect()`

## Rewrite Guidance

For a rewrite, preserve observable behavior first.

Recommended internal split:

- Registry: mounted items, groups, values, disabled state, force-mount state.
- Derived results: visible items/groups from search/filter.
- Selection reducer: selected value/id from keyboard, pointer, search, and controlled props.
- DOM adapter: focus, scroll, list height, custom select event.
- React components: thin wrappers over registry/store.

The tests should verify behavior, not internals:

- rendered attributes
- visible items
- selected item/value
- callback order
- keyboard navigation
- pointer/click behavior
- group visibility
- controlled and uncontrolled values
- disabled and force-mounted rows
- `shouldFilter={false}`
- empty/loading/dialog behavior

The safest rewrite path is to match upstream first, then add improvements behind additive props or documented intentional differences.
