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
import { useActiveProject } from "@/context/ActiveProjectContext";
import { ProjectDto } from "@/types/models";
import { FeatureGuard } from "./common/FeatureGuard";
import { CourseFeature } from "@/types/CourseFeature";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const userRole = useUserRole();
  const { activeProject, setActiveProject } = useActiveProject();

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
          const projects = await projectsApi.getUserProjects(userEmail);
          setProjects(projects);

          // Restore selected project from localStorage
          const savedProjectId = projectStorage.getSelectedProjectId();
          if (savedProjectId) {
            const savedProject = projects.find((p) => p.id === savedProjectId);
            if (savedProject) {
              setActiveProject(savedProject);
            }
          }
        } catch (error) {
          console.error("Error fetching projects:", error);
        }
      }
    };

    fetchProjects();
  }, [navigate, authStorage]);

  const handleProjectChange = (projectIdString: string) => {
    const selectedProject = projects.find(
      (p) => p.id.toString() === projectIdString,
    );

    if (selectedProject) {
      // Store the full project so feature pages can read the course and feature flags.
      setActiveProject(selectedProject);
      projectStorage.setSelectedProjectId(selectedProject.id);
    }
  };

  const goToStandups = () => {
    if (activeProject) {
      navigate("/standups");
    }
  };

  const goHappiness = () => {
    if (activeProject) {
      navigate("/happiness");
    }
  };

  function goCodeActivity() {
    if (activeProject) {
      navigate("/code-activity");
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

      <div className="mx-auto max-w-6xl space-y-4 p-4">
        {/* Projects Section */}
        <SectionCard title="Projects">
          <div className="space-y-4">
            <Select
              value={activeProject?.id.toString() || ""}
              onValueChange={handleProjectChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.projectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-4">
              {/* Each feature button is wrapped so the dashboard only exposes enabled course features. */}
              <FeatureGuard feature={CourseFeature.STANDUPS}>
                <Button
                  onClick={goToStandups}
                  disabled={!activeProject}
                  className="w-48"
                >
                  Standups
                </Button>
              </FeatureGuard>
              <FeatureGuard feature={CourseFeature.HAPPINESS_INDEX}>
                <Button
                  onClick={goHappiness}
                  disabled={!activeProject}
                  className="w-48"
                >
                  Happiness
                </Button>
              </FeatureGuard>
              <FeatureGuard feature={CourseFeature.CODE_ACTIVITY}>
                <Button
                  onClick={goCodeActivity}
                  disabled={!activeProject}
                  className="w-48"
                >
                  Code Activity
                </Button>
              </FeatureGuard>
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
    </div>
  );
};

export default Dashboard;
