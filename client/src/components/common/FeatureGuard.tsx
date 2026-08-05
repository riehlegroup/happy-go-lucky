import { useCourseFeatureEnabled} from "@/hooks/useCourseFeatureEnabled";
import { CourseFeature } from "@/types/CourseFeature";

interface Props {
    feature: CourseFeature;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const FeatureGuard: React.FC<Props> = ({ feature, children, fallback = null } : Props) => {
    const isFeatureEnabled = useCourseFeatureEnabled(feature);
    return isFeatureEnabled ? <>{children}</> : <>{fallback}</>;
}