export const userFacingErrors = {
  JOB_SEARCH_NOT_CONFIGURED: "Live job listings are temporarily unavailable. Please try again later.",
  JOB_SEARCH_UNAVAILABLE: "Live job listings are temporarily unavailable. Please try again later.",
  JOB_SEARCH_PROVIDER_400: "We couldn't complete your search. Try changing your keywords or location.",
  JOB_SEARCH_PROVIDER_401: "Live job listings are temporarily unavailable. Please try again later.",
  JOB_SEARCH_PROVIDER_403: "Live job listings are temporarily unavailable. Please try again later.",
  JOB_SEARCH_PROVIDER_404: "Live job listings are temporarily unavailable. Please try again later.",
  JOB_SEARCH_PROVIDER_429: "Search is busy right now. Please try again in a few minutes.",
  JOB_SEARCH_PROVIDER_ERROR: "Live job listings are temporarily unavailable. Please try again later.",
  JOB_SEARCH_INVALID_JSON: "Live job listings are temporarily unavailable. Please try again later.",
  JOB_SEARCH_INVALID_RESPONSE: "Live job listings are temporarily unavailable. Please try again later.",
  JOB_SEARCH_TIMEOUT: "The service is taking longer than expected. Please try again.",
  JOB_SEARCH_NETWORK_ERROR: "Live job listings are temporarily unavailable. Please try again later.",
  INVALID_SEARCH_REQUEST: "We couldn't complete your search. Please try again.",
  MISSING_KEYWORD: "Enter a job title or keyword to search.",
  NO_RESULTS: "No matching jobs were found. Try changing your keywords or location.",
  RECOMMENDATIONS_UNAVAILABLE: "We couldn't generate recommendations right now. Please try uploading your resume again later.",
  RECOMMENDATIONS_PARTIAL: "Some recommendations are unavailable right now. Showing the matches we could find.",
  INVALID_RESUME: "We could not read this file. Please upload a PDF or DOCX resume.",
  UNSUPPORTED_FILE_TYPE: "We could not read this file. Please upload a PDF or DOCX resume.",
  FILE_TOO_LARGE: "Resume files must be 8 MB or smaller.",
  INVALID_RESUME_REQUEST: "Choose a PDF or DOCX resume to upload.",
  AUTH_REQUIRED: "Please sign in to analyze your resume.",
  RESUME_ANALYSIS_UNAVAILABLE: "We couldn't generate recommendations right now. Please try uploading your resume again later.",
} as const;

export type UserFacingErrorCode = keyof typeof userFacingErrors;

export function userFacingErrorMessage(code: unknown, fallback: UserFacingErrorCode = "JOB_SEARCH_UNAVAILABLE"): string {
  return typeof code === "string" && Object.prototype.hasOwnProperty.call(userFacingErrors, code)
    ? userFacingErrors[code as UserFacingErrorCode]
    : userFacingErrors[fallback];
}

export class UserFacingError extends Error {
  constructor(readonly code: UserFacingErrorCode) {
    super(userFacingErrors[code]);
    this.name = "UserFacingError";
  }
}