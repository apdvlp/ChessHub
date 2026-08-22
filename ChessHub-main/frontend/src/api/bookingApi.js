import axios from "./axios";

export const getPlans = () => {
    return axios.get("/bookings/plans/");
};

export const createPassOrder = (planId) => {
    return axios.post("/bookings/pass/create-order/", {
        plan_id: planId,
    });
};

export const verifyPassPayment = (data) => {
    return axios.post("/bookings/pass/verify-payment/", data);
};