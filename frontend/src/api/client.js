// Base URL of the backend. Set VITE_API_BASE_URL in frontend/.env
// (or in the hosting dashboard when deployed). Defaults to local dev.
const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

export const API_BASE_URL = BASE_URL;

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function detailToMessage(detail) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    // FastAPI validation errors (422) arrive as a list of {msg, loc, ...}.
    return detail
      .map((d) => d?.msg || "Invalid value")
      .slice(0, 3)
      .join("; ");
  }
  return "";
}

async function errorFromResponse(response) {
  let message = "";
  try {
    const data = await response.json();
    message = detailToMessage(data?.detail);
  } catch {
    // The body was not JSON; fall through to the generic message.
  }
  if (!message) message = `Request failed (${response.status}).`;
  return new ApiError(message, response.status);
}

async function request(
  path,
  { method = "GET", body, json, timeoutMs = 30000, as = "json" } = {},
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const options = { method, signal: controller.signal };
  if (json !== undefined) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(json);
  } else if (body !== undefined) {
    options.body = body;
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    if (!response.ok) throw await errorFromResponse(response);
    if (as === "blob") {
      return { blob: await response.blob(), headers: response.headers };
    }
    return await response.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err?.name === "AbortError") {
      throw new ApiError("The request took too long. Please try again.");
    }
    if (err instanceof TypeError) {
      throw new ApiError(
        `Cannot reach the server at ${BASE_URL}. Is the backend running?`,
      );
    }
    throw new ApiError("The server sent an unexpected response.");
  } finally {
    clearTimeout(timer);
  }
}

/** POST /upload: validate a CSV file and return its parsed rows. */
export function uploadCsv(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/upload", { method: "POST", body: form });
}

/** POST /summary: latest-week summary with RAG status, from the parsed rows. */
export function getSummary(rows) {
  return request("/summary", { method: "POST", json: { rows } });
}

/** POST /review: Gemini review. Pass the object that getSummary() returned. */
export function getReview(summary) {
  return request("/review", {
    method: "POST",
    json: summary,
    timeoutMs: 150000,
  });
}

/** POST /export/pdf: returns { blob, filename }. */
export async function exportPdf(summary, review) {
  const { blob, headers } = await request("/export/pdf", {
    method: "POST",
    json: { summary, review },
    as: "blob",
    timeoutMs: 60000,
  });
  const match = /filename="?([^";]+)"?/i.exec(
    headers.get("Content-Disposition") || "",
  );
  return { blob, filename: match ? match[1] : "weekly-review.pdf" };
}

/** Save a blob as a file download in the browser. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
