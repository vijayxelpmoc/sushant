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
