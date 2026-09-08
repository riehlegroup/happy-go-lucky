import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
	createCompetitionSubmissionValidation,
	useForm,
} from "@/hooks/useForm";

interface SubmissinLinkUploaderProps {
	existingSubmissionLink?: string;
	lastUpdated?: string;
	isSubmitting?: boolean;
	onSubmit: (submissionLink: string) => void;
}

export const SubmissionLinkUploader: React.FC<SubmissinLinkUploaderProps> = ({
	existingSubmissionLink = "",
	lastUpdated,
	isSubmitting,
	onSubmit,
}) => {
	const [submitSucess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isTouched, setIsTouched] = useState(false);
	const isSubmissionLinkExisting = Boolean(existingSubmissionLink);

	const { data, errors, isValid, handleChanges } = useForm(
		{ submissionLink: existingSubmissionLink },
		createCompetitionSubmissionValidation(),
	);

	// if submission link is asynchronously updated, we need to update the form data accordingly
	useEffect(() => {
		if (existingSubmissionLink) {
			handleChanges("submissionLink", existingSubmissionLink);
		}
	}, [existingSubmissionLink, handleChanges]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isValid || isSubmitting) {
			return;
		}
		setSubmitSuccess(false);
		try {
			await onSubmit(data.submissionLink);
			setSubmitSuccess(true);
		} catch (error) {
			if (error instanceof Error) {
				setSubmitError(error.message);
			} else {
				setSubmitError("An unknown error occurred");
			}
		}
	};

	return (
		<div>
			<form onSubmit={handleSubmit}>
				<div className="grid grid-cols-[minmax(0,1fr)_auto] gap-12">
					<div className="">
						<Input
							type="url"
							name="submissionLink"
							id="submissionLinkInput"
							value={data.submissionLink}
							onChange={(e) => {
								handleChanges("submissionLink", e.target.value);
                setIsTouched(true);
                if(submitSucess) setSubmitSuccess(false);
                if(submitError) setSubmitError(null);
              }}
              className="w-full"
							placeholder="https://rrze.uni-erlangen.de/..." //TODO: Add correct placeholder for submission link
							disabled={isSubmitting}
						/>
						<div className="text-left">
							{isTouched && errors.submissionLink && (
								<p className="text-red-500">
									{errors.submissionLink}
								</p>
							)}
							{submitError && (
								<p className="text-red-500">
									{submitError}
								</p>
							)}
							{submitSucess && (
								<p className="text-green-500">
									Solution{" "}
									{isSubmissionLinkExisting
										? "updated"
										: "submitted"}{" "}
									successfully.
								</p>
							)}
							{isSubmissionLinkExisting && lastUpdated && (
								<p className="mt-1 text-left text-xs text-gray-500">
									Last submitted:{" "}
									{new Date(lastUpdated).toLocaleString()}
								</p>
							)}
						</div>
					</div>

					<Button
						type="submit"
						className="h-14"
						disabled={!isValid || isSubmitting}
					>
						{isSubmitting
              ? "Submitting..."
              : isSubmissionLinkExisting
                ? "Update Solution"
                : "Submit Solution"}
					</Button>
				</div>
			</form>
		</div>
	);
};

export default SubmissionLinkUploader;
