import re

SKILL_PATTERNS: dict[str, tuple[str, ...]] = {
    "Python": ("python", "pythonic"),
    "Java": ("java",),
    "JavaScript": ("javascript", "js"),
    "TypeScript": ("typescript", "ts"),
    "React": ("react",),
    "Next.js": ("next.js", "nextjs"),
    "HTML": ("html",),
    "CSS": ("css",),
    "SQL": ("sql",),
    "MySQL": ("mysql",),
    "PostgreSQL": ("postgresql", "postgres"),
    "Git": ("git",),
    "Docker": ("docker",),
    "FastAPI": ("fastapi",),
    "Flask": ("flask",),
    "AWS": ("aws",),
    "Azure": ("azure",),
    "Linux": ("linux",),
    "REST API": ("rest api", "rest-api", "restful api"),
    "Machine Learning": ("machine learning", "ml"),
}


def normalize_text(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9+\s]", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def analyze_job_description(title: str, company: str, description: str) -> dict[str, object]:
    normalized_description = normalize_text(description)
    detected_skills: list[str] = []

    for skill, patterns in SKILL_PATTERNS.items():
        if any(pattern in normalized_description for pattern in patterns):
            detected_skills.append(skill)

    return {
        "title": title.strip(),
        "company": company.strip(),
        "status": "analyzed",
        "detected_skills": detected_skills,
        "message": "Job description analyzed successfully.",
    }
