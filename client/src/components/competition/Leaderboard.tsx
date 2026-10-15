import { useLeaderboard } from "@/hooks/useLeaderboard";
import SectionCard from "../common/SectionCard";
import TopNavBar from "../common/TopNavBar";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useEffect, useState } from "react";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "../ui/pagination";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Field, FieldLabel } from "../ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Spinner } from "../ui/spinner";
import { useLocation, useParams } from "react-router-dom";
import competitionApi from "@/services/api/competition";


const Leaderboard: React.FC = () => {
    // Get competitionId from URL params
    const { competitionId } = useParams<{ competitionId: string }>();
    const compId = Number(competitionId);
    // Get competitionName from location state
    const location = useLocation();
    const [competitionName, setCompetitionName] = useState<string>(location.state?.competitionName || "");

	const [activeTab, setActiveTab] = useState<string>("overall");
	const [page, setPage] = useState<number>(1);
	const [itemsPerPage, setItemsPerPage] = useState<number>(25);

	const selectedRound = activeTab === "overall" ? null : parseInt(activeTab, 10);

	// Use the custom hook to fetch leaderboard data and rounds
	const {
		leaderboardData: { data, pagination },
		rounds,
		isLoading,
		error,
	} = useLeaderboard(compId, selectedRound, page, itemsPerPage);

    useEffect(() => {
        if (!competitionName && compId) {
            // Fetch competition name if not available in location state
            competitionApi.getCompetitionById(compId).then((competition) => {
                if(competition) {
                    setCompetitionName(competition.name);
                }
            }).catch((error) => {
                console.error("Error fetching competition name:", error);
                setCompetitionName("Competition");
            });
        }
    }, [compId, competitionName]);



	const handleTabChange = (newTab: string) => {
		setActiveTab(newTab);
		setPage(1); // Reset page to 1 when changing tabs
	};

    const handleItemsPerPageChange = (newLimit: number) => {
        setItemsPerPage(newLimit);
        setPage(1); // Reset page to 1 when changing items per page to avoid out-of-bounds page numbers
    }

	const handlePreviousPage = () => {
		if (pagination && page > 1) {
			setPage(page - 1);
		}
	};

	const handleNextPage = () => {
		if (pagination && page < pagination.totalPages) {
			setPage(page + 1);
		}
	};

	return (
		<div className="min-h-screen">
			<TopNavBar title="Leaderboard" showBackButton={true} showUserInfo={true} />

			<div className="mx-auto max-w-6xl space-y-4 p-4">
				<SectionCard title={`Leaderboard for ${competitionName}`}>
                    {isLoading ? (
                        <div><Spinner /></div>
                    ) :(
                    error ? (
                        <div className="text-red-500">Error loading leaderboard: {error}</div>
                    ) : 
                    (
                    rounds.length === 0 && data.length === 0 ? (
                        <div>No leaderboard data available for this competition.</div>
                    ) : (
					<Tabs  defaultValue="overall" value={activeTab} onValueChange={handleTabChange}>
						<TabsList className="flex justify-start" aria-label="Select round to view leaderboard">
							<TabsTrigger  value="overall">
								Total for all evaluaded rounds
							</TabsTrigger>
							{rounds.map((roundNum: number) => (
								<TabsTrigger key={roundNum} value={String(roundNum)}>
									Runde {roundNum}
								</TabsTrigger>
							))}
						</TabsList>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Rank</TableHead>
									<TableHead>Pseudonym</TableHead>
									<TableHead>Score (RMSE)</TableHead>
									<TableHead>Inference time (ms)</TableHead>
									{activeTab != "overall" && (
										<TableHead>Completed at</TableHead>
									)}
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.map((entry) => (
									<TableRow key={entry.pseudonym}>
										<TableCell>{entry.rank}</TableCell>
										<TableCell>{entry.pseudonym}</TableCell>
										<TableCell>{Number(entry.score).toFixed(4)}</TableCell>
										<TableCell>{entry.inference_time_ms}</TableCell>
										{activeTab != "overall" && (
											<TableCell>{entry.completed_at ? new Date(entry.completed_at).toLocaleString() : "N/A"}</TableCell>
										)}
									</TableRow>
								))}
							</TableBody>
						</Table>
						{/* Pagination controls */}
						<div className="flex items-center justify-between gap-4">
							<Field orientation="horizontal" className="w-fit">
								<FieldLabel htmlFor="select-rows-per-page">Rows per page</FieldLabel>
								<Select defaultValue="25" value={String(itemsPerPage)} onValueChange={(value) => handleItemsPerPageChange(Number(value))}>
									<SelectTrigger className="w-20" id="select-rows-per-page">
										<SelectValue  />
									</SelectTrigger>
									<SelectContent align="start">
										<SelectGroup>
											<SelectItem value="10" >10</SelectItem>
											<SelectItem value="25">25</SelectItem>
											<SelectItem value="50">50</SelectItem>
											<SelectItem value="100">100</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
							</Field>
							<Pagination className="mx-0 w-auto">
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious onClick={handlePreviousPage} />
									</PaginationItem>
									<PaginationItem>
										<PaginationNext onClick={handleNextPage} />
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					</Tabs>
                    )))}
				</SectionCard>
			</div>
		</div>
	);
};
export default Leaderboard;
