import { promises as fs } from 'fs';
import path from 'path';

export interface DownloadCounter {
  counterDownload: number;
  updatedAt: string;
}

/**
 * Usa DISCO PERSISTENTE:
 * - En Render añade un Disk y móntalo en /data (recomendado).
 * - Opcional: setea DATA_DIR=/data en las variables de entorno.
 * - Si no hay DATA_DIR, por defecto usará /data igualmente.
 */
const DATA_DIR  = process.env.DATA_DIR && path.isAbsolute(process.env.DATA_DIR)
  ? process.env.DATA_DIR
  : '/data';

const DATA_FILE = path.join(DATA_DIR, 'downloadsCounter.json');
const TMP_FILE  = DATA_FILE + '.tmp';

/** Crea el archivo si no existe; si está corrupto, lo re-inicializa. */
async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    JSON.parse(raw);
  } catch {
    const init: DownloadCounter = {
      counterDownload: 0,
      updatedAt: new Date().toISOString(),
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(init, null, 2), 'utf8');
  }
}

// Cola para serializar escrituras dentro del proceso
let writing = Promise.resolve();

export async function readCounterTx(): Promise<DownloadCounter> {
  await ensureFile();
  await writing; // espera a que termine cualquier write en curso
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw) as DownloadCounter;
}

async function writeCounter(data: DownloadCounter) {
  writing = writing.then(async () => {
    try {
      // write-then-rename atómico en el mismo dir
      await fs.writeFile(TMP_FILE, JSON.stringify(data, null, 2), 'utf8');
      await fs.rename(TMP_FILE, DATA_FILE);
    } catch (err) {
      try { await fs.unlink(TMP_FILE); } catch {}
      throw err;
    }
  });
  return writing;
}

export async function incrementCounter(): Promise<DownloadCounter> {
  const current = await readCounterTx();
  const next: DownloadCounter = {
    counterDownload: current.counterDownload + 1,
    updatedAt: new Date().toISOString(),
  };
  await writeCounter(next);
  return next;
}
