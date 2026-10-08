import { useCompetition } from "@/hooks/useCompetition";
import { Course } from "@/types/models";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { DateInput } from "../Administration/Course/components/CourseForm";
import { useEffect, useState } from "react";
import { CreateCompetitionDto, DatasetMetadata, DatasetType } from "@/types/competition.models";
import { Textarea } from "../ui/textarea";
import { DatasetUploader } from "./DatasetUploader";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import Label from "../common/Label";
import coursesApi from "@/services/api/courses";

interface CompetitionDialogProps {
	course: Course;
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}
const DEFAULT_COMPETITION_FORM_DATA = {
	name: "",
	description: "",
	start_date: "",
	end_date: "",
};

const CompetitionDialog: React.FC<CompetitionDialogProps> = ({ course, isOpen, onClose, onSuccess }) => {
	const {
		competition,
		isLoading,
		isActionLoading,
		createCompetition,
		updateCompetition,
		uploadTrainingDataset,
		uploadRoundDataset,
		getDatasetMetadata,
		downloadDataset,
		deleteDataset,
	} = useCompetition(course.id, { fetchSubmission: false }); // fetchSubmission is set to false because we don't need to fetch the user's submission in this dialog and it will save an unnecessary API call when the dialog is opened.

	// Local state for competition form
	const [formData, setFormData] = useState<CreateCompetitionDto>(DEFAULT_COMPETITION_FORM_DATA);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	// Local state for dataset files and metadata
	const [trainingFile, setTrainingFile] = useState<File | null>(null);
	const [trainingDatasetMetadata, setTrainingDatasetMetadata] = useState<DatasetMetadata | null>(null);
	const [selectedRoundFiles, setSelectedRoundFiles] = useState<
		Record<number, { inputFile: File | null; groundTruthFile: File | null }>
	>({});
	const [roundDatasetMetadata, setRoundDatasetMetadata] = useState<
		Record<number, { inputMetadata?: DatasetMetadata; groundTruthMetadata?: DatasetMetadata }>
	>({});
	const [submissionDates, setSubmissionDates] = useState<string[]>([]);

	const isEditMode = Boolean(competition?.id);

	const loadData = async () => {
		try {
			setErrorMessage(null);
			if (!course.id) {
				setErrorMessage("Course ID is undefined");
				return;
			}
			const schedule = await coursesApi.getSchedule(course.id);
			const sortedSubmissionDates = (schedule?.submissionDates || []).sort(
				(a: string, b: string) => new Date(a).getTime() - new Date(b).getTime(),
			);
			setSubmissionDates(sortedSubmissionDates);
			if (competition) {
				setFormData({
					name: competition.name || "",
					description: competition.description || "",
					start_date: competition.start_date ? competition.start_date.substring(0, 10) : "",
					end_date: competition.end_date ? competition.end_date.substring(0, 10) : "",
				});
				//If competition exists, datasets should also exist. Try to fetch them and set them in state. If they don't exist, set to null
				let datasetMetadata = await getDatasetMetadata();
				if (datasetMetadata) {
					const trainingMetadata = datasetMetadata.find((d) => d.dataset_type === DatasetType.TRAIN);
					setTrainingDatasetMetadata(trainingMetadata || null);

					const roundMetadataMap: Record<
						number,
						{ inputMetadata?: DatasetMetadata; groundTruthMetadata?: DatasetMetadata }
					> = datasetMetadata.reduce(
						(acc, d) => {
							if (d.dataset_type === DatasetType.INPUT || d.dataset_type === DatasetType.GROUND_TRUTH) {
								if (d.round === null || d.round === undefined) {
									return acc; // Skip datasets without a round number
								}
								const current = acc[d.round] || {};
								acc[d.round] = {
									inputMetadata: d.dataset_type === DatasetType.INPUT ? d : current.inputMetadata,
									groundTruthMetadata:
										d.dataset_type === DatasetType.GROUND_TRUTH ? d : current.groundTruthMetadata,
								};
							}
							return acc;
						},
						{} as Record<number, { inputMetadata?: DatasetMetadata; groundTruthMetadata?: DatasetMetadata }>,
					);
					setRoundDatasetMetadata(roundMetadataMap);
				} else {
					setTrainingDatasetMetadata(null);
					setRoundDatasetMetadata({});
				}
			} else {
				setFormData(DEFAULT_COMPETITION_FORM_DATA);
				setTrainingFile(null);
				setTrainingDatasetMetadata(null);
				setSelectedRoundFiles({});
			}
		} catch (error) {
			console.error("Error loading competition data:", error);
			setErrorMessage("Failed to load competition data. Please try again.");
		}
	};

	// initialize form data with existing competition data or default values
	useEffect(() => {
		if (isOpen) {
			loadData();
		}
	}, [isOpen, competition]);

	const handleOpenChange = (open: boolean) => {
		if (!open) onClose();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrorMessage(null);
		if (!formData.name.trim()) {
			setErrorMessage("Please provide a name for the competition.");
			return;
		}
		if (!formData.description.trim()) {
			setErrorMessage("Please provide a description for the competition.");
			return;
		}
		if (formData.start_date && formData.end_date) {
			if (new Date(formData.start_date) > new Date(formData.end_date)) {
				setErrorMessage("Start date cannot be after end date.");
				return;
			}
		}

		try {
			// validate datasets
			if (selectedRoundFiles && Object.keys(selectedRoundFiles).length > 0) {
				for (const [round, files] of Object.entries(selectedRoundFiles)) {
					if ((files.inputFile && !files.groundTruthFile) || (!files.inputFile && files.groundTruthFile)) {
						setErrorMessage(`Both input and ground truth files must be selected for round ${round}.`);
						return;
					}
				}
			}
			// create or update competition based on edit mode
			let competitionId: number | undefined;
			if (isEditMode && competition?.id) {
				const result = await updateCompetition(
					formData.name,
					formData.description,
					formData.start_date,
					formData.end_date,
				);
				if (result && result.id) {
					competitionId = result.id;
				} else {
					throw new Error("Failed to update competition. No ID returned.");
				}
			} else {
				const result = await createCompetition(
					formData.name,
					formData.description,
					formData.start_date,
					formData.end_date,
				);
				if (result && result.id) {
					competitionId = result.id;
				} else {
					throw new Error("Failed to create competition. No ID returned.");
				}
			}
			//upload datasets if new files are selected (parallel upload for training and test datasets)
			const uploadPromises = [];
			if (trainingFile) {
				uploadPromises.push(uploadTrainingDataset(trainingFile, competitionId));
			}
			if (selectedRoundFiles && Object.keys(selectedRoundFiles).length > 0) {
				for (const [round, files] of Object.entries(selectedRoundFiles)) {
					uploadPromises.push(
						uploadRoundDataset(Number(round), files.inputFile!, files.groundTruthFile!, competitionId),
					);
				}
			}
			if (uploadPromises.length > 0) {
				await Promise.all(uploadPromises);
			}
			onSuccess?.();
			onClose();
		} catch (error: unknown) {
			console.error("Error saving competition:", error);
			let errorMsg = "An unknown error occurred while saving the competition.";
			if (error instanceof Error) {
				errorMsg = error.message;
			} else if (typeof error === "string") {
				errorMsg = error;
			}
			setErrorMessage(errorMsg);
		}
	};

	const handleDeleteDataset = async (datasetId: number) => {
		if (!competition?.id) {
			console.error("No competition found to delete dataset");
			return;
		}
		setErrorMessage(null);
		try {
			if (window.confirm("Are you sure you want to delete this dataset? This action cannot be undone.")) {
				await deleteDataset(datasetId);
				setTrainingDatasetMetadata(null);
				await loadData(); // Refresh the dataset metadata after deletion
			}
		} catch (error: unknown) {
			console.error("Error deleting dataset:", error);
			let message = "Failed to delete dataset. Please try again.";
			if (error instanceof Error) {
				message = error.message;
			}else if (typeof error === "string") {
				message = error;
			}
			setErrorMessage(message);
		}
	};

	// orphaned datasets detection: if a dataset exists for a round that is greater than the number of submission dates, it is considered orphaned.
	// This can happen if a dataset was uploaded for a round that was later removed from the competition schedule.
	// We will display a warning message in the dialog if any orphaned datasets are detected.
	const orphanedRounds = Object.keys(roundDatasetMetadata)
		.map(Number)
		.filter((round) => round > submissionDates.length);

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-2xl ">
				<DialogHeader>
					<DialogTitle>{isLoading ? "Loading..." : isEditMode ? "Edit Competition" : "Create Competition"}</DialogTitle>
				</DialogHeader>

				<form
					id="competitionForm"
					onSubmit={handleSubmit}
					className="mt-4 max-h-[70vh] w-full min-w-0 space-y-4 overflow-y-auto"
				>
					<div className="w-full min-w-0 space-y-2">
						<Label>Competition name</Label>
						<Input
							type="text"
							id="competitionName"
							className="box-border w-full"
							value={formData.name}
							onChange={(e) => {
								setErrorMessage(null);
								setFormData({
									...formData,
									name: e.target.value,
								});
							}}
						/>
					</div>
					<div className="w-full min-w-0 space-y-2">
						<Label>Competition description</Label>
						<Textarea
							id="competitionDescription"
							value={formData.description}
							className="box-border w-full"
							onChange={(e) => {
								setErrorMessage(null);
								setFormData({
									...formData,
									description: e.target.value,
								});
							}}
							rows={4}
						/>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="w-full min-w-0 space-y-2">
							<Label>Start date:</Label>
							<DateInput
								value={formData.start_date}
								onChange={(e) => {
									setErrorMessage(null);
									setFormData({
										...formData,
										start_date: e.toISOString().substring(0, 10),
									});
								}}
								className="my-2"
							/>
						</div>
						<div className="w-full min-w-0 space-y-2">
							<Label>End date:</Label>
							<DateInput
								value={formData.end_date}
								onChange={(e) => {
									setErrorMessage(null);
									setFormData({
										...formData,
										end_date: e.toISOString().substring(0, 10),
									});
								}}
								className="my-2"
							/>
						</div>
					</div>
					{/* Dataset upload*/}
					<div className="w-full min-w-0 space-y-4">
						<DatasetUploader
							label="Training Dataset"
							type={DatasetType.TRAIN}
							existingMetadata={trainingDatasetMetadata}
							selectedFile={trainingFile}
							onFileSelect={(file) => {
								setErrorMessage(null);
								setTrainingFile(file);
							}}
							onDownload={() => {
								downloadDataset(trainingDatasetMetadata!.id, trainingDatasetMetadata!.file_name);
							}}
							onDelete={() => {
								if (trainingDatasetMetadata) {
									handleDeleteDataset(trainingDatasetMetadata.id);
								}
							}}
						/>
					</div>
					{/* Round overview and round dataset upload */}
					<div className="w-full min-w-0 space-y-4">
						{submissionDates.length === 0 && (
							<div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
								No submission dates found for this course. Please add submission dates in the course schedule to
								enable dataset uploads for each competition round.
							</div>
						)}
						{orphanedRounds.length > 0 && (
							<div className="space-y-2 rounded-md border border-red-300 bg-red-50 p-3">
								<span className="text-sm font-semibold text-red-800">
									There are datasets assigned to round numbers that exceed the current schedule. This means that
									there are orphaned datasets. Probably the submission dates were removed from the course
									schedule after the datasets were uploaded.
								</span>
								{orphanedRounds.map((r) => (
									<div key={r} className="flex items-center justify-between text-xs text-red-700">
										<span>Round {r} (Not in the schedule)</span>
										<div className="flex gap-2">
											{roundDatasetMetadata[r]?.inputMetadata && (
												<Button
													type="button"
													size="sm"
													variant="destructive"
													onClick={() =>
														handleDeleteDataset(roundDatasetMetadata[r]!.inputMetadata!.id)
													}
												>
													Delete input {r}
												</Button>
											)}
											{roundDatasetMetadata[r]?.groundTruthMetadata && (
												<Button
													type="button"
													size="sm"
													variant="destructive"
													onClick={() =>
														handleDeleteDataset(roundDatasetMetadata[r]!.groundTruthMetadata!.id)
													}
												>
													delete ground truth {r}
												</Button>
											)}
										</div>
									</div>
								))}
							</div>
						)}
						{/* Dataset upload for each round */}
						{submissionDates.length > 0 && (
							<div className="space-y-4">
								<Label className=" text-base font-semibold">Evaluation Rounds</Label>
								<div className="space-y-4">
									{submissionDates.map((date, index) => {
										const roundNumber = index + 1;
										const dateFormatted = new Date(date).toLocaleDateString("de-De");
										const inputMetadata = roundDatasetMetadata[roundNumber]?.inputMetadata;
										const groundTruthMetadata = roundDatasetMetadata[roundNumber]?.groundTruthMetadata;
										const isReady = Boolean(inputMetadata && groundTruthMetadata);
										const selectedInputFile = selectedRoundFiles[roundNumber]?.inputFile || null;
										const selectedGroundTruthFile = selectedRoundFiles[roundNumber]?.groundTruthFile || null;

										return (
											<div
												key={roundNumber}
												className={`rounded-lg border p-4 ${isReady ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-slate-50"}`}
											>
												<div className="mb-2 flex items-center justify-between border-b pb-2">
													<div>
														<span className="text-sm font-bold">Round {roundNumber}</span>
														<span className="ml-2 text-xs text-slate-500">
															Planned for: <strong>{dateFormatted}</strong>
														</span>
													</div>
													<span
														className={`rounded px-2 py-0.5 text-xs font-medium ${
															isReady
																? "bg-emerald-100 text-emerald-800"
																: "bg-amber-100 text-amber-800"
														}`}
													>
														{" "}
														{isReady ? "Ready for evaluation" : "Datasets incomplete"}
													</span>
												</div>
												<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
													<DatasetUploader
														label="Input dataset (CSV)"
														type={DatasetType.INPUT}
														existingMetadata={inputMetadata}
														selectedFile={selectedInputFile}
														onFileSelect={(file) => {
															setErrorMessage(null);
															setSelectedRoundFiles((prev) => ({
																...prev,
																[roundNumber]: {
																	...prev[roundNumber],
																	inputFile: file,
																},
															}));
														}}
														onDownload={() => downloadDataset(inputMetadata!.id, inputMetadata!.file_name)}
														onDelete={() => {
															handleDeleteDataset(inputMetadata!.id);
														}}
														disabled={isActionLoading}
													/>
													<DatasetUploader
														label="Ground truth dataset (CSV)"
														type={DatasetType.GROUND_TRUTH}
														existingMetadata={groundTruthMetadata}
														selectedFile={selectedGroundTruthFile}
														onFileSelect={(file) => {
															setErrorMessage(null);
															setSelectedRoundFiles((prev) => ({
																...prev,
																[roundNumber]: {
																	...prev[roundNumber],
																	groundTruthFile: file,
																},
															}));
														}}
														onDownload={() => downloadDataset(groundTruthMetadata!.id, groundTruthMetadata!.file_name)}
														onDelete={() => {
															handleDeleteDataset(groundTruthMetadata!.id);
														}}
														disabled={isActionLoading}
													/>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>
				</form>
				<DialogFooter className="flex justify-end gap-2">
					{errorMessage && (
						<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
							{errorMessage}
						</div>
					)}
					<Button variant="outline" onClick={onClose} disabled={isActionLoading}>
						Close
					</Button>
					<Button type="submit" form="competitionForm" disabled={isActionLoading}>
						{isActionLoading ? "Saving..." : isEditMode ? "Update Competition" : "Create Competition"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
export default CompetitionDialog;
