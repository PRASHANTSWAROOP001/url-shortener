import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import dotenv from "dotenv"
import {drizzle} from "drizzle-orm/node-postgres"
import auth from './routers/authRoute.js'
dotenv.config()

export const db = drizzle(process.env.DATABASE_URL!);

const app = new Hono()

app.get('/health', (c) => {
  return c.text('Hello Hono! 🔥')
})

app.route("/api/auth", auth)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})