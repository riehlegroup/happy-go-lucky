export const Messages = {
  common: {
    serverError: "Server error",
    requestProcessingError: "An error occurred while processing your request",
    resourceNotFound: "Resource not found",
    internalServerError: "Internal server error",
  },

  auth: {
    missingRegisterFields: "Please fill in username, email and password!",
    passwordTooWeak: "Password must be at least 8 characters long and should contain upper and lower case letters as well as numbers or special characters",
    invalidEmailFormat: "Invalid email format",
    invalidEmailAddress: "Invalid email address",
    nameTooShort: "Name must be at least 3 characters long",
    registerSuccess: "User registered successfully",
    missingLoginFields: "Email and password are required",
    invalidEmail: "Invalid email",
    noPasswordSet: "No password set for user",
    invalidPassword: "Invalid password",
    emailNotConfirmed: "Email not confirmed. Please contact system admin.",
    accountSuspended: "User account is suspended. Please contact system admin.",
    accountRemoved: "User account is removed. Please contact system admin.",
    loginFailed: "Login failed",
    userEmailRequired: "User email is required",
    emailNotFound: "Email not found",
    passwordResetEmailSent: "Password reset email sent",
    tokenAndNewPasswordRequired: "Token and new password are required",
    invalidOrExpiredResetToken: "Invalid or expired reset token",
    invalidOrExpiredToken: "Invalid or expired token",
    passwordResetSuccess: "Password has been reset",
    tokenRequired: "Token is required",
    invalidOrExpiredConfirmationToken:  "Invalid or expired token",
    emailConfirmed: "Email has been confirmed",
    userNotFound: "User not found",
    userNotFoundOrNotUnconfirmed: "User not found or not unconfirmed",
    confirmationEmailSent: "Confirmation email sent",
    failedToSendConfirmationEmail: "Failed to send confirmation email",
  },

  email: {
    confirmEmailSubject: "Confirm Email",
    confirmEmailBody: (confirmedLink: string) =>
      `You registered for Happy Go Lucky! Click the link to confirm your email: ${confirmedLink}`,

    passwordResetSubject: "Password Reset",
    passwordResetBody: (resetLink: string) =>
      `You requested a password reset. Click the link to reset your password: ${resetLink}`,

    standupEmailSubject: (projectName: string) => `Standup Update for ${projectName}`,
    standupEmailBody: (userName: string, doneText: string, plansText: string, challengesText: string) =>
      `Standup report from ${userName}\n\nDone: ${doneText}\nPlans: ${plansText}\nChallenges: ${challengesText}`,

    accountSuspendedSubject: "Account Suspended",
    accountSuspendedBody:
      "Your account has been suspended. Please contact the administrator for more information.",

    accountRemovedSubject: "Account Removed",
    accountRemovedBody:
      "Your account has been removed. Please contact the administrator for more information.",

  },

  course: {
      courseNameRequiredString: "Course name is required and must be a string",
      termIdRequired: "Term ID is required",
      termIdMustBeNumber: "Term ID must be a valid number",
      courseCreatedSuccessfully: "Course created successfully",

      courseIdMustBeInteger: "Course ID must be an integer",
      courseIdMustBeNumber: "Course ID must be a valid number",
      courseIdRequired: "Course ID is required",
      invalidCourseIdFormat: "Invalid course ID format",
      invalidCourseId: "Invalid course ID",

      courseDeletedSuccessfully: "Course deleted successfully",

      courseUpdateNotImplementedYet: "Course delete not implemented yet",
      userCoursesNotImplementedYet: "User courses not implemented yet",

      projectAddedSuccessfully: "Project added successfully",
      courseProjectsNotFound: "Course projects not found",

      projectIdMustBeNumber: "Project ID must be a valid number",
      projectNameRequiredString: "Project name is required and must be a string",
      projectNotFound: "Project not found",
      projectUpdatedSuccessfully: "Project updated successfully",
      projectDeletedSuccessfully: "Project deleted successfully",

      startAndEndDateRequired: "Start date and end date are required",
      scheduleSavedSuccessfully: "Schedule saved successfully",
      scheduleNotFoundForCourse: "Schedule not found for this course",

       courseNotFound: "Course not found",
    },

  legacy: {
    urlRequired: "Please fill in URL!",
    invalidUrl: "Invalid URL",
    urlAddedSuccessfully: "URL added successfully",
    failedToAddUrl: "Failed to add URL",

    projectNotFound: "Project not found",
    notMemberOfProject: "You are not a member of this project",
    leftProjectSuccessfully: "Left project successfully",
    failedToLeaveProject: "Failed to leave project",
  },

  project: {
    courseIdRequired: "Course id is required",

    projectEditMissingFields: "Please fill in project group name and project name",
    projectEditedSuccessfully: "Project edited successfully",
    projectEditionFailed: "Project edition failed",

    projectNameRequired: "Project name is required",
    courseNotFoundForProject: "Course not found for this project",
    failedToFetchCourse: "Failed to fetch course",

    projectNameAndUserEmailRequired: "Project name and user email are required",
    roleNotFound: "Role not found",
    roleRequired: "Please fill in your role",
    failedToRetrieveProjectRole: "Failed to retrieve project role",

    projectNotFound: "Project not found",
    alreadyJoinedProject: "You have already joined this project",
    joinedProjectSuccessfully: "Joined project successfully",
    failedToJoinProject: "Failed to join project",

    notMemberOfProject: "You are not a member of this project",
    leftProjectSuccessfully: "Left project successfully",
    failedToLeaveProject: "Failed to leave project",

    failedToRetrieveUserProjects: "Failed to retrieve user projects",
    failedToRetrieveCoursesOfUser: "Failed to retrieve courses of user",

    submissionDateIdRequiredNumber: "Submission date ID is required and must be a number",
    submissionDateNotFound: "Submission date not found",
    projectOrUserNotFound: "Project or user not found",
    happinessUpdatedSuccessfully: "Happiness updated successfully",
    failedToUpdateHappiness: "Failed to update happiness",
    failedToFetchHappinessData: "Failed to fetch happiness data",

    noScheduleFoundForCourse: "No schedule found for this course",
    noFutureSubmissionDatesAvailable: "No future submission dates available",
    failedToFetchAvailableSubmissions: "Failed to fetch available submissions",

    noMembersInProjectGroup: "No members in the project group",
    standupEmailSentSuccessfully: "Standup email sent successfully",
    failedToSendStandupEmail: "Failed to send standup email",

    failedToRetrieveProjectsForCourse: (courseName: string) =>
      `Failed to retrieve projects for course ${courseName}`,
  },

  term: {
    termNameRequiredString: "Term name is required and must be a string",
    termCreatedSuccessfully: "Term created successfully",

    termIdMustBeNumber: "Term ID must be a valid number",
    termNotFound: "Term not found",
    termDeletedSuccessfully: "Term deleted successfully",

    termIdRequired: "Term ID is required",
    invalidTermIdFormat: "Invalid term ID format",
    invalidTermId: "Invalid term ID",

    courseAddedSuccessfully: "Course added successfully",
  },


   user: {
     userNotFound: "User not found",
     failedToRetrieveUserStatus: "Failed to retrieve user status",
     emailAndStatusRequired: "Please provide email and status",
     userStatusUpdatedSuccessfully: "User status updated successfully",
     failedToUpdateUserStatus: "Failed to update user status",

     statusRequired: "Status is required",
     noConfirmedUsersFoundToUpdate: "No confirmed users found to update",
     allConfirmedUsersUpdatedTo: (status: string) =>
       `All confirmed users have been updated to ${status}`,
     failedToUpdateConfirmedUsers: "Failed to update confirmed users",

     newEmailRequired: "Please fill in new email!",
     emailUpdatedSuccessfully: "Email updated successfully",
     failedToUpdateEmail: "Failed to update email",

     newPasswordRequired: "Please fill in new password!",
     passwordMinLength: "Password must be at least 8 characters long",
     passwordUpdatedSuccessfully: "Password updated successfully",
     failedToUpdatePassword: "Failed to update password",

     userEmailAndProjectNameMandatory: "User Email and Project Name are mandatory!",
     failedToFetchUrl: "Failed to fetch URL",

     githubUsernameRequired: "Please fill in GitHub username!",
     githubUsernameAddedSuccessfully: "GitHub username added successfully",
     failedToAddGithubUsername: "Failed to add GitHub username",
     userEmailMandatory: "User Email is mandatory!",
     failedToFetchGithubUsername: "Failed to fetch GitHub username",

     failedToRetrieveUserRole: "Failed to retrieve user role",
     emailAndRoleRequired: "Please provide email and role",
     userRoleUpdatedSuccessfully: "User role updated successfully",
     failedToUpdateUserRole: "Failed to update user role",
   },



};
