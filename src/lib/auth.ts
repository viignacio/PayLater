import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function syncUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  // Check if profile exists
  const existingProfile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  });

  if (!existingProfile) {
    await db.insert(profiles).values({
      id: userId,
      name: `${user.firstName} ${user.lastName}`.trim() || user.username || "User",
      avatar: user.imageUrl,
    });
  }

  return userId;
}

export { auth, currentUser };
