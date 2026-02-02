export const messages = {
  common: {
    internalServerError: "Internal server error",
    requestProcessingError: "An error occurred while processing your request",
    resourceNotFound: "Resource not found",
    serverError: "Server error",

    invalidEmailAddress: "Invalid email address",
    userNotFound: "User not found",
    projectNotFound: "Project not found",
    courseNotFound: "Course not found",

    pleaseFillInUrl: "Please fill in URL!",
    invalidUrl: "Invalid URL",
    urlAddedSuccessfully: "URL added successfully",
    failedToAddUrl: "Failed to add URL",

    notMemberOfProject: "You are not a member of this project",
    leftProjectSuccessfully: "Left project successfully",
    failedToLeaveProject: "Failed to leave project",

    authenticationRequired: "Authentication required",
    invalidToken: "Invalid token",
    adminAccessRequired: "Forbidden: Admin access required",
    ownershipEditForbidden: "Forbidden: You can only edit your own data",
  },

  term: {
    termNameRequiredString: "Term name is required and must be a string",
    termCreatedSuccessfully: "Term created successfully",
    termIdRequired: "Term ID is required",
    termIdMustBeValidNumber: "Term ID must be a valid number",
    invalidTermIdFormat: "Invalid term ID format",
    invalidTermId: "Invalid term ID",
    termNotFound: "Term not found",
    termDeletedSuccessfully: "Term deleted successfully",
    courseAddedSuccessfully: "Course added successfully",
  },

  course: {
    courseNameRequiredString: "Course name is required and must be a string",
    courseIdRequired: "Course ID is required",
    courseIdMustBeInteger: "Course ID must be an integer",
    courseIdMustBeValidNumber: "Course ID must be a valid number",
    invalidCourseIdFormat: "Invalid course ID format",
    invalidCourseId: "Invalid course ID",
    courseNotFound: "Course not found",
    courseProjectsNotFound: "Course projects not found",

    termIdRequired: "Term ID is required",
    termIdMustBeValidNumber: "Term ID must be a valid number",

    courseCreatedSuccessfully: "Course created successfully",
    courseDeletedSuccessfully: "Course deleted successfully",

    courseDeleteNotImplementedYet: "Course delete not implemented yet",
    userCoursesNotImplementedYet: "User courses not implemented yet",

    projectIdMustBeValidNumber: "Project ID must be a valid number",
    projectNameRequiredString: "Project name is required and must be a string",
    projectNotFound: "Project not found",
    projectAddedSuccessfully: "Project added successfully",
    projectUpdatedSuccessfully: "Project updated successfully",
    projectDeletedSuccessfully: "Project deleted successfully",

    startAndEndDateRequired: "Start date and end date are required",
    scheduleSavedSuccessfully: "Schedule saved successfully",
    scheduleNotFoundForCourse: "Schedule not found for this course",
  },

  user: {
    failedToRetrieveUserStatus: "Failed to retrieve user status",
    provideEmailAndStatus: "Please provide email and status",
    userStatusUpdatedSuccessfully: "User status updated successfully",
    failedToUpdateUserStatus: "Failed to update user status",

    statusIsRequired: "Status is required",
    noConfirmedUsersFoundToUpdate: "No confirmed users found to update",
    allConfirmedUsersUpdatedTo: (status: string) => `All confirmed users have been updated to ${status}`,
    failedToUpdateConfirmedUsers: "Failed to update confirmed users",

    fillInNewEmail: "Please fill in new email!",
    invalidEmailAddress: "Invalid email address",
    emailUpdatedSuccessfully: "Email updated successfully",
    failedToUpdateEmail: "Failed to update email",

    fillInNewPassword: "Please fill in new password!",
    passwordMinLength8: "Password must be at least 8 characters long",
    passwordUpdatedSuccessfully: "Password updated successfully",
    failedToUpdatePassword: "Failed to update password",

    fillInUrl: "Please fill in URL!",
    invalidUrl: "Invalid URL",
    urlAddedSuccessfully: "URL added successfully",
    failedToFetchUrl: "Failed to fetch URL",
    failedToAddUrl: "Failed to add URL",
    userEmailAndProjectNameMandatory: "User Email and Project Name are mandatory!",

    userEmailRequiredBang: "User email is required!",
    userEmailMandatoryBang: "User Email is mandatory!",

    fillInGitHubUsername: "Please fill in GitHub username!",
    githubUsernameAddedSuccessfully: "GitHub username added successfully",
    failedToAddGitHubUsername: "Failed to add GitHub username",
    failedToFetchGitHubUsername: "Failed to fetch GitHub username",

    failedToRetrieveUserRole: "Failed to retrieve user role",
    provideEmailAndRole: "Please provide email and role",
    userRoleUpdatedSuccessfully: "User role updated successfully",
    failedToUpdateUserRole: "Failed to update user role",

    accountSuspendedSubject: "Account Suspended",
    accountSuspendedBody:
      "Your account has been suspended. Please contact the administrator for more information.",
    accountRemovedSubject: "Account Removed",
    accountRemovedBody:
      "Your account has been removed. Please contact the administrator for more information.",
  },

  auth: {
    fillInUsernameEmailPassword: "Please fill in username, email and password!",
    passwordStrengthRequirements:
      "Password must be at least 8 characters long and should contain upper and lower case letters as well as numbers or special characters",
    emailWrongFormat: "email has not the right format",
    nameMinLength3: "Name must be at least 3 characters long",

    userRegisteredSuccessfully: "User registered successfully",

    emailAndPasswordRequired: "Email and password are required",
    invalidEmail: "Invalid email",
    noPasswordSetForUser: "No password set for user",
    invalidPassword: "Invalid password",

    emailNotConfirmedContactAdmin: "Email not confirmed. Please contact system admin.",
    userSuspendedContactAdmin: "User account is suspended. Please contact system admin.",
    userRemovedContactAdmin: "User account is removed. Please contact system admin.",

    loginFailed: "Login failed",

    userEmailIsRequired: "User email is required",
    emailNotFound: "Email not found",
    passwordResetEmailSent: "Password reset email sent",

    tokenAndNewPasswordRequired: "Token and new password are required",
    invalidOrExpiredResetToken: "Invalid or expired reset token",
    invalidOrExpiredToken: "Invalid or expired token",
    passwordHasBeenReset: "Password has been reset",

    tokenIsRequired: "Token is required",
    invalidOrExpiredConfirmationToken: "Invalid or expired confirmation token",
    emailHasBeenConfirmed: "Email has been confirmed",

    userNotFoundOrNotUnconfirmed: "User not found or not unconfirmed",
    confirmationEmailSent: "Confirmation email sent",
    failedToSendConfirmationEmail: "Failed to send confirmation email",

    confirmEmailSubject: "Confirm Email",
    confirmEmailBody: (confirmedLink: string) =>
      `You registered for Happy Go Lucky! Click the link to confirm your email: ${confirmedLink}`,

    passwordResetSubject: "Password Reset",
    passwordResetBody: (resetLink: string) =>
      `You requested a password reset. Click the link to reset your password: ${resetLink}`,
  },

  project: {
    courseIdIsRequired: "Course id is required",
    failedToRetrieveProjectsForCourse: (courseName: unknown) =>
      `Failed to retrieve projects for course ${courseName}`,

    fillInProjectGroupAndProjectName: "Please fill in project group name and project name",
    projectEditedSuccessfully: "Project edited successfully",
    projectEditionFailed: "Project edition failed",

    projectNameIsRequired: "Project name is required",
    courseNotFoundForProject: "Course not found for this project",
    failedToFetchCourse: "Failed to fetch course",

    userEmailIsRequired: "User email is required",
    projectNameAndUserEmailRequired: "Project name and user email are required",
    roleNotFound: "Role not found",
    failedToRetrieveProjectRole: "Failed to retrieve project role",

    fillInYourRole: "Please fill in your role",
    alreadyJoinedProject: "You have already joined this project",
    joinedProjectSuccessfully: "Joined project successfully",
    failedToJoinProject: "Failed to join project",

    leftProjectSuccessfully: "Left project successfully",
    failedToLeaveProject: "Failed to leave project",
    notMemberOfProject: "You are not a member of this project",

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

    standupEmailSubject: (projectName: string) => `Standup Update for ${projectName}`,
    standupEmailBody: (userName: string, doneText: string, plansText: string, challengesText: string) =>
      `Standup report from ${userName}\n\nDone: ${doneText}\nPlans: ${plansText}\nChallenges: ${challengesText}`,
  },
} as const;
