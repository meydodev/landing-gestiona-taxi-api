import { promises as fs } from 'fs';
import path from 'path';

export interface Review {
  id: number;          // 👈 numérico
  rating: number;      // 1..5
  review: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  average: number;              // promedio de rating
  total: number;                // número de reseñas
  breakdown: { [stars: number]: number }; // % por estrellas
}



export interface CreateReview { rating: number; review: string; }

const DATA_DIR  = process.env.DATA_DIR  ?? path.resolve(__dirname, '../data');
const DATA_FILE = process.env.DATA_FILE ?? path.join(DATA_DIR, 'reviews.json');

let queue: Promise<void> = Promise.resolve();
function serialize<T>(op: () => Promise<T>): Promise<T> {
  const run = queue.then(op, op);
  queue = run.then(() => {}, () => {});
  return run;
}

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try { await fs.access(DATA_FILE); }
  catch { await fs.writeFile(DATA_FILE, '[]\n', 'utf8'); }
}

// Normaliza el archivo (convierte id string -> number, completa fechas)
async function readFileSafe(): Promise<Review[]> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  if (!raw.trim()) return [];
  const arr = JSON.parse(raw) as any[];
  return arr.map((r) => {
    const idNum = typeof r.id === 'number' ? r.id : parseInt(String(r.id), 10);
    const created = r.createdAt ?? new Date().toISOString();
    return {
      id: Number.isFinite(idNum) ? idNum : 0,
      rating: Number(r.rating),
      review: String(r.review ?? ''),
      createdAt: created,
      updatedAt: r.updatedAt ?? created,
    } as Review;
  }).filter(r => Number.isFinite(r.id));
}

async function writeAtomic(data: Review[]) {
  await ensureFile();
  const tmp = `${DATA_FILE}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await fs.rename(tmp, DATA_FILE);
}

function nextId(list: Review[]): number {
  let max = 0;
  for (const r of list) if (typeof r.id === 'number' && r.id > max) max = r.id;
  return max + 1; // empieza en 1 si está vacío
}

// --- API pública ---
export async function listReviews(): Promise<Review[]> {
  await queue; // espera escrituras en curso
  return readFileSafe();
}

export async function createReviewTx(input: CreateReview): Promise<Review> {
  return serialize(async () => {
    const list = await readFileSafe();
    const now = new Date().toISOString();
    const item: Review = {
      id: nextId(list),                 // 👈 autoincrement
      rating: input.rating,
      review: input.review.trim(),
      createdAt: now,
      updatedAt: now,
    };
    list.push(item);                    // se añade “una detrás de otra”
    await writeAtomic(list);
    return item;
  });
}


export async function getReviewStats(): Promise<ReviewStats> {
  const list = await listReviews();
  const total = list.length;
  if (total === 0) {
    return { average: 0, total: 0, breakdown: {1:0,2:0,3:0,4:0,5:0} };
  }

  const breakdown: Record<number, number> = {1:0,2:0,3:0,4:0,5:0};
  let sum = 0;
  for (const r of list) {
    sum += r.rating;
    breakdown[r.rating] = (breakdown[r.rating] ?? 0) + 1;
  }

  // convierte a porcentaje
  for (let i = 1; i <= 5; i++) {
    breakdown[i] = Math.round((breakdown[i] / total) * 100);
  }

  return {
    average: sum / total,
    total,
    breakdown
  };
}