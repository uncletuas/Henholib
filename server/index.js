// HTTP entrypoint for the Loopital hub.
//
// The routes live in app.js as a handler that takes an API-Gateway-style event and
// returns `{ statusCode, headers, body }`. This adapter turns each request into
// that shape and writes the response back.
const express = require("express");
const { handler } = require("./app");
const { migrate } = require("./migrate");

const app = express();
app.disable("x-powered-by");
// nginx sits in front on the same host; trust it for the client IP recorded at signing.
app.set("trust proxy", "loopback");

// Signature images arrive as data URLs inside the NDA request.
app.use(express.text({ type: "*/*", limit: "6mb" }));

app.all(/.*/, async (req, res) => {
  const event = {
    httpMethod: req.method,
    rawPath: req.path,
    headers: req.headers,
    queryStringParameters: req.query || {},
    body: typeof req.body === "string" && req.body ? req.body : undefined,
  };
  try {
    const result = await handler(event);
    for (const [k, v] of Object.entries(result.headers || {})) res.setHeader(k, v);
    res.status(result.statusCode || 200).send(result.body != null ? result.body : "");
  } catch (err) {
    console.error("adapter error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

const PORT = Number(process.env.PORT || 4100);
const HOST = process.env.HOST || "127.0.0.1";

migrate()
  .catch((e) => console.error("migrate failed (continuing):", e.message))
  .finally(() => app.listen(PORT, HOST, () => console.log(`loopital hub listening on ${HOST}:${PORT}`)));
