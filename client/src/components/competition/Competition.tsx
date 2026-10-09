import React, { useEffect } from "react";
import TopNavBar from "../common/TopNavBar";
import SectionCard from "../common/SectionCard";
import SubmissionLinkUploader from "./SubmissionLinkUploader";
import { useCompetition } from "@/hooks/useCompetition";
import { DatasetMetadata, DatasetType, RoundResultForUserDto } from "@/types/competition.models";
import Button from "../common/Button";
import { useActiveProject } from "@/context/ActiveProjectContext";
import { CompetitionSkeleton } from "./CompetitionSkeleton";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { useNavigate } from "react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

const Competition: React.FC = () => {
	const navigate = useNavigate();
	const { activeProject } = useActiveProject();
	const {
		competition,
		mySubmission,
		isLoading,
		isActionLoading,
		error,
		downloadDataset,
		getDatasetMetadata,
		submitCompetitionSubmission,
		getMyEvaluationResults,
	} = useCompetition(activeProject?.courseId);
	const [trainingDatasetMetadata, setTrainingDatasetMetadata] = React.useState<DatasetMetadata | null>(null);
	const [evaluationResults, setEvaluationResults] = React.useState<RoundResultForUserDto[]>([]);
	const showSkeleton = useDelayedLoading(isLoading, {
		delay: 200,
		minDuration: 400,
	});

	const fetchTrainingDatasetMetadata = async () => {
		if (competition) {
			try {
				const metadata = await getDatasetMetadata(DatasetType.TRAIN);
				if (metadata && metadata.length === 1) {
					setTrainingDatasetMetadata(metadata[0]);
				} else {
					setTrainingDatasetMetadata(null);
				}
			} catch (error) {
				console.error("Error fetching training dataset metadata:", error);
			}
		}
	};
	const fetchEvaluationResultsforUser = async () => {
		if (competition) {
			try {
				const results = await getMyEvaluationResults();
				if (results) {
					setEvaluationResults(results);
				} else {
					setEvaluationResults([]);
				}
			} catch (error) {
				setEvaluationResults([]);
				console.error("Error fetching user evaluation results:", error);
			}
		}
	};

	useEffect(() => {
		fetchTrainingDatasetMetadata();
		fetchEvaluationResultsforUser();
	}, [competition]);

	const goToLeaderboard = () => {
		if (competition?.id) {
			navigate(`/competition/${competition.id}/leaderboard`, { state: { competitionName: competition.name } });
		}
	};

	//TODO: add example Link
	const submissionGuidelines = (
		<div>
			<p>
				To participate in the competition, you need to submit a link to your solution. Your solution must be hosted in the
				rrze clound and must implent the basic API structure as this example. For each competition a trainings dataset
				will be provided to you to train your model. After training your model, different rounds with different evaluation
				datasets will be evaluated. Your own score will be calculated based on the performance of your model on the
				evaluation datasets and displayed on this page and on the leaderboards (under your pseudonym).
			</p>
		</div>
	);

	// Show skeleton if loading or if competition data is not yet available
	if (showSkeleton || (isLoading && !competition)) {
		return <CompetitionSkeleton />;
	}

	//Handle error state if no competition is found but loading is complete
	if (!competition) {
		return <div>No competition found or an error occurred: {error}</div>; //TODO: Add reusable error page component
	}

	return (
		<div className="min-h-screen">
			<TopNavBar title="Competition" showBackButton={true} showUserInfo={true} />

			<div className="mx-auto max-w-6xl space-y-4 p-4">
				<SectionCard title={competition.name}>
					<div className="mb-3 flex items-center justify-between gap-4">
						<h3 className="text-lg font-semibold">Description</h3>
						<div className="flex gap-4">
							<Button
								onClick={() => (trainingDatasetMetadata ? downloadDataset(trainingDatasetMetadata?.id) : null)}
								disabled={isActionLoading || !trainingDatasetMetadata}
							>
								Download Training Dataset
							</Button>
							<Button onClick={() => goToLeaderboard()} disabled={isActionLoading}>
								Leaderboard
							</Button>
						</div>
					</div>
					<div className="text-left">{competition.description}</div>

					<details className="my-4 text-left">
						<summary className="cursor-pointer font-bold hover:text-blue-600">Submission Guidelines</summary>
						<div className="mt-2">
							<p>{submissionGuidelines}</p>
						</div>
					</details>
				</SectionCard>
				<SectionCard title="Solution Submission">
					<div>
						<SubmissionLinkUploader
							existingSubmissionLink={mySubmission?.apiUrl}
							existingPseudonym={mySubmission?.pseudonym}
							lastUpdated={mySubmission?.updatedAt}
							isSubmitting={isActionLoading}
							onSubmit={(link: string, pseudonym: string) => submitCompetitionSubmission(link, pseudonym)}
						/>
					</div>
				</SectionCard>
				{evaluationResults.length > 0 && (
				<SectionCard title="Results of evaluated rounds">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Round</TableHead>
								<TableHead>Score (RSME)</TableHead>
								<TableHead>Inference time (ms)</TableHead>
								<TableHead>started at</TableHead>
								<TableHead>Completed at</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Error message</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{evaluationResults.sort((a, b) => a.round - b.round).map((entry) => (
								<TableRow key={entry.round}>
									<TableCell>{entry.round}</TableCell>
									<TableCell>{Number(entry.score).toFixed(4)}</TableCell>
									<TableCell>{entry.inference_time_ms}</TableCell>
									<TableCell>
										{entry.started_at ? new Date(entry.started_at).toLocaleString() : "N/A"}
									</TableCell>
									<TableCell>
										{entry.completed_at ? new Date(entry.completed_at).toLocaleString() : "N/A"}
									</TableCell>
									<TableCell>{entry.status}</TableCell>
									<TableCell>{entry.error_message}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</SectionCard>
				)}
			</div>
		</div>
	);
};

export default Competition;
