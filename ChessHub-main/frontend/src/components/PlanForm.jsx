export default function PlanForm({ plan, onChange, onSubmit, onCancel, saving }) {
    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit(plan);
            }}
            className="grid gap-6"
        >
            <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Plan Name</span>
                    <input
                        value={plan.name}
                        onChange={(event) =>
                            onChange({ ...plan, name: event.target.value })
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none"
                        required
                    />
                </label>

                <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Default Session Slot</span>
                    <select
                        value={plan._default_slot || ""}
                        onChange={(event) => {
                            const val = event.target.value; // form: "HH:MM-HH:MM"
                            if (!val) {
                                onChange({ ...plan });
                                return;
                            }

                            const [start, end] = val.split("-");
                            const [sh, sm] = start.split(":").map(Number);
                            const [eh, em] = end.split(":").map(Number);
                            const startMins = sh * 60 + sm;
                            const endMins = eh * 60 + em;
                            const duration = endMins - startMins;

                            // store a UI-only field `_default_slot` for persistence in the form state
                            onChange({ ...plan, duration: Number(duration), _default_slot: val });
                        }}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none"
                        required
                    >
                        <option value="">Select a slot (e.g. 1:00 PM - 2:00 PM)</option>
                        {Array.from({ length: 16 }, (_, i) => 6 + i).map((h) => {
                            // generate hour slots from 6:00 to 21:00 (6AM - 9PM)
                            const start24 = h;
                            const end24 = h + 1;
                            const toLabel = (hh) => {
                                const mer = hh >= 12 ? "PM" : "AM";
                                const disp = ((hh + 11) % 12) + 1;
                                return `${disp}:00 ${mer}`;
                            };

                            const start = `${String(start24).padStart(2, "0")}:00`;
                            const end = `${String(end24).padStart(2, "0")}:00`;
                            return (
                                <option key={h} value={`${start}-${end}`}>
                                    {toLabel(start24)} - {toLabel(end24)}
                                </option>
                            );
                        })}
                    </select>
                </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Monthly Slots</span>
                    <input
                        type="number"
                        value={plan.monthly_slots}
                        onChange={(event) =>
                            onChange({
                                ...plan,
                                monthly_slots: Number(event.target.value),
                            })
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none"
                        min={1}
                        required
                    />
                </label>

                <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Weekly Slots</span>
                    <input
                        type="number"
                        value={plan.weekly_slots}
                        onChange={(event) =>
                            onChange({
                                ...plan,
                                weekly_slots: Number(event.target.value),
                            })
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none"
                        min={1}
                        required
                    />
                </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Session Price</span>
                    <input
                        type="number"
                        step="0.01"
                        value={plan.session_price}
                        onChange={(event) =>
                            onChange({
                                ...plan,
                                session_price: Number(event.target.value),
                            })
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none"
                        min={0}
                        required
                    />
                </label>

                <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Monthly Price</span>
                    <input
                        type="number"
                        step="0.01"
                        value={plan.monthly_price}
                        onChange={(event) =>
                            onChange({
                                ...plan,
                                monthly_price: Number(event.target.value),
                            })
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none"
                        min={0}
                        required
                    />
                </label>
            </div>

            <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea
                    value={plan.description}
                    onChange={(event) =>
                        onChange({ ...plan, description: event.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none"
                    rows={4}
                    required
                />
            </label>

            <div className="flex flex-wrap gap-3">
                <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow"
                >
                    {saving ? "Saving..." : "Save Plan"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="bg-white border border-slate-300 text-slate-900 px-6 py-3 rounded-xl shadow-sm hover:bg-slate-50"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
