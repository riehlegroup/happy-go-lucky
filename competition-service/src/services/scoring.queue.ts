export class ScoringQueue {
	private queue: (() => Promise<void>)[] = [];
	private isProcessing: boolean = false;

	public enqueue(task: () => Promise<void>): void {
		this.queue.push(task);
		this.processNextEntry();
	}

	private async processNextEntry(): Promise<void> {
		if (this.isProcessing || this.queue.length === 0) {
			return;
		}

		this.isProcessing = true;

		const task = this.queue.shift();
		if (task) {
			try {
				await task();
			} catch (error) {
				console.error("Error processing task in prediction queue:", error);
			}
		}

		this.isProcessing = false;

		// start processing next recursively
		this.processNextEntry();
	}
}
