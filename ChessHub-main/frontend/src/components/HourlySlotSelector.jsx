import React from "react";

function toLabel(h) {
    const mer = h >= 12 ? "PM" : "AM";
    const disp = ((h + 11) % 12) + 1;
    return `${disp}:00 ${mer}`;
}

export default function HourlySlotSelector({ value, onChange, start = 6, count = 16 }) {
    return (
        <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Choose Slot</span>
            <select
                value={value || ""}
                onChange={(e) => onChange && onChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none"
            >
                <option value="">Select a slot</option>
                {Array.from({ length: count }, (_, i) => start + i).map((h) => (
                    <option key={h} value={`${String(h).padStart(2, "0")}:00-${String(h + 1).padStart(2, "0")}:00`}>
                        {toLabel(h)} - {toLabel(h + 1)}
                    </option>
                ))}
            </select>
        </label>
    );
}
