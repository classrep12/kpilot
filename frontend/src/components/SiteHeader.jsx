import Button from "./ui/Button";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#try", label: "Try it" },
];

function LogoMark() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#4f46e5" />
      <path
        d="M9 17l5 5 9-11"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SiteHeader({ onTryDemo, demoLoading = false }) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a
          href="#"
          aria-label="KPilot, back to top"
          className="flex items-center gap-2.5 rounded-md"
        >
          <LogoMark />
          <span className="font-display text-lg font-bold tracking-tight text-gray-900">
            KPilot
          </span>
          <span className="hidden border-l border-gray-200 pl-2.5 text-sm text-gray-500 lg:inline">
            The AI copilot for your weekly KPIs
          </span>
        </a>

        <div className="flex items-center gap-2 sm:gap-6">
          <nav aria-label="Main" className="hidden md:block">
            <ul
              role="list"
              className="flex list-none items-center gap-6 p-0 text-sm font-medium text-gray-600"
            >
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="rounded-md py-1 hover:text-gray-900"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <Button size="sm" onClick={onTryDemo} loading={demoLoading}>
            <span className="sm:hidden">Live demo</span>
            <span className="hidden sm:inline">Try the live demo</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
