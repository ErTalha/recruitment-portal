export interface ExportColumn<T> {
  title: string;
  value: (row: T) => unknown;
}
export function buildCSV<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  context = "",
  withTotals = true,
) {
  const escape = (v: unknown) =>
    '"' + String(v ?? "").replaceAll('"', '""') + '"';
  const values = rows.map((r) => columns.map((c) => c.value(r)));
  const total = columns.map((_, i) =>
    i === 0
      ? "TOTAL"
      : values.length && values.every((v) => typeof v[i] === "number")
        ? Math.round(values.reduce((n, v) => n + Number(v[i]), 0) * 100) / 100
        : "",
  );
  return (
    "\uFEFF" +
    [
      columns.map((c) => escape(c.title)).join(","),
      ...values.map((v) => v.map(escape).join(",")),
      ...(withTotals ? [total.map(escape).join(",")] : []),
      ...(context
        ? [[escape("FILTERS / GENERATED"), escape(context)].join(",")]
        : []),
    ].join("\r\n")
  );
}
