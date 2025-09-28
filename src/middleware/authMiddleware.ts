import type { Next, Context } from "hono";
import {verify} from "hono/jwt"
import dotenv from "dotenv"
dotenv.config();

export const authMiddleware = async (c:Context, next:Next)=>{
    try {

        const header = c.req.header("Authorization")


        if(!header || !header.startsWith("Bearer")){
            return c.json({
                success:false,
                message:"missing auth tokens",
            },401)
        }

        const token = header.split(" ")[1]

        const decoded = verify(token, process.env.JWT_SECRET!) 

        c.set("jwtPayload",decoded)

        await next();
        
    } catch (error) {

        console.error("error while validating token at the middleware.", error)

        return c.json({
            success:false,
            message:"expired/invalid token provided",
        },401)
        
    }
}