// Development mode auth helper to bypass authentication checks
import { auth } from "@/auth"
import prisma from "@/lib/db"

const DEV_USER_ID = "dev-user-id"
const DEV_USER_EMAIL = "dev@example.com"

export async function getDevSession() {
  try {
    const session = await auth()
    if (session?.user?.id) {
      return session
    }
  } catch {
    // Fall through to dev user
  }

  // Ensure dev user exists in database
  await prisma.user.upsert({
    where: { id: DEV_USER_ID },
    update: {},
    create: {
      id: DEV_USER_ID,
      email: DEV_USER_EMAIL,
      name: "Dev User",
      password: "dev-password-hash",
    },
  })

  // Return a dev user for testing
  return {
    user: {
      id: DEV_USER_ID,
      email: DEV_USER_EMAIL,
      name: "Dev User",
    },
  }
}

export function getDevUserId(): string {
  return DEV_USER_ID
}

export async function ensureDevUser() {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: DEV_USER_ID },
    })
    
    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: DEV_USER_ID,
          email: DEV_USER_EMAIL,
          name: "Dev User",
          password: "dev-password-hashed", // dummy password
        },
      })
    }
  } catch (error) {
    console.error("Error ensuring dev user:", error)
  }
}
