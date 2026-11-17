import Badge from "./ui/Badge";

// Written out in full so Tailwind can see the classes. Draws the line that
// joins one step's circle to the next on wide screens.
const CONNECTOR =
  "md:after:absolute md:after:left-16 md:after:-right-6 md:after:top-6 md:after:h-px md:after:bg-gray-300";

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

const STEPS = [
  {
    title: "Upload your weekly numbers",
    text: "Drop in a CSV, or load the sample data. KPilot checks the columns, dates and numbers, and tells you the exact line if something is wrong.",
    icon: (
      <Icon>
        <path d="M12 16V4m0 0L8 8m4-4 4 4" />
        <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
      </Icon>
    ),
    extra: (
      <code className="mt-3 inline-block max-w-full break-words rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700">
        week_start, brand, metric, actual, target
      </code>
    ),
  },
  {
    title: "See every brand against target",
    text: "Each metric gets a red, amber or green status, the change since last week, and a trend chart of actual against target.",
    icon: (
      <Icon>
        <path d="M5 20v-9m7 9V5m7 15v-7" />
      </Icon>
    ),
    extra: (
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge status="green" label="On track 100%+" />
        <Badge status="amber" label="Watch 80-99%" />
        <Badge status="red" label="Off track under 80%" />
      </div>
    ),
  },
  {
    title: "Generate the review pack",
    text: "Gemini writes the headline, the risks and follow-ups with an owner role and a deadline. Edit anything, then export a PDF.",
    icon: (
      <Icon>
        <path d="M7 3h7l5 5v13H7V3z" />
        <path d="M14 3v5h5" />
        <path d="M10 14l2 2 4-4" />
      </Icon>
    ),
    extra: (
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge status="neutral" label="Headline" dot={false} />
        <Badge status="neutral" label="Risks" dot={false} />
        <Badge status="neutral" label="Follow-ups" dot={false} />
        <Badge status="primary" label="PDF" dot={false} />
      </div>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="border-t border-gray-200 bg-white"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">
          How it works
        </p>
        <h2 id="how-title" className="mt-2 max-w-2xl text-3xl sm:text-4xl">
          From a CSV to a review pack in three steps
        </h2>

        <ol
          role="list"
          className="mt-12 grid list-none gap-10 p-0 md:grid-cols-3 md:gap-8"
        >
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className={["relative", index < STEPS.length - 1 ? CONNECTOR : ""]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white shadow-card">
                {step.icon}
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary-700">
                Step {index + 1}
              </p>
              <h3 className="mt-1 text-lg">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{step.text}</p>
              {step.extra}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
