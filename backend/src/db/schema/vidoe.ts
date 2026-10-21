import { varchar } from 'drizzle-orm/pg-core';
import { uuid } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';
import { userTable } from './user';
import { timestamp } from 'drizzle-orm/pg-core';

export const videoTable = pgTable('videoTable', {
  id: uuid('id').defaultRandom().primaryKey().unique().notNull(),
  public_link: varchar('public_link', { length: 500 }).notNull(),
  file_key: varchar('file_key', { length: 255 }).notNull(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});
