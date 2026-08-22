import api from "./axios";

export const getOccupiedSlots = () =>
    api.get("/bookings/occupied-slots");

export const createBooking = (slotsPayload) =>
    api.post("/bookings/", { slots: slotsPayload });

export const getMyBookings = () =>
    api.get("/bookings/");

export const rescheduleBooking = (id, data) =>
    api.put(`/bookings/${id}/reschedule`, data);

export const cancelBooking = (id) =>
    api.delete(`/bookings/${id}/cancel`);

export const createPassOrder = (amount) =>
    api.post("/bookings/create-order", { amount, currency: "INR" });

export const verifyPassPayment = (data) =>
    api.post("/bookings/verify-payment", data);