"use client";

import { useState } from "react";
import Papa from "papaparse";

type CsvRow = Record<string, unknown>;

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/\s+/g, "_").replace(/-+/g, "_");
}

export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const templateRows = [
    [
      "name",
      "slug",
      "category_slug",
      "address",
      "website",
      "price_level",
      "rating",
      "review_count",
      "neighborhood_slug",
    ],
    [
      "Cafe de Pijp",
      "cafe-de-pijp",
      "cafes",
      "Ferdinand Bolstraat 1, Amsterdam",
      "https://cafedepijp.example",
      "2",
      "4.4",
      "123",
      "de-pijp",
    ],
  ];

  function downloadTemplate() {
    const csv = templateRows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "places-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function validateCsvLocally(selected: File) {
    setStatus("Validating CSV…");
    return new Promise<void>((resolve, reject) => {
      Papa.parse<CsvRow>(selected, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: normalizeHeader,
        complete: (results) => {
          if (results.errors?.length) {
            const first = results.errors[0];
            const rowInfo = first.row != null ? ` at row ${first.row}` : "";
            const message = `Parse error${rowInfo}: ${first.message ?? "unknown"}`;
            setStatus(message);
            reject(new Error(message));
            return;
          }

          const headers = (results.meta.fields ?? []).map(normalizeHeader);
          const required = ["name", "slug", "category_slug"];
          const missing = required.filter((h) => !headers.includes(h));
          if (missing.length) {
            const message = `Missing required columns: ${missing.join(", ")}`;
            setStatus(message);
            reject(new Error(message));
            return;
          }

          setStatus(`Parsed ${results.data.length} rows. Ready to import.`);
          resolve();
        },
      });
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setStatus(null);
    if (!file) return;

    try {
      await validateCsvLocally(file);

      setBusy(true);
      setStatus("Uploading to server…");

      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/import/places", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error((await res.text().catch(() => "")) || `HTTP ${res.status}`);

      const json = await res.json().catch(() => ({}));
      setMsg(
        json?.message ??
          `Import complete${json?.insertedOrUpdated != null ? `: ${json.insertedOrUpdated} upserted` : ""}`
      );
      setStatus(null);
      setFile(null);
      const input = document.getElementById("file") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (e: any) {
      setErr(e?.message ?? "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-bold">Admin: CSV Import</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        <strong>Required:</strong> <code>name</code>, <code>slug</code>, <code>category_slug</code>.{" "}
        <strong>Optional:</strong> <code>address</code>, <code>website</code>, <code>price_level</code>,{" "}
        <code>rating</code>, <code>review_count</code>, <code>neighborhood_slug</code>.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-wrap items-center gap-3">
        <input
          id="file"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setMsg(null);
            setErr(null);
            setStatus(null);
          }}
        />

        <button type="button" onClick={downloadTemplate} className="rounded-xl border px-4 py-2">
          Download CSV template
        </button>

        <button
          type="submit"
          disabled={!file || busy}
          className={`rounded-xl px-4 py-2 text-white ${
            !file || busy ? "bg-gray-400" : "bg-black hover:opacity-90"
          }`}
        >
          {busy ? "Importing…" : "Import"}
        </button>
      </form>

      {status && <p className="mt-3 text-sm text-blue-700">{status}</p>}
      {msg && <p className="mt-4 text-green-700">{msg}</p>}
      {err && <p className="mt-4 text-red-600">{err}</p>}
    </main>
  );
}
