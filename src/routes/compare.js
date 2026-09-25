const express = require("express");
const multer = require("multer");
const { extractText } = require("../lib/extractText");
const { compareResumes } = require("../lib/analyzer");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per file
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (allowed.includes(file.mimetype) || /\.(pdf|docx|txt)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOCX and TXT files are supported."));
    }
  },
});

router.post(
  "/",
  upload.fields([
    { name: "oldResume", maxCount: 1 },
    { name: "newResume", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const oldFile = req.files?.oldResume?.[0];
      const newFile = req.files?.newResume?.[0];

      if (!oldFile || !newFile) {
        return res.status(400).json({
          error: "Please upload both your old resume and your new resume.",
        });
      }

      const [oldText, newText] = await Promise.all([
        extractText(oldFile),
        extractText(newFile),
      ]);

      if (oldText.length < 30 || newText.length < 30) {
        return res.status(422).json({
          error:
            "One of the uploaded files doesn't contain enough readable text. If it's a scanned/image-based PDF, try a text-based export instead.",
        });
      }

      const report = compareResumes(oldText, newText);
      res.json({ success: true, report });
    } catch (err) {
      console.error("Compare error:", err.message);
      res.status(500).json({ error: err.message || "Something went wrong while comparing resumes." });
    }
  }
);

module.exports = router;
