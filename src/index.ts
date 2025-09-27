import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import dotenv from "dotenv"
import {drizzle} from "drizzle-orm/node-postgres"
dotenv.config()

export const db = drizzle(process.env.DATABASE_URL!);

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})