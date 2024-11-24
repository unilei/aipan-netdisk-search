/**
 * 并发控制器，用于限制同时进行的操作数量
 */
interface PrioritizedTask {
  priority: number;
  task: () => Promise<void>;
}

export class ConcurrencyController {
  private running = 0;
  private queue: PrioritizedTask[] = [];

  constructor(private maxConcurrent: number) {}

  async add<T>(task: () => Promise<T>, priority: number = 0): Promise<T> {
    if (this.running >= this.maxConcurrent) {
      // If at concurrency limit, queue the task with priority
      return new Promise((resolve, reject) => {
        const prioritizedTask: PrioritizedTask = {
          priority,
          task: async () => {
            try {
              const result = await this.execute(task);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          }
        };
        
        // Insert task at the correct position based on priority
        const insertIndex = this.queue.findIndex(item => item.priority < priority);
        if (insertIndex === -1) {
          this.queue.push(prioritizedTask);
        } else {
          this.queue.splice(insertIndex, 0, prioritizedTask);
        }
      });
    }

    return this.execute(task);
  }

  private async execute<T>(task: () => Promise<T>): Promise<T> {
    this.running++;
    try {
      return await task();
    } finally {
      this.running--;
      this.processQueue();
    }
  }

  private processQueue() {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const next = this.queue.shift();
      if (next) {
        next.task();
      }
    }
  }

  getStats() {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent
    };
  }
}
