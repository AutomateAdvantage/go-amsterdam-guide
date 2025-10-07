"use client";

import { useState } from "react";

export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (!file) return;

    try {
      setBusy(true);
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/import/places", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);

      const json = await res.json().catch(() => ({}));
      setMsg(
        json?.message ||
          `Import complete${json?.inserted != null ? `: ${json.inserted} inserted` : ""}`
      );

      // reset file control
      setFile(null);
      const el = document.getElementById("file") as HTMLInputElement | null;
      if (el) el.value = "";
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
        <strong>Columns required:</strong> <code>name</code>, <code>slug</code>, <code>category_slug</code>.{" "}
        <strong>Optional:</strong> <code>address</code>, <code>website</code>, <code>price_level</code>,{" "}
        <code>rating</code>, <code>review_count</code>, <code>neighborhood_slug</code>.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-wrap items-center gap-3">
        <input
          id="file"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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

      {msg && <p className="mt-4 text-green-700">{msg}</p>}
      {err && <p className="mt-4 text-red-600">{err}</p>}
    </main>
  );
}
