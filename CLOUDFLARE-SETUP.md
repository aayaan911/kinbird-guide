# KINBIRD OS — Cloudflare Setup

**What this gets you:** cross-device sync (phone, wall screen, laptop all share one database) plus conversational AI chat that is grounded in your verified knowledge base so it cannot invent numbers.

**Cost:** free tier covers all of it at your volume.

**Time:** about 20 minutes.

**Important:** you do these steps yourself. I cannot create accounts or handle your passwords and keys. That is deliberate — a key I touch is a key that could leak, and this one guards your aviary data.

---

## Part A — Host the site on Cloudflare Pages (5 min)

1. Go to **dash.cloudflare.com** and sign up (free).
2. Left menu → **Workers & Pages** → **Create** → **Pages** tab → **Connect to Git**.
3. Authorise GitHub, pick the repo **`kinbird-guide`**.
4. Build settings: leave **everything blank** (it is plain HTML, no build step).
   - Framework preset: **None**
   - Build command: *(empty)*
   - Output directory: `/`
5. **Save and Deploy.**

You now have `https://kinbird-guide.pages.dev` and it redeploys automatically every time the GitHub file updates.

Optional: **Custom domains** → add your own domain if you have one.

---

## Part B — Create the storage (3 min)

1. Left menu → **Storage & Databases** → **KV**.
2. **Create instance**. Name it exactly: **`kinbird`**
3. Done. Leave it, you will bind it in Part C.

---

## Part C — Deploy the API Worker (8 min)

1. Left menu → **Workers & Pages** → **Create** → **Workers** tab → **Create Worker**.
2. Name it: **`kinbird-api`** → **Deploy** (it deploys a placeholder, that is fine).
3. Click **Edit code**.
4. Delete everything in the editor and paste the **entire contents of `worker.js`**.
5. Click **Deploy**.

Now bind the services to it:

6. Go back to the Worker → **Settings** → **Bindings** → **Add**.

   **Binding 1 — KV**
   - Type: **KV namespace**
   - Variable name: `KINBIRD`  *(exactly this, capitals)*
   - KV namespace: `kinbird`

   **Binding 2 — AI**
   - Type: **Workers AI**
   - Variable name: `AI`  *(exactly this)*

7. Still in **Settings** → **Variables and Secrets** → **Add**:
   - Type: **Secret**
   - Name: `KINBIRD_KEY`
   - Value: **a password you invent** (e.g. a long random phrase). Write it down. This is what stops strangers reading your aviary data.

8. **Deploy** again to apply the bindings.

---

## Part D — Connect the app (2 min)

1. Open your site → **LOG** tab → scroll to **BACKUP & SYNC**.
2. **Worker URL:** `https://kinbird-api.YOURNAME.workers.dev`
   (copy the exact URL from the Worker's overview page)
3. **Access key:** the same secret you set in step C7.
4. Press **CONNECT**. The badge turns green: `● CLOUD + AI ON`.

---

## Verify it worked

- Visit `https://kinbird-api.YOURNAME.workers.dev/health` in a browser.
  You should see `{"ok":true,"kv":true,"ai":true,"keySet":true,...}`.
  If `kv` or `ai` is `false`, the binding name is wrong — check spelling and capitals in Part C6.
- In the app, add a test pair in **LOG**, then open the site on your phone with the same URL and key. The pair should appear.
- In **BRAIN**, ask something conversational like *"should I put nest boxes in this week"*. With the Worker connected you get a reasoned answer citing sources; without it you get the exact-match answer.

---

## How the AI is kept honest

The Worker never lets the model answer from its own memory. On every question it receives only:

- your verified knowledge entries (each with its source), and
- your own logged aviary statistics.

It is instructed to cite a source for every claim, to prefer **your** data over general knowledge, and to reply *"That is not in my verified knowledge base"* when the context does not cover the question. Temperature is set to 0.2, which keeps it faithful to the context rather than creative.

That is the difference between a tool you can bet 150K on and a chatbot.

---

## Costs at your volume

| Service | Free tier | You will use |
|---|---|---|
| Pages | unlimited requests | trivial |
| Workers | 100,000 requests/day | a few hundred |
| KV | 100,000 reads/day | a few hundred |
| Workers AI | daily free allocation | a few dozen questions |

Expect ৳0/month.

---

## Backups

The Worker keeps a snapshot on every save for 90 days, so a bad import cannot destroy your record.

Still export manually every month: **LOG → BACKUP & SYNC → EXPORT ALL DATA**. Your breeding record is the one thing here that cannot be rebuilt.

---

## Weekly update routine

1. Tell me what changed or what you learned.
2. I update `system.html` and push to GitHub.
3. Cloudflare Pages redeploys automatically within a minute.
4. Your logged data is untouched — it lives in KV and localStorage, not in the HTML.
