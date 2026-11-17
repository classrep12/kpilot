import { useEffect, useState } from "react";
import { getSummary, uploadCsv } from "../api/client";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card from "./ui/Card";

const MAX_BYTES = 2 * 1024 * 1024; // same limit as the backend
const SAMPLE_URL = `${import.meta.env.BASE_URL}sample_kpis.csv`;

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function Spinner({ className = "h-4 w-4" }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      className="h-8 w-8 text-gray-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 16V4m0 0L8 8m4-4 4 4" />
      <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    </svg>
  );
}

export default function UploadPanel({ onLoaded, demoToken = 0, onBusyChange }) {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [source, setSource] = useState(null); // "file" | "sample"
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(null);

  const loading = status === "loading";

  // Tell the parent when work starts and stops.
  useEffect(() => {
    onBusyChange?.(loading);
  }, [loading]);

  // Load the sample when the parent asks for the demo (the token goes up by one).
  useEffect(() => {
    if (demoToken > 0) loadSample();
  }, [demoToken]);

  async function processFile(file, from) {
    setError("");

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setStatus("error");
      setError("Please choose a .csv file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus("error");
      setError("That file is too large. The limit is 2 MB.");
      return;
    }

    setStatus("loading");
    setSource(from);
    try {
      const upload = await uploadCsv(file);
      const summary = await getSummary(upload.rows);
      setLoaded({
        fileName: file.name,
        rows: upload.rows.length,
        brands: upload.brands.length,
        weeks: upload.weeks.length,
        latestWeek: upload.latest_week,
      });
      setStatus("success");
      onLoaded?.({ fileName: file.name, source: from, upload, summary });
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Something went wrong. Please try again.");
    }
  }

  async function loadSample() {
    if (loading) return;
    setError("");
    setStatus("loading");
    setSource("sample");
    let file;
    try {
      const response = await fetch(SAMPLE_URL);
      const type = response.headers.get("content-type") || "";
      // A missing file can come back as the app's HTML page with status 200.
      if (!response.ok || type.includes("text/html"))
        throw new Error("missing");
      const blob = await response.blob();
      file = new File([blob], "sample_kpis.csv", { type: "text/csv" });
    } catch {
      setStatus("error");
      setError(
        "Could not load the sample data. Please try again or upload your own CSV.",
      );
      return;
    }
    await processFile(file, "sample");
  }

  function handleChange(event) {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets the same file be chosen again
    if (file && !loading) processFile(file, "file");
  }

  function handleDragOver(event) {
    event.preventDefault();
    if (loading) return;
    event.dataTransfer.dropEffect = "copy";
    setDragging(true);
  }

  function handleDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    if (loading) return;
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file, "file");
  }

  return (
    <Card
      title="Upload weekly KPIs"
      description="A CSV with the columns week_start, brand, metric, actual and target."
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={loadSample}
          loading={loading && source === "sample"}
          disabled={loading}
        >
          Load sample data
        </Button>
      }
    >
      <label
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          "focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2",
          dragging
            ? "border-primary-500 bg-primary-50"
            : "border-gray-300 bg-white hover:border-primary-400 hover:bg-gray-50",
          loading ? "cursor-wait opacity-70" : "cursor-pointer",
        ].join(" ")}
      >
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          disabled={loading}
          onChange={handleChange}
        />
        {loading ? (
          <Spinner className="h-8 w-8 text-primary-600" />
        ) : (
          <UploadIcon />
        )}
        <span className="text-sm font-medium text-gray-900">
          {loading
            ? "Reading and checking your file..."
            : dragging
              ? "Drop the CSV to upload it"
              : "Drag and drop a CSV here, or click to browse"}
        </span>
        <span className="text-xs text-gray-500">CSV only, up to 2 MB</span>
      </label>

      <div aria-live="polite">
        {status === "success" && loaded && (
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-700">
            <Badge status="primary" label="Loaded" />
            <span>
              {loaded.fileName} · {plural(loaded.rows, "row")} ·{" "}
              {plural(loaded.brands, "brand")} · {plural(loaded.weeks, "week")}{" "}
              · latest week {loaded.latestWeek}
            </span>
          </p>
        )}
      </div>

      {status === "error" && (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-rag-red-600/25 bg-rag-red-50 px-3 py-2 text-sm text-rag-red-700"
        >
          {error}
        </div>
      )}
    </Card>
  );
}
