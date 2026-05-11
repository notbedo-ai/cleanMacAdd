// Quick smoke test for the parsers. Not part of the production build.
// Run with: npx tsx scripts/smoke-test.ts  (or use the wrapper: node scripts/smoke-test.mjs)
import { execSync } from 'node:child_process';

try {
  const out = execSync('npx --yes tsx scripts/smoke-test.ts', {
    stdio: 'pipe',
    cwd: process.cwd(),
  }).toString();
  console.log(out);
} catch (e) {
  console.error(e.stderr?.toString() ?? e.message);
  process.exit(1);
}
