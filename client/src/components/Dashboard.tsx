import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import TopNavBar from "@/components/common/TopNavBar";
import Button from "@/components/common/Button";
import SectionCard from "@/components/common/SectionCard";
import { useUserRole } from "@/hooks/useUserRole";
import AuthStorage from "@/services/storage/auth";
import ProjectStorage from "@/services/storage/project";
import projectsApi from "@/services/api/projects";
import adminApi from "@/services/api/admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [shutdownDialogOpen, setShutdownDialogOpen] = useState(false);
  const [shutdownPending, setShutdownPending] = useState(false);
  const [shutdownError, setShutdownError] = useState<string | null>(null);
  const [shutdownInProgress, setShutdownInProgress] = useState(false);
  const userRole = useUserRole();

  const authStorage = AuthStorage.getInstance();
  const projectStorage = ProjectStorage.getInstance();

  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) {
      navigate("/login");
    }

    const fetchProjects = async () => {
      const userEmail = authStorage.getEmail();
      if (userEmail) {
        try {
          const data = await projectsApi.getUserProjects(userEmail);
          const projectNames = data.map((project) => project.projectName);
          setProjects(projectNames);

          // Restore selected project from localStorage
          const savedProject = projectStorage.getSelectedProject();
          if (savedProject && projectNames.includes(savedProject)) {
            setSelectedProject(savedProject);
          }
        } catch (error) {
          console.error("Error fetching projects:", error);
        }
      }
    };

    fetchProjects();
  }, [navigate, authStorage]);

  useEffect(() => {
    if (userRole !== "ADMIN") {
      return;
    }

    const load = async () => {
      try {
        const status = await adminApi.getShutdownStatus();
        setShutdownInProgress(Boolean(status.isShuttingDown));
      } catch {
        // ignore (e.g., server down)
      }
    };

    void load();
  }, [userRole]);

  const handleProjectChange = (projectName: string) => {
    setSelectedProject(projectName);
    projectStorage.setSelectedProject(projectName);
  };

  const goToStandups = () => {
    if (selectedProject) {
      navigate("/standups", { state: { projectName: selectedProject } });
    }
  };

  const goHappiness = () => {
    if (selectedProject) {
      navigate("/happiness", { state: { projectName: selectedProject } });
    }
  };

  function goCodeActivity() {
    if (selectedProject) {
      navigate("/code-activity", { state: { projectName: selectedProject } });
    }
  }

  function goSettings() {
    navigate("/settings");
  }

  function goCourseParticipation() {
    navigate("/course-participation");
  }

  function goProjectConfig() {
    navigate("/project-config");
  }
  function goUserPanel() {
    navigate("/user-panel");
  }
  function goUserAdmin() {
    navigate("/user-admin");
  }

  function goCourseAdmin() {
    navigate("/course-admin");
  }

  async function shutdownSystem() {
    // Close dialog immediately for a clean UX.
    setShutdownDialogOpen(false);
    setShutdownPending(true);
    setShutdownError(null);

    try {
      await adminApi.shutdown();
      setShutdownInProgress(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Shutdown failed";
      setShutdownError(message);
    } finally {
      setShutdownPending(false);
    }
  }

  function startSystem() {
    setShutdownPending(true);
    setShutdownError(null);

    adminApi
      .start()
      .then(() => setShutdownInProgress(false))
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Start failed";
        setShutdownError(message);
      })
      .finally(() => setShutdownPending(false));
  }

  return (
    <div className="min-h-screen">
      <TopNavBar title="Dashboard" showBackButton={false} showUserInfo={true} />

      <div className="mx-auto max-w-6xl space-y-4 p-4 pt-16">
        {/* Projects Section */}
        <SectionCard title="Projects">
          <div className="space-y-4">
            <Select value={selectedProject || ""} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-4">
              <Button
                onClick={goToStandups}
                disabled={!selectedProject}
                className="w-48"
              >
                Standups
              </Button>
              <Button
                onClick={goHappiness}
                disabled={!selectedProject}
                className="w-48"
              >
                Happiness
              </Button>
              <Button
                onClick={goCodeActivity}
                disabled={!selectedProject}
                className="w-48"
              >
                Code Activity
              </Button>
            </div>
          </div>
        </SectionCard>

        {/* Configuration Section */}
        <SectionCard title="Configuration">
          <div className="flex flex-wrap gap-4">
            <Button onClick={goUserPanel} className="w-48">
              User profile
            </Button>
            <Button onClick={goSettings} className="w-48">
              Settings
            </Button>
            <Button onClick={goCourseParticipation} className="w-48">
              Course Participation
            </Button>
            <Button onClick={goProjectConfig} className="w-48">
              Project Config
            </Button>
          </div>
        </SectionCard>

        {/* System Administration Section */}
        {userRole === "ADMIN" && (
          <SectionCard title="System Administration">
            <div className="flex flex-wrap gap-4">
              <Button onClick={goUserAdmin} className="w-48">
                User Admin
              </Button>
              <Button onClick={goCourseAdmin} className="w-48">
                Course Admin
              </Button>

              {shutdownInProgress ? (
                <Button
                  variant="success"
                  className="w-48"
                  onClick={startSystem}
                  disabled={shutdownPending}
                >
                  Start system
                </Button>
              ) : (
                <Dialog open={shutdownDialogOpen} onOpenChange={setShutdownDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-48">
                      Shutdown system
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm shutdown</DialogTitle>
                      <DialogDescription>
                        Do you really want to shut down the system?
                        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
                          After shutdown, the system enters read-only mode: all write
                          operations will be rejected, but read requests will still
                          work.
                        </div>
                      </DialogDescription>
                    </DialogHeader>

                    {shutdownError && (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {shutdownError}
                      </div>
                    )}

                    <DialogFooter>
                      <Button
                        variant="secondary"
                        onClick={() => setShutdownDialogOpen(false)}
                        disabled={shutdownPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={shutdownSystem}
                        disabled={shutdownPending}
                      >
                        {shutdownPending ? "Shutting down…" : "Confirm shutdown"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
