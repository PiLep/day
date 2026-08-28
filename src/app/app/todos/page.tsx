import { redirect } from "next/navigation";

/** Tâches fusionnées dans Aujourd'hui — plus d'onglet dédié. */
export default async function TodosRedirect({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: isNew } = await searchParams;
  redirect(isNew === "1" ? "/app?new=1" : "/app");
}
