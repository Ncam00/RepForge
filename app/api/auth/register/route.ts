import { hash } from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { z } from "zod"
import { rateLimit, AUTH_RATE_LIMIT } from "@/lib/rate-limit"

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
})

export async function POST(req: NextRequest) {
  // Rate limit: 10 registration attempts per 15 minutes per IP
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
  const rl = rateLimit(`register:${ip}`, AUTH_RATE_LIMIT)
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    )
  }
  try {
    const body = await req.json()
    const { email, name, password } = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    })

    return NextResponse.json(
      { 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name 
        } 
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
