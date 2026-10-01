import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type StoredFile = { bytes: Buffer; contentType: string };

/** مكان صور العروض (Supabase Storage في الإنتاج) */
export abstract class FileStorage {
  abstract put(key: string, file: StoredFile): Promise<void>;
  abstract get(key: string): Promise<StoredFile | null>;
}

export const STORAGE = Symbol('STORAGE');

const extensionTypes: Record<string, string> = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

/** للتطوير المحلي بس: على Vercel الديسك مش دايم */
export class LocalDiskStorage extends FileStorage {
  constructor(private readonly root: string) {
    super();
  }

  private resolve(key: string): string {
    const target = path.resolve(this.root, key);
    if (!target.startsWith(path.resolve(this.root) + path.sep)) throw new Error('مسار ملف غلط');
    return target;
  }

  async put(key: string, file: StoredFile): Promise<void> {
    const target = this.resolve(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.bytes);
  }

  async get(key: string): Promise<StoredFile | null> {
    try {
      const bytes = await readFile(this.resolve(key));
      return { bytes, contentType: extensionTypes[path.extname(key)] ?? 'application/octet-stream' };
    } catch {
      return null;
    }
  }
}

/** Supabase Storage عن طريق الـ REST API بمفتاح service role (من السيرفر بس) */
export class SupabaseStorage extends FileStorage {
  private bucketReady: Promise<void> | null = null;

  constructor(
    private readonly url: string,
    private readonly serviceKey: string,
    private readonly bucket: string,
  ) {
    super();
  }

  private headers(extra: Record<string, string> = {}) {
    return { Authorization: `Bearer ${this.serviceKey}`, apikey: this.serviceKey, ...extra };
  }

  /** الـ bucket خاص (مش public)؛ بيتعمل أول مرة لو مش موجود */
  private ensureBucket(): Promise<void> {
    this.bucketReady ??= (async () => {
      const res = await fetch(`${this.url}/storage/v1/bucket`, {
        method: 'POST',
        headers: this.headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id: this.bucket, name: this.bucket, public: false }),
      });
      // 409/400 = موجود بالفعل
      if (!res.ok && res.status !== 409 && res.status !== 400) {
        this.bucketReady = null;
        throw new Error(`Supabase bucket: ${res.status}`);
      }
    })();
    return this.bucketReady;
  }

  async put(key: string, file: StoredFile): Promise<void> {
    await this.ensureBucket();
    const res = await fetch(`${this.url}/storage/v1/object/${this.bucket}/${key}`, {
      method: 'POST',
      headers: this.headers({ 'Content-Type': file.contentType, 'x-upsert': 'true' }),
      body: new Uint8Array(file.bytes),
    });
    if (!res.ok) throw new Error(`Supabase upload: ${res.status}`);
  }

  async get(key: string): Promise<StoredFile | null> {
    const res = await fetch(`${this.url}/storage/v1/object/${this.bucket}/${key}`, { headers: this.headers() });
    if (res.status === 404 || res.status === 400) return null;
    if (!res.ok) throw new Error(`Supabase download: ${res.status}`);
    return { bytes: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get('content-type') ?? 'image/jpeg' };
  }
}

/** للتيستات */
export class MemoryStorage extends FileStorage {
  readonly files = new Map<string, StoredFile>();

  put(key: string, file: StoredFile): Promise<void> {
    this.files.set(key, file);
    return Promise.resolve();
  }

  get(key: string): Promise<StoredFile | null> {
    return Promise.resolve(this.files.get(key) ?? null);
  }
}
