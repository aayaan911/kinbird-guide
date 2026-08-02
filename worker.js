/**
 * KINBIRD OS — Cloudflare Worker
 * Layer 2: cross-device data sync (KV)
 * Layer 3: grounded AI chat (Workers AI, retrieval-grounded so it cannot invent numbers)
 *
 * Endpoints:
 *   GET  /load           → returns saved {db, tasks}
 *   POST /save           → stores {db, tasks}
 *   POST /ask            → {q, kb:[...], stats:{...}} → grounded answer
 *   GET  /health         → status check
 *
 * Bindings required (set in the Cloudflare dashboard, see DEPLOY guide):
 *   KV namespace  → binding name: KINBIRD
 *   Workers AI    → binding name: AI
 *   Secret        → KINBIRD_KEY  (a password YOU choose; the page sends it)
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,X-Kinbird-Key",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

/* Only Ayaan's key may read or write the aviary data. */
function authed(request, env) {
  if (!env.KINBIRD_KEY) return true; // no key set = open (fine while testing)
  const k = request.headers.get("X-Kinbird-Key");
  return k && k === env.KINBIRD_KEY;
}

/* ---------- grounded prompt ----------
   The model is given ONLY the verified knowledge entries and Ayaan's own
   logged numbers. It is forbidden from inventing figures. If the context
   does not answer the question, it must say so. This is what keeps a
   150K-per-baby decision from resting on a hallucination. */
function buildPrompt(q, kb, stats) {
  const facts = (kb || [])
    .slice(0, 14)
    .map((e, i) => `[${i + 1}] ${e.t}\n${String(e.a).replace(/<[^>]+>/g, "")}\nSOURCE: ${e.s}`)
    .join("\n\n");

  const mine = stats && stats.n
    ? `AYAAN'S OWN LOGGED DATA (authoritative, from his aviary):
- Clutches logged: ${stats.n}
- Eggs laid: ${stats.l}, fertile: ${stats.f}
- Fertility: ${stats.fert?.toFixed(1)}%
- Dead-in-shell: ${stats.dsr?.toFixed(1)}% of fertile
- Hatch rate: ${stats.hat?.toFixed(1)}%
- Fledge rate: ${stats.fled?.toFixed(1)}%
- Babies fledged: ${stats.fl}`
    : "AYAAN'S OWN LOGGED DATA: none logged yet.";

  return `You are KINBIRD BRAIN, the advisor for Ayaan Ahmed Shohan's Fischer's lovebird aviary in Dhaka, Bangladesh.

ABSOLUTE RULES:
1. Answer ONLY from the CONTEXT below. Never invent a number, temperature, humidity, dosage, price or percentage.
2. If the context does not contain the answer, reply exactly: "That is not in my verified knowledge base. Ask Ayaan to add it in the TEACH tab."
3. Cite the source in square brackets after any factual claim, e.g. [1].
4. Prefer AYAAN'S OWN LOGGED DATA over general knowledge when both apply.
5. Be short, direct and confident. No filler, no warm-up sentences. Never open with agreement.
6. Lead with the uncomfortable truth if there is one.
7. Never use em-dashes. Use BDT for currency.

CONTEXT — VERIFIED KNOWLEDGE:
${facts}

${mine}

QUESTION: ${q}

ANSWER:`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    if (path === "/health") {
      return json({
        ok: true,
        kv: !!env.KINBIRD,
        ai: !!env.AI,
        keySet: !!env.KINBIRD_KEY,
        time: new Date().toISOString(),
      });
    }

    /* ---------- LOAD ---------- */
    if (path === "/load") {
      if (!authed(request, env)) return json({ error: "unauthorized" }, 401);
      if (!env.KINBIRD) return json({ error: "KV namespace 'KINBIRD' not bound" }, 500);
      const raw = await env.KINBIRD.get("aviary");
      return json(raw ? JSON.parse(raw) : { db: null, tasks: null });
    }

    /* ---------- SAVE ---------- */
    if (path === "/save" && request.method === "POST") {
      if (!authed(request, env)) return json({ error: "unauthorized" }, 401);
      if (!env.KINBIRD) return json({ error: "KV namespace 'KINBIRD' not bound" }, 500);
      let body;
      try { body = await request.json(); } catch { return json({ error: "bad json" }, 400); }

      // keep the last 30 versions so a bad import can never destroy the record
      const prev = await env.KINBIRD.get("aviary");
      if (prev) {
        await env.KINBIRD.put("backup:" + Date.now(), prev, { expirationTtl: 60 * 60 * 24 * 90 });
      }
      await env.KINBIRD.put("aviary", JSON.stringify({
        db: body.db || null,
        tasks: body.tasks || null,
        saved: new Date().toISOString(),
      }));
      return json({ ok: true, saved: new Date().toISOString() });
    }

    /* ---------- ASK (grounded AI) ---------- */
    if (path === "/ask" && request.method === "POST") {
      if (!authed(request, env)) return json({ error: "unauthorized" }, 401);
      if (!env.AI) return json({ error: "Workers AI binding 'AI' not configured" }, 500);

      let body;
      try { body = await request.json(); } catch { return json({ error: "bad json" }, 400); }
      const q = (body.q || "").trim();
      if (!q) return json({ error: "empty question" }, 400);

      const prompt = buildPrompt(q, body.kb, body.stats);

      try {
        const r = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          messages: [
            { role: "system", content: "You are a precise aviary advisor. You never invent numbers. You cite sources." },
            { role: "user", content: prompt },
          ],
          max_tokens: 620,
          temperature: 0.2, // low: we want fidelity to context, not creativity
        });
        const text = (r && (r.response || r.result)) || "";
        return json({ answer: text.trim(), grounded: true });
      } catch (e) {
        return json({ error: "ai_failed", detail: String(e) }, 500);
      }
    }

    return json({
      service: "KINBIRD OS API",
      endpoints: ["/health", "/load", "/save", "/ask"],
    });
  },
};
