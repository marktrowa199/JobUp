export type JobAnalysisResult = {
  title: string;
  company: string;
  status: string;
  detected_skills: string[];
  message: string;
};

export type JobAnalysisPayload = {
  title: string;
  company: string;
  description: string;
};

export async function analyzeJob(payload: JobAnalysisPayload): Promise<JobAnalysisResult> {
  const response = await fetch("http://127.0.0.1:8000/api/jobs/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Unable to analyze the job description right now.";

    try {
      const errorBody = await response.json();

      if (typeof errorBody?.detail === "string") {
        message = errorBody.detail;
      } else if (Array.isArray(errorBody?.detail)) {
        message = errorBody.detail.map((item: { msg?: string }) => item.msg ?? "Invalid input").join("; ");
      }
    } catch {
      // Ignore JSON parsing issues and use the default message.
    }

    throw new Error(message);
  }

  return response.json();
}
