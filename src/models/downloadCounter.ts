import { promises as fs } from 'fs';
import path from 'path';

export interface DownloadCounter {
  counterDownload: number;
  updatedAt: string;
}

// ⬇️ clave: usar __dirname -> ../data del archivo compilado
const DATA_DIR  = process.env.DATA_DIR  ?? path.resolve(__dirname, '../data');
const DATA_FILE = process.env.DATA_FILE ?? path.join(DATA_DIR, 'downloadsCounter.json');
const TMP_FILE  = DATA_FILE + '.tmp';

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    const init: DownloadCounter = {
      counterDownload: 0,
      updatedAt: new Date().toISOString(),
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(init, null, 2), 'utf8');
  }
}

let writing = Promise.resolve();

export async function readCounterTx(): Promise<DownloadCounter> {
  await ensureFile();
  await writing;
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw) as DownloadCounter;
}


async function writeCounter(data: DownloadCounter) {
  writing = writing.then(async () => {
    try {
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
