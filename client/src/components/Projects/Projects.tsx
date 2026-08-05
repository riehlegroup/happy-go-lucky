import React from "react";
import Standups from "./Standups";
import Happiness from "./Happiness";
import CodeActivity from "./CodeActivity";
import "./Projects.css";

//TODO: Is this component still needed? It is not used anywhere in the app, and the individual components are already rendered in the dashboard.
const Projects: React.FC = () => {
  return (
    <div>
      <div className="bigContainer">
        <div className="components">
          <Standups />
        </div>
        <div className="components">
          <Happiness />
        </div>
        <div className="components">
          <CodeActivity />
        </div>
      </div>
    </div>
  );
};

export default Projects;
