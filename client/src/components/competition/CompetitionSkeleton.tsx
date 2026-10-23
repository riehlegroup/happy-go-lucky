import React from "react";
import TopNavBar from "../common/TopNavBar";
import SectionCard from "../common/SectionCard";
import { Skeleton } from "../ui/skeleton";

export const CompetitionSkeleton: React.FC = () => {
	return (
		<div className="min-h-screen select-none" role="status" aria-busy="true">
			<span className="sr-only">Competition data is loading...</span>

			<TopNavBar title="Competition" showBackButton={true} showUserInfo={true} />

			<div className="pointer-events-none mx-auto max-w-6xl space-y-4 p-4">
				{/* Card 1: Details and Download-Actions */}
				<SectionCard title={<Skeleton className="my-1 h-7 w-56" />}>
					<div className="mb-3 flex items-center justify-between gap-4">
						<Skeleton className="h-6 w-28" />
						<div className="flex gap-4">
							{/* Download Training Dataset Button */}
							<Skeleton className="h-10 w-52 rounded-md" />
							{/* Leaderboard Button */}
							<Skeleton className="h-10 w-28 rounded-md" />
						</div>
					</div>

					{/* Description */}
					<div className="space-y-2.5 py-1">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-11/12" />
						<Skeleton className="h-4 w-3/4" />
					</div>

					{/* Guidelines */}
					<div className="my-4 pt-1">
						<Skeleton className="h-5 w-96 max-w-full" />
					</div>
				</SectionCard>

				{/* Card 2: Link Submission */}
				<SectionCard title="Solution Submission">
					<div className="mr-4 flex flex-col gap-4">
						{/* Pseudonym & Link Input fields */}
						<Skeleton className="h-10 w-full rounded-md" />
						<Skeleton className="h-10 w-full rounded-md" />
					</div>

					<div className="mt-4 flex justify-end">
						<Skeleton className="h-14 w-36 rounded-md" />
					</div>
				</SectionCard>
			</div>
		</div>
	);
};

export default CompetitionSkeleton;