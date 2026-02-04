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
import ActivityTimeline from "@/components/Projects/ActivityTimeline";
import { useUserRole } from "@/hooks/useUserRole";
import AuthStorage from "@/services/storage/auth";
import ProjectStorage from "@/services/storage/project";
import projectsApi from "@/services/api/projects";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
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

  return (
    <div className="min-h-screen">
      <TopNavBar title="Dashboard" showBackButton={false} showUserInfo={true} />

      <div className="mx-auto max-w-7xl p-4 pt-16">
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Left Column - Main Content */}
          <div className="flex-1 space-y-4">
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
                </div>
              </SectionCard>
            )}
          </div>

          {/* Right Column - Activity Timeline Sidebar */}
          {selectedProject && (
            <div className="sticky top-20 h-fit w-full lg:w-80">
              <SectionCard title="Recent Activity">
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  <ActivityTimeline projectName={selectedProject} />
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
