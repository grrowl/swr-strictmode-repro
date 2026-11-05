# fix: preserve provider request state across StrictMode effect replay

With a custom cache provider inside StrictMode, an older read can overwrite a completed mutation despite `useSWRMutation` sharing its key and populating the cache.

The reproduction loads `enabled`, starts another read, completes a mutation with `disabled`, then completes the older read with `enabled`. The cached value changes back to `enabled`. Without StrictMode it correctly stays `disabled`.

`useSWR` callbacks capture the provider's request and mutation registries. StrictMode effect cleanup removes the provider's global-state entry, and setup recreates those registries. Existing query callbacks retain the originals while `internalMutate` uses the replacements. Readers mounted after replay can also duplicate a pending request.

Create the mutation, fetch, and preload registries in the existing `initCache` closure and reuse them during provider setup. This follows the lifetime of the existing event revalidators and subscriptions and leaves event setup and cleanup unchanged.

## Reproduction

[Run the example](https://grrowl.github.io/swr-strictmode-repro/) or [edit it in StackBlitz](https://stackblitz.com/github/grrowl/swr-strictmode-repro?file=src/App.jsx). The [40-line reproduction](https://github.com/grrowl/swr-strictmode-repro/blob/main/src/App.jsx) uses React, native SWR hooks, a Map provider, and deferred promises. No application middleware, generated client, or external API is required. The repository's `npm run verify` demonstrates the original failure and corrected cases with identical controls and assertions.

## Tests

The added regression file exercises the actual hooks in normal mode and StrictMode. It verifies that a completed mutation survives an older read and that a reader mounted after replay shares an existing pending request. The StrictMode cases fail on the original source and pass with this change.

Verified against upstream revision `8148ef012fd5b317d1e8ec2da4b2ca0673f63c0f` (`2.6.0-beta.0`):

- Source suite: 37 suites passed, 401 tests passed, five skipped, six snapshots passed.
- Built-package suite: 37 suites passed, 401 tests passed, five skipped, six snapshots passed.
- Build, source typecheck, all test-typing projects, lint, and formatting passed.
- The focused regression passes all four cases after the fix. On the original source, both StrictMode cases fail and both normal-mode cases pass.
- Browser comparison with released SWR 2.5.1 and React 19.2.8 reproduces the original failure and corrected result. The upstream suite uses its pinned React 18.3.1.

## Related work

This is related to provider lifecycle state in [#2719](https://github.com/vercel/swr/issues/2719), but demonstrates a different failure. [#4300](https://github.com/vercel/swr/pull/4300) addresses a separate listener cleanup closure. Its proposed change alone does not resolve this reproduction. This PR does not claim to close either report.
