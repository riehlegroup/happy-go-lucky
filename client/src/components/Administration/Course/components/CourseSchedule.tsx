import React, { useState, useEffect } from "react";
import { Course } from "../types";
import Button from "@/components/common/Button";
import MessageBanner from "@/components/common/MessageBanner";
import { DateInput } from "./CourseForm";
import courseApi from "../api";

interface CourseScheduleProps {
  course: Course;
  onClose: () => void;
}

const CourseSchedule: React.FC<CourseScheduleProps> = ({ course, onClose }) => {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 28);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [submission, setSubmission] = useState<Date[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadSchedule = async () => {
    try {
      const schedule = await courseApi.getSchedule(course.id);
      if (schedule) {
        setStartDate(new Date(schedule.startDate));
        setEndDate(new Date(schedule.endDate));
        setSubmission(schedule.submissionDates.map(d => new Date(d)));
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
    }
  };

  const generateWeeklySubmission = () => {
    const boxes: Date[] = [];
    let current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
      boxes.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
    return boxes;
  };

  const filterSubmissionsInRange = () => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    return submission.filter(date => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d >= start && d <= end;
    });
  };

  const handleRegenerateWeekly = () => {
    const weeklySubmissions = generateWeeklySubmission();
    setSubmission(weeklySubmissions);
    setMessage({ text: "Weekly submissions regenerated", type: "success" });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Filter submissions to only include those within range before saving
      const validSubmissions = filterSubmissionsInRange();

      await courseApi.saveSchedule(course.id, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        submissionDates: validSubmissions.map(d => d.toISOString()),
      });

      setMessage({ text: "Schedule saved successfully!", type: "success" });
    } catch (error) {
      console.error("Error saving schedule:", error);
      setMessage({ text: "Failed to save schedule. Please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  useEffect(() => {
    // Update selectedDate to be within the new range (default to start date)
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const current = new Date(selectedDate);
    current.setHours(0, 0, 0, 0);

    // If selectedDate is outside the new range, reset it to start date
    if (current < start || current > end) {
      setSelectedDate(new Date(startDate));
    }

    // Only generate if there are no submissions yet (initial load)
    if (submission.length === 0) {
      const weeklySubmissions = generateWeeklySubmission();
      setSubmission(weeklySubmissions);
    } else {
      // Filter existing submissions to keep only those in the new range
      const filteredSubmissions = filterSubmissionsInRange();
      setSubmission(filteredSubmissions);
    }
  }, [startDate, endDate]);

  const addSubmission = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    // Check if date is within range
    if (d < start || d > end) {
      setMessage({
        text: "Submission date must be between course start and end dates",
        type: "error"
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const exists = submission.some(
      (slot) =>
        slot.toISOString().substring(0, 10) ===
        date.toISOString().substring(0, 10)
    );
    if (!exists) {
      const newSubmission = [...submission, date];
      newSubmission.sort((a, b) => a.getTime() - b.getTime());
      setSubmission(newSubmission);
    }
  };

  const removeSubmission = (date: Date) => {
    setSubmission(
      submission.filter(
        (slot) =>
          slot.toISOString().substring(0, 10) !==
          date.toISOString().substring(0, 10)
      )
    );
  };

  const formatDateWithLeadingZeros = (date: Date): string => {
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Sort submission dates ascending
  const sortedSubmissions = [...submission].sort((a, b) => a.getTime() - b.getTime());

  return (
    <div className="fixed inset-0 z-50 flex size-full items-center justify-center bg-gray-900/50">
      <div className="mt-4 flex max-h-[90vh] w-auto max-w-2xl flex-col items-center overflow-y-auto rounded bg-white p-6 text-gray-500 shadow">
        <h2 className="text-2xl font-bold text-black">Course Scheduler</h2>
        <h3>
          ID: {course.id}, Name: {course.courseName}
        </h3>

        <div className="flex w-full flex-col items-center">
          <DateInput
            label="Course start:"
            value={startDate.toISOString().substring(0, 10)}
            onChange={setStartDate}
            className="my-2"
          />

          <DateInput
            label="Course end:"
            value={endDate.toISOString().substring(0, 10)}
            onChange={setEndDate}
            className="my-2"
          />
        </div>

        <div className="mb-4 w-full">
          <h3 className="px-2 font-bold text-black">Submission:</h3>
          <div className="my-2 flex justify-center">
            <Button
              onClick={handleRegenerateWeekly}
            >
              Regenerate Weekly Submissions
            </Button>
          </div>
          <div className="my-2 flex items-end justify-center gap-2">
            <DateInput
              label="Add Date:"
              className="justify-center"
              value={selectedDate.toISOString().substring(0, 10)}
              onChange={setSelectedDate}
            />
            <Button
              onClick={() => addSubmission(selectedDate)}
            >
              Add
            </Button>
          </div>
          <div className="w-full px-2">
            <ul>
              {sortedSubmissions.map((slot, index) => (
                <li key={`submission-${index}`} className="flex items-center justify-between gap-2 border-b p-2 last:border-b-0">
                  <span>{formatDateWithLeadingZeros(slot)}</span>
                  <Button
                    className="text-sm"
                    variant="destructive"
                    onClick={() => removeSubmission(slot)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {message && <MessageBanner message={message} className="mb-4 w-full" />}

        <div className="flex justify-center gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Close
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CourseSchedule;
