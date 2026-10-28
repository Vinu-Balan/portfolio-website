// Checks the production build against the performance budget from the brief.
//  - Initial JS (gzipped), excluding the lazy-loaded 3D vendor chunks: < 250 KB
//  - Total transferable size of dist/: < 3 MB
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const INITIAL_JS_LIMIT_KB = 250;
const TOTAL_LIMIT_MB = 3;
const LAZY_VENDOR = /^assets\/(three|gsap|howler)-/;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = walk(DIST).map((path) => ({
  name: relative(DIST, path).replaceAll('\\', '/'),
  bytes: readFileSync(path),
}));

const gz = (buffer) => gzipSync(buffer).length;
const js = files.filter((f) => f.name.endsWith('.js'));
const initialJs = js.filter((f) => !LAZY_VENDOR.test(f.name));
const initialKb = initialJs.reduce((sum, f) => sum + gz(f.bytes), 0) / 1024;
const vendorKb =
  js.filter((f) => LAZY_VENDOR.test(f.name)).reduce((s, f) => s + gz(f.bytes), 0) / 1024;
const totalMb = files.reduce((sum, f) => sum + f.bytes.length, 0) / 1024 / 1024;

console.log(
  `Initial JS (gzip, excl. 3D vendors): ${initialKb.toFixed(1)} KB  (limit ${INITIAL_JS_LIMIT_KB})`,
);
console.log(
  `Lazy 3D vendors (gzip):              ${vendorKb.toFixed(1)} KB  (loaded after first paint)`,
);
console.log(
  `Total dist size:                     ${totalMb.toFixed(2)} MB  (limit ${TOTAL_LIMIT_MB})`,
);

const failures = [];
if (initialKb > INITIAL_JS_LIMIT_KB) failures.push('initial JS over budget');
if (totalMb > TOTAL_LIMIT_MB) failures.push('total size over budget');
if (failures.length > 0) {
  console.error(`Budget FAILED: ${failures.join(', ')}`);
  process.exit(1);
}
console.log('Budget OK');
