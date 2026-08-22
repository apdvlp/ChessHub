export default function SelectedSlotsPanel({
    plan,
    date,
    time,
    userPass,
}) {
    const usingPass =
        userPass &&
        userPass.remaining_slots > 0;

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">

            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                📋 Booking Summary
            </h2>

            <div className="space-y-5">

                <div className="flex justify-between items-center border-b pb-3">
                    <span className="text-gray-500 font-medium">
                        Plan
                    </span>

                    <span className="font-semibold text-gray-800">
                        {plan.name}
                    </span>
                </div>

                <div className="flex justify-between items-center border-b pb-3">
                    <span className="text-gray-500 font-medium">
                        Date
                    </span>

                    <span className="font-semibold text-gray-800">
                        {date.toDateString()}
                    </span>
                </div>

                <div className="flex justify-between items-center border-b pb-3">
                    <span className="text-gray-500 font-medium">
                        Time Slot
                    </span>

                    <span
                        className={`font-semibold ${
                            time
                                ? "text-green-600"
                                : "text-red-500"
                        }`}
                    >
                        {time || "Not Selected"}
                    </span>
                </div>

                {/* Duration removed from booking summary */}

                {usingPass ? (
                    <>
                        <div className="flex justify-between items-center border-b pb-3">
                            <span className="text-gray-500 font-medium">
                                Payment Method
                            </span>

                            <span className="font-semibold text-green-600">
                                Monthly Pass
                            </span>
                        </div>

                        <div className="flex justify-between items-center border-b pb-3">
                            <span className="text-gray-500 font-medium">
                                Remaining Slots
                            </span>

                            <span className="font-semibold text-blue-600">
                                {userPass.remaining_slots}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="flex justify-between items-center border-b pb-3">
                        <span className="text-gray-500 font-medium">
                            Payment Method
                        </span>

                        <span className="font-semibold text-blue-600">
                            Online Payment
                        </span>
                    </div>
                )}

                <div className="flex justify-between items-center pt-3">

                    <span className="text-lg font-bold text-gray-800">
                        Total
                    </span>

                    {usingPass ? (
                        <div className="text-right">

                            <p className="text-3xl font-bold text-green-600">
                                ₹ 0
                            </p>

                            <p className="text-sm text-gray-500">
                                Covered by Monthly Pass
                            </p>

                        </div>
                    ) : (
                        <span className="text-3xl font-bold text-blue-600">
                            ₹ {plan.session_price}
                        </span>
                    )}

                </div>

            </div>

            {usingPass && (
                <div className="mt-6 bg-green-100 border border-green-300 text-green-700 p-4 rounded-lg">
                    ✅ This booking will use <strong>1 slot</strong> from your monthly pass.
                </div>
            )}

            {!time && (
                <div className="mt-6 bg-yellow-100 border border-yellow-300 text-yellow-700 p-4 rounded-lg">
                    Please select a time slot to continue.
                </div>
            )}

        </div>
    );
}