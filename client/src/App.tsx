import "./App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ForgotPassword from "./screens/Auth/ForgotPassword";
import ResetPassword from "./screens/Auth/ResetPassword";
import LoginScreen from "./screens/Auth/LoginScreen";
import Dashboard from "./components/Dashboard";
import CodeActivity from "./components/Projects/CodeActivity";
import Settings from "./components/Configuration/Settings";
import CourseParticipation from "./components/Configuration/CourseParticipation";
import UserAdmin from "./components/Administration/UserAdmin";
import ProjectConfig from "./components/Configuration/ProjectConfig";
import Standups from "./components/Projects/Standups";
import Happiness from "./components/Projects/Happiness";
import ConfirmedEmail from "./screens/Auth/ConfirmedEmail";
import UserPanel from "./components/Configuration/UserPanel";
import CourseAdmin from "./components/Administration/CourseAdmin";
import { ActiveProjectProvider } from "./context/ActiveProjectContext";
import { Feather } from "lucide-react";
import { CourseFeature } from "./types/CourseFeature";
import { FeatureGuard } from "./components/common/FeatureGuard";

function App() {
  return (
    <div>
      <BrowserRouter>
      <ActiveProjectProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/forgotPassword" element={<ForgotPassword />} />
          <Route path="/resetPassword" element={<ResetPassword />} />  
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Feature routes safe-guarded by FeatureGuard */}
          <Route 
            path="/standups" 
            element={
              <FeatureGuard feature={CourseFeature.STANDUPS} fallback={<Navigate to="/dashboard" replace />}>
                <Standups /> 
              </FeatureGuard>
          } />
          <Route 
            path="/happiness" 
            element={
              <FeatureGuard feature={CourseFeature.HAPPINESS_INDEX} fallback={<Navigate to="/dashboard" replace />}>
                <Happiness /> 
              </FeatureGuard>
            } />
          <Route 
            path="/code-activity" 
            element={
              <FeatureGuard feature={CourseFeature.CODE_ACTIVITY} fallback={<Navigate to="/dashboard" replace />}>
                <CodeActivity /> 
              </FeatureGuard>
            } />
          {/*other routes*/}
          <Route path="/settings" element={<Settings />} />
          <Route path="/course-participation" element={<CourseParticipation />} />
          <Route path="/user-admin" element={<UserAdmin />} />
          <Route path="/course-admin" element={<CourseAdmin />} />
          <Route path="/project-config" element={<ProjectConfig />} />
          <Route path="/confirmedEmail" element={<ConfirmedEmail />} />
          <Route path="/user-panel" element={<UserPanel />} />
        </Routes>
      </ActiveProjectProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
