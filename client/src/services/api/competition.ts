import { API_BASE_URL } from "@/config/api";

export const COMPETITION_SUBMISSION_ENDPOINT = "eval/competition/submissions";

export type CompetitionSubmissionPayload = {
  submissionLink: string;
};

export async function submitCompetitionSubmission(
  payload: CompetitionSubmissionPayload
): Promise<unknown> {
  const response = await fetch(
    `${API_BASE_URL}${COMPETITION_SUBMISSION_ENDPOINT}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    let errorMessage = `Submission failed (${response.status})`;

    try {
      const errorData = await response.json();
      if (typeof errorData?.message === "string") {
        errorMessage = errorData.message;
      }
    } catch {
      // Keep the generic message when the backend does not return JSON.
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchCompetitionDetails(): Promise<{
  title: string;
  description: string;
}> {
  const response = await fetch(`${API_BASE_URL}eval/competition/details`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch competition details (${response.status})`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error("Failed to parse competition details response");
  }
}   