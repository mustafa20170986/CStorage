import { serial } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { timestamp } from 'drizzle-orm/pg-core';
import { boolean } from 'drizzle-orm/pg-core';
import { varchar } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';

export const outboxEvents = pgTable('outbox', {
  id: serial('id').primaryKey(),
  aggrigateId: varchar('aggrigateId', { length: 255 }).notNull(),
  aggrigateType: varchar('aggrigateType', { length: 100 }).notNull(),
  eventType: varchar('eventType', { length: 100 }).notNull(),
  payload: text('payload').notNull(),
  processed: boolean('processed').default(false).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});
