import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopNavBar from "../common/TopNavBar";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import SectionCard from "@/components/common/SectionCard";
import Card from "@/components/common/Card";
import MessageBanner from "@/components/common/MessageBanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import AuthStorage from "@/services/storage/auth";
import ApiClient from "@/services/api/client";
import coursesApi from "@/services/api/courses";

const ProjectConfig: React.FC = () => {
  const navigate = useNavigate();

  const [url, setURL] = useState("");
  const [newURL, setNewURL] = useState("");
  const [enrolledProjects, setEnrolledProjects] = useState<string[]>([]);
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedAvailableProject, setSelectedAvailableProject] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [courses, setCourses] = useState<{ id: number; courseName: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<{ id: number; courseName: string } | null>(null);
  const [user, setUser] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [createdProject, setCreatedProject] = useState<string>("");
  const [memberRole, setMemberRole] = useState("");
  const [projectRoles, setProjectRoles] = useState<{ [key: string]: string | null }>({});
  const [error, setError] = useState('');





  useEffect(() => {
    const authStorage = AuthStorage.getInstance();
    const token = authStorage.getToken();
    if (!token) {
      navigate("/login");
    }
    const fetchUserData = async () => {
      const userName = authStorage.getUserName();
      const userEmail = authStorage.getEmail();
      if (userName && userEmail) {
        setUser({
          name: userName,
          email: userEmail,
        });
      } else {
        console.warn("User data not found in storage");
      }
    };

    fetchUserData();

    const fetchCourses = async () => {
      try {
        const data = await coursesApi.getCourses();
        setCourses(data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, [navigate]);

  const handleCourseChange = (courseId: string) => {
    const course = courses.find(c => c.id.toString() === courseId);
    if (course) {
      setSelectedCourse(course);
      setSelectedProject(null);
      fetchProjects(course.id);
    }
  };

  const fetchProjects = async (courseId: number) => {
    const authStorage = AuthStorage.getInstance();
    const userEmail = authStorage.getEmail();
    if (userEmail) {
      try {
        const data = await ApiClient.getInstance().get<{
          enrolledProjects: Array<{ projectName: string }>;
          availableProjects: Array<{ projectName: string }>;
        }>("/course/courseProjects", { courseId, userEmail });

        setEnrolledProjects(data.enrolledProjects.map((project) => project.projectName));
        setAvailableProjects(data.availableProjects.map((project) => project.projectName));

        // Fetch all roles in parallel
        const rolePromises = data.enrolledProjects.map(project =>
          ApiClient.getInstance().get<{ role: string }>(
            "/courseProject/user/role",
            { projectName: project.projectName, email: userEmail }
          ).then(roleData => ({ projectName: project.projectName, role: roleData.role }))
            .catch(error => {
              console.error(`Failed to fetch role for ${project.projectName}:`, error);
              return { projectName: project.projectName, role: null };
            })
        );

        const roleResults = await Promise.all(rolePromises);
        const roles = Object.fromEntries(
          roleResults.map(r => [r.projectName, r.role])
        );
        setProjectRoles(roles);
        console.log("Fetched project roles:", roles);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    }
  };


  const handleProjectChange = (projectName: string) => {
    setSelectedProject(projectName);
    fetchProjectURL(projectName);
  };

  const fetchProjectURL = async (projectName: string) => {
    const authStorage = AuthStorage.getInstance();
    const userEmail = authStorage.getEmail();

    if (!projectName) {
      console.error("Selected project is missing");
      return;
    } else if (!userEmail) {
      console.error("User email is missing");
      return;
    }

    try {
      const data = await ApiClient.getInstance().get<{ url: string }>(
        "/user/project/url",
        { userEmail: userEmail, projectName: projectName }
      );

      if (data && data.url) {
        setURL(data.url || "");
      } else {
        setURL("");
      }
    } catch (error) {
      console.error("Error fetching URL:", error);
    }
  };

  const handleChangeURL = async () => {
    const authStorage = AuthStorage.getInstance();
    const userEmail = authStorage.getEmail();
    if (userEmail && selectedProject) {
      try {
        const data = await ApiClient.getInstance().post<{ message: string }>(
          "/user/project/url",
          { userEmail, URL: newURL, projectName: selectedProject }
        );
        setMessage({ text: data.message || "URL changed successfully", type: "success" });
        setURL(newURL);
        setNewURL("");
      } catch (error: unknown) {
        if (error instanceof Error) {
          setMessage({ text: error.message, type: "error" });
        } else {
          setMessage({ text: "An unexpected error occurred", type: "error" });
        }
      }
    } else {
      setMessage({ text: "User email or selected project is missing", type: "error" });
    }
  };
  const handleJoin = async (projectName: string, role: string) => {
    if (!user) {
      setMessage({ text: "User data not available. Please log in again.", type: "error" });
      return;
    }

    try {
      const data = await ApiClient.getInstance().post<{ message: string }>(
        "/user/project",
        { projectName, memberName: user.name, memberRole: role, memberEmail: user.email }
      );

      const responseMessage = data.message || "Successfully joined the project!";
      setMessage({ text: responseMessage, type: "success" });
      if (responseMessage.toLowerCase().includes("successfully")) {
        window.location.reload();
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        setMessage({ text: error.message, type: "error" });
      }
    }
  };

  const handleLeave = async (projectName: string) => {
    if (!user) {
      setMessage({ text: "User data not available. Please log in again.", type: "error" });
      return;
    }

    try {
      const data = await ApiClient.getInstance().delete<{ message: string }>(
        `/user/project?projectName=${projectName}&memberEmail=${user.email}`
      );

      const responseMessage = data.message || "Successfully left the project!";
      setMessage({ text: responseMessage, type: "success" });
      if (responseMessage.toLowerCase().includes("successfully")) {
        window.location.reload();
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        setMessage({ text: error.message, type: "error" });
      }
    }
  };

  const handleCreate = async (projectName: string) => {
    if (!selectedCourse?.id) {
      setMessage({ text: "No course selected", type: "error" });
      return;
    }

    try {
      const data = await ApiClient.getInstance().post<{ message: string }>(
        "/courseProject",
        { courseId: selectedCourse.id, projectName }
      );

      const responseMessage = data.message || "Project created successfully";
      setMessage({ text: responseMessage, type: "success" });
      if (responseMessage.toLowerCase().includes("successfully")) {
        window.location.reload();
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({ text: "An unexpected error occurred", type: "error" });
      }
    }
  };

  const validateProjectName = (name: string) => {
    const isValid = /^[a-zA-Z0-9_]+$/.test(name);
    if (!isValid) {
      setError('Project name can only contain letters, numbers, and underscores.');
    } else {
      setError('');
    }
  };

  const handleCreateAndJoin = async (projectName: string) => {
    await handleCreate(projectName);
    await handleJoin(projectName, "owner");
  };

  return (
    <div className="min-h-screen">
      <TopNavBar title="Project Configuration" showBackButton={true} showUserInfo={true} />

      <div className="mx-auto max-w-6xl space-y-4 p-4 pt-16">
        <SectionCard title="Select Course">
          <div className="space-y-4">
            <Select onValueChange={handleCourseChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.courseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SectionCard>

        {selectedCourse && (
          <>
            {/* Enrolled Projects Section */}
            <SectionCard title="Enrolled Projects">
              <div className="space-y-2">
                {enrolledProjects.length > 0 ? (
                  enrolledProjects.map((project) => (
                    <Card key={project}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{project}</p>
                          {projectRoles[project] === "owner" && (
                            <p className="text-xs text-slate-500">Owner</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {projectRoles[project] === "owner" ? (
                            <Dialog onOpenChange={(open) => {
                              if (open) {
                                handleProjectChange(project);
                              } else {
                                setMessage(null);
                                setNewURL("");
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="primary" className="px-3 py-1 text-sm">
                                  Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Project URL</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="break-words text-sm">
                                    <p className="font-semibold text-slate-700">Current URL:</p>
                                    {url ? (
                                      <p className="break-all text-slate-600">{url}</p>
                                    ) : (
                                      <p className="italic text-slate-400">No URL currently set</p>
                                    )}
                                  </div>
                                  <Input
                                    type="text"
                                    label="New URL"
                                    placeholder="Enter new URL"
                                    value={newURL}
                                    onChange={(e) => setNewURL(e.target.value)}
                                  />
                                  {message && <MessageBanner message={message} />}
                                </div>
                                <DialogFooter>
                                  <Button onClick={handleChangeURL}>Save</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <Button
                              variant="primary"
                              className="px-3 py-1 text-sm"
                              disabled={true}
                              title="You must be an owner to edit this course"
                            >
                              Edit
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            className="px-3 py-1 text-sm"
                            onClick={() => handleLeave(project)}
                          >
                            Leave
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-slate-500">No enrolled projects</p>
                )}
              </div>
            </SectionCard>

            {/* Available Projects Section */}
            <SectionCard title="Available Projects">
              <div className="space-y-4">
                <Select onValueChange={setSelectedAvailableProject}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Project to Join" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProjects.map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedAvailableProject && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="primary">Join</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Join Project</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          type="text"
                          label="Role"
                          placeholder="Enter your role"
                          value={memberRole}
                          onChange={(e) => setMemberRole(e.target.value)}
                        />
                        {message && <MessageBanner message={message} />}
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => handleJoin(selectedAvailableProject, memberRole)}
                        >
                          Join
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </SectionCard>

            {/* Create Project Section */}
            <SectionCard title="Create New Project">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Create Project</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Project</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      type="text"
                      label="Project Name"
                      placeholder="Enter project name"
                      value={createdProject}
                      error={error}
                      onChange={(e) => {
                        setCreatedProject(e.target.value);
                        validateProjectName(e.target.value);
                      }}
                    />
                    {message && <MessageBanner message={message} />}
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => handleCreateAndJoin(createdProject)}
                      disabled={!!error}
                    >
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectConfig;
