import { useState } from "react";

export default function Chat() {
  const [html, setHtml] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function convert() {
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailHtml: html }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err?.error || `Server error: ${res.status}`);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setResult(data.result || "");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function copyResult() {
    if (!result) return;
    navigator.clipboard.writeText(result);
  }

  function downloadTxt() {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quoted-printable.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ maxWidth: 960, margin: "2rem auto", fontFamily: "Inter, Arial, sans-serif" }}>
      <h1>Email → Quoted-Printable Converter</h1>

      <textarea
        placeholder="Paste raw HTML email here..."
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        style={{ width: "100%", height: 280, marginBottom: 12 }}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={convert} disabled={loading || !html} style={{ padding: "10px 16px" }}>
          {loading ? "Converting…" : "Convert"}
        </button>
        <button onClick={() => { setHtml(""); setResult(""); }} style={{ padding: "10px 16px" }}>
          Clear
        </button>
      </div>

      {error && (
        <div style={{ color: "crimson", marginBottom: 12 }}>
          Error: {error}
        </div>
      )}

      {result && (
        <div>
          <div style={{ marginBottom: 8 }}>
            <button onClick={copyResult} style={{ marginRight: 8 }}>Copy</button>
            <button onClick={downloadTxt}>Download .txt</button>
          </div>
          <textarea readOnly value={result} style={{ width: "100%", height: 360 }} />
        </div>
      )}
    </div>
  );
}
