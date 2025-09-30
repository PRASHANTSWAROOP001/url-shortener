import { db } from "../index.js";
import { userLinksTable } from "../db/schema.js";
import { redis } from "../index.js";
import { eq, sql } from "drizzle-orm";

export async function batchUpdateClick() {
  try {
    // better pattern: use "clicks:*"
    const keys = await redis.keys("clicks:*");

    if (keys.length === 0) {
      return;
    }

    const pipeline = redis.pipeline();
    keys.forEach((k) => pipeline.get(k));
    const results = (await pipeline.exec()) as Array<
      [Error | null, string | null] | null
    >;

    for (let i = 0; i < keys.length; i++) {
      const entry = results[i];
      if (!entry) continue;

      const [, rawValue] = entry;
      const valueString = typeof rawValue === "string" ? rawValue : "0";
      const clickValue = Number.parseInt(valueString, 10) || 0;

      if (clickValue <= 0) continue;

      // 🔹 extract shortCode from redis key
      // if your key is like "clicks:abc123"
      const redisKey = keys[i];
      const shortCode = redisKey.replace("clicks:", "");

      // 🔹 update DB (increment existing clickCount)
      await db
        .update(userLinksTable)
        .set({
          clickCount: sql`${userLinksTable.clickCount} + ${clickValue}`,
        })
        .where(eq(userLinksTable.shortCode, shortCode));

      // 🔹 reset counter in Redis
      await redis.del(redisKey);
    }

    console.log(`Flushed ${keys.length} counters to DB`);
  } catch (error) {
    console.error("error happened while handling increment counter", error);
  }
}
