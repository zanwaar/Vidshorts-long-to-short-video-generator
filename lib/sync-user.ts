import { auth, currentUser } from "@clerk/nextjs/server";

import { users } from "@/db/schema";

export async function syncAuthenticatedUser(userIdFromRequest?: string | null) {
  const userId = userIdFromRequest ?? (await auth()).userId;

  if (!userId) {
    return null;
  }

  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return null;
    }

    const { db } = await import("@/db");

    const primaryEmail =
      clerkUser.primaryEmailAddress?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      null;

    await db
      .insert(users)
      .values({
        clerkUserId: clerkUser.id,
        email: primaryEmail,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        username: clerkUser.username,
        imageUrl: clerkUser.imageUrl,
        lastSeenAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.clerkUserId,
        set: {
          email: primaryEmail,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          username: clerkUser.username,
          imageUrl: clerkUser.imageUrl,
          lastSeenAt: new Date(),
          updatedAt: new Date(),
        },
      });

    return clerkUser;
  } catch (error) {
    console.error("Failed to sync authenticated user to database", error);
    return null;
  }
}
