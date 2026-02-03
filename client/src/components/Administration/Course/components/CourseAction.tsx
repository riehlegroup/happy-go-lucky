import React from "react";
import Add from "@/assets/Add.png";
import Edit from "@/assets/Edit.png";
import { cn } from "@/lib/utils";
import { msgKey, translate } from "@/Resources/i18n";

interface CourseActionProps {
  label?: string;
  type?: "course" | "project" | "schedule";
  action: "add" | "edit" | "delete" | "schedule";
  onClick: () => void;
  className?: string;
  dataCy?: string;
}

/**
 * Presentational component that renders action buttons for courses and projects.
 * Supports add, edit, delete, and schedule actions with icons or labels.
 * Uses dynamic styling based on action type for better UI consistency.
 */
export const CourseAction = React.forwardRef<HTMLButtonElement, CourseActionProps>(
  ({ label, type = "course", action, onClick, className, dataCy, ...rest }, ref) => {
    const getIcon = () => {
      switch (action) {
        case "edit":
          return (
            <img
              className="size-6"
              src={Edit}
              alt={translate(msgKey.common.actions.edit)}
            />
          );
        case "delete":
          return;
        case "add":
          return (
            <img
              className="size-6 "
              src={Add}
              alt={translate(msgKey.common.actions.add)}
            />
          );
        default:
          return null;
      }
    };

    const isDelete = action === "delete";

    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn(
          "flex items-center rounded px-3 py-1 text-white transition-colors",
          isDelete ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700",
          className
        )}
        data-cy={dataCy || `${action}-${type}-trigger`}
        {...rest}
      >
        {label ? <span className="text-xs uppercase">{label}</span> : getIcon()}
      </button>
    );
  }
);

CourseAction.displayName = "CourseAction";
