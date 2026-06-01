import { getServerSession } from "next-auth";
import { authOptions } from "../app/api/auth/[...nextauth]/route";

export async function requireUser() {
  const session = await getServerSession(authOptions);
 
  if (!session?.user?.id) return null;
 
  return session.user;
}

export async function requireUserOrThrow() {
  const user = await requireUser();
  if (!user) {
    throw Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}