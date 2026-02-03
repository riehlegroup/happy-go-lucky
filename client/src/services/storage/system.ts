const SHUTDOWN_IN_PROGRESS_KEY = "system.shutdown.inProgress";
const SHUTDOWN_EVENT_NAME = "system:shutdown";

class SystemStorage {
  private static instance: SystemStorage;

  static getInstance(): SystemStorage {
    if (!SystemStorage.instance) {
      SystemStorage.instance = new SystemStorage();
    }
    return SystemStorage.instance;
  }

  isShutdownInProgress(): boolean {
    return localStorage.getItem(SHUTDOWN_IN_PROGRESS_KEY) === "true";
  }

  setShutdownInProgress(inProgress: boolean): void {
    localStorage.setItem(SHUTDOWN_IN_PROGRESS_KEY, inProgress ? "true" : "false");
    window.dispatchEvent(new Event(SHUTDOWN_EVENT_NAME));
  }

  static shutdownEventName(): string {
    return SHUTDOWN_EVENT_NAME;
  }
}

export default SystemStorage;
