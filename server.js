const express = require("express");
const cors = require("cors");
const compareRouter = require("./src/routes/compare");

const app = express();
const PORT = process.env.PORT || 5050;

app.use(
  cors({
    origin: true,
    credentials: true,
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
