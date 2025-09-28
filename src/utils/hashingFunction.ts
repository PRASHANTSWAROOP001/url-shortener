import { createHash } from "node:crypto";
import {customAlphabet} from "nanoid"

export function generateHash(data:string):string{
    const hash = createHash("sha256")
    hash.update(data)
    return hash.digest("hex")
}

const nanoid = customAlphabet(
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    8
)

export function generateShortCode() {
  return nanoid();
}