export const Errors = {
  INVALID_AUTH_TOKEN: 'Invalid or expired auth token',
  PASSWORDS_MISMATCH_ERROR: 'Passwords do not match',
  ACCOUNT_SUSPENDED: 'Account is suspended',
  EMAIL_ADDRESS_NOT_FOUND: 'Email address not found',
  NOT_REGISTERED_ERROR: 'User is not registered on Palette',
  PRE_REGISTERED_ERROR: 'User is already registered on Palette',
  INVALID_PASSWORD: 'Invalid password',
  FERPA_NOT_ACCEPTED:
    'User does not agree with FERPA guidelines. Cant proceed with pre registration',
  OPPORTUNITY_EXISTS_IN_CONSIDERATIONS:
    'This opportunity already exists in your considerations',
  NO_TODO_FOUND: 'no such todo found',
  TODO_EXISTS: 'Todo Already Exists',
  RECORD_NOT_FOUND: 'record not found',
  YOU_ARE_NOT_CREATOR: 'You are not the creator of this opportunity',
  SOME_OPPORTUNITIES_NOT_ADDED: `Some Opportunities could not be added`,
  NOT_FOUND: 'No Opportunities Found',
  NO_CONSIDERATIONS_FOUND: 'No Considerations Found',
  UNAUTHORIZED_OPPORTUNITY_CREATION:
    'You can create opportunity for only yourself',
  UNAUTHORIZED_OPPORTUNITY_STATUS_UPDATE:
    'Bad request, provide proper credentials.',
  NULL_OPPORTUNITY_ID: "Opportunity Id can't be NULL",
  INVALID_OPPORTUNITY_REMOVAL_REQUEST:
    'Bad request, Opportunity does not exist or it is already removed.',
  NO_COMMENTS: 'No Comments Available',
  INVALID_OPP: 'Opportunity Not Found!',
  INVALID_OPPORTUNITY_CREATION: 'You are not the creator of this opportunity.',
  INVALID_HIDING_STATUS:
    'Bad request, you can either make it hidden or available.',
  FAILED: 'Failure',
  RECORDS_NOT_FOUND: 'Records Not Found',
  INVALID_CREDENTIALS:
    'Bad request, please check the credentials that you are requesting.',
  ALREADY_HIDDEN_EVENT: 'Event is already hidden.',
  ALREADY_AVAILABLE_EVENT: 'Event is already available.',
  EVENT_REMOVED:
    'Event is already removed, so cannot be made Hidden or Available.',
  OPPORTUNITY_NOT_FOUND: 'Opportunity Not Found',
  NO_STUDENT: 'NO STUDENTS FOUND',
  NO_INSTITUTES_ASSIGNED_TO_ADMIN: 'Admin has no institute assigned',
};

export const Responses = {
  LOGIN_SUCCESS: 'Login successful',
  PASSWORD_RESET_SUCCESS: 'Password changed successfully',
  PRE_REGISTER_SUCCESS: 'User pre registered successfully',
  ADD_PROFILE_PICTURE_SUCCESS: 'Profile picture updated successfully',
  SUCCESS: 'SUCCESS',
  ADDED_TO_TODO: 'Added to todo',
  ADDED_TO_CONSIDERATIONS: 'Added To Considerations',
  OPPORTUNITY_UPDATED: 'Opportunity Updated Successfully',
  ALL_ADDED_TO_CONSIDERATIONS: `all opportunities added to considerations`,
  ALL_ADDED_TO_TODOS: 'all opportunities added to todos',
  DRAFT_OPPORTUNITY_SAVED: 'Opportunity saved as draft',
  STATUS_UPDATE: 'Status update success',
  OPPORTUNITY_REMOVED: 'Opportunity is removed',
  OPPORTUNITY_REMOVAL_REQUEST_CREATED:
    'Opportunity removal request is created.',
  ALL_COMMENTS_OF_OPP: 'All comments of the requested opportunity',
  COMMENT_CREATED: 'Comment created',
  OPPORTUNITY_CREATED: 'Opportunity is created',
  UPDATED: 'Opportunity Updated Successfully',
  EVENT_MADE_AVAILABLE: 'Event is successfully made available.',
  EVENT_MADE_HIDDEN: 'Event is successfully made hidden.',
  RECEPIENT: 'Recipients',
  RECEPIENTS_FETCH_SUCCESS: 'Recipients fetched successfully',
  PROFILE_FETCHED: 'Profile fetched successfully',
};

