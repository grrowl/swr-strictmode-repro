import { spawnSync } from 'node:child_process';
const cases = [['unpatched', 'false', 0], ['unpatched', 'true', 1], ['fixed', 'true', 0], ['fixed', 'false', 0]];
let matches = true;
for (const [version, strict, expected] of cases) {
  const result = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test'], {
    env: { ...process.env, SWR_VERSION: version, STRICT_MODE: strict }, stdio: 'inherit'
  });
  console.log(`Dependency=${version}; StrictMode=${strict}; actual exit=${result.status}; expected exit=${expected}`);
  if (result.status !== expected) matches = false;
}
process.exitCode = matches ? 0 : 1;
