import { varchar, integer,pgTable} from "drizzle-orm/pg-core"

export const usersTable = pgTable("users", {
    id:integer().primaryKey().generatedAlwaysAsIdentity(),
    name:varchar({length:255}).notNull(),
    email:varchar({length:255}).notNull().unique(),
    password:varchar({length:65}).notNull().unique()
});

