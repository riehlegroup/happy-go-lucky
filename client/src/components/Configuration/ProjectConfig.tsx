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
import { en as messages } from "@/messages";

const ProjectConfig: React.FC = () => {
  const navigate = useNavigate();

  const [url, setURL] = useState("");
  const [newURL, setNewURL] = useState("");
  const [enrolledProjects, setEnrolledProjects] = useState<string[]>([]);
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedAvailableProject, setSelectedAvailableProject] = useState<
    string | null
  >(null);
  const [message, setMessage] = useState("");
  const [courses, setCourses] = useState<{ id: number; courseName: string }[]>(
    [],
  );
  const [selectedCourse, setSelectedCourse] = useState<{
    id: number;
    courseName: string;
  } | null>(null);
  const [user, setUser] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [createdProject, setCreatedProject] = useState<string>("");
  const [memberRole, setMemberRole] = useState("");
  const [projectRoles, setProjectRoles] = useState<{
    [key: string]: string | null;
  }>({});
  const [error, setError] = useState("");

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
    const course = courses.find((c) => c.id.toString() === courseId);
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

        setEnrolledProjects(
          data.enrolledProjects.map((project) => project.projectName),
        );
        setAvailableProjects(
          data.availableProjects.map((project) => project.projectName),
        );

        // Fetch all roles in parallel
        const rolePromises = data.enrolledProjects.map((project) =>
          ApiClient.getInstance()
            .get<{ role: string }>("/courseProject/user/role", {
              projectName: project.projectName,
              email: userEmail,
            })
            .then((roleData) => ({
              projectName: project.projectName,
              role: roleData.role,
            }))
            .catch((error) => {
              console.error(
                `Failed to fetch role for ${project.projectName}:`,
                error,
              );
              return { projectName: project.projectName, role: null };
            }),
        );

        const roleResults = await Promise.all(rolePromises);
        const roles = Object.fromEntries(
          roleResults.map((r) => [r.projectName, r.role]),
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
        { userEmail: userEmail, projectName: projectName },
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
          { userEmail, URL: newURL, projectName: selectedProject },
        );
        setMessage(
          data.message || messages.projectConfig.url.changeSuccessFallback,
        );
        setURL(newURL);
        setNewURL("");
      } catch (error: unknown) {
        if (error instanceof Error) {
          setMessage(error.message);
        } else {
          setMessage(messages.errors.unexpected);
        }
      }
    } else {
      setMessage(messages.projectConfig.status.userEmailOrProjectMissing);
    }
  };
  const handleJoin = async (projectName: string, role: string) => {
    if (!user) {
      setMessage(messages.projectConfig.status.userNotAvailableWarning);
      return;
    }

    try {
      const data = await ApiClient.getInstance().post<{ message: string }>(
        "/user/project",
        {
          projectName,
          memberName: user.name,
          memberRole: role,
          memberEmail: user.email,
        },
      );

      setMessage(data.message || messages.projectConfig.status.joinedFallback);
      if (data.message.includes("successfully")) {
        window.location.reload();
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        setMessage(error.message);
      }
    }
  };

  const handleLeave = async (projectName: string) => {
    if (!user) {
      setMessage(messages.projectConfig.status.userNotAvailableWarning);
      return;
    }

    try {
      const data = await ApiClient.getInstance().delete<{ message: string }>(
        `/user/project?projectName=${projectName}&memberEmail=${user.email}`,
      );

      setMessage(data.message || messages.projectConfig.status.leftFallback);
      if (data.message.includes("successfully")) {
        window.location.reload();
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        setMessage(error.message);
      }
    }
  };

  const handleCreate = async (projectName: string) => {
    if (!selectedCourse?.id) {
      setMessage(messages.projectConfig.status.noCourseSelected);
      return;
    }

    try {
      const data = await ApiClient.getInstance().post<{ message: string }>(
        "/courseProject",
        { courseId: selectedCourse.id, projectName },
      );

      setMessage(data.message || messages.projectConfig.status.createdFallback);
      if (data.message.includes("successfully")) {
        window.location.reload();
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage(messages.errors.unexpected);
      }
    }
  };

  const validateProjectName = (name: string) => {
    const isValid = /^[a-zA-Z0-9_]+$/.test(name);
    if (!isValid) {
      setError(messages.projectConfig.createDialog.projectNameInvalid);
    } else {
      setError("");
    }
  };

  const handleCreateAndJoin = async (projectName: string) => {
    await handleCreate(projectName);
    await handleJoin(projectName, "owner");
  };

  return (
    <div className="min-h-screen">
      <TopNavBar
        title={messages.projectConfig.pageTitle}
        showBackButton={true}
        showUserInfo={true}
      />

      <div className="mx-auto max-w-6xl space-y-4 p-4 pt-16">
        <SectionCard title={messages.projectConfig.selectCourseTitle}>
          <div className="space-y-4">
            <Select onValueChange={handleCourseChange}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={messages.projectConfig.selectCoursePlaceholder}
                />
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
            <SectionCard title={messages.projectConfig.enrolledProjectsTitle}>
              <div className="space-y-2">
                {enrolledProjects.length > 0 ? (
                  enrolledProjects.map((project) => (
                    <Card key={project}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{project}</p>
                          {projectRoles[project] === "owner" && (
                            <p className="text-xs text-slate-500">
                              {messages.projectConfig.ownerLabel}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {projectRoles[project] === "owner" ? (
                            <Dialog
                              onOpenChange={(open) => {
                                if (open) {
                                  handleProjectChange(project);
                                } else {
                                  setMessage("");
                                  setNewURL("");
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="primary"
                                  className="px-3 py-1 text-sm"
                                >
                                  {messages.projectConfig.edit}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    {messages.projectConfig.url.dialogTitle}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="break-words text-sm">
                                    <p className="font-semibold text-slate-700">
                                      {messages.projectConfig.url.currentLabel}
                                    </p>
                                    {url ? (
                                      <p className="break-all text-slate-600">
                                        {url}
                                      </p>
                                    ) : (
                                      <p className="italic text-slate-400">
                                        {messages.projectConfig.url.noneSet}
                                      </p>
                                    )}
                                  </div>
                                  <Input
                                    type="text"
                                    label={
                                      messages.projectConfig.url.newUrlLabel
                                    }
                                    placeholder={
                                      messages.projectConfig.url
                                        .newUrlPlaceholder
                                    }
                                    value={newURL}
                                    onChange={(e) => setNewURL(e.target.value)}
                                  />
                                  {message && (
                                    <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                                      {message}
                                    </div>
                                  )}
                                </div>
                                <DialogFooter>
                                  <Button onClick={handleChangeURL}>
                                    {messages.projectConfig.save}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <Button
                              variant="primary"
                              className="px-3 py-1 text-sm"
                              disabled={true}
                              title={
                                messages.projectConfig.tooltips.ownerOnlyEdit
                              }
                            >
                              {messages.projectConfig.edit}
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            className="px-3 py-1 text-sm"
                            onClick={() => handleLeave(project)}
                          >
                            {messages.projectConfig.leave}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-slate-500">
                    {messages.projectConfig.empty.noEnrolledProjects}
                  </p>
                )}
              </div>
            </SectionCard>

            {/* Available Projects Section */}
            <SectionCard title={messages.projectConfig.availableProjectsTitle}>
              <div className="space-y-4">
                <Select onValueChange={setSelectedAvailableProject}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        messages.projectConfig.selectProjectToJoinPlaceholder
                      }
                    />
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
                      <Button variant="primary">
                        {messages.projectConfig.join}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {messages.projectConfig.joinDialog.title}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          type="text"
                          label={messages.projectConfig.joinDialog.roleLabel}
                          placeholder={
                            messages.projectConfig.joinDialog.rolePlaceholder
                          }
                          value={memberRole}
                          onChange={(e) => setMemberRole(e.target.value)}
                        />
                        {message && (
                          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                            {message}
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() =>
                            handleJoin(selectedAvailableProject, memberRole)
                          }
                        >
                          {messages.projectConfig.join}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </SectionCard>

            {/* Create Project Section */}
            <SectionCard title={messages.projectConfig.createNewProjectTitle}>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>{messages.projectConfig.createProject}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {messages.projectConfig.createDialog.title}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      type="text"
                      label={
                        messages.projectConfig.createDialog.projectNameLabel
                      }
                      placeholder={
                        messages.projectConfig.createDialog
                          .projectNamePlaceholder
                      }
                      value={createdProject}
                      error={error}
                      onChange={(e) => {
                        setCreatedProject(e.target.value);
                        validateProjectName(e.target.value);
                      }}
                    />
                    {message && (
                      <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                        {message}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => handleCreateAndJoin(createdProject)}
                      disabled={!!error}
                    >
                      {messages.projectConfig.create}
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
