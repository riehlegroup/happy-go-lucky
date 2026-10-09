import competitionApi from "@/services/api/competition";
import { Competition, CompetitionSubmission, DatasetMetadata, DatasetType } from "@/types/competition.models";
import { useCallback, useEffect, useState } from "react";

function extractErrorMessage(error: unknown, fallbackMessage: string): string {
	if (error instanceof Error) {
		return error.message;
	}
	return fallbackMessage;
}

/**
 * Competition hook to manage competition actions and dataset uploads/downloads. Manages competition state, loading states, and error handling.
 * @param courseId
 * @param options options for the hook
 * @param options.fetchSubmission whether to fetch the user's submission for the competition. Defaults to true.
 * @returns
 */
export const useCompetition = (courseId: number | undefined, options = { fetchSubmission: true }) => {
	const [competition, setCompetition] = useState<Competition | null>(null);
	const [mySubmission, setMySubmission] = useState<CompetitionSubmission | null>(null);
	// Loading for first time fetch
	const [isLoading, setIsLoading] = useState<boolean>(true);
	// Loading for all mutations
	const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const fetchCompetiton = useCallback(async () => {
		if (!courseId) {
			setIsLoading(true);
			return;
		}
		setIsLoading(true);
		setError(null);
		try {
			const response = await competitionApi.getCompetitionByCourse(courseId);
			setCompetition(response);
			if (!response) {
				setError("No competition found for this course");
			} else if (response.id && options.fetchSubmission) {
				// try to find submission for the current user if competition is found
				const userSubmission = await competitionApi.getMySubmission(response.id);
				setMySubmission(userSubmission);
			}
		} catch (error) {
			setError(extractErrorMessage(error, "An unknown error occurred"));
			console.error("Error fetching competition data:", error);
		} finally {
			setIsLoading(false);
		}
	}, [courseId, options.fetchSubmission]);

	// fetch competition when component loads the first time
	useEffect(() => {
		fetchCompetiton();
	}, [fetchCompetiton]);

	const createCompetition = async (name: string, description: string, startDate: string, endDate: string) => {
		if (!courseId) {
			setError("Course ID is undefined");
			return;
		}
		setIsActionLoading(true);
		setError(null);
		try {
			const newCompetition = await competitionApi.createCompetition({
				name,
				description,
				courseId,
				start_date: startDate,
				end_date: endDate,
			});
			setCompetition(newCompetition);
			return newCompetition;
		} catch (error) {
			setError(extractErrorMessage(error, "Failed to create competition"));
			throw error;
		} finally {
			setIsActionLoading(false);
		}
	};

	const getCompetitionById = async (competitionId: number) => {
		setIsActionLoading(true);
		setError(null);
		try {
			const competition = await competitionApi.getCompetitionById(competitionId);
			setCompetition(competition);
			return competition;
		} catch (error) {
			setError(extractErrorMessage(error, "Failed to fetch competition by ID"));
			throw error;
		} finally {
			setIsActionLoading(false);
		}
	};

	const updateCompetition = async (name: string, description: string, startDate: string, endDate: string) => {
		if (!competition?.id) {
			setError("No competition found to update");
			return;
		}
		setIsActionLoading(true);
		setError(null);
		try {
			const updatedCompetition = await competitionApi.updateCompetition(competition.id, {
				name,
				description,
				start_date: startDate,
				end_date: endDate,
			});
			setCompetition(updatedCompetition);
			return updatedCompetition;
		} catch (error) {
			setError(extractErrorMessage(error, "Failed to update competition"));
			throw error;
		} finally {
			setIsActionLoading(false);
		}
	};

	const uploadDataset = async (type: DatasetType, file: File) => {
		if (!competition?.id) {
			setError("No competition found to upload dataset");
			return;
		}
		setIsActionLoading(true);
		setError(null);
		try {
			await competitionApi.uploadDataset(competition.id, type, file);
		} catch (error) {
			setError(extractErrorMessage(error, "Failed to upload dataset"));
			throw error;
		} finally {
			setIsActionLoading(false);
		}
	};

	const downloadDataset = async (type: DatasetType) => {
		if (!competition?.id) {
			setError("No competition found to download dataset");
			return;
		}
		setIsActionLoading(true);
		setError(null);
		try {
			const blob = await competitionApi.downloadDatasetByType(competition.id, type);
			if (blob) {
				// Create a temporary link to download the blob
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				link.download = `${type.toLowerCase()}_dataset_${competition.name}.csv`; // Title the file with the competition name and dataset type to show user which dataset they are downloading
				document.body.appendChild(link);
				link.click();
				link.remove();
				// Revoke the object URL after download to free up memory
				window.URL.revokeObjectURL(url);
			} else {
				setError("No dataset found for the specified type");
			}
		} catch (error) {
			setError(extractErrorMessage(error, "Failed to download dataset"));
			throw error;
		} finally {
			setIsActionLoading(false);
		}
	};

    const getDatasetMetadata = async (type: DatasetType) => {
        if (!competition?.id) {
            setError("No competition found to get dataset metadata");
            return;
        }
        setIsActionLoading(true);
        setError(null);
        try {
            const datasetMetadata: DatasetMetadata = await competitionApi.getDatasetMetadataByType(competition.id, type);
            if (!datasetMetadata) {
                setError("No dataset metadata found for the specified type");
            }
            return datasetMetadata;
        } catch (error) {
            setError(extractErrorMessage(error, "Failed to get dataset metadata"));
            throw error;
        } finally {
            setIsActionLoading(false);
        }
    }

    const deleteDataset = async (datasetId: number) => {
        if (!competition?.id) {
            setError("No competition found to delete dataset");
            return;
        }
        setIsActionLoading(true);
        setError(null);
        try {
            await competitionApi.deleteDataset(competition.id, datasetId);
        } catch (error) {
            setError(extractErrorMessage(error, "Failed to delete dataset"));
            throw error;
        } finally {
            setIsActionLoading(false);
        }
    }

	const submitCompetitionSubmission = async (submissionLink: string) => {
		if (!competition?.id) {
			setError("No competition found to submit submission link");
			return;
		}
		setIsActionLoading(true);
		setError(null);
		try {
			const submission = await competitionApi.submitCompetitionSubmission(competition.id, submissionLink);
			setMySubmission(submission);
			return submission;
		} catch (error) {
			setError(extractErrorMessage(error, "Failed to submit competition submission"));
			throw error;
		} finally {
			setIsActionLoading(false);
		}
	};

	return {
		competition,
		mySubmission,
		isLoading,
		isActionLoading,
		error,
		fetchCompetiton,
		createCompetition,
		getCompetitionById,
		updateCompetition,
		uploadDataset,
		downloadDataset,
        getDatasetMetadata,
        deleteDataset,
		submitCompetitionSubmission,
	};
};
