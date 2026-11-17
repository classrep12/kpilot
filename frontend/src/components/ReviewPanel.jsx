import { useState } from "react";
import { downloadBlob, exportPdf, getReview } from "../api/client";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card from "./ui/Card";

const INPUT =
  "w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900";

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-primary-600"
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

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function findProblem(followUps) {
  const index = followUps.findIndex(
    (f) => !f.task.trim() || !f.owner.trim() || !f.deadline,
  );
  return index === -1
    ? ""
    : `Follow-up ${index + 1} needs a task, an owner and a deadline before you can export.`;
}

function Alert({ children }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-rag-red-600/25 bg-rag-red-50 px-3 py-2 text-sm text-rag-red-700"
    >
      {children}
    </div>
  );
}

export default function ReviewPanel({ summary }) {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [edited, setEdited] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [exported, setExported] = useState("");

  async function generate() {
    if (loading) return;
    if (
      edited &&
      !window.confirm(
        "Generating a new review will replace your edits. Continue?",
      )
    ) {
      return;
    }
    setLoading(true);
    setError("");
    setExportError("");
    setExported("");
    try {
      const result = await getReview(summary);
      setReview(result);
      setEdited(false);
    } catch (err) {
      // Any review already on screen is kept.
      setError(
        err?.message || "Could not generate the review. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateFollowUp(index, field, value) {
    setReview((prev) => ({
      ...prev,
      follow_ups: prev.follow_ups.map((f, i) =>
        i === index ? { ...f, [field]: value } : f,
      ),
    }));
    setEdited(true);
    setExportError("");
    setExported("");
  }

  async function handleExport() {
    const problem = findProblem(review.follow_ups);
    if (problem) {
      setExportError(problem);
      setExported("");
      return;
    }
    setExporting(true);
    setExportError("");
    setExported("");
    try {
      const payload = {
        ...review,
        follow_ups: review.follow_ups.map((f) => ({
          ...f,
          task: f.task.trim(),
          owner: f.owner.trim(),
        })),
      };
      const { blob, filename } = await exportPdf(summary, payload);
      downloadBlob(blob, filename);
      setExported(filename);
    } catch (err) {
      setExportError(
        err?.message || "Could not export the PDF. Please try again.",
      );
    } finally {
      setExporting(false);
    }
  }

  const showEmpty = !review && !loading && !error;

  return (
    <Card
      title="AI review"
      description="Gemini writes a headline, risks and follow-ups from the numbers above. Edit the follow-ups, then export the review pack as a PDF."
      actions={
        <>
          {review && (
            <Button
              variant="secondary"
              onClick={handleExport}
              loading={exporting}
              disabled={loading}
            >
              Export PDF
            </Button>
          )}
          <Button onClick={generate} loading={loading}>
            {loading
              ? "Generating..."
              : review
                ? "Regenerate review"
                : "Generate review"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {error && <Alert>{error}</Alert>}
        {exportError && <Alert>{exportError}</Alert>}

        <div aria-live="polite">
          {loading && (
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-6 text-sm text-gray-600">
              <Spinner />
              <span>
                Gemini is writing the review. This usually takes a few seconds,
                and up to a minute if it is busy.
              </span>
            </div>
          )}
          {exported && !loading && (
            <p className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
              <Badge status="primary" label="PDF downloaded" />
              <span>
                {exported} was sent to your browser's downloads. Edit the
                follow-ups and export again to update it.
              </span>
            </p>
          )}
        </div>

        {showEmpty && (
          <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center">
            <p className="text-sm font-medium text-gray-900">No review yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Choose Generate review to get a headline, a summary for each
              brand, the main risks and suggested follow-ups.
            </p>
          </div>
        )}

        {review && !loading && (
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-sm text-gray-500">Headline</h3>
              <p className="rounded-lg bg-primary-50 px-4 py-3 font-display text-base font-semibold text-primary-900">
                {review.headline}
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-sm text-gray-500">Brand summaries</h3>
              {review.brand_summaries.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No brand summaries were written.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {review.brand_summaries.map((b) => (
                    <div
                      key={b.brand}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <h4 className="text-sm">{b.brand}</h4>
                      <p className="mt-1 text-sm text-gray-700">{b.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-sm text-gray-500">Risks</h3>
              {review.risks.length === 0 ? (
                <p className="text-sm text-gray-500">No risks were listed.</p>
              ) : (
                <ul className="space-y-2">
                  {review.risks.map((r, i) => (
                    <li
                      key={i}
                      className="flex flex-wrap items-start gap-2 text-sm"
                    >
                      <Badge status="neutral" label={r.brand} dot={false} />
                      <span className="min-w-0 flex-1 text-gray-700">
                        {r.description}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-1 text-sm text-gray-500">Follow-ups</h3>
              <p className="mb-2 text-xs text-gray-500">
                Edit the task, owner or deadline. Your changes go into the PDF.
              </p>
              {review.follow_ups.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No follow-ups were suggested.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full min-w-[46rem] text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th scope="col" className="px-3 py-2 font-medium">
                          Brand
                        </th>
                        <th scope="col" className="px-3 py-2 font-medium">
                          Task
                        </th>
                        <th scope="col" className="px-3 py-2 font-medium">
                          Owner
                        </th>
                        <th scope="col" className="px-3 py-2 font-medium">
                          Deadline
                        </th>
                        <th scope="col" className="px-3 py-2 font-medium">
                          Priority
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {review.follow_ups.map((f, i) => (
                        <tr key={i} className="align-top">
                          <td className="px-3 py-2 font-medium text-gray-900">
                            {f.brand}
                          </td>
                          <td className="px-3 py-2">
                            <textarea
                              rows={2}
                              value={f.task}
                              onChange={(e) =>
                                updateFollowUp(i, "task", e.target.value)
                              }
                              aria-label={`Task for ${f.brand} follow-up ${i + 1}`}
                              className={`${INPUT} min-w-[14rem] resize-y`}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={f.owner}
                              onChange={(e) =>
                                updateFollowUp(i, "owner", e.target.value)
                              }
                              aria-label={`Owner for ${f.brand} follow-up ${i + 1}`}
                              className={`${INPUT} min-w-[9rem]`}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="date"
                              value={f.deadline}
                              onChange={(e) =>
                                updateFollowUp(i, "deadline", e.target.value)
                              }
                              aria-label={`Deadline for ${f.brand} follow-up ${i + 1}`}
                              className={INPUT}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Badge
                              status={
                                f.priority === "high" ? "primary" : "neutral"
                              }
                              label={capitalize(f.priority)}
                              dot={false}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </Card>
  );
}
