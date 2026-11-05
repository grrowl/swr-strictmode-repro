# Provider replay separates request and mutation state

`useSWR` captures `MUTATION`, `FETCH`, and `PRELOAD` from the cache provider's `SWRGlobalState` entry. `internalMutate` looks up the current provider state when a mutation runs.

During StrictMode effect replay, the provider cleanup removes that entry. The next provider setup creates new registry objects. Existing query callbacks still refer to the original objects, while mutations use the replacements. A completed mutation therefore cannot tell the existing query callback to discard its older response.

The same split allows a reader mounted after effect replay to start another request for a key that already has a pending request.

The proposed source fix creates the three registries in the surrounding `initCache` closure and reuses them in `initProvider`. Their lifetime matches the existing event revalidators and subscriptions. The provider's event setup and cleanup remain unchanged.

## Verification

The upstream regression exercises the public React hooks and DOM results in both normal mode and StrictMode. It controls response order with deferred promises. The second regression checks that two readers receive the same result from one pending request. Neither regression inspects private SWR registries.

The standalone browser test separately drives the five visible controls against the installed package and the corrected copy. It asserts that the completed mutation survives the older read. Its unpatched StrictMode run intentionally fails that assertion.

The source and built-package suites each passed 401 tests, with five skipped and six snapshots passed. Build, source typecheck, all test-typing projects, lint, and formatting passed.

The retained logs record the original failure and corrected results. See `UPSTREAM_PR.md` for final check totals and `evidence/` for screenshots and command output.

## Related upstream work

[Issue #2719](https://github.com/vercel/swr/issues/2719) concerns provider state being deleted during remount and a resulting crash. This reproduction shows a different symptom: an older read overwrites a completed mutation after effect replay.

[PR #4300](https://github.com/vercel/swr/pull/4300) concerns cleanup retaining an earlier event-listener closure. Applying that proposed change alone did not fix this read/write race. The proposed registry correction does not claim to resolve that separate listener cleanup issue.

No exact existing report was found in the issue and PR searches before this reproduction was prepared.
