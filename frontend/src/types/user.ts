
export interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "supporter" | "creator" | "admin";
}
