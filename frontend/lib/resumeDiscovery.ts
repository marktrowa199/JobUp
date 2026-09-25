import type { Job } from "@/lib/jobSearch";

export type ResumeProfile = {
  fileName: string;
  name: string | null;
  contact: { email: string | null; phone: string | null; linkedin: string | null };
  roles: string[];
  skills: string[];
  technologies: string[];
  experience: string[];
  education: string[];
  certifications: string[];
  projects: string[];
  summary: string[];
  keywords: string[];
  yearsExperience: string | null;
};

export class InvalidResumeError extends Error {}

export type ResumeJobMatch = {
  job: Job;
  score: number;
  matchedSkills: string[];
  reason: string;
};

const SKILL_TERMS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python", "Java", "C#", ".NET",
  "PHP", "Laravel", "HTML", "CSS", "Tailwind", "SQL", "PostgreSQL", "MySQL", "MongoDB",
  "REST API", "FastAPI", "Django", "Flask", "AWS", "Azure", "Google Cloud", "Docker",
  "Kubernetes", "Git", "Linux", "Excel", "Power BI", "Tableau", "Figma", "Agile", "Scrum",
  "Machine Learning", "Data Analysis", "Communication", "Project Management", "Customer Service",
  "Accounting", "Bookkeeping", "Networking", "Troubleshooting", "Quality Assurance", "SEO",
];

const ROLE_TERMS = [
  "Junior Software Developer", "Software Developer", "Software Engineer", "Junior Web Developer",
  "Web Developer", "Frontend Developer", "Front-end Developer", "Backend Developer",
  "Back-end Developer", "Full Stack Developer", "Python Developer", "Data Analyst", "Data Scientist",
  "IT Support", "IT Help Desk", "QA Engineer", "Quality Assurance Analyst", "Network Engineer",
  "Cybersecurity Analyst", "UI/UX Designer", "Project Manager", "Accountant", "Customer Service Representative",
];

const TECHNOLOGY_TERMS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python", "Java", "C#", ".NET",
  "PHP", "Laravel", "HTML", "CSS", "Tailwind", "SQL", "PostgreSQL", "MySQL", "MongoDB",
  "FastAPI", "Django", "Flask", "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Git", "Linux",
  "Power BI", "Tableau", "Figma",
];

const CERTIFICATION_TERMS = [
  "AWS Certified", "Microsoft Certified", "Azure Fundamentals", "Google Cloud Certified", "CompTIA A+",
  "CompTIA Security+", "CCNA", "PMP", "CISSP", "CPA", "CMA", "ITIL",
];

const KEYWORD_TERMS = [
  "Software Development", "Web Development", "Backend Development", "Frontend Development", "API Development",
  "Leadership", "Teamwork", "Problem Solving", "Data Visualization", "Database Management", "Testing",
  "Automation", "Business Analysis", "Technical Support", "Content Writing", "Communication Skills",
];

const SECTION_HEADINGS = /^(?:(?:professional|work\s+)?experience\s*:?|employment(?:\s+history)?\s*:?|education\s*:?|academic(?:\s+background)?\s*:?|certifications?\s*:?|licenses?\s*:?|skills\s*:?|technical\s+skills\s*:?|projects\s*:?|professional\s+summary\s*:?|summary\s*:?|profile\s*:?|references?\s*:?|objective\s*:?|career\s+objective\s*:?\s*)$/i;

function escaped(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesTerm(text: string, term: string): boolean {
  return new RegExp(`(?<![a-z0-9])${escaped(term.toLowerCase())}(?![a-z0-9])`, "i").test(text);
}

function findTerms(text: string, terms: string[]): string[] {
  return terms.filter((term) => includesTerm(text, term));
}

function sectionLines(text: string, sectionNames: string[]): string[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const heading = new RegExp(`^(?:${sectionNames.join("|")})\\s*:?$`, "i");
  const start = lines.findIndex((line) => heading.test(line));
  if (start < 0) return [];

  const collected: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (SECTION_HEADINGS.test(line)) break;
    if (line.length >= 4 && !collected.includes(line)) collected.push(line);
    if (collected.length === 5) break;
  }
  return collected;
}

function hasSection(text: string, names: string[]): boolean {
  const heading = new RegExp(`^(?:${names.join("|")})\\s*:?\\s*$`, "im");
  return heading.test(text);
}

