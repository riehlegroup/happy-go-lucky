export const messagesEn = {
  common: {
    appName: "Happy Go Lucky",
    topNav: {
      user: (username: string) => `User: ${username}`,
    },
    errors: {
      unexpected: "An unexpected error occurred",
      userDataMissing: "User data not available. Please log in again.",
    },
    actions: {
      back: "← Back",
      logout: "Logout",
      close: "Close",
      save: "Save",
      saving: "Saving...",
      cancel: "Cancel",
      confirm: "Confirm",
      delete: "Delete",
      remove: "Remove",
      add: "Add",
      edit: "Edit",
      join: "Join",
      leave: "Leave",
      create: "Create",
      submit: "Submit",
      reset: "Reset",
      previous: "Previous",
      next: "Next",
      all: "all",
      dismiss: "Dismiss message",
      sendEmail: "Send Email",
      reload: "reload",
      filter: "Filter",
    },
    placeholders: {
      notAvailable: "Not available",
      notSet: "Not set",
      na: "N/A",
    },
  },

  auth: {
    tabs: {
      login: "Login",
      signUp: "Sign Up",
    },

    headings: {
      forgotPassword: "Forgot Your Password",
      resetPassword: "Reset Your Password",
      confirmEmail: "Confirm Email",
    },

    helperText: {
      forgotPassword: {
        line1: "Enter your email address and",
        line2: "we will send you a link to reset your password",
      },
      confirmEmail: {
        line1: "Thank you for confirming your email!",
        line2: "Please click the button to confirm and go back to Login Page",
      },
    },

    labels: {
      name: "Name",
      email: "Email",
      password: "Password",
    },

    placeholders: {
      name: "Please enter your name",
      email: "Please enter your email address",
      password: "Please enter your password",
      newPassword: "Enter new password",
    },

    actions: {
      createAccount: "Create Account",
      signIn: "Sign In",
      send: "Send",
      resetPassword: "Reset Password",
      confirm: "Confirm",
    },

    links: {
      forgotPassword: "Forget Password?",
      clickHere: "Click here",
    },

    validation: {
      nameRequired: "Name is required",
      validEmailRequired: "Please enter a valid email address",
    },

    messages: {
      registrationSuccessFallback:
        "Registration successful! Please check your email to confirm your account.",
      loginSuccess: "Login successful!",
      passwordResetLinkSent: "Password reset link sent! Please check your email.",
      invalidOrMissingResetToken: "Invalid or missing reset token",
      passwordResetSuccess: "Password has been reset successfully!",
      invalidOrMissingConfirmationToken: "Invalid or missing confirmation token",
      emailConfirmedSuccess: "Email has been confirmed successfully!",
    },
  },

  dashboard: {
    title: "Dashboard",
    sections: {
      projects: "Projects",
      configuration: "Configuration",
      systemAdministration: "System Administration",
    },
    projectSelectPlaceholder: "Select Project",
    projectActions: {
      standups: "Standups",
      happiness: "Happiness",
      codeActivity: "Code Activity",
    },
    configActions: {
      userProfile: "User profile",
      settings: "Settings",
      courseParticipation: "Course Participation",
      projectConfig: "Project Config",
    },
    adminActions: {
      userAdmin: "User Admin",
      courseAdmin: "Course Admin",
    },
  },

  projects: {
    standups: {
      title: "Standup Emails",
      sectionTitle: "Submit Standup",
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
      messages: {
        missingProjectOrUser: "Missing project or user information",
        emailSent: "Standup email sent successfully",
      },
    },
    codeActivity: {
      title: "Code Activity",
      sectionTitle: "Commits on GitHub",
      loading: "Loading...",
      noCommits: "No commits found.",
      loadingMore: "Loading more commits...",
    },
    happiness: {
      title: "Happiness",
      tabs: {
        user: "User",
        display: "Display",
      },
      submitSectionTitle: "Submit Happiness Rating",
      displaySectionTitle: (projectName: string) => `Happiness - ${projectName}`,
      messages: {
        missingRequiredInfo: "Missing project, user, or submission information",
        updatedSuccess: "Happiness updated successfully",
        noActiveSubmission:
          "No active submission window available. Please contact an administrator to set up a course schedule.",
      },
      prompts: {
        enterBefore: "Please Enter Before",
        question: "How happy are you doing this project?",
      },
    },
  },

  configuration: {
    settings: {
      title: "Settings",
      sections: {
        accountSettings: "Account Settings",
      },
      labels: {
        emailAddress: "Email Address",
        password: "Password",
        githubUsername: "GitHub Username",
        newEmail: "New Email",
        newPassword: "New Password",
      },
      placeholders: {
        newEmail: "Enter your new email",
        newPassword: "Enter your new password",
        githubUsername: "Enter your GitHub username",
      },
      dialogs: {
        changeEmail: "Change Email Address",
        changePassword: "Change Password",
        editGithubUsername: "Edit GitHub Username",
      },
      actions: {
        changeEmail: "Change Email",
        changePassword: "Change Password",
      },
      messages: {
        emailChangedFallback: "Email changed successfully!",
        passwordChangedFallback: "Password changed successfully!",
        githubUsernameAddedFallback: "GitHub username added successfully!",
        githubUsernameUpdatedFallback: "GitHub username updated successfully!",
        githubUsernameEmpty: "GitHub username cannot be empty",
        userEmailNotAvailable: "User email not available",
      },
    },
    userPanel: {
      submitChanges: "Submit Changes",
      title: "User Profile",
      updateProfile: "Update Profile",
      labels: {
        newPassword: "New Password",
        githubUsername: "GitHub Username",
      },
      placeholders: {
        newPassword: "Enter new password",
        githubUsername: "Enter your GitHub username",
      },
    },
    courseParticipation: {
      title: "Course Participation",
      sections: {
        enrolled: "Projects you are enrolled in",
        available: "Available Projects",
      },
      placeholders: {
        selectCourse: "Select Course",
        role: "Enter your role",
      },
      labels: {
        role: "Role",
      },
      dialogs: {
        leaveProject: "Leave Project",
        joinProject: "Join Project",
        confirmLeave: (projectName: string) =>
          `Are you sure you want to leave ${projectName}?`,
      },
      messages: {
        noEnrolledProjects: "No enrolled projects",
        noAvailableProjects: "No available projects",
        userDataMissing: "User data not available. Please log in again.",
        joinedSuccessFallback: "Successfully joined the project!",
        leftSuccessFallback: "Successfully left the project!",
      },
    },
    projectConfig: {
      title: "Project Configuration",
      sections: {
        selectCourse: "Select Course",
        enrolledProjects: "Enrolled Projects",
        availableProjects: "Available Projects",
        createNewProject: "Create New Project",
      },
      placeholders: {
        selectCourse: "Select Course",
        selectProjectToJoin: "Select Project to Join",
        newUrl: "Enter new URL",
        role: "Enter your role",
        projectName: "Enter project name",
      },
      labels: {
        newUrl: "New URL",
        currentUrl: "Current URL:",
        role: "Role",
        projectName: "Project Name",
      },
      messages: {
        urlChangedFallback: "URL changed successfully",
        missingUserEmailOrProject: "User email or selected project is missing",
        userDataMissing: "User data not available. Please log in again.",
        noCourseSelected: "No course selected",
        joinedSuccessFallback: "Successfully joined the project!",
        leftSuccessFallback: "Successfully left the project!",
        projectCreatedFallback: "Project created successfully",
        invalidProjectName:
          "Project name can only contain letters, numbers, and underscores.",
        noEnrolledProjects: "No enrolled projects",
        noUrlCurrentlySet: "No URL currently set",
        owner: "Owner",
        ownerRequiredToEdit: "You must be an owner to edit this course",
      },
      dialogs: {
        editProjectUrl: "Edit Project URL",
        joinProject: "Join Project",
        createProject: "Create Project",
      },
    },
  },

  admin: {
    courseAdmin: {
      title: "Manage Courses",
      sections: {
        terms: (count: number) => `Terms (${count})`,
        courses: (count: number) => `Courses (${count})`,
        projects: (count: number) => `Projects (${count})`,
      },
      actions: {
        create: "create",
        addCourse: "add course",
        addProject: "add project",
        schedule: "schedule",
        edit: "edit",
        delete: "delete",
      },
      tableHeadings: {
        id: "id",
        termName: "termName",
        displayName: "displayName",
        action: "action",
        term: "term",
        name: "name",
        projectName: "projectName",
        courseId: "courseId",
        actions: "actions",
      },
      messages: {
        noProjectsFound: "No projects found",
      },
    },
    userAdmin: {
      title: "User Admin",
      dialogs: {
        editUser: "Edit user",
      },
      labels: {
        username: "Username",
        email: "Email",
        githubUsername: "GitHub Username",
        status: "Status",
        userRole: "UserRole",
        newPassword: "New Password",
      },
      tooltips: {
        edit: "edit",
        sendConfirmationEmail: "send confirmation email",
      },
      tableHeadings: {
        username: "username",
        email: "email",
        githubUsername: "github username",
        status: "status",
        userRole: "userRole",
        action: "action",
      },
    },
    term: {
      entity: {
        term: "Term",
        course: "Course",
      },
      dialogTitle: (mode: "edit" | "create", entity: "term" | "course") =>
        `${mode === "edit" ? "Edit" : "Create"} ${entity === "course" ? "Course" : "Term"}`,
      formLabels: {
        termName: "Term Name",
        displayName: "Display Name",
        courseName: "Course Name",
      },
      deleteTermDialog: {
        title: "Delete Term",
        description: (termName: string) =>
          `Are you sure you want to delete term "${termName}"? This action cannot be undone.`,
      },
    },
    course: {
      entity: {
        course: "Course",
        project: "Project",
      },
      dialogTitle: (mode: "edit" | "create", entity: "course" | "project") =>
        `${mode === "edit" ? "Edit" : "Create"} ${entity === "project" ? "Project" : "Course"}`,
      confirmDeleteProject: (projectName: string) =>
        `Are you sure you want to delete project "${projectName}"?`,
      deleteCourseDialog: {
        title: "Delete Course",
        description: (courseName: string) =>
          `Are you sure you want to delete course "${courseName}"? This will also delete the course schedule and submissions. This action cannot be undone.`,
      },
      formLabels: {
        term: "Term",
        courseName: "Course Name",
        projectName: "Project Name",
        studentsCanCreateProject: "Students Can Create Project",
      },
      placeholders: {
        selectTerm: "Select a term...",
      },
      schedule: {
        title: "Course Scheduler",
        labels: {
          id: "ID",
          name: "Name",
          courseStart: "Course start:",
          courseEnd: "Course end:",
          submission: "Submission:",
          regenerateWeekly: "Regenerate Weekly Submissions",
          addDate: "Add Date:",
        },
        messages: {
          weeklyRegenerated: "Weekly submissions regenerated",
          savedSuccess: "Schedule saved successfully!",
          saveFailed: "Failed to save schedule. Please try again.",
          submissionOutOfRange:
            "Submission date must be between course start and end dates",
        },
      },
    },
  },

  components: {
    table: {
      emptyNoUsers: "No users found",
    },
    selectMenu: {
      placeholder: "Select a fruit",
      label: "Fruits",
      items: {
        apple: "Apple",
        banana: "Banana",
        blueberry: "Blueberry",
        grapes: "Grapes",
        pineapple: "Pineapple",
      },
    },
  },

  widgets: {
    email: {
      invalid: "Invalid email address.",
      validForRegistration: "E-Mail address is valid for registration!",
      validForLogin: "E-Mail address valid for login!",
    },
    password: {
      strengthLabel: "Password Strength:",
      strengths: {
        veryWeak: "Very Weak",
        weak: "Weak",
        medium: "Medium",
        strong: "Strong",
        veryStrong: "Very Strong",
      },
    },
  },
} as const;
