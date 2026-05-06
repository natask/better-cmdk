# master-cmdk-semantic

Client-side semantic scoring helpers for `master-cmdk`.

This package keeps cmdk's filter contract synchronous:

```ts
(value, search, keywords) => number
```

The expensive embedding work runs outside that function. The filter only reads
the latest cached semantic score map and composes it with the core text matcher.
