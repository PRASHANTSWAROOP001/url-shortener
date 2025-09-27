import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { signUpSchema, loginSchema } from "../utils/authZodSchema.js";
import { db } from "../index.js";
import { usersTable } from "../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { sign } from "hono/jwt";
import dotenv from "dotenv";

dotenv.config();

const auth = new Hono();

auth.post("/signup", zValidator("json", signUpSchema), async (c) => {
  try {
    const { name, email, password } = c.req.valid("json");

    const searchExistingEmails = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (searchExistingEmails.length > 0 && searchExistingEmails[0].email == email) {
      return c.json(
        {
          success: false,
          message: "user alreay exists",
        },
        409
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user: typeof usersTable.$inferInsert = {
      name,
      email,
      password: hashedPassword,
    };

    await db.insert(usersTable).values(user);

    return c.json({
      succcess: true,
      message: "account created successfully",
    });
  } catch (error) {
    console.error("error happened while creating users account", error);
    return c.json(
      {
        success: false,
        message: "error happened while creating account",
      },
      500
    );
  }
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
    try {
        const { email, password } = c.req.valid("json");

        const user = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1);

        if (!user.length) {
            return c.json(
                {
                    success: false,
                    message: "User does not exist.",
                },
                404
            );
        }

        const validatePassword = await bcrypt.compare(password, user[0].password);

        if (!validatePassword) {
            return c.json(
                {
                    success: false,
                    message: "Invalid email or password combination.",
                },
                401
            );
        }

        
        const token = await sign(
            {
            id: user[0].id,
            email: user[0].email,
            exp: Math.floor(Date.now() / 1000) + 60 * 60,
            },
            process.env.JWT_SECRET!,
            "HS256"
        );
        return c.json(
            {
                success: true,
                message: "Login successful.",
                token,
            },
            200
        );

    } catch (error) {
        console.error(error);
        return c.json(
            {
                success: false,
                message: "Internal server error.",
            },
            500
        );
    }
});

export default auth;


