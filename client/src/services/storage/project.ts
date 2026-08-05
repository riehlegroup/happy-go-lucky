
/**
 * Project storage service for managing selected project state
 */
class ProjectStorage {
  private static instance: ProjectStorage;
  private readonly SELECTED_PROJECT_KEY = "selectedProject";

  private constructor() {}

  static getInstance(): ProjectStorage {
    if (!ProjectStorage.instance) {
      ProjectStorage.instance = new ProjectStorage();
    }
    return ProjectStorage.instance;
  }

  getSelectedProjectId(): number | null {
    const itemId = localStorage.getItem(this.SELECTED_PROJECT_KEY);
    return itemId ? parseInt(itemId, 10) : null;
  }

  setSelectedProjectId(projectId: number): void {
    localStorage.setItem(this.SELECTED_PROJECT_KEY, projectId.toString());
  }

  clearSelectedProjectId(): void {
    localStorage.removeItem(this.SELECTED_PROJECT_KEY);
  }
}

export default ProjectStorage;
