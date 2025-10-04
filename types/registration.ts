export interface RegistrationFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  congregationId: string
}

export interface Congregation {
  id: string
  name: string
  slug: string | null
}

export interface RegistrationRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  congregationId: string
}

export interface RegistrationResponse {
  success: boolean
  message: string
  userId?: string
}

export interface MembershipRequest {
  userId: string
  congregationId: string
}

export interface MembershipResponse {
  success: boolean
  message: string
}
