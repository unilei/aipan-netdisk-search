import { initializePrisma } from './prisma-client';

if (process.env.NODE_ENV !== 'production') {
  initializePrisma();
}
