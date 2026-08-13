import { ProjectDto } from "@/types/models";
import React, { createContext, useContext, useState } from "react";


interface ActiveProjectContextType {
  activeProject: ProjectDto | null;
  setActiveProject: (project: ProjectDto | null) => void;
}

const ActiveProjectContext = createContext<ActiveProjectContextType | undefined>(undefined);

export const ActiveProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProject, setActiveProject] = useState<ProjectDto | null>(null);

  return (
    <ActiveProjectContext.Provider value={{ activeProject, setActiveProject }}>
      {children}
    </ActiveProjectContext.Provider>
  );
};

export const useActiveProject = () => {
  // This shared state keeps the selected project available across all feature pages.
  const context = useContext(ActiveProjectContext);
  if (!context) throw new Error("Missing Provider");
  return context;
};