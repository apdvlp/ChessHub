import { create } from "zustand";

const useBookingStore = create((set) => ({

    plan: null,

    date: null,

    startTime: null,

    endTime: null,

    total: 0,

    setPlan: (plan) =>
        set({ plan }),

    setDate: (date) =>
        set({ date }),

    setTime: (start, end) =>
        set({
            startTime: start,
            endTime: end,
        }),

    setTotal: (total) =>
        set({ total }),

}));

export default useBookingStore;