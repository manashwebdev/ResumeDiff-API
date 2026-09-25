const express = require("express");
const cors = require("cors");
const compareRouter = require("./src/routes/compare");

const app = express();
const PORT = process.env.PORT || 5050;

// Enable CORS for all origins
app.use(cors());

// Handle preflight requests
app.options("*", cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "ResumeDiff API",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/compare", compareRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(err.status || 500).json({
    error: err.message || "Unexpected server error.",
  });
});

app.listen(PORT, () => {
  console.log(`ResumeDiff API running on port ${PORT}`);
});