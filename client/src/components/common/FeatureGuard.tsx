import { useCourseFeatureEnabled } from "@/hooks/useCourseFeatureEnabled";
import { CourseFeature } from "@/types/CourseFeature";

interface Props {
  feature: CourseFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
/**
 * Guards a feature specific component by checking if the course feature is enabled for the selected course using the useCourseFeatureEnabled hook.
 */
export const FeatureGuard: React.FC<Props> = ({
  feature,
  children,
  fallback = null,
}: Props) => {
  const isFeatureEnabled = useCourseFeatureEnabled(feature);
  // Keep the UI aligned with the enabled features of the selected course.
  return isFeatureEnabled ? <>{children}</> : <>{fallback}</>;
};
