import fs from "node:fs";
import path from "node:path";
import { config } from "../config";

export interface ImageEntry {
  name: string;
  url: string;
  addedAt: string;
}

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"]);

export function isImageFile(filename: string | undefined): boolean {
  return Boolean(filename) && IMAGE_EXTENSIONS.has(path.extname(filename!).toLowerCase());
}

export class ImageService {
  readonly directory = config.imageDirectory;

  constructor() {
    fs.mkdirSync(this.directory, { recursive: true });
  }

  list(): ImageEntry[] {
    try {
      return fs
        .readdirSync(this.directory)
        .filter(isImageFile)
        .map((name) => {
          const mtime = fs.statSync(path.join(this.directory, name)).mtime;
          return { name, url: `/images/${encodeURIComponent(name)}`, addedAt: mtime.toISOString() };
        })
        .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    } catch (error) {
      console.error("🖼️  Failed to list images:", error);
      return [];
    }
  }

  async save(originalName: string, content: Buffer): Promise<string> {
    const ext = path.extname(originalName).toLowerCase() || ".jpg";
    const filename = `image_${Date.now()}_${Math.random().toString(36).slice(2, 7)}${ext}`;
    await fs.promises.writeFile(path.join(this.directory, filename), content);
    console.log(`💾 Saved image: ${filename}`);
    this.pruneOldImages();
    return filename;
  }

  delete(name: string): boolean {
    const target = path.join(this.directory, path.basename(name));
    if (!fs.existsSync(target)) return false;
    fs.unlinkSync(target);
    console.log(`🗑️  Deleted image: ${name}`);
    return true;
  }

  pruneOldImages(): void {
    const extra = this.list().slice(config.maxImages);
    for (const image of extra) this.delete(image.name);
    if (extra.length) console.log(`🧹 Pruned ${extra.length} old image(s)`);
  }

  getStatus() {
    return { count: this.list().length };
  }
}
