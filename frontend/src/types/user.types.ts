export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  plan: string;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  joinedAt: string;
}
