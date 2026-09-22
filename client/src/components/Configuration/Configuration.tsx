import AccountSettings2 from "./AccountSettings2";
import ProjectConfig from "./ProjectConfig";
import CourseParticipation from "./CourseParticipation";
import "./Configuration.css";

const Configuration = () => {
  return (
    <div>
      <div className="ConfigbigContainer">
        <div className="ConfigComponents">
          <AccountSettings2 />
        </div>
        <div className="ConfigComponents">
          <CourseParticipation />
        </div>
        <div className="ConfigComponents">
          <ProjectConfig />
        </div>
      </div>
    </div>
  );
};

export default Configuration;
