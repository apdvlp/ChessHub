import api from "./axios";

export const getProfile = () =>
    api.get("/auth/me");

export const updateProfile = (data) =>
    api.put("/auth/me", data);

export const changePassword = (data) =>
    api.put("/auth/change-password", data);

export const logout = () =>
    api.post("/auth/logout");

export const refreshToken = () =>
    api.post("/auth/refresh-token");