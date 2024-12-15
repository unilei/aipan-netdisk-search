import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';

interface PoolOptions {
  min?: number;
  max?: number;
  idleTimeout?: number;
  acquireTimeout?: number;
  retryInterval?: number;
  leakDetectionThreshold?: number;
}

interface PoolStats {
  active: number;
  idle: number;
  waiting: number;
  total: number;
  maxUsed: number;
  acquireTime: number;
  leakedConnections: number;
  lastLeakDetection: Date;
}

type QueueItem = {
  resolve: (client: PrismaClient) => void;
  reject: (error: Error) => void;
  timestamp: number;
  stackTrace?: string;
};

export class PrismaPool extends EventEmitter {
  private clients: Array<{
    client: PrismaClient;
    lastActive: number;
    acquiredAt?: number;
    stackTrace?: string;
  }> = [];
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
    acquireTime: 0,
    leakedConnections: 0,
    lastLeakDetection: new Date()
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
      retryInterval: options.retryInterval ?? 1000,
      leakDetectionThreshold: options.leakDetectionThreshold ?? 60000
    };

    void this.initializeMinConnections();
    
    this.maintenanceInterval = setInterval(
      () => void this.maintenance(),
      Math.min(this.options.idleTimeout / 2, 30000)
    );
  }

  private async initializeMinConnections(): Promise<void> {
    try {
      const initPromises = Array.from({ length: this.options.min }, () => this.createClient());
      const clients = await Promise.all(initPromises);
      clients.forEach(client => {
        if (client) {
          this.idleClients.add(client);
          this.clients.push({
            client,
            lastActive: Date.now()
          });
        }
      });
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

      client.$on('query', (e) => this.emit('query', { ...e, clientId: client }));
      client.$on('error', (e) => this.emit('error', { ...e, clientId: client }));

      await client.$connect();
      return client;
    } catch (error) {
      this.emit('error', { error, operation: 'createClient' });
      return null;
    }
  }

  async acquire(): Promise<PrismaClient> {
    const startTime = Date.now();
    const stackTrace = new Error().stack;
    
    try {
      const idleClient = this.idleClients.values().next().value as PrismaClient | undefined;
      if (idleClient) {
        const clientInfo = this.clients.find(c => c.client === idleClient);
        if (clientInfo) {
          clientInfo.acquiredAt = Date.now();
          clientInfo.stackTrace = stackTrace;
          clientInfo.lastActive = Date.now();
        }
        this.idleClients.delete(idleClient);
        this.activeClients.add(idleClient);
        this.updateStats(startTime);
        return idleClient;
      }

      if (this.clients.length < this.options.max) {
        const client = await this.createClient();
        if (!client) throw new Error('Failed to create new client');
        this.clients.push({
          client,
          lastActive: Date.now(),
          acquiredAt: Date.now(),
          stackTrace
        });
        this.activeClients.add(client);
        this.updateStats(startTime);
        return client;
      }

      return new Promise<PrismaClient>((resolve, reject) => {
        const timeout = setTimeout(() => {
          const index = this.waitingQueue.findIndex(w => w.resolve === resolve && w.reject === reject);
          if (index !== -1) {
            this.waitingQueue.splice(index, 1);
            reject(new Error('Connection acquire timeout'));
          }
        }, this.options.acquireTimeout);

        this.waitingQueue.push({
          resolve: (client: PrismaClient) => {
            clearTimeout(timeout);
            const clientInfo = this.clients.find(c => c.client === client);
            if (clientInfo) {
              clientInfo.acquiredAt = Date.now();
              clientInfo.stackTrace = stackTrace;
            }
            this.updateStats(startTime);
            resolve(client);
          },
          reject: (error: Error) => {
            clearTimeout(timeout);
            reject(error);
          },
          timestamp: startTime,
          stackTrace
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
        
        const nextRequest = this.waitingQueue.shift();
        if (nextRequest) {
          this.activeClients.add(client);
          nextRequest.resolve(client);
          this.stats.waiting = this.waitingQueue.length;
          return;
        }

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
      
      // 检测连接泄漏
      for (const clientInfo of this.clients) {
        if (clientInfo.acquiredAt && 
            (now - clientInfo.acquiredAt) > this.options.leakDetectionThreshold) {
          this.emit('connection-leak', {
            timeHeld: now - clientInfo.acquiredAt,
            stackTrace: clientInfo.stackTrace,
            lastActive: clientInfo.lastActive
          });
          this.stats.leakedConnections++;
        }
      }

      // 清理空闲连接
      const idleClientsArray = Array.from(this.idleClients);
      for (const client of idleClientsArray) {
        const clientInfo = this.clients.find(c => c.client === client);
        if (clientInfo && 
            (now - clientInfo.lastActive) > this.options.idleTimeout && 
            this.clients.length > this.options.min) {
          await client.$disconnect();
          this.idleClients.delete(client);
          this.clients = this.clients.filter(c => c.client !== client);
          this.emit('connection-closed', { reason: 'idle' });
        }
      }

      // 处理超时的等待请求
      while (this.waitingQueue.length > 0 && 
             now - this.waitingQueue[0].timestamp > this.options.acquireTimeout) {
        const request = this.waitingQueue.shift();
        if (request) {
          request.reject(new Error('Connection acquire timeout'));
          this.emit('acquire-timeout', {
            waitTime: now - request.timestamp,
            stackTrace: request.stackTrace
          });
        }
      }

      this.stats.lastLeakDetection = new Date();
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
    
    await Promise.all(this.clients.map(client => client.client.$disconnect()));
    
    this.clients = [];
    this.activeClients.clear();
    this.idleClients.clear();
    this.waitingQueue = [];
    this.updateStats();
  }
}
