import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import TopNavBar from "../common/TopNavBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionCard from "@/components/common/SectionCard";
import moment from "moment";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import AuthStorage from "@/services/storage/auth";
import ApiClient from "@/services/api/client";
import coursesApi from "@/services/api/courses";
import { msgKey, translate } from "@/Resources/i18n";

const Happiness: React.FC = (): React.ReactNode => {
  const location = useLocation();

  const [projectName, setProjectName] = useState<string | null>("");
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null
  );
  const [happinessData, setHappinessData] = useState<Array<{
    id: number;
    projectId: number;
    userId: number;
    happiness: number;
    submissionDateId: number;
    timestamp: string;
    submissionDate: string;
    userEmail: string;
  }>>([]);
  const [nextSubmission, setNextSubmission] = useState<{
    id: number;
    submissionDate: string;
  } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userCurrentHappiness, setUserCurrentHappiness] = useState<number | null>(null);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [allSubmissionDates, setAllSubmissionDates] = useState<string[]>([]);

  useEffect(() => {
    const projectNameFromState = location.state?.projectName;
    if (projectNameFromState) {
      setProjectName(projectNameFromState);
    }
    const authStorage = AuthStorage.getInstance();
    const storedUserName = authStorage.getUserName();
    if (storedUserName) {
      setUser((prev) => prev && ({ ...prev , name: storedUserName }));
    }
  }, [location.state]);

  useEffect(() => {
    const fetchUserData = () => {
      const authStorage = AuthStorage.getInstance();
      const userName = authStorage.getUserName();
      const userEmail = authStorage.getEmail();
      if (userName && userEmail) {
        setUser({ name: userName, email: userEmail });
      } else {
        console.warn("User data not found in storage");
      }
    };

    fetchUserData();
  }, []);

  // Fetch courseId from projectName
  useEffect(() => {
    const fetchCourseId = async () => {
      if (!projectName) return;

      try {
        const course = await ApiClient.getInstance().get<{ courseId: number; courseName: string }>(
          "/courseProject/course",
          { projectName: projectName }
        );
        setCourseId(course.courseId);
      } catch (error) {
        console.error("Error fetching project course ID:", error);
      }
    };

    fetchCourseId();
  }, [projectName]);

  // Fetch all submission dates from course schedule
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!courseId) return;

      try {
        const schedule = await coursesApi.getSchedule(courseId);
        if (schedule && schedule.submissionDates) {
          // Sort submission dates chronologically
          const sortedDates = [...schedule.submissionDates].sort();
          setAllSubmissionDates(sortedDates);
        }
      } catch (error) {
        console.error("Error fetching course schedule:", error);
      }
    };

    fetchSchedule();
  }, [courseId]);

  useEffect(() => {
    const fetchNextSubmission = async () => {
      if (!projectName) return;

      try {
        const submission = await ApiClient.getInstance().get<{
          id: number;
          submissionDate: string;
        }>("/courseProject/availableSubmissions",
          { projectName: projectName }
        );

        setNextSubmission(submission);
      } catch (error) {
        console.error("Error fetching next submission:", error);
        setNextSubmission(null);
      }
    };

    fetchNextSubmission();
  }, [projectName]);

  const handleHappinessSubmit = async (ratingValue: number) => {
    if (!projectName || !user?.email || !nextSubmission) {
      alert(translate(msgKey.projects.happiness.messages.missingRequiredInfo));
      return;
    }

    try {
      // Update highlighting immediately
      setUserCurrentHappiness(ratingValue);

      await ApiClient.getInstance().post<{ message: string }>(
        "/courseProject/happiness",
        {
          projectName,
          userEmail: user.email,
          happiness: ratingValue,
          submissionDateId: nextSubmission.id,
        }
      );

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Reload happiness data to update the display
      await fetchHappinessData();
    } catch (error) {
      console.error("Error updating happiness:", error);
    }
  };

  const fetchHappinessData = async () => {
    try {
      const data = await ApiClient.getInstance().get<Array<{
        id: number;
        projectId: number;
        userId: number;
        happiness: number;
        submissionDateId: number;
        timestamp: string;
        submissionDate: string;
        userEmail: string;
      }>>(
        "/courseProject/happiness",
        { projectName: projectName ?? "" }
      );
      setHappinessData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch happiness data:", error);
    }
  };

  useEffect(() => {
    if (projectName) {
      fetchHappinessData();
    }
  }, [projectName]);

  // Update user's current happiness when data or submission changes
  useEffect(() => {
    if (user?.email && nextSubmission) {
      if (happinessData.length > 0) {
        const userEntry = happinessData.find(
          entry => entry.userEmail === user.email && entry.submissionDateId === nextSubmission.id
        );
        setUserCurrentHappiness(userEntry ? userEntry.happiness : null);
      } else {
        setUserCurrentHappiness(null);
      }
    }
  }, [happinessData, nextSubmission, user?.email]);

  const emailColors: { [email: string]: string } = {};
  const uniqueEmails = [
    ...new Set(happinessData.map((data) => data.userEmail)),
  ];
  uniqueEmails.forEach((email, index) => {
    emailColors[email] = `hsl(${(index * 360) / uniqueEmails.length
      }, 100%, 50%)`;
  });

  // Create mapping: submissionDate → sprint number
  const dateToSprintNumber: { [date: string]: number } = {};
  if (allSubmissionDates.length > 0) {
    allSubmissionDates.forEach((date, index) => {
      dateToSprintNumber[date] = index + 1; // Sprint 1, Sprint 2, etc.
    });
  } else {
    const uniqueTimestamps = [...new Set(happinessData.map(d => d.submissionDate))];
    const uniqueDates = uniqueTimestamps
      .map(ts => new Date(Number(ts) * 1000).toISOString())
      .sort();
    uniqueDates.forEach((date, index) => {
      dateToSprintNumber[date] = index + 1;
    });
  }

  // Transform data for chart
  const formattedData: { [sprintLabel: string]: { sprintLabel: string; [userEmail: string]: number | string | undefined } } = {};
  const now = new Date();

  // Find the next submission date after now (current sprint)
  const futureDates = Object.keys(dateToSprintNumber)
    .map(dateKey => ({ dateKey, date: new Date(dateKey) }))
    .filter(item => item.date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const nextSubmissionDate = futureDates.length > 0 ? futureDates[0].dateKey : null;

  // Pre-populate past sprints + current sprint (next upcoming submission date)
  Object.entries(dateToSprintNumber).forEach(([dateKey, sprintNumber]) => {
    const submissionDate = new Date(dateKey);
    if (submissionDate <= now || dateKey === nextSubmissionDate) {
      const sprintLabel = `Sprint ${sprintNumber}`;
      formattedData[sprintLabel] = { sprintLabel };
    }
  });

  happinessData.forEach((data) => {
    if (!data.submissionDate) return;

    const dateKey = new Date(Number(data.submissionDate) * 1000).toISOString();
    const sprintNumber = dateToSprintNumber[dateKey];

    if (!sprintNumber) {
      console.warn(`No sprint number found for date ${dateKey} (timestamp: ${data.submissionDate})`);
      return;
    }

    const sprintLabel = `Sprint ${sprintNumber}`;
    if (formattedData[sprintLabel]) {
      formattedData[sprintLabel][data.userEmail] = data.happiness;
    }
  });

  // Convert to array for recharts, sorted by sprint number
  const chartData = Object.values(formattedData).sort((a, b) => {
    const sprintA = parseInt(a.sprintLabel.replace('Sprint ', ''));
    const sprintB = parseInt(b.sprintLabel.replace('Sprint ', ''));
    return sprintA - sprintB;
  });

  return (
    <div className="min-h-screen">
      <TopNavBar
        title={translate(msgKey.projects.happiness.title)}
        showBackButton={true}
        showUserInfo={true}
      />
      <div className="mx-auto max-w-6xl space-y-4 p-4 pt-16">
        <Tabs defaultValue="User" className="w-full">
          <TabsList className="inline-flex h-auto gap-1 bg-slate-100 p-2">
            <TabsTrigger value="User" className="data-[state=active]:bg-white data-[state=active]:shadow">
              {translate(msgKey.projects.happiness.tabs.user)}
            </TabsTrigger>
            <TabsTrigger value="Display" className="data-[state=active]:bg-white data-[state=active]:shadow">
              {translate(msgKey.projects.happiness.tabs.display)}
            </TabsTrigger>
          </TabsList>
        <TabsContent value="User">
          <SectionCard title={translate(msgKey.projects.happiness.submitSectionTitle)}>
            {!nextSubmission ? (
              <div className="rounded-md bg-red-50 p-4 text-center text-sm text-red-700">
                {translate(msgKey.projects.happiness.messages.noActiveSubmission)}
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  <div className="text-sm text-slate-600">
                    {translate(msgKey.projects.happiness.prompts.enterBefore)}{" "}
                    <span className="font-semibold">
                      {moment(nextSubmission.submissionDate).format("YYYY-MM-DD HH:mm:ss")}
                    </span>
                  </div>
                  <div className="space-y-6">
                    <div className="text-lg font-semibold text-slate-900">
                      {translate(msgKey.projects.happiness.prompts.question)}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {[-3, -2, -1, 0, 1, 2, 3].map((rating) => {
                        const isSelected = userCurrentHappiness === rating;
                        return (
                          <button
                            key={rating}
                            onClick={() => handleHappinessSubmit(rating)}
                            className={`flex flex-col items-center gap-1 rounded-lg p-3 text-sm font-semibold transition-all ${
                              isSelected
                                ? "border-4 border-blue-600 bg-blue-50"
                                : "border-2 border-slate-300 bg-white hover:border-primary hover:bg-slate-50"
                            } active:bg-primary active:text-white`}
                            type="button"
                          >
                            {rating}
                          </button>
                        );
                      })}
                    </div>
                    {showSuccess && (
                      <div className="rounded-md bg-green-50 p-3 text-center text-sm font-medium text-green-700">
                        {translate(msgKey.projects.happiness.messages.updatedSuccess)}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </SectionCard>
        </TabsContent>
        <TabsContent value="Display">
          <SectionCard
            title={translate(
              msgKey.projects.happiness.displaySectionTitle,
              String(projectName ?? "")
            )}
          >
            <ResponsiveContainer height={400} width="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 70, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="1 1" />
                <XAxis dataKey="sprintLabel" />
                <YAxis domain={[-3, 3]} ticks={[-3, -2, -1, 0, 1, 2, 3]} />

                {uniqueEmails.map((email) => (
                  <Line
                    key={email}
                    type="monotone"
                    dataKey={email}
                    stroke={emailColors[email]}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Happiness;
