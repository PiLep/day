import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Session } from "next-auth";

type AuthedSession = Session & { user: NonNullable<Session["user"]> };

/**
 * Session garantie, sinon retour à la landing.
 *
 * Les pages et le layout d'un segment sont rendus en parallèle : le layout ne
 * peut pas protéger la page à lui seul, chaque page doit donc vérifier la
 * session elle-même — sans quoi elle lève avant que la redirection n'aboutisse.
 */
export async function requireSession(): Promise<AuthedSession> {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  return session as AuthedSession;
}

/** Identifiant de l'utilisateur connecté, sinon retour à la landing. */
export async function requireUserId(): Promise<string> {
  const session = await requireSession();
  return session.user.id;
}
