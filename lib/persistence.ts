import fs from 'fs/promises';
import path from 'path';

export interface PersistenceOptions {
  directory: string;
  maxFileSize?: number;  // 单个文件最大大小（字节）
  maxFiles?: number;     // 最大文件数
}

/**
 * 缓存持久化管理器
 */
export class PersistenceManager {
  private directory: string;
  private maxFileSize: number;
  private maxFiles: number;

  constructor(options: PersistenceOptions) {
    this.directory = options.directory;
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 默认 10MB
    this.maxFiles = options.maxFiles || 100;
  }

  async initialize() {
    try {
      await fs.mkdir(this.directory, { recursive: true });
    } catch (error) {
      console.error('Failed to create persistence directory:', error);
      throw error;
    }
  }

  private getFilePath(key: string): string {
    // 使用 MD5 或其他哈希函数可以确保文件名的唯一性和有效性
    const safeKey = Buffer.from(key).toString('base64').replace(/[/+=]/g, '_');
    return path.join(this.directory, `${safeKey}.json`);
  }

  async save(key: string, value: any): Promise<void> {
    const filePath = this.getFilePath(key);
    
    try {
      const data = JSON.stringify({
        key,
        value,
        timestamp: Date.now()
      });

      // 检查文件大小
      if (Buffer.byteLength(data) > this.maxFileSize) {
        throw new Error(`Cache entry exceeds maximum file size: ${key}`);
      }

      // 检查并清理旧文件
      await this.cleanup();

      // 写入文件
      await fs.writeFile(filePath, data, 'utf8');
    } catch (error) {
      console.error(`Failed to persist cache entry ${key}:`, error);
      throw error;
    }
  }

  async load(key: string): Promise<any | null> {
    const filePath = this.getFilePath(key);
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(data);
      
      // 可以在这里添加过期检查等逻辑
      return parsed.value;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      console.error(`Failed to load cache entry ${key}:`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`Failed to delete cache entry ${key}:`, error);
        throw error;
      }
    }
  }

  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.directory);
      await Promise.all(
        files.map(file => 
          fs.unlink(path.join(this.directory, file))
        )
      );
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  private async cleanup(): Promise<void> {
    try {
      const files = await fs.readdir(this.directory);
      if (files.length <= this.maxFiles) {
        return;
      }

      // 获取文件信息并排序
      const fileStats = await Promise.all(
        files.map(async file => {
          const filePath = path.join(this.directory, file);
          const stats = await fs.stat(filePath);
          return { file, stats };
        })
      );

      // 按修改时间排序，删除最旧的文件
      fileStats.sort((a, b) => a.stats.mtime.getTime() - b.stats.mtime.getTime());
      
      const filesToDelete = fileStats.slice(0, files.length - this.maxFiles);
      await Promise.all(
        filesToDelete.map(({ file }) =>
          fs.unlink(path.join(this.directory, file))
        )
      );
    } catch (error) {
      console.error('Failed to cleanup cache files:', error);
      throw error;
    }
  }

  async getStats(): Promise<{
    totalSize: number;
    fileCount: number;
    oldestFile: Date | null;
    newestFile: Date | null;
  }> {
    try {
      const files = await fs.readdir(this.directory);
      if (files.length === 0) {
        return {
          totalSize: 0,
          fileCount: 0,
          oldestFile: null,
          newestFile: null
        };
      }

      const fileStats = await Promise.all(
        files.map(async file => {
          const filePath = path.join(this.directory, file);
          return fs.stat(filePath);
        })
      );

      const totalSize = fileStats.reduce((sum, stats) => sum + stats.size, 0);
      const times = fileStats.map(stats => stats.mtime.getTime());

      return {
        totalSize,
        fileCount: files.length,
        oldestFile: new Date(Math.min(...times)),
        newestFile: new Date(Math.max(...times))
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      throw error;
    }
  }
}