export const RecordTypeName = {
  ADMINISTRATOR: 'Administrator',
  STUDENT: 'Student',
  GUARDIAN: 'Guardian',
};

export const Roles = {
  ADMIN: 'Admin',
  STUDENT: 'Student',
};

export const OpportunityScope = {
  DISCRETE: 'Discrete',
  GLOBAL: 'Global',
};

export const Visibility = {
  AVAILABLE: 'Available',
  REMOVED: 'Removed',
  HIDDEN: 'Hidden',
};

export const ApprovalStatus = {
  DRAFT: 'Draft',
  APPROVED: 'Approved',
};

export const OpportunityStatus = {
  IN_REVIEW: 'In Review',
  APPROVED: 'Approved',
};

export const RemovalStatus = {
  IN_REVIEW: 'In Review',
  APPROVED: 'Approved',
};

export const CommentType = {
  APPROVAL: 'Approval',
  GENERIC: 'Generic',
};

export const Event = {
  INVALID_OPPORTUNITY_REMOVAL_REQUEST:
    'Bad request, Opportunity does not exist or it is already removed.',
  EVENT_NOT_FOUND:
    'Event is already removed, so cannot be made Hidden or Available.',
  EVENT_HIDDEN_ALREADY: 'Event is already hidden.',
  EVENT_HIDDEN_SUCCESS: 'Event is successfully made hidden.',
  EVENT_AVAILABLE_ALREADY: 'Event is already available.',
  EVENT_AVAILABLE_SUCCESS: 'Event is successfully made available.',
  EVENT_REMOVED:
    'Event is already removed, so cannot be made Hidden or Available.',
};

export const NotificationTitles = {
  OPPORTUNITY_REMOVED: `Opportunity removed`,
  OPPORTUNITY_REMOVE_REQUEST: `Opportunity Removal Request`,
  OPPORTUNITY_APPROVAL_REQUEST: `Opportunity Approval Request`,
  NEW_CREATOR_COMMENT: 'New comment by opportunity creator!',
  NEW_ADMIN_COMMENT: 'New comment by opportunity creator!',
  NEW_CONSIDERATION: 'New in Consideration',
};

export const NotificationMessage = {
  OPPORTUNITY_REMOVED_BY_CREATOR: `Opportunity has been removed by the creator`,
  OPPORTUNITY_REMOVED_BY_ADMIN: `Opportunity has been removed by the admin`,
  OPPORTUNITY_REMOVE_REQUEST: `Removal Request for the Global Opportunity`,
  OPPORTUNITY_REQUEST_APPROVAL: `Opportunity Request for the approval`,
  OPPORTUNITY_CREATED: `Opportunity Created for you`,
};

export const NotificationDataTexts = {
  OPPORTUNITY_REMOVED: `Opportunity data`,
  OPPORTUNITY_EDIT: `Opportunity edit data`,
  OPPORTUNITY_COMMENT: `Opportunity Comment`,
  OPPORTUNITY_CREATED: `Create opportunity`,
};

export const NotificationDataTypes = {
  OPPORTUNITY_REMOVED: `Create opportunity removal`,
  OPPORTUNITY_EDIT: `Create opportunity edit`,
  OPPORTUNITY_COMMENT: `Create opportunity comment`,
  OPPORTUNITY_CREATED: `Create opportunity`,
};

export const AccountActivity = {
  ACTIVITY: 'Activity',
  // ACTIVITY: 'activities',
}
