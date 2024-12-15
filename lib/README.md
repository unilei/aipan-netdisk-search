# Prisma Database Connection Management

This module provides a robust connection pooling and management system for Prisma ORM in Node.js applications.

## Features

- **Connection Pooling**: Efficiently manages database connections with configurable pool sizes
- **Query Monitoring**: Tracks slow queries and provides performance metrics
- **Security**: Implements query timeout and parameter validation
- **Resource Management**: Detects connection leaks and manages idle connections
- **Error Handling**: Comprehensive error tracking and reporting
- **Type Safety**: Full TypeScript support

## Usage

```typescript
import { PrismaManager } from './prisma-client';

// Get the singleton instance
const prismaManager = PrismaManager.getInstance();

// Get a client from the pool
const client = await prismaManager.getClient();

try {
  // Use the client
  const result = await client.user.findMany();
} finally {
  // Always release the client back to the pool
  await prismaManager.releaseClient(client);
}
```

## Configuration

The connection pool can be configured with the following options:

```typescript
const config = {
  min: 2,              // Minimum number of connections
  max: 10,             // Maximum number of connections
  idleTimeout: 30000,  // Time in ms before idle connections are closed
  acquireTimeout: 5000, // Time in ms to wait for a connection
  leakDetectionThreshold: 60000 // Time in ms before a connection is considered leaked
};
```

## Query Validation

The system automatically validates queries to prevent potential issues:

- Maximum pagination limits
- Query depth restrictions
- Required field validation
- Query timeout protection

## Monitoring

The system provides detailed statistics and monitoring capabilities:

```typescript
const stats = await prismaManager.getStats();
console.log(stats);
// {
//   pool: {
//     active: number,
//     idle: number,
//     total: number,
//     ...
//   },
//   queries: {
//     totalQueries: number,
//     slowQueries: number,
//     errors: number,
//     ...
//   }
// }
```

## Events

The system emits various events for monitoring and debugging:

- `query`: Emitted for each query
- `slow-query`: Emitted when a query exceeds the slow threshold
- `very-slow-query`: Emitted when a query exceeds the very slow threshold
- `error`: Emitted on any error
- `connection-leak`: Emitted when a connection leak is detected

## Best Practices

1. Always release connections after use
2. Use try/finally blocks to ensure connections are released
3. Monitor connection leaks and slow queries
4. Configure pool sizes based on your application needs
5. Implement proper error handling

## Testing

Run the test suite:

```bash
npm test
```

## License

MIT
