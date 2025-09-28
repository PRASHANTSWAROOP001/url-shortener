
import { varchar, integer,pgTable, text, timestamp, index, uniqueIndex} from "drizzle-orm/pg-core"

export const usersTable = pgTable("users", {
    id:integer().primaryKey().generatedAlwaysAsIdentity(),
    name:varchar({length:255}).notNull(),
    email:varchar({length:255}).notNull().unique(),
    password:varchar({length:65}).notNull().unique()
},);

export const globalUrlTable = pgTable("global_urls", {
    id:integer().primaryKey().generatedAlwaysAsIdentity(),
    hash:varchar({length:64}).notNull().unique(),
    longUrl:text().notNull()
})

export const userLinksTable = pgTable("user_link", {
    id:integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id").notNull().references(()=>usersTable.id, {onDelete:"cascade"}),
    globalUrlId:integer("global_url_id").notNull().references(()=>globalUrlTable.id, {onDelete:"cascade"}),
    shortCode:varchar({length:10}).notNull().unique(),
    createdAt:timestamp("timestamp1").notNull().defaultNow(),
    clickCount:integer().$default(()=> 0)
},(table)=>[
    index("user_link_userId").on(table.userId),
    uniqueIndex("url_index").on(table.globalUrlId,table.userId)
]
)


export const analyticsTable = pgTable("link_analytics", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  // Who owns the link (denormalized for easier querying)
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  // Which link was clicked
  userLinkId: integer("user_link_id")
    .notNull()
    .references(() => userLinksTable.id, { onDelete: "cascade" }),

  // When it was clicked
  clickedAt: timestamp("clicked_at").notNull().defaultNow(),

  // Optional context data
  ipAddress: varchar("ip_address", { length: 45 }), // IPv6 fits in 45 chars
  userAgent: text("user_agent"), // browser/device info
  referrer: text("referrer"), // where the click came from
  country: varchar("country", { length: 2 }) // ISO country code
});

