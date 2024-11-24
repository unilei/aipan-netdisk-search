export interface User {
  id: string;
  name: string | null;
  email: string;
  role: 'user' | 'admin';
  emailVerified: Date | null;
}
