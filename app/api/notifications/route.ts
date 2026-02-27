import { NextRequest, NextResponse } from "next/server";
import { getDevSession } from "@/lib/dev-auth";
import prisma from "@/lib/db";
import { z } from "zod";

/**
 * GET /api/notifications
 *
 * Query params:
 *   unread  - if "true", return only unread notifications
 *   limit   - max results (default 20, max 100)
 *   cursor  - pagination cursor (notification id, for cursor-based paging)
 *
 * Returns:
 *   { notifications, unreadCount, hasMore, nextCursor }
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getDevSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limitParam = parseInt(searchParams.get("limit") || "20");
    const limit = Math.min(Math.max(1, limitParam), 100);
    const cursor = searchParams.get("cursor");

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId: session.user.id,
          ...(unreadOnly ? { isRead: false } : {}),
          ...(cursor ? { id: { lt: cursor } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1, // fetch one extra to detect hasMore
      }),
      prisma.notification.count({
        where: { userId: session.user.id, isRead: false },
      }),
    ]);

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({
      notifications: items.map((n) => ({
        ...n,
        data: n.data ? JSON.parse(n.data) : null,
      })),
      unreadCount,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 *
 * Body: { ids?: string[]; all?: boolean }
 *
 * if `all` is true: mark all user notifications as read
 * if `ids` provided: mark specific notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getDevSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const schema = z.union([
      z.object({ all: z.literal(true) }),
      z.object({ ids: z.array(z.string().min(1)).min(1) }),
    ]);

    let parsed;
    try {
      parsed = schema.parse(body);
    } catch {
      return NextResponse.json({ error: "Provide either { all: true } or { ids: string[] }" }, { status: 400 });
    }

    if ("all" in parsed) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ message: "All notifications marked as read" });
    } else {
      // Only mark notifications that belong to this user
      await prisma.notification.updateMany({
        where: {
          id: { in: parsed.ids },
          userId: session.user.id,
        },
        data: { isRead: true },
      });
      return NextResponse.json({ message: `${parsed.ids.length} notification(s) marked as read` });
    }
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications
 *
 * Body: { ids?: string[]; all?: boolean; readOnly?: boolean }
 *
 * Deletes notifications for the current user.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getDevSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { ids, all, readOnly } = body as {
      ids?: string[];
      all?: boolean;
      readOnly?: boolean;
    };

    if (all) {
      const result = await prisma.notification.deleteMany({
        where: {
          userId: session.user.id,
          ...(readOnly ? { isRead: true } : {}),
        },
      });
      return NextResponse.json({ deleted: result.count });
    }

    if (ids && Array.isArray(ids) && ids.length > 0) {
      const result = await prisma.notification.deleteMany({
        where: {
          id: { in: ids },
          userId: session.user.id, // security: only own notifications
        },
      });
      return NextResponse.json({ deleted: result.count });
    }

    return NextResponse.json(
      { error: "Provide { all: true } or { ids: string[] }" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 });
  }
}
