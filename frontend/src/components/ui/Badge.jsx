// Class names are written out in full (not built from strings) so that
// Tailwind can see them and generate the CSS.
const STYLES = {
  green: {
    badge: "bg-rag-green-50 text-rag-green-700 ring-rag-green-600/25",
    dot: "bg-rag-green-600",
  },
  amber: {
    badge: "bg-rag-amber-50 text-rag-amber-700 ring-rag-amber-600/25",
    dot: "bg-rag-amber-600",
  },
  red: {
    badge: "bg-rag-red-50 text-rag-red-700 ring-rag-red-600/25",
    dot: "bg-rag-red-600",
  },
  neutral: {
    badge: "bg-gray-100 text-gray-700 ring-gray-300",
    dot: "bg-gray-400",
  },
  primary: {
    badge: "bg-primary-50 text-primary-700 ring-primary-200",
    dot: "bg-primary-500",
  },
};

export const STATUS_LABELS = {
  green: "On track",
  amber: "Watch",
  red: "Off track",
};

const SIZES = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export default function Badge({
  status = "neutral",
  label,
  size = "sm",
  dot = true,
  className = "",
  children,
}) {
  const style = STYLES[status] ?? STYLES.neutral;
  const text = children ?? label ?? STATUS_LABELS[status];

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset",
        SIZES[size] ?? SIZES.sm,
        style.badge,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`}
        />
      )}
      {text}
    </span>
  );
}
