import api from "./axios";

export const createOrder = (amount) =>
    api.post("/bookings/create-order", {
        amount,
        currency: "INR",
    });

export const verifyPayment = (data) =>
    api.post("/bookings/verify-payment", data);

export const confirmPassBooking = (bookingId) =>
    api.post("/bookings/confirm-pass", {
        booking_id: bookingId,
    });