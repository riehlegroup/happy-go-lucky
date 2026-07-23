import { ChangeEvent, FormEvent, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  submitCompetitionSubmission,
  type CompetitionSubmissionPayload,
} from "../../services/api/competition";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function CompetitionSubmission() {
  const [formData, setFormData] = useState({ submissionLink: "" });
  const [errors, setErrors] = useState<{ submissionLink?: string }>({});
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [submitError, setSubmitError] = useState<string>("");

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [e.target.name]: e.target.value,
    }));
  }

  function validate() {
    let newErrors: { submissionLink?: string } = {};
    if (!formData.submissionLink) {
      newErrors.submissionLink = "Submission link is required";
    }
    //TODO: Add more validation
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSubmitError("");

    if (!validate()) {
      return;
    }

    setStatus("uploading");

    try {
      const payload: CompetitionSubmissionPayload = {
        submissionLink: formData.submissionLink,
      };

      await submitCompetitionSubmission(payload);
      setStatus("success");
      setFormData({ submissionLink: "" });
    } catch (error) {
      setStatus("error");
      setSubmitError(
        error instanceof Error
          ? error.message
          : "The submission could not be sent.",
      );
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-12">
          <div className="">
            <Input
              type="url"
              name="submissionLink"
              id="submissionLinkInput"
              value={formData.submissionLink}
              onChange={handleInputChange}
              placeholder="https://rrze.uni-erlangen.de/..." //TODO: Add correct placeholder for submission link
            />
            <div className="text-left">
              {errors.submissionLink && (
                <p className="text-red-500">{errors.submissionLink}</p>
              )}
              {submitError && <p className="text-red-500">{submitError}</p>}
              {status === "success" && (
                <p className="text-green-600">
                  Solution submitted successfully.
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="h-14"
            disabled={status === "uploading"}
          >
            {status === "uploading" ? "Submitting..." : "Submit Solution"}
          </Button>
        </div>
      </form>
    </div>
  );
}
