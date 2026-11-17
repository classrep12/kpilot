function Icon({ children }) {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const FEATURES = [
  {
    title: "Status you can read at a glance",
    text: "Every metric is rated against its target: on track at 100% or more, watch from 80%, off track below that. Each badge also carries a text label, so colour is never the only signal.",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 12.5l2.5 2.5 4.5-5" />
      </Icon>
    ),
  },
  {
    title: "Trends, not just snapshots",
    text: "See the change since last week on every tile, plus a chart of actual against target for any brand and metric, with the exact numbers one hover away.",
    icon: (
      <Icon>
        <path d="M3 17l5-5 4 4 8-9" />
        <path d="M15 7h5v5" />
      </Icon>
    ),
  },
  {
    title: "A review that names owners and dates",
    text: "Gemini turns the numbers into a headline, ranked risks and follow-ups, each with an owner role such as Sales lead and a deadline. Only computed summary numbers are sent to Gemini, never your raw rows. You edit everything before it goes out.",
    icon: (
      <Icon>
        <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" />
        <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
      </Icon>
    ),
  },
  {
    title: "A PDF you can actually send",
    text: "One click exports a clean review pack: an overview page with the headline and status counts, then one page per brand with its KPI table, risks and follow-up table.",
    icon: (
      <Icon>
        <path d="M7 3h7l5 5v13H7V3z" />
        <path d="M14 3v5h5" />
        <path d="M12 12v5m0 0l-2-2m2 2l2-2" />
      </Icon>
    ),
  },
];

const STACK = [
  "FastAPI",
  "Pandas",
  "Pydantic",
  "Gemini",
  "React",
  "Tailwind CSS",
  "Recharts",
  "ReportLab",
];

export default function Features() {
  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="border-t border-gray-200 bg-gray-50"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">
          Features
        </p>
        <h2 id="features-title" className="mt-2 max-w-2xl text-3xl sm:text-4xl">
          Everything the Monday review needs
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-card"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-lg">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{feature.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="shrink-0 text-sm font-medium text-gray-500">
            Built with
          </p>
          <ul role="list" className="flex list-none flex-wrap gap-2 p-0">
            {STACK.map((name) => (
              <li
                key={name}
                className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
