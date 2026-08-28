"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createGoal, deleteGoal, updateGoal } from "@/lib/actions";
import { CalendarIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
 * Un seul formulaire, deux présentations : feuille basse (dialog) sur mobile,
 * carte en ligne sur desktop. L'ouverture passe par l'URL (`?new=1`, `?edit=1`).
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

  const router = useRouter();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [isMobileSheet, setIsMobileSheet] = useState(false);

  const close = useCallback(() => {
    router.push(cancelHref);
  }, [router, cancelHref]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileSheet(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Focus trap + Escape sur la feuille mobile.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !isMobileSheet) {
      titleRef.current?.focus();
      return;
    }

    titleRef.current?.focus();

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [close, isMobileSheet]);

  return (
    <div
      className="fixed inset-0 z-30 md:static md:z-auto"
      role={isMobileSheet ? "dialog" : undefined}
      aria-modal={isMobileSheet ? true : undefined}
      aria-labelledby={isMobileSheet ? titleId : undefined}
    >
      {/* Voile — mobile seulement ; un tap en dehors referme. */}
      <button
        type="button"
        aria-label="Fermer"
        onClick={close}
        className="absolute inset-0 bg-[rgb(24_24_27/40%)] md:hidden"
      />

      <div
        ref={panelRef}
        className="absolute inset-x-0 bottom-0 max-h-dvh overflow-y-auto rounded-t-[24px] bg-surface px-5 pt-3 pb-[max(2rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgb(24_24_27/18%)] md:static md:max-h-none md:overflow-visible md:rounded-lg md:border md:border-accent md:p-5 md:pb-5 md:shadow-[0_0_0_3px_rgb(79_70_229/10%)]"
      >
        <div className="mx-auto mb-4 h-[5px] w-[38px] rounded-full bg-border md:hidden" aria-hidden />

        <div className="flex items-center justify-between md:hidden">
          <h2 id={titleId} className="text-[17px] font-semibold">
            {heading}
          </h2>
          <button
            type="button"
            onClick={close}
            className="inline-flex min-h-11 items-center px-1 text-[13.5px] font-semibold text-ink-2"
          >
            Annuler
          </button>
        </div>
        <p className="mb-3 hidden text-[15px] font-semibold md:block" aria-hidden>
          {heading}
        </p>

        <form
          action={async (formData) => {
            const title = String(formData.get("title") ?? "").trim();
            if (!title) {
              setError("Saisissez un titre pour l'objectif.");
              titleRef.current?.focus();
              return;
            }
            setError(null);
            await action(formData);
          }}
          className="mt-[18px] flex flex-col gap-3 md:mt-0 md:grid md:grid-cols-[1fr_300px] md:gap-5"
          noValidate
        >
          <div className="flex flex-col gap-3 md:gap-2.5">
            <div>
              <label htmlFor="goal-title" className="mb-1.5 block text-[12px] font-semibold text-ink-2">
                Titre
              </label>
              <input
                ref={titleRef}
                id="goal-title"
                name="title"
                required
                maxLength={200}
                defaultValue={goal?.title ?? ""}
                placeholder="Ex. Lancer mon side project"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "goal-title-error" : undefined}
                className={`${FIELD} h-[46px] text-[14.5px] md:h-[42px] md:text-[14px]`}
              />
              {error && (
                <p id="goal-title-error" role="alert" className="mt-1.5 text-[12.5px] font-medium text-red-600">
                  {error}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="goal-description" className="mb-1.5 block text-[12px] font-semibold text-ink-2">
                Description <span className="font-medium text-ink-3">(optionnel)</span>
              </label>
              <textarea
                id="goal-description"
                name="description"
                maxLength={2000}
                defaultValue={goal?.description ?? ""}
                placeholder="Ce que « terminé » veut dire pour vous"
                className={`${FIELD} min-h-[68px] flex-1 resize-none py-3 text-[14px] md:min-h-[56px] md:py-2.5 md:text-[13.5px]`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:gap-2.5">
            <label
              className={`${FIELD} flex h-11 items-center justify-between gap-2 text-[14px] focus-within:border-accent focus-within:ring-focus md:h-[42px] md:text-[13.5px]`}
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
              <legend className="mb-2.5 text-[12px] font-semibold text-ink-2">
                Couleur
              </legend>
              <div className="flex flex-wrap gap-3 py-1 md:gap-2.5">
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
                      className="block size-11 rounded-full transition-shadow peer-checked:shadow-[0_0_0_2px_var(--color-surface),0_0_0_4.5px_var(--dot)] peer-focus-visible:ring-focus md:size-[26px] md:peer-checked:shadow-[0_0_0_2px_var(--color-surface),0_0_0_4px_var(--dot)]"
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
          <div className="mt-3 md:mt-4">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex h-11 items-center rounded-md px-3 text-[13px] font-semibold text-ink-2 transition-colors hover:bg-red-50 hover:text-red-700 md:h-9"
            >
              Supprimer l&apos;objectif
            </button>
            <ConfirmDialog
              open={confirmDelete}
              title="Supprimer l'objectif ?"
              description={`« ${goal.title} » sera supprimé. Les tâches liées resteront, sans objectif.`}
              confirmLabel="Supprimer l'objectif"
              pending={isDeleting}
              onCancel={() => setConfirmDelete(false)}
              onConfirm={() =>
                startDelete(async () => {
                  await deleteGoal(goal.id);
                })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
