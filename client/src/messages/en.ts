export const en = {
  // Key naming convention:
  // - Use lowerCamelCase sections.
  // - Use dot-separated nesting via objects (not literal dots).
  // - Prefer: domain -> feature -> message.
  // Examples:
  //   auth: { login: { title: "Login" } }
  //   errors: { required: { email: "Email is required" } }
  //   course: { create: { success: "Course created successfully" } }

  common: {
    ok: "OK",
    confirm: "Confirm",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    close: "Close",
  },

  app: {
    name: "Happy Go Lucky",
  },

  validation: {
    required: (fieldName: string) => `${fieldName} is required`,
    mustBeBoolean: (fieldName: string) => `${fieldName} must be a boolean`,

    term: {
      required: "Term is required",
    },

    course: {
      courseNamePattern:
        "Course name can only contain letters, numbers, spaces, and hyphens",
    },

    project: {
      projectNamePattern: "Only letters, numbers, spaces and hyphens allowed",
    },

    termName: {
      pattern: "Use format: WS24, SS25, WS24/25, Winter 2024 or Summer 2025",
    },

    displayName: {
      pattern:
        "Display name can only contain letters, numbers, spaces, hyphens, and slashes",
    },
  },

  errors: {
    unexpected: "An unexpected error occurred",
    required: {
      email: "Email is required",
    },
  },

  auth: {
    login: {
      title: "Login",
      button: "Login",
    },

    loginScreen: {
      tabs: {
        login: "Login",
        registration: "Sign Up",
      },
      fields: {
        name: {
          label: "Name",
          placeholder: "Please enter your name",
          required: "Name is required",
        },
        email: {
          label: "Email",
          invalid: "Please enter a valid email address",
        },
        password: {
          label: "Password",
        },
      },
      actions: {
        createAccount: "Create Account",
        signIn: "Sign In",
      },
      forgotPassword: {
        prompt: "Forget Password?",
        link: "Click here",
      },
      status: {
        registrationFallback:
          "Registration successful! Please check your email to confirm your account.",
        loginSuccess: "Login successful!",
      },
    },

    forgotPassword: {
      title: "Forgot Your Password",
      description:
        "Enter your email address and\n we will send you a link to reset your password",
      placeholder: "Please enter your email address",
      button: "Send",
      status: {
        linkSent: "Password reset link sent! Please check your email.",
      },
    },

    resetPassword: {
      title: "Reset Your Password",
      placeholder: "Enter new password",
      button: "Reset Password",
      status: {
        invalidToken: "Invalid or missing reset token",
        success: "Password has been reset successfully!",
      },
    },

    confirmEmail: {
      title: "Confirm Email",
      description:
        "Thank you for confirming your email!\n Please click the button to confirm and go back to Login Page",
      button: "Confirm",
      status: {
        invalidToken: "Invalid or missing confirmation token",
        success: "Email has been confirmed successfully!",
      },
    },
  },

  email: {
    placeholder: "Please enter your email address",
    invalidWithPeriod: "Invalid email address.",
    invalidNoPeriod: "Invalid email address",
    registrationValid: "E-Mail address is valid for registration!",
    loginValid: "E-Mail address valid for login!",
  },

  password: {
    placeholder: "Please enter your password",
    strength: {
      label: "Password Strength:",
      veryWeak: "Very Weak",
      weak: "Weak",
      medium: "Medium",
      strong: "Strong",
      veryStrong: "Very Strong",
    },
  },

  course: {
    create: {
      success: (courseName: string) =>
        `Course: "${courseName}" created successfully`,
      failure: (courseName: string, error: unknown) =>
        `Fail to create Course: "${courseName}", Error: ${error}"`,
    },
    update: {
      success: (courseName: string) =>
        `Course: ${courseName} editing successfully`,
      failure: (courseName: string, error: unknown) =>
        `Course: ${courseName} Error: ${error}`,
    },
    delete: {
      success: (courseName: string) =>
        `Course "${courseName}" deleted successfully`,
      failure: (courseName: string) =>
        `Failed to delete course "${courseName}"`,
    },
    addCourseToTerm: {
      success: (courseName: string) =>
        `Course: "${courseName}" created successfully`,
      failure: (courseName: string, termId: number | string, error: unknown) =>
        `Failed to create Course: "${courseName}" for termId: "${termId}, Error: ${error}"`,
    },
    addProject: {
      success: (projectName: string) =>
        `Project: "${projectName}" created successfully`,
      failure: (
        projectName: string,
        courseId: number | string,
        error: unknown,
      ) =>
        `Fail to create Project: "${projectName}" for courseId: "${courseId}, Error: ${error}"`,
    },
    updateProject: {
      success: (projectName: string) =>
        `Project: "${projectName}" updated successfully`,
      failure: (projectName: string, error: unknown) =>
        `Failed to update Project: "${projectName}". Error: ${error}`,
    },
    deleteProject: {
      success: (projectName: string) =>
        `Project: "${projectName}" deleted successfully`,
      failure: (projectName: string, error: unknown) =>
        `Failed to delete Project: "${projectName}". Error: ${error}`,
    },
  },

  term: {
    create: {
      success: (termName: string) => `Term: "${termName}" created successfully`,
      failure: (termName: string, error: unknown) =>
        `Failed to create Term: "${termName}", Error: ${error}"`,
    },
    delete: {
      success: (termName: string) => `Term "${termName}" deleted successfully`,
      failure: (termName: string) => `Failed to delete term "${termName}"`,
    },
  },

  projects: {
    happiness: {
      pageTitle: "Happiness",
      missingInfoAlert: "Missing project, user, or submission information",

      tabs: {
        user: "User",
        display: "Display",
      },

      submit: {
        sectionTitle: "Submit Happiness Rating",
        noSubmissionWindow:
          "No active submission window available. Please contact an administrator to set up a course schedule.",
        submitBeforeLabel: "Please Enter Before",
        question: "How happy are you doing this project?",
        success: "Happiness updated successfully",
      },

      display: {
        sectionTitle: (projectName: string | null) =>
          `Happiness - ${projectName ?? ""}`,
      },
    },
    codeActivity: {
      pageTitle: "Code Activity",
      commitsSectionTitle: "Commits on GitHub",
      loading: "Loading...",
      noneFound: "No commits found.",
      loadingMore: "Loading more commits...",
    },

    standups: {
      pageTitle: "Standup Emails",
      submitTitle: "Submit Standup",
      fields: {
        done: {
          label: "What did you complete yesterday?",
          placeholder: "Enter completed work...",
        },
        plans: {
          label: "What are your plans for today?",
          placeholder: "Enter your plans...",
        },
        challenges: {
          label: "What blockers or challenges do you face?",
          placeholder: "Enter any challenges...",
        },
      },
      actions: {
        sendEmail: "Send Email",
      },
      status: {
        missingProjectOrUser: "Missing project or user information",
        sent: "Standup email sent successfully",
      },
    },
  },

  dashboard: {
    pageTitle: "Dashboard",
    projectsTitle: "Projects",
    selectProjectPlaceholder: "Select Project",
    actions: {
      standups: "Standups",
      happiness: "Happiness",
      codeActivity: "Code Activity",
    },
    configurationTitle: "Configuration",
    configurationActions: {
      userProfile: "User profile",
      settings: "Settings",
      courseParticipation: "Course Participation",
      projectConfig: "Project Config",
    },
    systemAdministrationTitle: "System Administration",
    systemAdministrationActions: {
      userAdmin: "User Admin",
      courseAdmin: "Course Admin",
    },
  },

  admin: {
    common: {
      edit: "Edit",
      create: "Create",
      add: "Add",
      term: "Term",
      course: "Course",
      project: "Project",
    },

    forms: {
      submit: "submit",
    },

    userAdmin: {
      pageTitle: "User Admin",
      editDialogTitle: "Edit user",
      fields: {
        username: "Username",
        email: "Email",
        githubUsername: "GitHub Username",
        status: "Status",
        userRole: "UserRole",
        newPassword: "New Password",
      },
      table: {
        notAvailable: "N/A",
        headings: {
          username: "username",
          email: "email",
          githubUsername: "github username",
          status: "status",
          userRole: "userRole",
          action: "action",
        },
      },
      icons: {
        editTitle: "edit",
        sendConfirmationEmailTitle: "send confirmation email",
      },
    },

    courseAdmin: {
      pageTitle: "Manage Courses",
      aria: {
        dismissMessage: "Dismiss message",
      },
      actions: {
        create: "create",
        addCourse: "add course",
        delete: "delete",
        addProject: "add project",
        schedule: "schedule",
        edit: "edit",
      },
      sections: {
        termsTitle: (count: number) => `Terms (${count})`,
        coursesTitle: (count: number) => `Courses (${count})`,
        projectsTitle: (count: number) => `Projects (${count})`,
      },
      tables: {
        termsHeadings: {
          id: "id",
          termName: "termName",
          displayName: "displayName",
          action: "action",
        },
        coursesHeadings: {
          id: "id",
          term: "term",
          name: "name",
          action: "action",
        },
        projectsHeadings: {
          id: "id",
          projectName: "projectName",
          courseId: "courseId",
          actions: "actions",
        },
      },
      empty: {
        noProjectsFound: "No projects found",
      },
      confirmations: {
        deleteProject: (projectName: string) =>
          `Are you sure you want to delete project "${projectName}"?`,
        deleteCourseTitle: "Delete Course",
        deleteCourseDescription: (courseName: string) =>
          `Are you sure you want to delete course "${courseName}"? This will also delete the course schedule and submissions. This action cannot be undone.`,
        deleteTermTitle: "Delete Term",
        deleteTermDescription: (termName: string) =>
          `Are you sure you want to delete term "${termName}"? This action cannot be undone.`,
      },
      dialogs: {
        termOrCourseTitle: (action: "add" | "edit", type: "term" | "course") =>
          `${action === "edit" ? "Edit" : "Create"} ${type === "course" ? "Course" : "Term"}`,
        courseOrProjectTitle: (
          action: "add" | "edit",
          type: "course" | "project",
        ) =>
          `${action === "edit" ? "Edit" : "Create"} ${type === "project" ? "Project" : "Course"}`,
      },
      forms: {
        termNameLabel: "Term Name",
        displayNameLabel: "Display Name",
        courseNameLabel: "Course Name",
        projectNameLabel: "Project Name",
        termLabel: "Term",
        selectTermPlaceholder: "Select a term...",
        studentsCanCreateProjectLabel: "Students Can Create Project",
      },
      schedule: {
        title: "Course Scheduler",
        courseInfo: (id: number, courseName: string) =>
          `ID: ${id}, Name: ${courseName}`,
        courseStartLabel: "Course start:",
        courseEndLabel: "Course end:",
        submissionTitle: "Submission:",
        regenerateWeekly: "Regenerate Weekly Submissions",
        addDateLabel: "Add Date:",
        add: "Add",
        remove: "Remove",
        saving: "Saving...",
        weeklyRegenerated: "Weekly submissions regenerated",
        savedSuccess: "Schedule saved successfully!",
        savedFailure: "Failed to save schedule. Please try again.",
        submissionDateOutOfRange:
          "Submission date must be between course start and end dates",
      },
    },
  },

  selectMenu: {
    example: {
      placeholder: "Select a fruit",
      groupLabel: "Fruits",
      items: {
        apple: "Apple",
        banana: "Banana",
        blueberry: "Blueberry",
        grapes: "Grapes",
        pineapple: "Pineapple",
      },
    },
  },

  table: {
    filter: "Filter",
    reload: "reload",
    noUsersFound: "No users found",
    all: "all",
  },

  settings: {
    pageTitle: "Settings",
    sectionTitle: "Account Settings",
    edit: "Edit",

    user: {
      notAvailableWarning: "User data not available. Please log in again.",
      notFoundInStorageWarning: "User data not found in storage",
    },

    email: {
      label: "Email Address",
      notAvailableValue: "Not available",
      dialogTitle: "Change Email Address",
      inputLabel: "New Email",
      inputPlaceholder: "Enter your new email",
      action: "Change Email",
      successFallback: "Email changed successfully!",
    },

    password: {
      label: "Password",
      dialogTitle: "Change Password",
      inputLabel: "New Password",
      inputPlaceholder: "Enter your new password",
      action: "Change Password",
      successFallback: "Password changed successfully!",
    },

    github: {
      label: "GitHub Username",
      notSetValue: "Not set",
      dialogTitle: "Edit GitHub Username",
      inputLabel: "GitHub Username",
      inputPlaceholder: "Enter your GitHub username",
      confirm: "Confirm",
      emptyError: "GitHub username cannot be empty",
      emailMissingError: "User email not available",
      successFallback: "GitHub username added successfully!",
    },
  },

  userPanel: {
    pageTitle: "User Profile",
    sectionTitle: "Update Profile",
    submitChanges: "Submit Changes",
    reset: "Reset",

    email: {
      label: "Email Address",
      userNotAvailableWarning: "User data not available. Please log in again.",
      successFallback: "Email changed successfully!",
    },

    password: {
      label: "New Password",
      placeholder: "Enter new password",
      userNotAvailableWarning: "User data not available. Please log in again.",
      successFallback: "Password changed successfully!",
    },

    github: {
      label: "GitHub Username",
      placeholder: "Enter your GitHub username",
      userEmailMissingWarning: "User email not available. Please log in again.",
      emptyError: "GitHub username cannot be empty",
      successFallback: "GitHub username updated successfully!",
    },
  },

  projectConfig: {
    pageTitle: "Project Configuration",
    selectCourseTitle: "Select Course",
    selectCoursePlaceholder: "Select Course",
    enrolledProjectsTitle: "Enrolled Projects",
    availableProjectsTitle: "Available Projects",
    createNewProjectTitle: "Create New Project",
    selectProjectToJoinPlaceholder: "Select Project to Join",

    ownerLabel: "Owner",
    edit: "Edit",
    leave: "Leave",
    join: "Join",
    save: "Save",
    createProject: "Create Project",
    create: "Create",

    tooltips: {
      ownerOnlyEdit: "You must be an owner to edit this course",
    },

    url: {
      dialogTitle: "Edit Project URL",
      currentLabel: "Current URL:",
      noneSet: "No URL currently set",
      newUrlLabel: "New URL",
      newUrlPlaceholder: "Enter new URL",
      changeSuccessFallback: "URL changed successfully",
    },

    joinDialog: {
      title: "Join Project",
      roleLabel: "Role",
      rolePlaceholder: "Enter your role",
    },

    createDialog: {
      title: "Create Project",
      projectNameLabel: "Project Name",
      projectNamePlaceholder: "Enter project name",
      projectNameInvalid:
        "Project name can only contain letters, numbers, and underscores.",
    },

    status: {
      userNotAvailableWarning: "User data not available. Please log in again.",
      userEmailOrProjectMissing: "User email or selected project is missing",
      noCourseSelected: "No course selected",
      joinedFallback: "Successfully joined the project!",
      leftFallback: "Successfully left the project!",
      createdFallback: "Project created successfully",
    },

    empty: {
      noEnrolledProjects: "No enrolled projects",
    },
  },

  courseParticipation: {
    pageTitle: "Course Participation",
    enrolledTitle: "Projects you are enrolled in",
    availableTitle: "Available Projects",
    selectCoursePlaceholder: "Select Course",
    leave: "Leave",
    join: "Join",
    cancel: "Cancel",
    confirm: "Confirm",
    leaveDialogTitle: "Leave Project",
    leaveDialogText: (projectName: string) =>
      `Are you sure you want to leave ${projectName}?`,
    empty: {
      noEnrolledProjects: "No enrolled projects",
      noAvailableProjects: "No available projects",
    },
    joinDialogTitle: "Join Project",
    roleLabel: "Role",
    rolePlaceholder: "Enter your role",
    status: {
      userNotAvailableWarning: "User data not available. Please log in again.",
      joinedFallback: "Successfully joined the project!",
      leftFallback: "Successfully left the project!",
    },
  },
} as const;

export type Messages = typeof en;
