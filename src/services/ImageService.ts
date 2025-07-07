import fs from "fs-extra";
import path from "path";

export class ImageService {
  private imageDirectory: string;

  constructor() {
    this.imageDirectory = process.env.IMAGE_DIRECTORY || "./uploads/images";
    fs.ensureDirSync(this.imageDirectory);
  }

  getImageList(): string[] {
    try {
      const files = fs.readdirSync(this.imageDirectory);
      const imageFiles = files
        .filter((file) => this.isImageFile(file))
        .map((file) => `/uploads/images/${file}`)
        .sort((a, b) => {
          // Sort by modification time, newest first
          const statA = fs.statSync(
            path.join(this.imageDirectory, path.basename(a))
          );
          const statB = fs.statSync(
            path.join(this.imageDirectory, path.basename(b))
          );
          return statB.mtime.getTime() - statA.mtime.getTime();
        });

      return imageFiles;
    } catch (error) {
      console.error("Failed to get image list:", error);
      return [];
    }
  }

  private isImageFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"].includes(ext);
  }

  getStatus(): { imageCount: number } {
    const images = this.getImageList();
    return { imageCount: images.length };
  }

  deleteImage(filename: string): boolean {
    try {
      const filepath = path.join(this.imageDirectory, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log(`🗑️  Deleted image: ${filename}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to delete image:", error);
      return false;
    }
  }

  cleanupOldImages(maxImages: number = 100): void {
    try {
      const images = this.getImageList();
      if (images.length > maxImages) {
        const imagesToDelete = images.slice(maxImages);
        imagesToDelete.forEach((imagePath) => {
          const filename = path.basename(imagePath);
          this.deleteImage(filename);
        });
        console.log(`🧹 Cleaned up ${imagesToDelete.length} old images`);
      }
    } catch (error) {
      console.error("Failed to cleanup old images:", error);
    }
  }
}
