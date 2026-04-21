// Input shapes for Users module endpoints.

export interface CreateUserInput {
  email: string;
  fullName: string;
  password: string;
  role: string; // owner | dispatcher | viewer
}

export interface UpdateUserInput {
  fullName?: string;
  status?: string; // active | suspended | removed
}

export interface ChangeRoleInput {
  role: string; // owner | dispatcher | viewer
}

// Shape returned by service for a single user.
export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  status: string;
  role: string | null; // null only for broken data — no active role link
  createdAt: Date;
}
