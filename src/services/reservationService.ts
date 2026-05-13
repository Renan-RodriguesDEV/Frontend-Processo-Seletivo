import { reservationsApi } from './api'
import type {
  CreateLocationRequest,
  CreateReservationRequest,
  CreateRoomRequest,
  Location,
  Reservation,
  Room,
  UpdateReservationRequest,
  UpdateRoomRequest,
} from '../types'

export const reservationService = {
  async getLocations() {
    const response = await reservationsApi.get<Location[]>('/locations/')
    return response.data
  },

  async createLocation(payload: CreateLocationRequest) {
    const response = await reservationsApi.post<Location>('/locations/', payload)
    return response.data
  },

  async getRooms() {
    const response = await reservationsApi.get<Room[]>('/rooms/')
    return response.data
  },

  async createRoom(payload: CreateRoomRequest) {
    const response = await reservationsApi.post<Room>('/rooms/', payload)
    return response.data
  },

  async updateRoom(roomId: number, payload: UpdateRoomRequest) {
    const response = await reservationsApi.put<Room>(`/rooms/${roomId}`, payload)
    return response.data
  },

  async getReservations() {
    const response = await reservationsApi.get<Reservation[]>('/reservations/')
    return response.data
  },

  async createReservation(payload: CreateReservationRequest) {
    const response = await reservationsApi.post<Reservation>('/reservations/', payload)
    return response.data
  },

  async updateReservation(reservationId: number, payload: UpdateReservationRequest) {
    const response = await reservationsApi.put<Reservation>(`/reservations/${reservationId}`, payload)
    return response.data
  },

  async deleteReservation(reservationId: number) {
    await reservationsApi.delete(`/reservations/${reservationId}`)
  },

  async deleteSelectedReservations(reservationIds: number[]) {
    await Promise.all(reservationIds.map((reservationId) => this.deleteReservation(reservationId)))
  },
  async deleteAllReservations() {
    await reservationsApi.delete('/reservations/')
  }
}