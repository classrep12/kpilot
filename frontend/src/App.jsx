import { Suspense, lazy, useEffect, useRef, useState } from "react";
import Features from "./components/Features";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import ReviewPanel from "./components/ReviewPanel";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import UploadPanel from "./components/UploadPanel";
import Badge from "./components/ui/Badge";

const Dashboard = lazy(() => import("./components/Dashboard"));

function scrollToElement(element) {
  if (!element) return;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  element.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
}

export default function App() {
  const [data, setData] = useState(null);
  const [loadId, setLoadId] = useState(0);
  const [demoToken, setDemoToken] = useState(0);
  const [demoRunning, setDemoRunning] = useState(false);
  const resultsRef = useRef(null);

  // After any successful load, bring the results into view.
  useEffect(() => {
    if (loadId > 0) scrollToElement(resultsRef.current);
  }, [loadId]);

  function handleLoaded(next) {
    setData(next);
    setLoadId((n) => n + 1);
  }

  function handleBusyChange(busy) {
    if (!busy) setDemoRunning(false);
  }

  function startDemo() {
    if (demoRunning) return;
    setDemoRunning(true);
    scrollToElement(document.getElementById("try"));
    setDemoToken((n) => n + 1);
  }

  return (
    <div className="min-h-screen">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-700 focus:shadow-card"
      >
        Skip to main content
      </a>

      <SiteHeader onTryDemo={startDemo} demoLoading={demoRunning} />

      <main id="content">
        <Hero
          onTryDemo={startDemo}
          onUpload={() => scrollToElement(document.getElementById("try"))}
          demoLoading={demoRunning}
        />

        <div
          id="try"
          className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6"
        >
          <UploadPanel
            onLoaded={handleLoaded}
            demoToken={demoToken}
            onBusyChange={handleBusyChange}
          />

          {data && (
            <div ref={resultsRef} className="space-y-6">
              {data.source === "sample" && (
                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <Badge status="neutral" label="Sample data (synthetic)" />
                  These numbers are made up for demonstration.
                </p>
              )}
              <Suspense
                fallback={
                  <div
                    role="status"
                    className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500"
                  >
                    Loading dashboard...
                  </div>
                }
              >
                <Dashboard upload={data.upload} summary={data.summary} />
              </Suspense>
              <ReviewPanel key={loadId} summary={data.summary} />
            </div>
          )}
        </div>

        <HowItWorks />
        <Features />
      </main>

      <SiteFooter />
    </div>
  );
}
