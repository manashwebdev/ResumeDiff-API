const {
  SKILLS,
  ATS_KEYWORDS,
  ACTION_VERBS,
  WEAK_PHRASES,
  SECTION_HEADERS,
} = require("./keywordBank");

// ---------- helpers ----------

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findMatches(text, terms) {
  const found = new Set();
  for (const term of terms) {
    const pattern = new RegExp(`(?<![\\w])${escapeRegex(term)}(?![\\w])`, "i");
    if (pattern.test(text)) found.add(term);
  }
  return found;
}

function diffSets(oldSet, newSet) {
  const added = [...newSet].filter((x) => !oldSet.has(x));
  const removed = [...oldSet].filter((x) => !newSet.has(x));
  const kept = [...newSet].filter((x) => oldSet.has(x));
  return { added, removed, kept };
}

function countOccurrences(text, terms) {
  let count = 0;
  const lower = text.toLowerCase();
  for (const term of terms) {
    const re = new RegExp(`(?<![\\w])${escapeRegex(term.toLowerCase())}(?![\\w])`, "g");
    const matches = lower.match(re);
    if (matches) count += matches.length;
  }
  return count;
}

function splitSentences(text) {
  return text
    .replace(/\n/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!word) return 0;
  const vowelGroups = word.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;
  if (word.endsWith("e") && count > 1) count -= 1;
  return Math.max(count, 1);
}

function fleschReadingEase(text) {
  const sentences = splitSentences(text);
  const words = text.split(/\s+/).filter(Boolean);
  if (sentences.length === 0 || words.length === 0) return { score: 0, label: "N/A" };

  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const score =
    206.835 -
    1.015 * (words.length / sentences.length) -
    84.6 * (syllables / words.length);

  const rounded = Math.round(Math.max(0, Math.min(100, score)));
  let label = "Very Difficult";
  if (rounded >= 90) label = "Very Easy";
  else if (rounded >= 70) label = "Easy / Recruiter-Friendly";
  else if (rounded >= 50) label = "Standard";
  else if (rounded >= 30) label = "Fairly Difficult";

  return {
    score: rounded,
    label,
    avgWordsPerSentence: +(words.length / sentences.length).toFixed(1),
    sentenceCount: sentences.length,
    wordCount: words.length,
  };
}

function detectSections(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const found = {};
  for (const [section, patterns] of Object.entries(SECTION_HEADERS)) {
    found[section] = lines.some((line) => {
      // section headers are usually short lines (<6 words)
      if (line.split(" ").length > 6) return false;
      return patterns.some((p) => p.test(line));
    });
  }
  return found;
}

function extractSectionBody(text, sectionRegexList, allHeaderPatterns) {
  const lines = text.split("\n");
  let capturing = false;
  const body = [];

  const isAnyHeader = (line) => {
    if (line.split(" ").length > 6) return false;
    return Object.values(allHeaderPatterns)
      .flat()
      .some((p) => p.test(line.trim()));
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const isThisHeader =
      line.split(" ").length <= 6 && sectionRegexList.some((p) => p.test(line));

    if (isThisHeader) {
      capturing = true;
      continue;
    }
    if (capturing && isAnyHeader(line)) {
      break; // hit the next section
    }
    if (capturing) body.push(line);
  }
  return body;
}

