import type { JWTPayload } from "hono/utils/jwt/types";

export interface userToken extends JWTPayload{
    id:number,
    email:string
}