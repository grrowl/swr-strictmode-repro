# SWR StrictMode mutation race

A standalone React example shows an older GET replacing a completed mutation under StrictMode with a custom SWR cache provider. The example uses native `useSWR`, `useSWRMutation`, and `SWRConfig`. Deferred promises control response order without HTTP requests or timers.

The demo uses React's development build so StrictMode replays effects. The reproduction is in [src/App.jsx](src/App.jsx). The same file runs against original SWR 2.5.1 and a copy with the proposed fix.

## Run the example

```sh
npm ci
npx playwright install chromium
npm run build
npm start
```

Open [the demo](http://127.0.0.1:4173/). Choose the dependency and StrictMode setting, then select **Load example**. Press the five numbered buttons in order.

The initial GET returns `enabled`. A second GET starts, then a mutation finishes with `disabled`. Completing the older GET must leave the cached value `disabled`.

| Dependency | StrictMode | Observed final value | Expected final value |
| --- | --- | --- | --- |
| SWR 2.5.1 | Off | `disabled` | `disabled` |
| SWR 2.5.1 | On | `enabled` | `disabled` |
| SWR 2.5.1 with proposed fix | On | `disabled` | `disabled` |
| SWR 2.5.1 with proposed fix | Off | `disabled` | `disabled` |

Reload the example to reset the deferred responses.

## Run the browser checks

```sh
npm run build
npm run verify
```

`verify` runs the same assertion in all four configurations. It expects the original StrictMode test to fail and the other three tests to pass. It exits successfully only when that comparison matches. The individual regression command below must fail on the original package:

```sh
SWR_VERSION=unpatched STRICT_MODE=true npm test
```

Run the corrected case with:

```sh
SWR_VERSION=fixed STRICT_MODE=true npm test
```

The build script leaves `node_modules/swr` unchanged. It copies the installed package to `.build/swr-fixed`, applies the specific registry correction, and bundles both versions separately. Both bundles use the same React instance. `package-lock.json` pins all dependencies.

## Inspect the evidence and proposed source fix

- [Browser comparison log](evidence/browser-matrix.log)
- [Original StrictMode screenshot](evidence/unpatched-strict-true.png)
- [Corrected StrictMode screenshot](evidence/fixed-strict-true.png)
- [Upstream source regression before the fix](evidence/upstream-source-red.log)
- [Upstream source regression after the fix](evidence/upstream-source-green.log)
- [Proposed upstream patch](evidence/upstream.patch)
- [Draft PR description](UPSTREAM_PR.md)
- [Cause and verification details](ANALYSIS.md)

The upstream patch targets `vercel/swr` revision `8148ef012fd5b317d1e8ec2da4b2ca0673f63c0f`, version `2.6.0-beta.0`. The browser example separately proves the released SWR 2.5.1 behaviour with React 19.2.8. The upstream source tests use its pinned React 18.3.1.

The source fix is committed locally as `315d79272cedd0cf06d5e159a6ef5ccc728a73d8` on `codex/fix-provider-replay-registries` in `/tmp/swr-strictmode-upstream`. No issue or PR has been published.

## Run the source regression in SWR

Apply `evidence/upstream.patch` to a checkout of the recorded upstream revision. Follow SWR's contribution guide to install its pinned dependencies and build the package, then run:

```sh
pnpm test test/use-swr-provider-replay.test.tsx --runInBand --reporters=default
pnpm test:build test/use-swr-provider-replay.test.tsx --runInBand --reporters=default
```

To see the source tests fail before the fix, reverse only `evidence/source-fix.patch`. Keep the new regression file in place. Both normal-mode cases pass, while both StrictMode cases fail. Reapply the source fix to restore all four passing cases.
