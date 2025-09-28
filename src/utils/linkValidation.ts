import z from "zod"

export const linkSchema = z.object({
    linkUrl:z.string().min(6)
})