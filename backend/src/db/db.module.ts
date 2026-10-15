// src/db/db.module.ts
import { Module, Global } from '@nestjs/common';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

export const DRIZZLE = 'DRIZZLE_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: () => {
        const connectionString =
          process.env.DATABASE_URL || 'postgres:4057@localhost:5432/cstorage';

        // Initialize standard postgres-js client for local development
        const queryClient = postgres(connectionString);
        return drizzle(queryClient, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DbModule {}
