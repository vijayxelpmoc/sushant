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

export const ObserverSubRoles: string[] = [
  'Aunt',
  'Uncle',
  "Parent's Sibling",
  'Employer',
  'Observer',
  'Husband',
  'Wife',
  'Cousin',
  'Family',
  'Steps',
  'Coworker',
  'Observer',
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
  'Aunt',
  'Uncle',
  'Husband',
  'Wife',
  'Partner',
  'Cousin',
  'Grandmother',
  'Grandfather',
  'Grandparent',
  'Guardian',
];

export const MentorSubRoles: string[] = ['Advisor', 'Mentor', 'Champion'];

export const GuardianObserverSubRoles: string[] = [
  ...ObserverSubRoles,
  ...GuardianSubRoles,
];
