export type CourierStatus = 'active' | 'inactive'

export interface Courier {
  id: string
  name: string
  phone?: string | null
  vehicleType?: string | null
  licensePlate?: string | null
  status: CourierStatus
  createdAt: string
  updatedAt: string
}

export interface CreateCourierInput {
  name: string
  phone?: string
  vehicleType?: string
  licensePlate?: string
}

export interface UpdateCourierInput {
  name?: string
  phone?: string | null
  vehicleType?: string | null
  licensePlate?: string | null
  status?: CourierStatus
}
