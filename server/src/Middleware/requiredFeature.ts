import { Request, Response, NextFunction } from "express";
import { CourseManager } from "../Managers/CourseManager";
import { CourseFeature } from "../Models/CourseFeature";

export type CourseIdResolver = (req: Request) => Promise<number | string | null | undefined> | number | string | null | undefined;

export interface RequiredFeatureOptions {
  resolveCourseId?: CourseIdResolver;
  courseIdKeys?: string[];
}

function readCourseIdFromRequest(req: Request, keys: string[]): number | string | null | undefined {
  const sources = [req.params, req.body, req.query];

  for (const key of keys) {
    for (const source of sources) {
      const value = source?.[key];
      if (value !== undefined && value !== null && value !== "") {
        return Array.isArray(value) ? value[0] : value;
      }
    }
  }

  return undefined;
}

export function requiredFeature(
  feature: CourseFeature,
  cm: CourseManager,
  options: RequiredFeatureOptions = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const candidateCourseId = options.resolveCourseId
      ? await options.resolveCourseId(req)
      : readCourseIdFromRequest(req, options.courseIdKeys ?? ["courseId"]);

    if (candidateCourseId === undefined || candidateCourseId === null || candidateCourseId === "") {
      next();
      return;
    }

    const courseId = Number(candidateCourseId);

    if (!Number.isFinite(courseId)) {
      return res.status(400).json({
        error: "A valid course id is required to check feature availability.",
      });
    }

    const course = await cm.getCourseById(courseId);

    if (!course) {
      return res.status(404).json({
        error: "Course not found.",
      });
    }

    const enabledFeatures: CourseFeature[] = course.getEnabledFeatures() || [];

    if (!enabledFeatures.includes(feature)) {
      return res.status(403).json({
        error: `Feature ${feature} is not enabled for this course.`,
      });
    }

    next();
  };
}