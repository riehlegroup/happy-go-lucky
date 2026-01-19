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
import { en as messages } from "@/messages";

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
      <TopNavBar
        title={messages.dashboard.pageTitle}
        showBackButton={false}
        showUserInfo={true}
      />

      <div className="mx-auto max-w-6xl space-y-4 p-4 pt-16">
        {/* Projects Section */}
        <SectionCard title={messages.dashboard.projectsTitle}>
          <div className="space-y-4">
            <Select
              value={selectedProject || ""}
              onValueChange={handleProjectChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={messages.dashboard.selectProjectPlaceholder}
                />
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
                {messages.dashboard.actions.standups}
              </Button>
              <Button
                onClick={goHappiness}
                disabled={!selectedProject}
                className="w-48"
              >
                {messages.dashboard.actions.happiness}
              </Button>
              <Button
                onClick={goCodeActivity}
                disabled={!selectedProject}
                className="w-48"
              >
                {messages.dashboard.actions.codeActivity}
              </Button>
            </div>
          </div>
        </SectionCard>

        {/* Configuration Section */}
        <SectionCard title={messages.dashboard.configurationTitle}>
          <div className="flex flex-wrap gap-4">
            <Button onClick={goUserPanel} className="w-48">
              {messages.dashboard.configurationActions.userProfile}
            </Button>
            <Button onClick={goSettings} className="w-48">
              {messages.dashboard.configurationActions.settings}
            </Button>
            <Button onClick={goCourseParticipation} className="w-48">
              {messages.dashboard.configurationActions.courseParticipation}
            </Button>
            <Button onClick={goProjectConfig} className="w-48">
              {messages.dashboard.configurationActions.projectConfig}
            </Button>
          </div>
        </SectionCard>

        {/* System Administration Section */}
        {userRole === "ADMIN" && (
          <SectionCard title={messages.dashboard.systemAdministrationTitle}>
            <div className="flex flex-wrap gap-4">
              <Button onClick={goUserAdmin} className="w-48">
                {messages.dashboard.systemAdministrationActions.userAdmin}
              </Button>
              <Button onClick={goCourseAdmin} className="w-48">
                {messages.dashboard.systemAdministrationActions.courseAdmin}
              </Button>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
