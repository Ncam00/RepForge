import { NextRequest, NextResponse } from "next/server";

/**
 * middleware.ts
 *
 * Runs at the Edge for every matching request.
 * Responsibilities:
 *  1. Add security HTTP headers to all API responses
 *  2. Block obviously malformed requests early
 *
 * Note: Per-endpoint rate limiting is handled inside individual route handlers
 * using lib/rate-limit.ts (Node.js runtime) since the Edge runtime doesn't
 * support in-process memory stores reliably.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only process API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ── Block requests with suspiciously large Content-Length early ──────────
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const bytes = parseInt(contentLength, 10);
    const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 MB
    if (!isNaN(bytes) && bytes > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }
  }

  const response = NextResponse.next();

  // ── Security headers ─────────────────────────────────────────────────────

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Disable framing (clickjacking protection)
  response.headers.set("X-Frame-Options", "DENY");

  // XSS protection (legacy browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Strict referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Remove server fingerprinting headers injected by Node/Next
  response.headers.delete("X-Powered-By");

  // CORS: Only allow same origin for API routes by default.
  // Healthkit sync endpoint needs to accept requests from the iOS app.
  const origin = request.headers.get("origin");
  const allowedOrigins = [
    process.env.NEXTAUTH_URL || "http://localhost:3000",
    // Add your production domain here when deploying
  ].filter(Boolean);

  if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV === "development")) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
  }

  // Handle pre-flight OPTIONS requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