function candidateName(text: string): string | null {
  const firstLine = text.split(/\r?\n/).map((line) => line.trim()).find((line) => line.length > 2);
  if (!firstLine || firstLine.length > 60 || /[@/:]|\d/.test(firstLine)) return null;
  const words = firstLine.split(/\s+/);
  return words.length >= 2 && words.length <= 4 && words.every((word) => /^[A-Za-z][A-Za-z'’-]*$/.test(word))
    ? firstLine
    : null;
}

export function analyzeResumeText(rawText: string, fileName: string): ResumeProfile {
  const text = rawText.replace(/\u0000/g, " ").replace(/\s+/g, " ").trim();
  if (text.length < 120) {
    throw new InvalidResumeError("We couldn't detect a valid resume in this file. Please upload a resume or CV to use Resume-Powered Discovery.");
  }

  const normalizedText = rawText.replace(/\u0000/g, " ");
  const hasExperience = hasSection(normalizedText, ["experience", "work experience", "professional experience", "employment history"]);
  const hasEducation = hasSection(normalizedText, ["education", "academic background"]);
  const hasSkills = hasSection(normalizedText, ["skills", "technical skills", "core competencies"]);
  const hasProjects = hasSection(normalizedText, ["projects", "personal projects", "academic projects"]);
  const hasCertifications = hasSection(normalizedText, ["certifications", "certification", "licenses", "licenses and certifications"]);
  const hasSummary = hasSection(normalizedText, ["summary", "professional summary", "profile", "career objective", "objective"]);
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
  const phone = text.match(/(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}/)?.[0] ?? null;
  const linkedin = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[\w%/-]+/i)?.[0] ?? null;
  const roles = findTerms(text, ROLE_TERMS);
  const skills = findTerms(text, SKILL_TERMS);
  const technologies = findTerms(text, TECHNOLOGY_TERMS);
  const education = sectionLines(normalizedText, ["education", "academic background"]);
  const experience = sectionLines(normalizedText, ["experience", "work experience", "professional experience", "employment", "employment history"]);
  const projects = sectionLines(normalizedText, ["projects", "personal projects", "academic projects"]);
  const summary = sectionLines(normalizedText, ["professional summary", "summary", "profile", "career objective", "objective"]);
  const certifications = [
    ...findTerms(text, CERTIFICATION_TERMS),
    ...sectionLines(normalizedText, ["certifications", "certification", "licenses", "licenses and certifications"]),
  ].filter((item, index, all) => all.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === index).slice(0, 6);
  const yearsExperience = text.match(/\b(\d{1,2}(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|work|professional)/i)?.[1] ?? null;
  const structuralSections = [hasExperience, hasEducation, hasSkills, hasProjects, hasCertifications, hasSummary]
    .filter(Boolean).length;
  const hasResumeAnchor = Boolean(email || phone || hasExperience || hasProjects || roles.length);
  const hasResumeContent = roles.length > 0 || skills.length >= 2 || experience.length > 0 || education.length > 0 || projects.length > 0 || certifications.length > 0;

  if (structuralSections < 2 || !hasResumeAnchor || !hasResumeContent) {
    throw new InvalidResumeError("We couldn't detect a valid resume in this file. Please upload a resume or CV to use Resume-Powered Discovery.");
  }

  const keywords = [...new Set([...roles, ...skills, ...technologies, ...findTerms(text, KEYWORD_TERMS)])].slice(0, 24);

  return {
    fileName,
    name: candidateName(normalizedText),
    contact: { email, phone, linkedin },
    roles: roles.slice(0, 5),
    skills,
    technologies,
    experience: experience.length ? experience : yearsExperience ? [`${yearsExperience} years of experience`] : [],
    education,
    certifications,
    projects,
    summary,
    keywords,
    yearsExperience,
  };
}

const RELATED_ROLES: Array<{ pattern: RegExp; roles: string[] }> = [
  { pattern: /software|web|front.?end|back.?end|full.?stack|python developer/i, roles: ["Junior Software Developer", "Junior Web Developer", "Software Engineer", "Python Developer", "Backend Developer", "Associate Software Engineer"] },
  { pattern: /data analyst|data scientist/i, roles: ["Data Analyst", "Junior Data Analyst", "Business Intelligence Analyst", "Reporting Analyst", "Data Scientist"] },
  { pattern: /it support|help desk|network|cybersecurity/i, roles: ["IT Support Specialist", "IT Help Desk Technician", "Network Engineer", "Cybersecurity Analyst", "Systems Administrator"] },
  { pattern: /quality assurance|qa engineer/i, roles: ["QA Engineer", "Software Tester", "Quality Assurance Analyst", "Automation Tester"] },
  { pattern: /ui.?ux|designer/i, roles: ["UI/UX Designer", "Product Designer", "Web Designer", "Graphic Designer"] },
  { pattern: /accountant|accounting/i, roles: ["Accountant", "Junior Accountant", "Bookkeeper", "Finance Analyst"] },
  { pattern: /customer service/i, roles: ["Customer Service Representative", "Customer Support Specialist", "Client Services Associate"] },
];

export function getRoleSearchQueries(profile: ResumeProfile): string[] {
  const queries = [...profile.roles.slice(0, 2)];
  const roleContext = profile.roles.join(" ") || profile.skills.join(" ");
  const family = RELATED_ROLES.find(({ pattern }) => pattern.test(roleContext));
  if (family) queries.push(...family.roles);
  if (queries.length === 0 && /python/i.test(roleContext)) queries.push("Python Developer");
  if (queries.length === 0 && /react|javascript|typescript|html|css/i.test(roleContext)) queries.push("Web Developer");
  if (queries.length === 0 && /sql|excel|power bi|tableau/i.test(roleContext)) queries.push("Data Analyst");
  if (queries.length === 0) queries.push(...profile.skills.slice(0, 3));
  return [...new Set(queries)].slice(0, 5);
}

export function rankResumeJob(job: Job, profile: ResumeProfile, searchRoles: string[]): ResumeJobMatch {
  const jobText = `${job.title} ${job.description}`.toLowerCase();
  const matchedSkills = profile.skills.filter((skill) => includesTerm(jobText, skill));
  const exactRoleMatch = profile.roles.some((role) => includesTerm(job.title, role));
  const relatedRoleMatch = searchRoles.some((role) => includesTerm(job.title, role));
  const keywordMatches = profile.keywords.filter((keyword) => includesTerm(jobText, keyword)).length;
  const score = Math.min(99, 30 + Math.min(matchedSkills.length * 9, 36) + (exactRoleMatch ? 20 : relatedRoleMatch ? 12 : 0) + Math.min(keywordMatches * 3, 13));
  const evidence = matchedSkills.slice(0, 3);
  const reason = evidence.length
    ? `Recommended because your resume includes ${evidence.join(", ")}${profile.yearsExperience ? ` and ${profile.yearsExperience} years of experience` : ""}.`
    : exactRoleMatch
      ? `Recommended because your resume lists ${profile.roles[0]}.`
      : `Related to your resume${profile.roles[0] ? ` and ${profile.roles[0]} experience` : " skills and experience"}.`;

  return { job, score, matchedSkills: evidence, reason };
}