export const ObserverSubRoles: string[] = [
  'Aunt',
  'Uncle',
  "Parent's Sibling",
  'Grandmother',
  'Grandfather',
  'Grandparent',
  'Employer',
  'Observer',
  'Husband',
  'Wife',
  'Cousin',
  'Family',
  'Steps',
  'Coworker',
];

export const StudentSubRoles: string[] = [
  'Daughter',
  'Stepdaughter',
  'Foster Daughter',
  'Son',
  'Stepson',
  'Foster Son',
  'Child',
  'Stepchild',
  'Foster Child',
  'Grandson',
  'Granddaughter',
  'Grandchild',
  'Employee',
  'Dependent',
  "Sibling's Child",
];

export const GuardianSubRoles: string[] = [
  'Father',
  'Stepfather',
  'Mother',
  'Stepmother',
  'Parent',
  'stepparent',
  'Foster Parent',
  'Guardian',
];

export const MentorSubRoles: string[] = ['Advisor', 'Mentor'];

export const GuardianObserverSubRoles: string[] = [
  ...ObserverSubRoles,
  ...GuardianSubRoles,
];
