import competitionApi from "@/services/api/competition";
import { Competition, DatasetType } from "@/types/competition.models";
import { useCallback, useEffect, useState } from "react";


/**
 * Competition hook to manage competition actions and dataset uploads/downloads. Manages competition state, loading states, and error handling. 
 * @param courseId 
 * @returns 
 */
export const useCompetition = (courseId: number | undefined) => {
    const [competition, setCompetition] = useState<Competition | null>(null);
    // Loading for first time fetch
    const[isLoading, setIsLoading] = useState<boolean>(true);
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
            }
        } catch (error) {
            setError("Failed to fetch competition data");
            console.error("Error fetching competition data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [courseId]);

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
                startDate,
                endDate
            });
            setCompetition(newCompetition);
            return newCompetition;
        } catch (error) {
            setError("Failed to create competition");
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
            setError("Failed to fetch competition by ID");
            throw error;
        } finally {
            setIsActionLoading(false);
        }
    };

    const uploadDataset = async (type: DatasetType, file: File) => { 
        if(!competition?.id) {
            setError("No competition found to upload dataset");
            return;
        }
        setIsActionLoading(true);
        setError(null);
        try {
            await competitionApi.uploadDataset(competition.id, type, file);
        } catch (error) {
            setError("Failed to upload dataset");
            throw error;
        } finally {
            setIsActionLoading(false);
        }
    };

    const downloadDataset = async (type: DatasetType) => {
        if(!competition?.id) {
            setError("No competition found to download dataset");
            return;
        }
        setIsActionLoading(true);
        setError(null);
        try {
            const blob = await competitionApi.downloadDatasetByType(competition.id, type);
            if(blob) {
                // Create a temporary link to download the blob 
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${type.toLowerCase()}_dataset_${competition.name}.zip`; // Title the file with the competition name and dataset type to show user which dataset they are downloading
                document.body.appendChild(link);
                link.click();
                link.remove();
                // Revoke the object URL after download to free up memory
                window.URL.revokeObjectURL(url);
            } else {
                setError("No dataset found for the specified type");
            }
        } catch (error) {
            setError("Failed to download dataset");
            throw error;
        } finally {
            setIsActionLoading(false);
        }
    };

    return {
        competition,
        isLoading,
        isActionLoading,
        error,
        fetchCompetiton,
        createCompetition,
        getCompetitionById,
        uploadDataset,
        downloadDataset
    };
}
