"use client";

import { useState } from "react";
import Papa from "papaparse";

type CsvRow = {
  name?: string;
  slug?: string;
  address?: string;
  website?: string;
  price_level?: string | number;
  rating?: string | number;
  review_count?: string | number;
  category_slug?: string;
  neighborhood_slug?: string;
};

export default function AdminImportPage() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [status, setStatus] = useState<string>("");

  function onFile(file: File) {
    setStatus("Parsing CSV…");
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (res) => {
        const data = (res.data || []).map((r) => ({
          ...r,
          // normalize fields
          slug: r.slug?.trim(),
          category_slug: r.category_slug?.trim(),
          neighborhood_slug: r.neighborhood_slug?.trim(),
        }));
        setRows(data);
        setPreview(data.slice(0, 10));
        setStatus(`Parsed ${data.length} rows. Ready to import.`);
      },
      error: (err) => setStatus(`Parse error: ${err.message}`),
    });
  }

  async function importRows() {
    if (!rows.length) return;
    setStatus("Importing…");
    const res = await fetch("/api/import/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    if (!res.ok) {
      const text = await res.text();
      setStatus(`Import failed: ${res.status} ${text}`);
      return;
    }
    const data = await res.json();
    setStatus(`Imported ${data.inserted} (updated ${data.updated}). Errors: ${data.errors?.length || 0}`);
  }

  const downloadTemplate = () => {
    const headers = [
      "name",
      "slug",
      "address",
      "website",
      "price_level",
      "rating",
      "review_count",
      "category_slug",
      "neighborhood_slug",
    ];
    const blob = new Blob([headers.join(",") + "\n"], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "places_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold">Admin: CSV Import</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Columns required: <code>name, slug, category_slug</code>. Optional: <code>address, website, price_level, rating, review_count, neighborhood_slug</code>.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
        <button className="rounded-md border px-3 py-2" onClick={downloadTemplate}>
          Download CSV template
        </button>
        <button
          className="rounded-md bg-black text-white px-3 py-2 disabled:opacity-50"
          disabled={!rows.length}
          onClick={importRows}
        >
          Import {rows.length ? `(${rows.length})` : ""}
        </button>
      </div>

      {status && <p className="mt-4">{status}</p>}

      {preview.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Preview (first 10 rows)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(preview[0]).map((k) => (
                    <th key={k} className="p-2 border-b text-left">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="odd:bg-white even:bg-gray-50">
                    {Object.keys(preview[0]).map((k) => (
                      <td key={k} className="p-2 border-b">{(r as any)[k] ?? ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
