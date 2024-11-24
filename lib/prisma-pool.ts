import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';

interface PoolOptions {
  min?: number;
  max?: number;
  idleTimeout?: number;
  acquireTimeout?: number;
  retryInterval?: number;
}

interface PoolStats {
  active: number;
  idle: number;
  waiting: number;
  total: number;
  maxUsed: number;
  acquireTime: number;
}

type QueueItem = {
  resolve: (client: PrismaClient) => void;
  reject: (error: Error) => void;
  timestamp: number;
};

export class PrismaPool extends EventEmitter {
  private clients: PrismaClient[] = [];
  private activeClients = new Set<PrismaClient>();
  private idleClients = new Set<PrismaClient>();
  private waitingQueue: QueueItem[] = [];
  
  private options: Required<PoolOptions>;
  private stats: PoolStats = {
    active: 0,
    idle: 0,
    waiting: 0,
    total: 0,
    maxUsed: 0,
    acquireTime: 0
  };
  
  private acquireTimes: number[] = [];
  private readonly MAX_ACQUIRE_TIMES = 100;
  private maintenanceInterval: NodeJS.Timeout;

  constructor(options: PoolOptions = {}) {
    super();
    this.options = {
      min: options.min ?? 1,
      max: options.max ?? 10,
      idleTimeout: options.idleTimeout ?? 30000,
      acquireTimeout: options.acquireTimeout ?? 5000,
      retryInterval: options.retryInterval ?? 1000
    };

    void this.initializeMinConnections();
    
    this.maintenanceInterval = setInterval(
      () => void this.maintenance(),
      Math.min(this.options.idleTimeout / 2, 30000)
    );
  }

  private async initializeMinConnections(): Promise<void> {
    try {
      const initPromises = Array(this.options.min).fill(0).map(async () => {
        const client = await this.createClient();
        if (client) {
          this.idleClients.add(client);
          this.clients.push(client);
        }
      });

      await Promise.all(initPromises);
      this.updateStats();
    } catch (error) {
      this.emit('error', { error, operation: 'initialize' });
      throw error;
    }
  }

  private async createClient(): Promise<PrismaClient | null> {
    try {
      const client = new PrismaClient({
        log: [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' }
        ]
      });

      client.$on('query', (e) => {
        this.emit('query', { ...e, clientId: client });
      });

      client.$on('error', (e) => {
        this.emit('error', { ...e, clientId: client });
      });

      await client.$connect();
      return client;
    } catch (error) {
      this.emit('error', { error, operation: 'createClient' });
      return null;
    }
  }

  async acquire(): Promise<PrismaClient> {
    const startTime = Date.now();
    
    try {
      // 尝试获取空闲连接
      const idleClient = this.idleClients.values().next().value as PrismaClient | undefined;
      if (idleClient) {
        this.idleClients.delete(idleClient);
        this.activeClients.add(idleClient);
        this.updateStats(startTime);
        return idleClient;
      }

      // 如果可以创建新连接
      if (this.clients.length < this.options.max) {
        const client = await this.createClient();
        if (!client) {
          throw new Error('Failed to create new client');
        }
        this.clients.push(client);
        this.activeClients.add(client);
        this.updateStats(startTime);
        return client;
      }

      // 需要等待空闲连接
      return new Promise<PrismaClient>((resolve, reject) => {
        const timeout = setTimeout(() => {
          const index = this.waitingQueue.findIndex(
            w => w.resolve === resolve && w.reject === reject
          );
          if (index !== -1) {
            this.waitingQueue.splice(index, 1);
            reject(new Error('Connection acquire timeout'));
          }
        }, this.options.acquireTimeout);

        this.waitingQueue.push({
          resolve: (client: PrismaClient) => {
            clearTimeout(timeout);
            this.updateStats(startTime);
            resolve(client);
          },
          reject: (error: Error) => {
            clearTimeout(timeout);
            reject(error);
          },
          timestamp: startTime
        });
        
        this.stats.waiting = this.waitingQueue.length;
      });
    } catch (error) {
      this.emit('error', { error, operation: 'acquire' });
      throw error;
    }
  }

  async release(client: PrismaClient): Promise<void> {
    try {
      if (this.activeClients.has(client)) {
        this.activeClients.delete(client);
        
        // 如果有等待的请求，直接分配给它
        const nextRequest = this.waitingQueue.shift();
        if (nextRequest) {
          this.activeClients.add(client);
          nextRequest.resolve(client);
          this.stats.waiting = this.waitingQueue.length;
          return;
        }

        // 否则加入空闲池
        this.idleClients.add(client);
        this.updateStats();
      }
    } catch (error) {
      this.emit('error', { error, operation: 'release' });
      throw error;
    }
  }

  private updateStats(acquireStartTime?: number): void {
    this.stats.active = this.activeClients.size;
    this.stats.idle = this.idleClients.size;
    this.stats.total = this.clients.length;
    this.stats.maxUsed = Math.max(this.stats.maxUsed, this.stats.active);
    
    if (acquireStartTime) {
      const acquireTime = Date.now() - acquireStartTime;
      this.acquireTimes.push(acquireTime);
      if (this.acquireTimes.length > this.MAX_ACQUIRE_TIMES) {
        this.acquireTimes.shift();
      }
      this.stats.acquireTime = this.acquireTimes.reduce((a, b) => a + b, 0) / this.acquireTimes.length;
    }
  }

  private async maintenance(): Promise<void> {
    try {
      const now = Date.now();
      const idleClientsArray = Array.from(this.idleClients);
      
      // 清理超时的空闲连接
      for (const client of idleClientsArray) {
        if (this.clients.length > this.options.min) {
          await client.$disconnect();
          this.idleClients.delete(client);
          const index = this.clients.indexOf(client);
          if (index !== -1) {
            this.clients.splice(index, 1);
          }
        }
      }

      // 检查等待队列中的超时请求
      while (
        this.waitingQueue.length > 0 &&
        now - this.waitingQueue[0].timestamp > this.options.acquireTimeout
      ) {
        const request = this.waitingQueue.shift();
        if (request) {
          request.reject(new Error('Connection acquire timeout'));
        }
      }

      this.updateStats();
    } catch (error) {
      this.emit('error', { error, operation: 'maintenance' });
    }
  }

  async getStats(): Promise<PoolStats> {
    return { ...this.stats };
  }

  async close(): Promise<void> {
    clearInterval(this.maintenanceInterval);
    
    // 断开所有连接
    await Promise.all(
      this.clients.map(client => client.$disconnect())
    );
    
    this.clients = [];
    this.activeClients.clear();
    this.idleClients.clear();
    this.waitingQueue = [];
    this.updateStats();
  }
}
