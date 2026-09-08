import {sqliteTable,text} from 'drizzle-orm/sqlite-core';
export const profiles=sqliteTable('profiles',{userId:text('user_id').primaryKey().notNull(),data:text('data').notNull(),updatedAt:text('updated_at').notNull()});
