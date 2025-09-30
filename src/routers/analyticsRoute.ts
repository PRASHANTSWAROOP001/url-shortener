import { Hono } from "hono";
import { authMiddleware } from "../middleware/authMiddleware.js";
import type { userToken } from "../utils/types.js";
import { db } from "../index.js";
import { userLinksTable } from "../db/schema.js";
import { globalUrlTable } from "../db/schema.js";
import { sql, eq, and } from "drizzle-orm";
const analytics = new Hono();

analytics.get("/get_all_shorted_link", authMiddleware, async (c) => {
    try {

        const user = await c.get("jwtPayload") as userToken;

        console.log(user)

        const userId = user.id

        console.log(userId)


        const { limit, offset, sortBy, sortOrder } = c.req.query();

        const limitNo = parseInt(limit) || 10;
        const offsetNo = offset ? parseInt(offset) : 0; // first page = 0

        const allowedSortFields = ["createdAt", "clickCount"] as const;
        type SortField = (typeof allowedSortFields)[number];

        const allowedSortOrders = ["asc", "desc"] as const;
        type SortOrder = (typeof allowedSortOrders)[number];

        // default values
        const field: SortField = allowedSortFields.includes(sortBy as SortField)
            ? (sortBy as SortField)
            : "createdAt";

        const order: SortOrder = allowedSortOrders.includes(sortOrder as SortOrder)
            ? (sortOrder as SortOrder)
            : "desc";

        // map to column object
        const columnMap = {
            createdAt: userLinksTable.createdAt,
            clickCount: userLinksTable.clickCount,
        } as const;

        const sortColumn = columnMap[field];

        // use .asc() / .desc() safely
        const orderExpression =
            order === "asc"
                ? sql`${sortColumn} ASC`
                : sql`${sortColumn} DESC`;

        const result = await db
            .select({
                id: userLinksTable.id,
                shortCode: userLinksTable.shortCode,
                longUrl: globalUrlTable.longUrl,
                clickCount: userLinksTable.clickCount,
                createdAt: userLinksTable.createdAt,
            })
            .from(userLinksTable)
            .innerJoin(globalUrlTable, eq(userLinksTable.globalUrlId, globalUrlTable.id))
            .where(eq(userLinksTable.userId, userId))
            .orderBy(orderExpression) 
            .limit(limitNo)
            .offset(offsetNo);



        return c.json({ success: true, data: result });

    } catch (error) {
        console.error(
            "error happened while getting all shorted links for the user",
            error
        );
        return c.json({ success: false, message: "internal error" }, 500);
    }

})

analytics.delete("/delete_url", authMiddleware, async (c)=>{
    try {

        const user = await c.get("jwtPayload") as userToken;

        const userId = user.id;

    
        const {id} = c.req.query();

        const searchLink = await db.select().from(userLinksTable).where(and(
            eq(userLinksTable.id,parseInt(id)),
            eq(userLinksTable.userId, userId)
        ))

        if(searchLink.length == 0){
            return c.json({
                success:false,
                message:"missing link/link does not belong to this user."
            }, 404)
        }

        await db.delete(userLinksTable).where(
            and(
                eq(userLinksTable.id, parseInt(id)),
                eq(userLinksTable.userId, userId)
            )
        )


        return c.json({
            success:true,
            message:"success fully deleted"
        })
        
        
    } catch (error) {
        console.error("error happened while deleting a link", error)
        return c.json({
            success:false,
            message:"error while deleting the url"
        }, 500)
        
    }
})

export default analytics;