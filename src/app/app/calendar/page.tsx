import { redirect } from "next/navigation";

/** Calendrier = Google Calendar. Day se concentre sur Aujourd'hui. */
export default function CalendarRedirect() {
  redirect("/app");
}
