import z from "zod";

export const signUpSchema = z.object({
    name:z.string().min(3),
    email:z.email(),
    password:z.string().min(6)
})

export const loginSchema = signUpSchema.omit({
    name:true
})
