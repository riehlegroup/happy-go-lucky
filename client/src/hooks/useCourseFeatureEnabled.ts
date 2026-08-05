import { useActiveProject } from "@/context/ActiveProjectContext";
import { CourseFeature } from "@/types/CourseFeature";

export const useCourseFeatureEnabled = (feature: CourseFeature): boolean => {
  const { activeProject } = useActiveProject();
  
  if (!activeProject || !activeProject.enabledFeatures) {
    return false;
  }
  
  return activeProject.enabledFeatures.includes(feature);
};