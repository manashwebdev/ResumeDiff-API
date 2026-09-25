const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

/**
 * Extracts raw text from an uploaded resume file buffer.
 * Supports PDF, DOCX and TXT. Throws a descriptive error for anything else.
 */
async function extractText(file) {
  if (!file) throw new Error("No file provided");

  const name = (file.originalname || "").toLowerCase();
  const mime = file.mimetype || "";

  try {
    if (mime === "application/pdf" || name.endsWith(".pdf")) {
      const data = await pdfParse(file.buffer);
      return normalize(data.text);
    }

    if (
      mime ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return normalize(result.value);
    }

    if (mime === "text/plain" || name.endsWith(".txt")) {
      return normalize(file.buffer.toString("utf-8"));
    }

    if (name.endsWith(".doc")) {
      throw new Error(
        "Legacy .doc files aren't supported. Please save as .docx or .pdf and re-upload."
      );
    }

    throw new Error(
      "Unsupported file type. Please upload a PDF, DOCX or TXT resume."
    );
  } catch (err) {
    if (err.message && err.message.startsWith("Unsupported")) throw err;
    if (err.message && err.message.startsWith("Legacy")) throw err;
    throw new Error(
      `Could not read "${file.originalname}". The file may be corrupted, scanned as an image, or password protected.`
    );
  }
}

function normalize(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

module.exports = { extractText };
