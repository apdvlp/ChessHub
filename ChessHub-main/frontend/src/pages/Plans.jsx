import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getPlans,
    createPlan,
    updatePlan,
    deletePlan,
    createPassOrder,
    verifyPassPayment,
} from "../api/bookings";
import loadRazorpay from "../utils/loadRazorpay";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import PlanCard from "../components/PlanCard";
import PlanForm from "../components/PlanForm";

const emptyPlan = {
    name: "",
    description: "",
    duration: 60,
    monthly_slots: 8,
    weekly_slots: 2,
    session_price: 500,
    monthly_price: 2999,
};

export default function Plans() {
    const navigate = useNavigate();

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editPlan, setEditPlan] = useState(null);
    const [formData, setFormData] = useState(emptyPlan);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPlans();
    }, []);

    async function loadPlans() {
        try {
            const res = await getPlans();
            setPlans(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function openCreatePlan() {
        setFormData(emptyPlan);
        setEditPlan(null);
        setFormOpen(true);
    }

    function openEditPlan(plan) {
        setFormData({
            name: plan.name,
            description: plan.description,
            duration: plan.duration,
            monthly_slots: plan.monthly_slots,
            weekly_slots: plan.weekly_slots,
            session_price: plan.session_price,
            monthly_price: plan.monthly_price,
        });
        setEditPlan(plan);
        setFormOpen(true);
    }

    function closeForm() {
        setFormOpen(false);
        setEditPlan(null);
        setFormData(emptyPlan);
    }

    async function handleSavePlan(data) {
        setSaving(true);
        try {
            if (editPlan) {
                await updatePlan(editPlan.id, data);
            } else {
                await createPlan(data);
            }
            await loadPlans();
            closeForm();
        } catch (err) {
            console.error(err);
            alert("Unable to save plan.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm("Delete this plan?")) return;
        try {
            await deletePlan(id);
            await loadPlans();
        } catch (err) {
            console.error(err);
            alert("Unable to delete plan.");
        }
    }

    async function buyPass(plan) {
        try {
            const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
            const useFakePayment = !razorpayKey;

            const res = await createPassOrder(plan.id);

            if (useFakePayment) {
                await verifyPassPayment({
                    plan_id: plan.id,
                    razorpay_order_id: res.data.order_id,
                    razorpay_payment_id: "fake_payment_id",
                    razorpay_signature: "fake_signature",
                });

                alert("Pass Purchased Successfully (dev mode)");
                navigate("/dashboard");
                return;
            }

            const loaded = await loadRazorpay();
            if (!loaded) {
                alert("Unable to load Razorpay.");
                return;
            }

            const options = {
                key: razorpayKey,
                amount: res.data.amount,
                currency: res.data.currency,
                order_id: res.data.order_id,
                name: "ChessHub",
                description: plan.name,
                handler: async function (response) {
                    try {
                        await verifyPassPayment({
                            plan_id: plan.id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        alert("Pass Purchased Successfully");
                        navigate("/dashboard");
                    } catch (err) {
                        console.error(err);
                        alert("Payment verification failed.");
                    }
                },
                theme: {
                    color: "#2563eb",
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Unable to purchase pass.");
        }
    }

    if (loading) {
        return <Loader />;
    }

    return (
        <>
            <Navbar />

            <div className="flex min-h-screen bg-gray-100">
                <Sidebar />

                <main className="flex-1 p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">Manage Monthly Plans</h1>
                            <p className="text-gray-600 mt-2">
                                Create, edit, and delete plans. Click any card to view plan details, then purchase with Razorpay.
                            </p>
                        </div>
                        <button
                            onClick={openCreatePlan}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow"
                        >
                            Add New Plan
                        </button>
                    </div>

                    {formOpen && (
                        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-2xl font-semibold mb-4">
                                {editPlan ? "Edit Plan" : "Create New Plan"}
                            </h2>
                            <PlanForm
                                plan={formData}
                                onChange={setFormData}
                                onCancel={closeForm}
                                onSubmit={handleSavePlan}
                                saving={saving}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {plans.map((plan) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                onEdit={openEditPlan}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                </main>
            </div>
        </>
    );
}
