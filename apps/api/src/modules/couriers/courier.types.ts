export interface CourierResponse {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  status: string; // active | inactive
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCourierInput {
  name: string;
  phone: string;
}

export interface UpdateCourierInput {
  name?: string;
  phone?: string;
  status?: string;
}
