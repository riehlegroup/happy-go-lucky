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
import { msgKey, translate } from "@/Resources/i18n";

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
        title={translate(msgKey.dashboard.title)}
        showBackButton={false}
        showUserInfo={true}
      />

      <div className="mx-auto max-w-6xl space-y-4 p-4 pt-16">
        {/* Projects Section */}
        <SectionCard title={translate(msgKey.dashboard.sections.projects)}>
          <div className="space-y-4">
            <Select value={selectedProject || ""} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={translate(msgKey.dashboard.projectSelectPlaceholder)} />
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
                {translate(msgKey.dashboard.projectActions.standups)}
              </Button>
              <Button
                onClick={goHappiness}
                disabled={!selectedProject}
                className="w-48"
              >
                {translate(msgKey.dashboard.projectActions.happiness)}
              </Button>
              <Button
                onClick={goCodeActivity}
                disabled={!selectedProject}
                className="w-48"
              >
                {translate(msgKey.dashboard.projectActions.codeActivity)}
              </Button>
            </div>
          </div>
        </SectionCard>

        {/* Configuration Section */}
        <SectionCard title={translate(msgKey.dashboard.sections.configuration)}>
          <div className="flex flex-wrap gap-4">
            <Button onClick={goUserPanel} className="w-48">
              {translate(msgKey.dashboard.configActions.userProfile)}
            </Button>
            <Button onClick={goSettings} className="w-48">
              {translate(msgKey.dashboard.configActions.settings)}
            </Button>
            <Button onClick={goCourseParticipation} className="w-48">
              {translate(msgKey.dashboard.configActions.courseParticipation)}
            </Button>
            <Button onClick={goProjectConfig} className="w-48">
              {translate(msgKey.dashboard.configActions.projectConfig)}
            </Button>
          </div>
        </SectionCard>

        {/* System Administration Section */}
        {userRole === "ADMIN" && (
          <SectionCard title={translate(msgKey.dashboard.sections.systemAdministration)}>
            <div className="flex flex-wrap gap-4">
              <Button onClick={goUserAdmin} className="w-48">
                {translate(msgKey.dashboard.adminActions.userAdmin)}
              </Button>
              <Button onClick={goCourseAdmin} className="w-48">
                {translate(msgKey.dashboard.adminActions.courseAdmin)}
              </Button>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
