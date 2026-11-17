import Badge from "./ui/Badge";
import Button from "./ui/Button";

const TRUST_ITEMS = ["No sign-up", "Sample data included", "Exports a PDF"];

// Each series is weekly attainment (% of target); the target line is 100.
const PREVIEW_ROWS = [
  {
    label: "Leads",
    value: "1,540",
    status: "green",
    badge: "On track 112%",
    values: [92, 96, 101, 104, 108, 112],
  },
  {
    label: "Conversion rate",
    value: "5.8%",
    status: "amber",
    badge: "Watch 96%",
    values: [104, 102, 100, 99, 98, 96],
  },
  {
    label: "Revenue",
    value: "Rs 4.2 lakh",
    status: "red",
    badge: "Off track 66%",
    values: [96, 90, 84, 78, 72, 66],
  },
];

const PREVIEW_DESCRIPTION =
  "Illustration of a KPilot dashboard for an example brand: leads are on track, " +
  "conversion rate needs watching, revenue is off track, and an AI review " +
  "suggests a follow-up for the sales lead.";

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-primary-600"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6 4.5v11a1 1 0 001.5.86l9-5.5a1 1 0 000-1.72l-9-5.5A1 1 0 006 4.5z" />
    </svg>
  );
}

function Sparkline({ values, target = 100 }) {
  const width = 96;
  const height = 32;
  const pad = 3;
  const all = [...values, target];
  const min = Math.min(...all);
  const span = Math.max(...all) - min || 1;
  const y = (v) => pad + (1 - (v - min) / span) * (height - pad * 2);
  const step = (width - pad * 2) / (values.length - 1);
  const points = values
    .map((v, i) => `${(pad + i * step).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");
  const lastX = pad + (values.length - 1) * step;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-8 w-24"
      aria-hidden="true"
    >
      <line
        x1={pad}
        x2={width - pad}
        y1={y(target)}
        y2={y(target)}
        stroke="#9ca3af"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <polyline
        points={points}
        fill="none"
        stroke="#4f46e5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={lastX}
        cy={y(values[values.length - 1])}
        r="2.5"
        fill="#4f46e5"
      />
    </svg>
  );
}

function ProductPreview() {
  return (
    <div className="relative isolate">
      <div
        aria-hidden="true"
        className="absolute -inset-6 -z-10 rounded-full bg-primary-200/40 blur-3xl"
      />
      <div
        role="img"
        aria-label={PREVIEW_DESCRIPTION}
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card"
      >
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              Example brand
            </p>
            <p className="text-xs text-gray-500">Week of 9 Nov</p>
          </div>
          <Badge status="neutral" label="Illustration" dot={false} />
        </div>

        <div className="divide-y divide-gray-100">
          {PREVIEW_ROWS.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{row.label}</p>
                <p className="font-display text-lg font-bold text-gray-900">
                  {row.value}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge status={row.status} label={row.badge} />
                <Sparkline values={row.values} />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            AI review
          </p>
          <p className="text-sm text-gray-800">
            Revenue is the main risk this week at 66% of target, and it has
            fallen for six weeks in a row.
          </p>
          <p className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <Badge status="primary" label="Follow-up" dot={false} />
            <span>Investigate the revenue drop · Sales lead · Due 18 Nov</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Hero({ onTryDemo, onUpload, demoLoading = false }) {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-200">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-primary-500"
            />
            KPilot · The AI copilot for your weekly KPIs
          </p>

          <h1
            id="hero-title"
            className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl"
          >
            Turn weekly KPIs into a{" "}
            <span className="text-primary-600">review pack</span> in minutes.
          </h1>

          <p className="mt-5 max-w-xl text-lg text-gray-600">
            Upload a CSV of weekly numbers. KPilot shows every brand against
            target in red, amber and green, then uses Gemini to write the
            headline, the risks and follow-ups with an owner and a deadline,
            ready to export as a PDF.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              onClick={onTryDemo}
              loading={demoLoading}
              leftIcon={<PlayIcon />}
            >
              {demoLoading ? "Loading demo..." : "Try the live demo"}
            </Button>
            <Button
              variant="secondary"
              onClick={onUpload}
              disabled={demoLoading}
            >
              Upload your CSV
            </Button>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
            {TRUST_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckIcon />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <ProductPreview />
      </div>
    </section>
  );
}
