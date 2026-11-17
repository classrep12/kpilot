import { useId, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { STATUS_LABELS } from "./ui/Badge";
import Card from "./ui/Card";
import StatTile from "./ui/StatTile";

// Recharts needs real colour values. These match the Tailwind palette:
// primary-600, gray-500 and gray-200. The chart is not a status, so no RAG colours.
const ACTUAL_COLOR = "#4f46e5";
const TARGET_COLOR = "#6b7280";
const GRID_COLOR = "#e5e7eb";

const NUMBER = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });
const COMPACT = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function isRate(metric) {
  const key = metric.toLowerCase();
  return key.includes("rate") || key.includes("conversion");
}

function metricLabel(metric) {
  const text = metric.replace(/_inr$/i, " (INR)").replace(/_/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function fmtInr(value) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${sign}Rs ${(abs / 1e7).toFixed(2)} crore`;
  if (abs >= 1e5) return `${sign}Rs ${(abs / 1e5).toFixed(1)} lakh`;
  return `${sign}Rs ${abs.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function fmtValue(metric, value) {
  if (metric.toLowerCase().endsWith("_inr")) return fmtInr(value);
  if (isRate(metric)) return `${value.toFixed(2)}%`;
  return NUMBER.format(value);
}

function fmtTick(metric, value) {
  return isRate(metric) ? `${value}%` : COMPACT.format(value);
}

// Parse as local midnight so the date never shifts with the time zone.
function fmtWeekShort(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function fmtWeekLong(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function describeCounts(items) {
  const n = { red: 0, amber: 0, green: 0 };
  for (const s of items) n[s.rag_status] += 1;
  return [
    n.red && `${n.red} off track`,
    n.amber && `${n.amber} watch`,
    n.green && `${n.green} on track`,
  ]
    .filter(Boolean)
    .join(" · ");
}

function Select({ id, label, value, onChange, options }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium text-gray-500"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-[11rem] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function Dashboard({ upload, summary }) {
  const brandId = useId();
  const metricId = useId();
  const [brandChoice, setBrandChoice] = useState("");
  const [metricChoice, setMetricChoice] = useState("");

  // Fall back to the first option whenever a choice is empty or no longer
  // exists (for example after a different CSV is loaded).
  const brands = upload.brands;
  const brand = brands.includes(brandChoice) ? brandChoice : brands[0];

  const brandMetrics = useMemo(
    () =>
      [
        ...new Set(
          upload.rows.filter((r) => r.brand === brand).map((r) => r.metric),
        ),
      ].sort(),
    [upload.rows, brand],
  );
  const metric = brandMetrics.includes(metricChoice)
    ? metricChoice
    : brandMetrics[0];

  const chartData = useMemo(
    () =>
      upload.rows
        .filter((r) => r.brand === brand && r.metric === metric)
        .sort((a, b) => a.week_start.localeCompare(b.week_start))
        .map((r) => ({
          week: r.week_start,
          actual: r.actual,
          target: r.target,
        })),
    [upload.rows, brand, metric],
  );

  const byBrand = useMemo(() => {
    const groups = new Map();
    for (const s of summary.summaries) {
      if (!groups.has(s.brand)) groups.set(s.brand, []);
      groups.get(s.brand).push(s);
    }
    return [...groups.entries()];
  }, [summary.summaries]);

  const last = chartData[chartData.length - 1];
  const chartLabel = last
    ? `Line chart of ${metricLabel(metric)} for ${brand}, actual versus target ` +
      `over ${chartData.length} weeks. Latest week: actual ` +
      `${fmtValue(metric, last.actual)}, target ${fmtValue(metric, last.target)}.`
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg">Latest week</h2>
        <p className="text-sm text-gray-500">
          Week starting {fmtWeekLong(summary.latest_week)}. Status compares
          actual with target: on track at 100% or more, watch from 80%, off
          track below 80%.
        </p>
      </div>

      {byBrand.map(([brandName, items]) => (
        <Card
          key={brandName}
          title={brandName}
          titleAs="h3"
          description={describeCounts(items)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((s) => (
              <StatTile
                key={s.metric}
                label={metricLabel(s.metric)}
                value={fmtValue(s.metric, s.actual)}
                target={fmtValue(s.metric, s.target)}
                change={s.wow_change}
                status={s.rag_status}
                statusLabel={`${STATUS_LABELS[s.rag_status]} ${s.pct_achieved.toFixed(1)}%`}
              />
            ))}
          </div>
        </Card>
      ))}

      <Card
        title="Actual vs target"
        description="Weekly trend for the selected brand and metric."
      >
        <div className="mb-4 flex flex-wrap gap-3">
          <Select
            id={brandId}
            label="Brand"
            value={brand}
            onChange={setBrandChoice}
            options={brands.map((b) => ({ value: b, label: b }))}
          />
          <Select
            id={metricId}
            label="Metric"
            value={metric}
            onChange={setMetricChoice}
            options={brandMetrics.map((m) => ({
              value: m,
              label: metricLabel(m),
            }))}
          />
        </div>

        {chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            There is no data for this brand and metric.
          </p>
        ) : (
          <>
            <div role="img" aria-label={chartLabel} className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
                >
                  <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                  <XAxis
                    dataKey="week"
                    tickFormatter={fmtWeekShort}
                    tick={{ fontSize: 12, fill: TARGET_COLOR }}
                    tickLine={false}
                    axisLine={{ stroke: GRID_COLOR }}
                  />
                  <YAxis
                    width={56}
                    domain={[0, "auto"]}
                    tickFormatter={(value) => fmtTick(metric, value)}
                    tick={{ fontSize: 12, fill: TARGET_COLOR }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value, name) => [fmtValue(metric, value), name]}
                    labelFormatter={(label) => `Week of ${fmtWeekLong(label)}`}
                    contentStyle={{
                      borderRadius: 8,
                      borderColor: GRID_COLOR,
                      fontSize: 13,
                    }}
                  />
                  <Legend verticalAlign="top" height={32} />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual"
                    stroke={ACTUAL_COLOR}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    name="Target"
                    stroke={TARGET_COLOR}
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <table className="sr-only">
              <caption>
                {metricLabel(metric)} for {brand}: actual versus target by week
              </caption>
              <thead>
                <tr>
                  <th scope="col">Week starting</th>
                  <th scope="col">Actual</th>
                  <th scope="col">Target</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((d) => (
                  <tr key={d.week}>
                    <th scope="row">{fmtWeekLong(d.week)}</th>
                    <td>{fmtValue(metric, d.actual)}</td>
                    <td>{fmtValue(metric, d.target)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>
    </div>
  );
}