function normalizeLine(line) {
  return line
    .toLowerCase()
    .replace(/^[-•*▪●○◦\s]+/, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function diffBullets(oldBody, newBody) {
  const oldNorm = new Map(oldBody.map((l) => [normalizeLine(l), l]));
  const newNorm = new Map(newBody.map((l) => [normalizeLine(l), l]));

  const added = [];
  const removed = [];

  for (const [key, original] of newNorm) {
    if (!oldNorm.has(key) && key.length > 8) added.push(original);
  }
  for (const [key, original] of oldNorm) {
    if (!newNorm.has(key) && key.length > 8) removed.push(original);
  }
  return { added, removed };
}

function hasQuantifiedResults(lines) {
  return lines.filter((l) => /\d/.test(l)).length;
}

// ---------- ATS scoring ----------

function scoreResume(text, { skillHits, keywordHits, sections, actionVerbCount, weakPhraseCount, quantified, wordCount }) {
  let score = 0;
  const reasons = [];

  // 1) Keyword & skill density (max 30)
  const densityPoints = Math.min(30, skillHits.size * 2 + keywordHits.size * 1.5);
  score += densityPoints;
  reasons.push(`${skillHits.size} skills + ${keywordHits.size} ATS keywords detected (+${Math.round(densityPoints)} pts)`);

  // 2) Section completeness (max 25)
  const requiredSections = ["contact", "summary", "skills", "experience", "education"];
  const presentRequired = requiredSections.filter((s) => sections[s]).length;
  const sectionPoints = (presentRequired / requiredSections.length) * 25;
  score += sectionPoints;
  reasons.push(`${presentRequired}/${requiredSections.length} core sections present (+${Math.round(sectionPoints)} pts)`);

  // 3) Action verbs (max 15)
  const verbPoints = Math.min(15, actionVerbCount * 1.5);
  score += verbPoints;
  reasons.push(`${actionVerbCount} strong action verbs used (+${Math.round(verbPoints)} pts)`);

  // 4) Quantified achievements (max 15)
  const quantPoints = Math.min(15, quantified * 2);
  score += quantPoints;
  reasons.push(`${quantified} bullet lines contain measurable numbers (+${Math.round(quantPoints)} pts)`);

  // 5) Length sanity (max 10) - ideal 350-900 words
  let lengthPoints = 10;
  if (wordCount < 200) lengthPoints = 3;
  else if (wordCount < 350) lengthPoints = 7;
  else if (wordCount > 1100) lengthPoints = 5;
  score += lengthPoints;
  reasons.push(`${wordCount} words total (+${lengthPoints} pts for length)`);

  // 6) Weak phrase penalty (max -10)
  const penalty = Math.min(10, weakPhraseCount * 2);
  score -= penalty;
  if (penalty > 0) reasons.push(`-${penalty} pts for ${weakPhraseCount} passive/weak phrases ("responsible for", etc.)`);

  const final = Math.round(Math.max(0, Math.min(100, score)));
  return { score: final, reasons };
}

// ---------- suggestions ----------

function buildSuggestions({ skillDiff, keywordDiff, oldAts, newAts, oldReadability, newReadability, weakPhraseCountNew, quantifiedNew, sectionsNew }) {
  const suggestions = [];

  if (newAts.score < oldAts.score) {
    suggestions.push({
      type: "warning",
      text: `Your new resume's ATS score dropped from ${oldAts.score} to ${newAts.score}. Review the removed keywords and sections below before applying.`,
    });
  } else if (newAts.score > oldAts.score) {
    suggestions.push({
      type: "positive",
      text: `Nice — ATS compatibility improved by ${newAts.score - oldAts.score} points versus your previous version.`,
    });
  }

  if (keywordDiff.removed.length > 0) {
    suggestions.push({
      type: "warning",
      text: `You removed ${keywordDiff.removed.length} recruiter keyword(s): ${keywordDiff.removed.slice(0, 5).join(", ")}. Only remove these if they're no longer relevant to your target role.`,
    });
  }

  if (quantifiedNew < 3) {
    suggestions.push({
      type: "tip",
      text: "Add more measurable achievements (e.g. \"increased conversion by 18%\", \"managed a team of 5\"). Numbers are one of the strongest signals recruiters scan for.",
    });
  }

  if (weakPhraseCountNew > 0) {
    suggestions.push({
      type: "tip",
      text: `Replace passive phrases like "responsible for" or "worked on" with strong action verbs (built, led, launched, optimized) — found ${weakPhraseCountNew} instance(s).`,
    });
  }

  if (!sectionsNew.summary) {
    suggestions.push({
      type: "tip",
      text: "Consider adding a short professional summary at the top — it's one of the first things recruiters and ATS parsers look for.",
    });
  }

  if (newReadability.avgWordsPerSentence > 26) {
    suggestions.push({
      type: "tip",
      text: `Your average sentence length is ${newReadability.avgWordsPerSentence} words — break long bullet points into shorter, punchier statements.`,
    });
  }

  if (skillDiff.added.length === 0 && skillDiff.removed.length === 0) {
    suggestions.push({
      type: "tip",
      text: "No skill changes were detected between versions — if you're targeting a new role, tailor your skills section to match the job description.",
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      type: "positive",
      text: "Solid revision — no major red flags detected between the two versions.",
    });
  }

  return suggestions;
}

// ---------- main entry point ----------

function analyzeResume(text) {
  const skillHits = findMatches(text, SKILLS);
  const keywordHits = findMatches(text, ATS_KEYWORDS);
  const sections = detectSections(text);
  const actionVerbCount = countOccurrences(text, ACTION_VERBS);
  const weakPhraseCount = countOccurrences(text, WEAK_PHRASES);
  const readability = fleschReadingEase(text);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const expBody = extractSectionBody(text, SECTION_HEADERS.experience, SECTION_HEADERS);
  const projBody = extractSectionBody(text, SECTION_HEADERS.projects, SECTION_HEADERS);
  const quantified = hasQuantifiedResults([...expBody, ...projBody]);

  const ats = scoreResume(text, {
    skillHits,
    keywordHits,
    sections,
    actionVerbCount,
    weakPhraseCount,
    quantified,
    wordCount,
  });

  return {
    text,
    skillHits,
    keywordHits,
    sections,
    actionVerbCount,
    weakPhraseCount,
    readability,
    wordCount,
    expBody,
    projBody,
    quantified,
    ats,
  };
}

function compareResumes(oldText, newText) {
  const oldA = analyzeResume(oldText);
  const newA = analyzeResume(newText);

  const skillDiff = diffSets(oldA.skillHits, newA.skillHits);
  const keywordDiff = diffSets(oldA.keywordHits, newA.keywordHits);
  const experienceChanges = diffBullets(oldA.expBody, newA.expBody);
  const projectChanges = diffBullets(oldA.projBody, newA.projBody);

  const sectionChanges = {};
  for (const key of Object.keys(oldA.sections)) {
    const before = oldA.sections[key];
    const after = newA.sections[key];
    if (before !== after) {
      sectionChanges[key] = after ? "added" : "removed";
    }
  }

  const suggestions = buildSuggestions({
    skillDiff,
    keywordDiff,
    oldAts: oldA.ats,
    newAts: newA.ats,
    oldReadability: oldA.readability,
    newReadability: newA.readability,
    weakPhraseCountNew: newA.weakPhraseCount,
    quantifiedNew: newA.quantified,
    sectionsNew: newA.sections,
  });

  return {
    ats: {
      old: oldA.ats.score,
      new: newA.ats.score,
      delta: newA.ats.score - oldA.ats.score,
      oldReasons: oldA.ats.reasons,
      newReasons: newA.ats.reasons,
    },
    readability: {
      old: oldA.readability,
      new: newA.readability,
    },
    skills: {
      added: skillDiff.added.sort(),
      removed: skillDiff.removed.sort(),
      kept: skillDiff.kept.sort(),
    },
    keywords: {
      added: keywordDiff.added.sort(),
      removed: keywordDiff.removed.sort(),
      kept: keywordDiff.kept.sort(),
    },
    sections: {
      old: oldA.sections,
      new: newA.sections,
      changes: sectionChanges,
    },
    experience: experienceChanges,
    projects: projectChanges,
    stats: {
      oldWordCount: oldA.wordCount,
      newWordCount: newA.wordCount,
      oldActionVerbs: oldA.actionVerbCount,
      newActionVerbs: newA.actionVerbCount,
      oldWeakPhrases: oldA.weakPhraseCount,
      newWeakPhrases: newA.weakPhraseCount,
      oldQuantified: oldA.quantified,
      newQuantified: newA.quantified,
    },
    suggestions,
  };
}

module.exports = { analyzeResume, compareResumes };
