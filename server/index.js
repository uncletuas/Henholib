// HTTP entrypoint for the loopital API on Render.
//
// The business logic lives in app.js — the original AWS Lambda handler, which
// takes an API-Gateway-style `event` and returns `{ statusCode, headers, body }`.
// This adapter turns each incoming HTTP request into that event shape, calls the
// handler, and writes the response back. The RAW request body is preserved as a
// string so the Paystack webhook can verify its HMAC signature over it.
const express = require("express");
const { handler } = require("./app");
const { migrate } = require("./migrate");
const { seedApps } = require("./connectors");
const { loadSelfConfig, watchSelfConfig } = require("./zina");

const app = express();

// Capture the raw body as a string for every content type (JSON routes parse it
// themselves inside the handler; the Paystack webhook needs the exact bytes).
app.use(express.text({ type: "*/*", limit: "6mb" }));

app.all(/.*/, async (req, res) => {
  const rawBody = typeof req.body === "string" ? req.body : "";
  const event = {
    httpMethod: req.method,
    rawPath: req.path,
    headers: req.headers,
    queryStringParameters: req.query || {},
    body: rawBody || undefined,
    isBase64Encoded: false,
  };
  try {
    const result = await handler(event);
    const headers = result.headers || {};
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    res.status(result.statusCode || 200).send(result.body != null ? result.body : "");
  } catch (err) {
    console.error("adapter error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

const PORT = process.env.PORT || 10000;

// Apply the schema (idempotent), make sure Zina's app registry knows about every
// product in the ecosystem, then overlay whatever the portal holds for Loopital
// itself onto the environment before anything reads it. Every step is
// best-effort: a database that's briefly unreachable should delay the control
// plane, not stop the API that customers actually sign in through.
migrate()
  .then(() => seedApps())
  .then(() => loadSelfConfig())
  .catch((e) => console.error("boot setup failed (continuing):", e.message))
  .finally(() => {
    watchSelfConfig();
    app.listen(PORT, () => console.log(`loopital API listening on :${PORT}`));
  });
