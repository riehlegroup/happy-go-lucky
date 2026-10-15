import { Database } from "sqlite";
import cron from "node-cron";

export class SchedulerService {
	constructor(private db: Database) {}

	public startScheduledTasks(): void {
		void this.startCompetitionEvaluationScheduler();
	}

	private async startCompetitionEvaluationScheduler(): Promise<void> {
		cron.schedule("0 16 * * *", async () => { // 16:00 PM every day (automatic summer/winter time adjustment is handled by the cron library)
			
			console.log(`Checking for due submissions}`);

            // submission dates are stored as dateTimeObject:Date.getTime() / 1000			
            const allSubmissions = await this.db.all(
				`SELECT id as submissionId, scheduleId as courseId, submissionDate 
                FROM submissions;`
			);
            const toBerlinDateString = (date: Date): string => 
                date.toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" }); // Format as YYYY-MM-DD

            const todayStr = toBerlinDateString(new Date());
            const dueSubmissions = allSubmissions.filter((submission: { submissionId: string; courseId: number; submissionDate: number }) => {
                // Convert the stored submission date (in seconds) back to a Date object
                const submissionDate = new Date(submission.submissionDate * 1000);
                // Only compare the date part, not the time
                return toBerlinDateString(submissionDate) === todayStr;
            });

            const competitionServiceUrl = process.env.INTERNAL_COMPETITION_SERVICE_URL || "http://competition-service:8081";

			for (const submission of dueSubmissions) {
                // Fetch all submissions for the course in ascending order to determine the round number
				const allSubmissionsOfCourse = await this.db.all(
					`SELECT id FROM submissions WHERE scheduleId = ? ORDER BY submissionDate ASC`,
					[submission.courseId],
				);

				const roudNumber = allSubmissionsOfCourse.findIndex((sub) => sub.id === submission.submissionId) + 1;
                if(roudNumber < 1) {
                    console.error(`Could not determine round number for submission ${submission.submissionId} of course ${submission.courseId}.`);
                    continue;
                } 
				try {
					// start evaluation for the submission
					const res = await fetch(`${competitionServiceUrl}/evaluations/courses/${submission.courseId}/start?round=${roudNumber}`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
                            "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
						},
					});

					if (!res.ok) {
						console.error(
							`Failed to start evaluation for course ${submission.courseId} and round ${roudNumber}. Status: ${res.status}`,
						);
					} else {
						console.log(
							`HGL: Successfully started evaluation for course ${submission.courseId} and round ${roudNumber}.`,
						);
					}
				} catch (error) {
					console.error(
						`Error while starting evaluation for course ${submission.courseId} and round ${roudNumber}:`,
						error,
					);
				}
			}
		}, 
        {
            timezone: "Europe/Berlin",
        });
	}
}
