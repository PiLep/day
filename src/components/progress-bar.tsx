export function ProgressBar({
  done,
  total,
  color,
}: {
  done: number;
  total: number;
  color: string;
}) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="space-y-1">
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-zinc-500">
        {done}/{total} tâches · {pct}%
      </p>
    </div>
  );
}
