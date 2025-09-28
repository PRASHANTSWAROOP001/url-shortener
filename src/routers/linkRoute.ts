import { Hono } from "hono";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { zValidator } from "@hono/zod-validator";
import { linkSchema } from "../utils/linkValidation.js";
import { generateHash, generateShortCode } from "../utils/hashingFunction.js";
import { globalUrlTable, userLinksTable } from "../db/schema.js";
import { db } from "../index.js";
import { and, eq } from "drizzle-orm";
import type { userToken } from "../utils/types.js";
import dotenv from "dotenv"
import { redis } from "../index.js";
dotenv.config()

const link = new Hono()


link.post(
  "/short_url",
  authMiddleware,
  zValidator("json", linkSchema),
  async (c) => {
    try {
      const { linkUrl } = c.req.valid("json");
      const user =await c.get("jwtPayload") as userToken;

      const getHash = generateHash(linkUrl);

      // 1️. Check if global URL exists
      let [globalRow] = await db
        .select()
        .from(globalUrlTable)
        .where(eq(globalUrlTable.hash, getHash));

      // 2. Insert into global table if missing
      if (!globalRow) {
        const [insertedGlobal] = await db
          .insert(globalUrlTable)
          .values({ hash: getHash, longUrl: linkUrl })
          .returning();

        globalRow = insertedGlobal;
      }

      // 3️. Check if user already has this link
      let [userLinkRow] = await db
        .select()
        .from(userLinksTable)
        .where(
          and(
            eq(userLinksTable.userId, user.id),
            eq(userLinksTable.globalUrlId, globalRow.id)
          )
        );

      // 4️. Insert short code if missing
      if (!userLinkRow) {
        const shortCode = generateShortCode();

        const [insertedUserLink] = await db
          .insert(userLinksTable)
          .values({
            userId: user.id,
            globalUrlId: globalRow.id,
            shortCode,
          })
          .returning();

        userLinkRow = insertedUserLink;
      }

      // 5️. Return the short URL
      const baseUrl = process.env.BASE_URL || "http://localhost:3000";
      return c.json({
        success: true,
        shortUrl: `${baseUrl}/${userLinkRow.shortCode}`,
      });
    } catch (error) {
      console.error("Error while creating link.", error);
      return c.json(
        {
          success: false,
          message: "Error while creating the shorten link.",
        },
        500
      );
    }
  }
);


export const fetchRedirect = link.get("/:url",async (c)=>{
  try {

    const shortCode = c.req.param("url")

    const redisData = await redis.get(shortCode)

    if(redisData){
      return c.redirect(redisData, 302)
    }

    const result = await db.select({
      shortCode:userLinksTable.shortCode,
      longUrl:globalUrlTable.longUrl
    })
    .from(userLinksTable)
    .innerJoin(globalUrlTable,
      eq(userLinksTable.globalUrlId, globalUrlTable.id)
    )
    .where(eq(userLinksTable.shortCode, shortCode))

    if(result.length == 0){
      return c.json({
        success:false,
        message:"could not find any link."
      }, 404)
    }

    await redis.set(result[0].shortCode, result[0].longUrl,"EX", 600)

    return c.redirect(result[0].longUrl, 302)
    
  } catch (error) {
    console.error("error happened while getting the url",error)

    return c.json({
      success:false,
      message:"internal server errro due to some issues with get url",
    }, 500)
  }
})

export default link;