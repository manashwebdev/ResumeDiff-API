// Curated reference lists used to detect skills / ATS keywords inside resume text.
// These are intentionally broad and cross-discipline (dev, design, data, product,
// marketing, general professional) so ResumeDiff is useful beyond software roles.

const SKILLS = [
  // Languages
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "Kotlin",
  "Swift", "PHP", "Ruby", "SQL", "HTML", "CSS", "Bash", "Scala", "R",
  // Frontend
  "React", "Next.js", "Vue", "Angular", "Svelte", "Redux", "Tailwind CSS",
  "Framer Motion", "Vite", "Webpack", "jQuery", "Bootstrap", "SASS", "jQuery UI",
  // Backend
  "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring Boot", "GraphQL",
  "REST API", "gRPC", "Microservices",
  // Data / Cloud / DevOps
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD", "Jenkins",
  "GitHub Actions", "Linux", "Nginx",
  // Databases
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "Firebase", "DynamoDB", "Elasticsearch",
  // Data / ML
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy",
  "Data Analysis", "Power BI", "Tableau", "Excel",
  // Design
  "Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator", "UI/UX Design",
  "Wireframing", "Prototyping", "Design Systems",
  // PM / Process
  "Agile", "Scrum", "Kanban", "Jira", "Confluence", "Product Management",
  "Stakeholder Management", "Roadmapping",
  // Marketing / Business
  "SEO", "SEM", "Google Analytics", "Content Marketing", "Social Media Marketing",
  "Salesforce", "HubSpot", "CRM",
  // Version control / testing
  "Git", "GitHub", "GitLab", "Jest", "Cypress", "Unit Testing", "Test Automation",
];

// Terms recruiters / ATS systems commonly scan for that aren't strictly "skills"
const ATS_KEYWORDS = [
  "Bachelor's Degree", "Master's Degree", "Certified", "Certification",
  "Leadership", "Cross-functional", "Team Player", "Problem Solving",
  "Communication", "Project Management", "Budget Management",
  "Stakeholder", "KPI", "OKR", "A/B Testing", "Client Relations",
  "Customer Success", "Vendor Management", "Compliance", "Risk Management",
  "Process Improvement", "Data-Driven", "Full-Stack", "Full Stack",
  "Scalable", "High-Availability", "Performance Optimization",
];

// Strong resume action verbs vs weak/passive phrasing
const ACTION_VERBS = [
  "achieved", "built", "created", "delivered", "designed", "developed",
  "drove", "engineered", "established", "executed", "generated", "improved",
  "increased", "initiated", "launched", "led", "managed", "optimized",
  "orchestrated", "pioneered", "reduced", "resolved", "scaled", "spearheaded",
  "streamlined", "transformed", "won", "automated", "architected", "mentored",
  "negotiated", "accelerated", "implemented", "shipped",
];

const WEAK_PHRASES = [
  "responsible for", "worked on", "helped with", "was involved in",
  "duties included", "tasked with", "in charge of",
];

const SECTION_HEADERS = {
  contact: [/contact/i, /email|phone/i],
  summary: [/summary/i, /objective/i, /profile/i],
  skills: [/skills/i, /technical skills/i, /core competencies/i],
  experience: [/experience/i, /employment/i, /work history/i],
  projects: [/projects?/i],
  education: [/education/i, /academic/i],
  certifications: [/certifications?/i, /licenses?/i],
  achievements: [/achievements?/i, /awards?/i, /honors?/i],
};

module.exports = { SKILLS, ATS_KEYWORDS, ACTION_VERBS, WEAK_PHRASES, SECTION_HEADERS };
