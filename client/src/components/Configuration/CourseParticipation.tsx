import React, { useState, useEffect } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import TopNavBar from "../common/TopNavBar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import SectionCard from "@/components/common/SectionCard";
import Card from "@/components/common/Card";
import MessageBanner from "@/components/common/MessageBanner";
import AuthStorage from "@/services/storage/auth";
import coursesApi from "@/services/api/courses";
import projectsApi from "@/services/api/projects";
import ApiClient from "@/services/api/client";

const CourseParticipation: React.FC = () => {
  type Project = {
    id: number;
    projectName: string;
    courseName: string;
  };

  const [role, setRole] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);


  const [user, setUser] = useState<{
    name: string;
    email: string;
  } | null>(null);

  const [courses, setCourses] = useState<string[]>([]);
  const [userProjects, setUserProjects] = useState<string[]>([]);

  const [enrolledProjects, setEnrolledProjects] = useState<Project[]>([]);
  const [selectedEnrolledCourse, setSelectedEnrolledCourse] = useState<string>("");

  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [selectedAvailableCourse, setSelectedAvailableCourse] = useState<string>("");

  useEffect(() => {
    const fetchUserData = async () => {
      const authStorage = AuthStorage.getInstance();
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
        setCourses(data.map((item) => item.courseName));
        console.log("Fetched project groups:", data);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(error.message);
        }
      }
    };

    fetchCourses();

    const fetchUserProjects = async() => {
      try {
        const authStorage = AuthStorage.getInstance();
        const userEmail = authStorage.getEmail();
        if (!userEmail) return;

        const data = await projectsApi.getUserProjects(userEmail);
        setUserProjects(data.map((item) => item.projectName));
        console.log("Fetched user projects:", data);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(error.message);
        }
      }
    };

    fetchUserProjects();
  }, []);

  useEffect(() => {
    const fetchEnrolledProjects = async () => {
      if (selectedEnrolledCourse) {
        try {
          const data = await projectsApi.getProjectsByCourseName(selectedEnrolledCourse);
          const mappedProjects = data.map((item) => ({
            id: item.id,
            projectName: item.projectName,
            courseName: selectedEnrolledCourse,
          }));

          const enrolledProjects = mappedProjects.filter((item: Project) => userProjects.includes(item.projectName));

          setEnrolledProjects(enrolledProjects);
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error(error.message);
          }
        }
      } else {
        setEnrolledProjects([]);
      }
    };

    fetchEnrolledProjects();
  }, [selectedEnrolledCourse, userProjects]);

  const filteredEnrolledProjects = enrolledProjects.filter(
    (project) => project.courseName === selectedEnrolledCourse
  );

  useEffect(() => {
    const fetchAvailableProjects = async () => {
      if (selectedAvailableCourse) {
        try {
          const data = await projectsApi.getProjectsByCourseName(selectedAvailableCourse);
          const mappedProjects = data.map((item) => ({
            id: item.id,
            projectName: item.projectName,
            courseName: selectedAvailableCourse,
          }));

          const availableProjectsWithoutEnrolled = mappedProjects.filter((item: Project) => !userProjects.includes(item.projectName));

          setAvailableProjects(availableProjectsWithoutEnrolled);
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error(error.message);
          }
        }
      } else {
        setAvailableProjects([]);
      }
    };

    fetchAvailableProjects();
  }, [selectedAvailableCourse, userProjects]);

  const filteredAvailableProjects = availableProjects.filter(
    (project: Project) => project.courseName === selectedAvailableCourse
  );

  const handleJoin = async (projectName: string) => {
    if (!user) {
      setMessage({ text: "User data not available. Please log in again.", type: "error" });
      return;
    }

    try {
      const data = await ApiClient.getInstance().post<{ success: boolean; message: string }>(
        "/user/project",
        {
          projectName,
          memberName: user.name,
          memberRole: role,
          memberEmail: user.email,
        }
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
      const data = await ApiClient.getInstance().delete<{ success: boolean; message: string }>(
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

  return (
    <div className="min-h-screen">
      <TopNavBar title="Course Participation" showBackButton={true} showUserInfo={true} />

      <div className="mx-auto max-w-6xl space-y-4 p-4 pt-16">
        {/* Enrolled Courses Section */}
        <SectionCard title="Projects you are enrolled in">
          <div className="space-y-4">
            <Select
              onValueChange={(value) => {
                setSelectedEnrolledCourse(value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((group, index) => (
                  <SelectItem key={index} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filteredEnrolledProjects.length > 0 ? (
              <div className="space-y-2">
                {filteredEnrolledProjects.map((project: Project) => (
                  <Card key={project.id}>
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{project.projectName}</p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" className="w-fit text-sm">
                            Leave
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Leave Project</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p className="text-sm">
                              Are you sure you want to leave {project.projectName}?
                            </p>
                            {message && <MessageBanner message={message} />}
                          </div>
                          <DialogFooter>
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setMessage(null);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleLeave(project.projectName)}
                            >
                              Confirm
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No enrolled projects</p>
            )}
          </div>
        </SectionCard>

        {/* Available Courses Section */}
        <SectionCard title="Available Projects">
          <div className="space-y-4">
            <Select
              onValueChange={(value) => {
                setSelectedAvailableCourse(value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((group, index) => (
                  <SelectItem key={index} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filteredAvailableProjects.length > 0 ? (
              <div className="space-y-2">
                {filteredAvailableProjects.map((project: Project) => (
                  <Card key={project.id}>
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{project.projectName}</p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="primary" className="px-3 py-1 text-sm">
                            Join
                          </Button>
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
                              value={role}
                              onChange={(e) => setRole(e.target.value)}
                            />
                            {message && <MessageBanner message={message} />}
                          </div>
                          <DialogFooter>
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setRole("");
                                setMessage(null);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleJoin(project.projectName)}
                            >
                              Join
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No available projects</p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default CourseParticipation;
