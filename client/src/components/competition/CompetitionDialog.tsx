import { useCompetition } from "@/hooks/useCompetition";
import { Course } from "@/types/models";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { DateInput } from "../Administration/Course/components/CourseForm";
import { useEffect, useState } from "react";
import {
	CreateCompetitionDto,
	DatasetMetadata,
	DatasetType,
} from "@/types/competition.models";
import { Textarea } from "../ui/textarea";
import { DatasetUploader } from "./DatasetUploader";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import Label from "../common/Label";

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

const CompetitionDialog: React.FC<CompetitionDialogProps> = ({
	course,
	isOpen,
	onClose,
	onSuccess,
}) => {
	const {
		competition,
		isLoading,
		isActionLoading,
		createCompetition,
		updateCompetition,
		uploadDataset,
		downloadDataset,
	} = useCompetition(course.id, { fetchSubmission: false }); // fetchSubmission is set to false because we don't need to fetch the user's submission in this dialog and it will save an unnecessary API call when the dialog is opened.

	// Local state for competition form
	const [formData, setFormData] = useState<CreateCompetitionDto>(
		DEFAULT_COMPETITION_FORM_DATA,
	);
	const [trainingFile, setTrainingFile] = useState<File | null>(null);
	const [trainingDatasetMetadata, setTrainingDatasetMetadata] =
		useState<DatasetMetadata | null>(null);
	const [testFile, setTestFile] = useState<File | null>(null);
	const [testDatasetMetadata, setTestDatasetMetadata] =
		useState<DatasetMetadata | null>(null);

	const isEditMode = Boolean(competition?.id);

	// initialize form data with existing competition data or default values
	useEffect(() => {
		if (isOpen) {
			if (competition) {
				setFormData({
					name: competition.name || "",
					description: competition.description || "",
					start_date: competition.start_date
						? competition.start_date.substring(0, 10)
						: "",
					end_date: competition.end_date
						? competition.end_date.substring(0, 10)
						: "",
				});
				//If competition exists, datasets should also exist. Try to fetch them and set them in state. If they don't exist, set to null
				//TODO: Implement dataset fetching and setting in state
			} else {
				setFormData(DEFAULT_COMPETITION_FORM_DATA);
				setTrainingFile(null);
				setTrainingDatasetMetadata(null);

				setTestDatasetMetadata(null);
				setTestFile(null);
			}
		}
	}, [isOpen, competition]);

	const handleOpenChange = (open: boolean) => {
		if (!open) onClose();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			// create or update competition based on edit mode
			if (isEditMode && competition?.id) {
				await updateCompetition(
					formData.name,
					formData.description,
					formData.start_date,
					formData.end_date,
				);
			} else {
				await createCompetition(
					formData.name,
					formData.description,
					formData.start_date,
					formData.end_date,
				);
			}
			//upload or replace datasets if new files are selected (parallel upload for training and test datasets)
			const uploadPromises = [];
			if (trainingFile) {
				uploadPromises.push(
					uploadDataset(DatasetType.TRAIN, trainingFile),
				);
			}
			if (testFile) {
				uploadPromises.push(uploadDataset(DatasetType.TEST, testFile));
			}
			if (uploadPromises.length > 0) {
				await Promise.all(uploadPromises);
			}
			onSuccess?.();
			onClose();
		} catch (error) {
			console.error("Error saving competition:", error);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-2xl ">
				<DialogHeader>
					<DialogTitle>
						{isLoading
							? "Loading..."
							: isEditMode
								? "Edit Competition"
								: "Create Competition"}
					</DialogTitle>
				</DialogHeader>

				{/*TODO: handle loading state and error messages and form validation */}
				<form id="competitionForm" onSubmit={handleSubmit} className="mt-4 w-full min-w-0 space-y-4 max-h-[70vh] overflow-y-auto">
					<div className="w-full min-w-0 space-y-2">
						<Label>Competition name</Label>
						<Input
							type="text"
							id="competitionName"
                            className="w-full box-border" 
							value={formData.name}
							onChange={(e) =>
								setFormData({
									...formData,
									name: e.target.value,
								})
							}
						/>
					</div>
					<div className="w-full min-w-0 space-y-2">
						<Label>Competition description</Label>
						<Textarea
							id="competitionDescription"
							value={formData.description}
                            className="w-full box-border"
							onChange={(e) =>
								setFormData({
									...formData,
									description: e.target.value,
								})
							}
							rows={4}
						/>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="w-full min-w-0 space-y-2">
							<Label>Start date:</Label>
							<DateInput
								value={formData.start_date}
								onChange={(e) =>
									setFormData({
										...formData,
										start_date: e
											.toISOString()
											.substring(0, 10),
									})
								}
								className="my-2"
							/>
						</div>
						<div className="w-full min-w-0 space-y-2">
							<Label>End date:</Label>
							<DateInput
								value={formData.end_date}
								onChange={(e) =>
									setFormData({
										...formData,
										end_date: e
											.toISOString()
											.substring(0, 10),
									})
								}
								className="my-2"
							/>
						</div>
					</div>
					<p className="text-xs text-muted-foreground leading-relaxed break-words">
                        Choose training Dataset and evaluation dataset for the competition.
                        Both must contain ground truth data. 
                        The training dataset will be accessible by students to train their models, 
                        while the evaluation dataset will be used for the final evaluation.
                        To add evaluations before the final one, please create a schedule where you can add additional validation datasets.
					</p>
					{/* Dataset upload for trainig and test datasets */}
					<div className="w-full min-w-0 space-y-4">
						<DatasetUploader
							label="Training Dataset"
							type={DatasetType.TRAIN}
							existingMetadata={trainingDatasetMetadata}
							selectedFile={trainingFile}
							onFileSelect={setTrainingFile}
							onDownload={() => {
								downloadDataset(DatasetType.TRAIN);
							}}
						/>
						<DatasetUploader
							label="Dataset for final evaluation"
							type={DatasetType.TEST}
							existingMetadata={testDatasetMetadata}
							selectedFile={testFile}
							onFileSelect={setTestFile}
							onDownload={() => {
								downloadDataset(DatasetType.TEST);
							}}
						/>
					</div>
					
				</form>
                <DialogFooter className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={onClose}
							disabled={isActionLoading}
						>
							Close
						</Button>
						<Button type="submit" form="competitionForm" disabled={isActionLoading}>
							{isActionLoading
								? "Saving..."
								: isEditMode
									? "Update Competition"
									: "Create Competition"}
						</Button>
					</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
export default CompetitionDialog;
