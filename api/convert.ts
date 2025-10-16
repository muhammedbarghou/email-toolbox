export const config = {
    runtime: "edge",
  };
  
  const OPENAI_API = "https://api.openai.com/v1/chat/completions";
  const apiKey = process.env.OPENAI_API_KEY as string;
  
  const PROMPT_SYSTEM = `
  You are an expert email template refactoring assistant.
  Task:
  - Take the exact HTML provided by the user.
  - Preserve all structure, layout, inline and <style> CSS, links, tracking placeholders and unsubscribe links.
  - Remove emojis and replace any broken/garbled characters (e.g. â) with correct punctuation.
  - Do NOT add or remove sections.
  - Convert the final HTML to valid quoted-printable encoding.
  - Encode special characters correctly (e.g., © -> =C2=A9).
  - Preserve indentation and spacing for readability.
  - Output ONLY the quoted-printable HTML (no explanation, no metadata).
  `;
  
  export default async function (req: Request) {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    let payload: any;
    try {
      payload = await req.json();
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  
    const emailHtml = payload?.emailHtml || "";
    if (!emailHtml) {
      return new Response(
        JSON.stringify({ error: "Missing emailHtml in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  
    // Build messages
    const messages = [
      { role: "system", content: PROMPT_SYSTEM },
      { role: "user", content: emailHtml },
    ];
  
    // Call OpenAI Chat Completions endpoint
    try {
      const resp = await fetch(OPENAI_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // or any model name available on your account
          messages,
          max_tokens: 16000,
          temperature: 0.0,
        }),
      });
  
      if (!resp.ok) {
        const txt = await resp.text();
        return new Response(JSON.stringify({ error: "OpenAI error", details: txt }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }
  
      const data = await resp.json();
      const result = data.choices?.[0]?.message?.content ?? "";
  
      return new Response(JSON.stringify({ result }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message || String(e) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  