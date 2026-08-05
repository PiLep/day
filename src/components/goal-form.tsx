import Link from "next/link";
import { createGoal, deleteGoal, updateGoal } from "@/lib/actions";
import { CalendarIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { GOAL_COLORS, DEFAULT_GOAL_COLOR } from "@/lib/goal-colors";
import { toDateString } from "@/lib/dates";

export type GoalFormValues = {
  id: string;
  title: string;
  description: string | null;
  color: string;
  targetDate: Date | null;
};

const FIELD =
  "w-full rounded-md border border-border bg-surface px-3.5 text-ink outline-none transition-shadow placeholder:text-ink-3 focus:border-accent focus:ring-focus";

/**
 * Création / édition d'un objectif.
 *
 * Un seul formulaire, deux présentations : feuille basse sur mobile, carte en
 * ligne sur desktop (§03 · écran 3). L'ouverture passe par l'URL (`?new=1`,
 * `?edit=1`), donc rien à hydrater côté client.
 */
export function GoalForm({
  goal,
  cancelHref,
}: {
  goal?: GoalFormValues;
  cancelHref: string;
}) {
  const editing = goal !== undefined;
  const action = editing ? updateGoal.bind(null, goal.id) : createGoal;
  const heading = editing ? "Modifier l'objectif" : "Nouvel objectif";
  const submitLabel = editing ? "Enregistrer" : "Créer l'objectif";
  const selectedColor = goal?.color ?? DEFAULT_GOAL_COLOR;

  return (
    <div className="fixed inset-0 z-30 md:static md:z-auto">
      {/* Voile — mobile seulement ; un tap en dehors referme. */}
      <Link
        href={cancelHref}
        aria-label="Fermer"
        className="absolute inset-0 bg-[rgb(24_24_27/40%)] md:hidden"
      />

      <div className="absolute inset-x-0 bottom-0 max-h-dvh overflow-y-auto rounded-t-[24px] bg-surface px-5 pt-3 pb-8 shadow-[0_-8px_32px_rgb(24_24_27/18%)] md:static md:max-h-none md:overflow-visible md:rounded-lg md:border md:border-accent md:p-5 md:shadow-[0_0_0_3px_rgb(79_70_229/10%)]">
        <div className="mx-auto mb-4 h-[5px] w-[38px] rounded-full bg-border md:hidden" />

        <div className="flex items-center justify-between md:hidden">
          <span className="text-[17px] font-semibold">{heading}</span>
          <Link href={cancelHref} className="text-[13.5px] font-semibold text-ink-2">
            Annuler
          </Link>
        </div>

        <form
          action={action}
          className="mt-[18px] flex flex-col gap-3 md:mt-0 md:grid md:grid-cols-[1fr_300px] md:gap-5"
        >
          <div className="flex flex-col gap-3 md:gap-2.5">
            <input
              name="title"
              required
              maxLength={200}
              autoFocus
              defaultValue={goal?.title ?? ""}
              placeholder="Titre de l'objectif"
              aria-label="Titre de l'objectif"
              className={`${FIELD} h-[46px] text-[14.5px] md:h-[42px] md:text-[14px]`}
            />
            <textarea
              name="description"
              maxLength={2000}
              defaultValue={goal?.description ?? ""}
              placeholder="Description (optionnel)"
              aria-label="Description de l'objectif"
              className={`${FIELD} min-h-[68px] flex-1 resize-none py-3 text-[14px] md:min-h-[56px] md:py-2.5 md:text-[13.5px]`}
            />
          </div>

          <div className="flex flex-col gap-3 md:gap-2.5">
            <label
              className={`${FIELD} flex h-[46px] items-center justify-between gap-2 text-[14px] focus-within:border-accent focus-within:ring-focus md:h-[42px] md:text-[13.5px]`}
            >
              <span className="flex shrink-0 items-center gap-2">
                <CalendarIcon className="size-[15px] text-ink-2 md:size-[14px]" />
                Échéance
              </span>
              <input
                type="date"
                name="targetDate"
                defaultValue={goal?.targetDate ? toDateString(goal.targetDate) : ""}
                aria-label="Échéance"
                className="tnum min-w-0 bg-transparent text-right text-ink-2 outline-none"
              />
            </label>

            <fieldset>
              <legend className="mb-2.5 text-[12px] font-semibold text-ink-2 md:sr-only">
                Couleur
              </legend>
              <div className="flex gap-3.5 py-1 md:gap-2.5">
                {GOAL_COLORS.map((c) => (
                  <label key={c.name} className="cursor-pointer">
                    <input
                      type="radio"
                      name="color"
                      value={c.base}
                      defaultChecked={c.base === selectedColor}
                      className="peer sr-only"
                    />
                    <span
                      title={c.label}
                      style={{ backgroundColor: c.base, "--dot": c.base } as React.CSSProperties}
                      className="block size-[34px] rounded-full transition-shadow peer-checked:shadow-[0_0_0_2px_var(--color-surface),0_0_0_4.5px_var(--dot)] peer-focus-visible:ring-focus md:size-[26px] md:peer-checked:shadow-[0_0_0_2px_var(--color-surface),0_0_0_4px_var(--dot)]"
                    />
                    <span className="sr-only">{c.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-2 flex gap-2 md:mt-auto md:mb-0">
              <Link
                href={cancelHref}
                className="hidden h-[38px] items-center rounded-md px-3.5 text-[13.5px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 md:inline-flex"
              >
                Annuler
              </Link>
              <SubmitButton
                label={submitLabel}
                pendingLabel={editing ? "Enregistrement…" : "Création…"}
                className="flex h-12 flex-1 items-center justify-center rounded-md bg-accent text-[15px] font-semibold text-white shadow-xs transition-colors hover:bg-accent-hover disabled:opacity-60 md:h-[38px] md:text-[13.5px]"
              />
            </div>
          </div>
        </form>

        {editing && (
          <form action={deleteGoal.bind(null, goal.id)} className="mt-3 md:mt-4">
            <SubmitButton
              label="Supprimer l'objectif"
              pendingLabel="Suppression…"
              className="h-10 rounded-md px-3 text-[13px] font-semibold text-ink-2 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60 md:h-9"
            />
          </form>
        )}
      </div>
    </div>
  );
}
