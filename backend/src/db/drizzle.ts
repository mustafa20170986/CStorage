// src/db/db.module.ts
import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';

export const DRIZZLE = 'DRIZZLE_CONNECTION';

@Global() // Makes DRIZZLE available across your app without re-importing DbModule everywhere
@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: async () => {
        // Connection string to your PostgreSQL database
        const connectionString =
          process.env.DATABASE_URL ||
          'postgres://user:password@localhost:5432/cstorage';

        // Setup postgres-js client
        const queryClient = postgres(connectionString);

        // Return initialized Drizzle ORM instance with schema
        return drizzle(queryClient, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DbModule {}
