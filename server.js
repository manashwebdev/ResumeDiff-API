const express = require("express");
const cors = require("cors");
const compareRouter = require("./src/routes/compare");

const app = express();
const PORT = process.env.PORT || 5050;

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "ResumeDiff API" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.use("/api/compare", compareRouter);

// Fallback error handler (e.g. multer file-size / file-type errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`ResumeDiff API running on http://localhost:${PORT}`);
});
