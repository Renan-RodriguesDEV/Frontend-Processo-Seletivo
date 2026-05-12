export type LoginRequest = { email: string; password: string }

export type LoginResponse = { token: string }

export type RegisterRequest = LoginRequest

export type RegisterResponse = { id: number; email: string; created_at: string }

export type Location = { id: number; name: string; address: string }

export type CreateLocationRequest = { name: string; address: string }

export type Room = {
  id: number
  name: string
  location_id: number
  capacity: number
  location: Location
}

export type CreateRoomRequest = { name: string; location_id: number; capacity: number }

export type UpdateRoomRequest = Partial<CreateRoomRequest>

export type Reservation = {
  id: number
  room_id: number
  start_datetime: string
  end_datetime: string
  responsible: string
  coffee: boolean
  people_count?: number | null
  description?: string | null
  room: Room
}

export type CreateReservationRequest = {
  room_id: number
  start_datetime: string
  end_datetime: string
  responsible: string
  coffee: boolean
  people_count?: number
  description?: string
}

export type UpdateReservationRequest = Partial<CreateReservationRequest>