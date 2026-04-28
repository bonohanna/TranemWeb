import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const defaultZipPath = path.resolve(
  projectRoot,
  '../Tranem/app/src/main/assets/systdefault.zip',
);
const zipPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : defaultZipPath;
const outputDir = path.resolve(projectRoot, 'public/data');
const wasmSource = path.resolve(projectRoot, 'node_modules/sql.js/dist/sql-wasm.wasm');
const wasmTarget = path.resolve(projectRoot, 'public/sql-wasm.wasm');

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const archiveBytes = await fs.readFile(zipPath);
  const entries = unzipSync(new Uint8Array(archiveBytes));
  const dbEntryName = Object.keys(entries).find((entryName) =>
    entryName.toLowerCase().endsWith('.db'),
  );

  if (!dbEntryName) {
    throw new Error(`No SQLite database was found inside ${zipPath}`);
  }

  const dbFileName = path.basename(dbEntryName);
  const dbTarget = path.join(outputDir, dbFileName);

  await fs.writeFile(dbTarget, Buffer.from(entries[dbEntryName]));
  await fs.copyFile(wasmSource, wasmTarget);

  console.log(`Catalog extracted to ${dbTarget}`);
  console.log(`sql.js wasm copied to ${wasmTarget}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
