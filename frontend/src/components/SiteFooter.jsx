export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>KPilot · Sample data is synthetic and for demonstration only.</p>
        <p className="flex items-center gap-3">
          <a href="#" className="rounded-sm underline-offset-2 hover:underline">
            Back to top
          </a>
          <span aria-hidden="true">·</span>
          <span>Built by Harshita</span>
        </p>
      </div>
    </footer>
  );
}
