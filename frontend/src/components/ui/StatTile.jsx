import Badge from "./Badge";

function describeChange(change) {
  const rounded = Math.round(change * 10) / 10;
  const abs = Math.abs(rounded).toFixed(1);
  if (rounded > 0) return { arrow: "▲", text: `${abs}%`, spoken: `up ${abs}%` };
  if (rounded < 0)
    return { arrow: "▼", text: `${abs}%`, spoken: `down ${abs}%` };
  return { arrow: "▬", text: "0.0%", spoken: "unchanged" };
}

export default function StatTile({
  label,
  value,
  target,
  change,
  status,
  statusLabel,
  className = "",
}) {
  const hasChange = typeof change === "number" && Number.isFinite(change);
  const delta = hasChange ? describeChange(change) : null;

  return (
    <div
      className={["rounded-lg border border-gray-200 bg-white p-4", className]
        .filter(Boolean)
        .join(" ")}
    >
      <dl>
        <div className="flex items-start justify-between gap-2">
          <dt className="text-sm font-medium text-gray-500">{label}</dt>
          {status && <Badge status={status} label={statusLabel} />}
        </div>

        <dd className="mt-2 break-words font-display text-2xl font-bold tabular-nums text-gray-900">
          {value}
        </dd>

        {target && (
          <dd className="mt-0.5 text-sm tabular-nums text-gray-500">
            Target {target}
          </dd>
        )}

        <dd className="mt-2 text-xs text-gray-500">
          {delta ? (
            <>
              <span aria-hidden="true" className="tabular-nums">
                {delta.arrow} {delta.text}
              </span>
              <span className="sr-only">{delta.spoken}</span> vs last week
            </>
          ) : (
            "No previous week"
          )}
        </dd>
      </dl>
    </div>
  );
}
