import { useState } from "react";
import { Term } from "./types";
import { Course } from "../Course/types";
import { TermDialog } from "./components/TermDialog";
import { TermForm } from "./components/TermForm";
import { TermAction } from "./components/TermAction";
import { useTerm } from "@/hooks/useTerm";
import { useDialog } from "@/hooks/useDialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { msgKey, translate } from "@/Resources/i18n";

interface TermWidgetProps {
  label?: string;
  action: "add" | "edit" | "delete";
  type?: "term" | "course";
  term?: Term | null;
  onFetch?: () => void;
  onDeleteTerm?: (term: Term) => void;
}

const TermWidget: React.FC<TermWidgetProps> = ({
  label = undefined,
  action,
  type = "term",
  term = null,
  onFetch,
  onDeleteTerm,
}: TermWidgetProps) => {
  const { message, DEFAULT, createTerm, addCourse, deleteTerm: deleteTermFromHook } = useTerm();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const defaultData = type === "term" ? DEFAULT : { id: 0, termId: term?.id || 0, courseName: "", projects: [], studentsCanCreateProject: false };

  const {
    dialogState,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    updateDialogData,
  } = useDialog<Term | Course>(defaultData);

  // Handles dialog state changes based on the action type
  const handleStateDialog = () => {
    switch (action) {
      case "edit":
        if (type === "term" && term) {
          openEditDialog(term);
        } else {
          console.error("Edit action requires a term!");
          return;
        }
        break;
      case "add":
        openCreateDialog();
        break;
      case "delete":
        if (type === "term" && term) {
          handleDelete();
        } else {
          console.error("Delete action requires a term!");
          return;
        }
        break;
      default:
        console.warn(`Unhandled action type: ${action}`);
    }
  };

  const handleDelete = async () => {
    if (type === "term" && term) {
      setShowDeleteConfirmation(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (type === "term" && term) {
      // Use the passed deleteTerm function if available, otherwise use the hook's version
      const deleteFunc = onDeleteTerm || deleteTermFromHook;
      await deleteFunc(term);
      onFetch?.();
    }
  };

  const handleSubmit = async () => {
    if (!dialogState.data) return;

    try {
      if (type === "course") {
        const courseData = dialogState.data as Course;
        if (dialogState.mode === "create") {
          if (!term) return;
          await addCourse({
            ...courseData,
            termId: term.id, // Ensure termId is set
          });
          onFetch?.(); // Callback for updating table
        }
      } else {
        const termData = dialogState.data as Term;
        if (dialogState.mode === "create") {
          await createTerm(termData);
          onFetch?.();
        }
        // Note: Term editing is not implemented in the spec
      }
      closeDialog(); // Close dialog after successful submission
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  /**
   * Main Dialog-based UI for term/course operations
   */
  return (
    <>
      <TermDialog
        isOpen={dialogState.isOpen}
        title={translate(
          msgKey.admin.term.dialogTitle,
          action === "edit" ? "edit" : "create",
          type === "course" ? "course" : "term"
        )}
        trigger={
          <TermAction
            label={label}
            type={type}
            action={action}
            onClick={handleStateDialog}
            dataCy={`${action ? "edit" : "add"}-term-trigger`}
          />
        }
        onClick={handleStateDialog}
        onClose={closeDialog}
        message={message || undefined}
      >
        <TermForm
          type={type}
          label={
            type === "term"
              ? [
                  translate(msgKey.admin.term.formLabels.termName),
                  translate(msgKey.admin.term.formLabels.displayName),
                ]
              : [translate(msgKey.admin.term.formLabels.courseName)]
          }
          data={dialogState.data || undefined}
          message={message || undefined}
          onChange={updateDialogData}
          onSubmit={handleSubmit}
        />
      </TermDialog>

      {type === "term" && term && (
        <ConfirmationDialog
          open={showDeleteConfirmation}
          onOpenChange={setShowDeleteConfirmation}
          title={translate(msgKey.admin.term.deleteTermDialog.title)}
          description={translate(
            msgKey.admin.term.deleteTermDialog.description,
            term.termName
          )}
          onConfirm={handleConfirmDelete}
          confirmText={translate(msgKey.common.actions.delete)}
          cancelText={translate(msgKey.common.actions.cancel)}
        />
      )}
    </>
  );
};

export default TermWidget;
