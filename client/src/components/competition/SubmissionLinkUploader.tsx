import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { createCompetitionSubmissionValidation, useForm } from "@/hooks/useForm";

interface SubmissinLinkUploaderProps {
	existingSubmissionLink?: string;
	existingPseudonym?: string;
	lastUpdated?: string;
	isSubmitting?: boolean;
	onSubmit: (submissionLink: string, pseudonym: string) => void;
}

export const SubmissionLinkUploader: React.FC<SubmissinLinkUploaderProps> = ({
	existingSubmissionLink = "",
	existingPseudonym = "",
	lastUpdated,
	isSubmitting,
	onSubmit,
}) => {
	const [submitSucess, setSubmitSuccess] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isTouched, setIsTouched] = useState(false);
	const isSubmissionLinkExisting = Boolean(existingSubmissionLink);

	const { data, errors, isValid, handleChanges } = useForm(
		{ submissionLink: existingSubmissionLink, pseudonym: existingPseudonym },
		createCompetitionSubmissionValidation(),
	);

	// if submission link is asynchronously updated, we need to update the form data accordingly
	useEffect(() => {
		if (existingSubmissionLink && existingSubmissionLink !== data.submissionLink) {
			handleChanges("submissionLink", existingSubmissionLink);
		}
		if( existingPseudonym && existingPseudonym !== data.pseudonym) {
			handleChanges("pseudonym", existingPseudonym);
		}
	}, [existingSubmissionLink, existingPseudonym]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isValid || isSubmitting) {
			return;
		}
		setSubmitError(null);
		setSubmitSuccess(false);
		try {
			await onSubmit(data.submissionLink, data.pseudonym);
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
				<div className="flex flex-col gap-4 mr-4">
					<div>
						<Input
							type="text"
							name="pseudonym"
							id="pseudonymInput"
							value={data.pseudonym}
							onChange={(e) => {
								handleChanges("pseudonym", e.target.value);
								setIsTouched(true);
								if (submitSucess) setSubmitSuccess(false);
								if (submitError) setSubmitError(null);
							}}
							className="w-full"
							placeholder="Enter your pseudonym"
							disabled={isSubmitting}
						/>
						<div className="text-left">
							{isTouched && errors.pseudonym && <p className="text-red-500">{errors.pseudonym}</p>}
						</div>
					</div>
					<div className="">
						<Input
							type="url"
							name="submissionLink"
							id="submissionLinkInput"
							value={data.submissionLink}
							onChange={(e) => {
								handleChanges("submissionLink", e.target.value);
								setIsTouched(true);
								if (submitSucess) setSubmitSuccess(false);
								if (submitError) setSubmitError(null);
							}}
							className="w-full"
							placeholder="https://rrze.uni-erlangen.de/..." //TODO: Add correct placeholder for submission link
							disabled={isSubmitting}
						/>
						<div className="text-left">
							{isTouched && errors.submissionLink && <p className="text-red-500">{errors.submissionLink}</p>}
							{submitError && <p className="text-red-500">{submitError}</p>}
							{submitSucess && (
								<p className="text-green-500">
									Solution {isSubmissionLinkExisting ? "updated" : "submitted"} successfully.
								</p>
							)}
						</div>
					</div>
          </div>

					<div className="text-right col-span-2 mt-4">
						<Button type="submit" className="h-14" disabled={!isValid || isSubmitting}>
							{isSubmitting ? "Submitting..." : isSubmissionLinkExisting ? "Update Solution" : "Submit Solution"}
						</Button>
						<div className="">
							{isSubmissionLinkExisting && lastUpdated && (
								<p className="mt-1 text-xs text-gray-500">
									Last update: {new Date(lastUpdated).toLocaleString()}
								</p>
							)}
						</div>
					</div>
			</form>
		</div>
	);
};

export default SubmissionLinkUploader;
