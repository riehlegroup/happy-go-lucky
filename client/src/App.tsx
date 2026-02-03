import "./App.css";
import { useEffect, useState } from "react";
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
import SystemStorage from "./services/storage/system";
import ShutdownOverlay from "./components/common/ShutdownOverlay";

function App() {
  const [isShuttingDown, setIsShuttingDown] = useState(
    SystemStorage.getInstance().isShutdownInProgress()
  );

  useEffect(() => {
    const onShutdownStateChange = () => {
      setIsShuttingDown(SystemStorage.getInstance().isShutdownInProgress());
    };

    window.addEventListener(
      SystemStorage.shutdownEventName(),
      onShutdownStateChange
    );
    return () =>
      window.removeEventListener(
        SystemStorage.shutdownEventName(),
        onShutdownStateChange
      );
  }, []);

  return (
    <div>
      <BrowserRouter>
        {isShuttingDown && <ShutdownOverlay />}
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/forgotPassword" element={<ForgotPassword />} />
          <Route path="/resetPassword" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/standups" element={<Standups />} />
          <Route path="/happiness" element={<Happiness />} />
          <Route path="/code-activity" element={<CodeActivity />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/course-participation" element={<CourseParticipation />} />
          <Route path="/user-admin" element={<UserAdmin />} />
          <Route path="/course-admin" element={<CourseAdmin />} />
          <Route path="/project-config" element={<ProjectConfig />} />
          <Route path="/confirmedEmail" element={<ConfirmedEmail />} />
          <Route path="/user-panel" element={<UserPanel />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
