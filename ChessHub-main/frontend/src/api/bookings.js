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

export const createPassOrder = (amountOrPlanId) => {
    if (typeof amountOrPlanId === "object" || (typeof amountOrPlanId === "number" && amountOrPlanId < 100)) {
        const planId = typeof amountOrPlanId === "object" ? amountOrPlanId.plan_id : amountOrPlanId;
        return api.post("/bookings/pass/create-order/", { plan_id: planId });
    }
    return api.post("/bookings/create-order", { amount: amountOrPlanId, currency: "INR" });
};

export const verifyPassPayment = (data) => {
    if (data && data.plan_id) {
        return api.post("/bookings/pass/verify-payment/", data);
    }
    return api.post("/bookings/verify-payment", data);
};

export const getPlans = () =>
    api.get("/bookings/plans/");

export const getPlan = (id) =>
    api.get(`/bookings/plans/${id}/`);

export const createPlan = (data) =>
    api.post("/bookings/plans/", data);

export const updatePlan = (id, data) =>
    api.put(`/bookings/plans/${id}/`, data);

export const deletePlan = (id) =>
    api.delete(`/bookings/plans/${id}/`);

export const getCalendar = (year = 2026) =>
    api.get(`/bookings/calendar/?year=${year}`);