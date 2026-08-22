import { useNavigate } from "react-router-dom";
import { useState } from "react";
import HourlySlotSelector from "./HourlySlotSelector";

export default function PlanCard({ plan, onEdit, onDelete }) {
    const navigate = useNavigate();
    const [slot, setSlot] = useState("");

    return (
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition duration-300 p-6 border">

            <div className="text-5xl text-center mb-4">♟️</div>

            <h2 className="text-2xl font-bold text-center text-gray-800">{plan.name}</h2>

            <p className="text-gray-600 text-center mt-3">{plan.description}</p>

            <div className="mt-6 space-y-3">

                <HourlySlotSelector value={slot} onChange={setSlot} start={6} count={16} />

                {/* Duration removed from UI */}

                <p className="text-lg">
                    🎯 <strong>Weekly Slots:</strong> {plan.weekly_slots}
                </p>

                <p className="text-lg">
                    📅 <strong>Monthly Slots:</strong> {plan.monthly_slots}
                </p>

                <hr />

                <p className="text-lg text-blue-600 font-semibold">💰 Single Session: ₹ {plan.session_price}</p>

                <p className="text-lg text-green-600 font-semibold">⭐ Monthly Pass: ₹ {plan.monthly_price}</p>

            </div>

            <div className="mt-6 space-y-3">
                <button
                    onClick={() =>
                        navigate(`/plans/${plan.id}`, {
                            state: { plan },
                        })
                    }
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold"
                >
                    View Details
                </button>

                {onEdit && (
                    <button onClick={() => onEdit(plan)} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold">
                        Edit Plan
                    </button>
                )}

                {onDelete && (
                    <button onClick={() => onDelete(plan.id)} className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold">
                        Delete Plan
                    </button>
                )}

            </div>

        </div>
    );
}