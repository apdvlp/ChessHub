import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import { getProfile } from "../api/users";

export default function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            const res = await getProfile();
            setUser(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <Loader />;

    return (
        <>
            <Navbar />

            <div className="flex min-h-screen bg-gray-100">
                <Sidebar />

                <main className="flex-1 p-8">
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">

                        <div className="flex items-center gap-6">

                            <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-bold">
                                {user?.username?.charAt(0).toUpperCase()}
                            </div>

                            <div>
                                <h1 className="text-3xl font-bold">
                                    {user?.first_name} {user?.last_name}
                                </h1>

                                <p className="text-gray-500">
                                    @{user?.username}
                                </p>
                            </div>

                        </div>

                        <hr className="my-8" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div>
                                <p className="text-gray-500">Username</p>
                                <p className="font-semibold">
                                    {user?.username}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Email</p>
                                <p className="font-semibold">
                                    {user?.email}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">First Name</p>
                                <p className="font-semibold">
                                    {user?.first_name || "-"}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Last Name</p>
                                <p className="font-semibold">
                                    {user?.last_name || "-"}
                                </p>
                            </div>

                            <div className="md:col-span-2">
                                <p className="text-gray-500">Joined</p>
                                <p className="font-semibold">
                                    {new Date(user?.date_joined).toLocaleDateString()}
                                </p>
                            </div>

                        </div>

                    </div>
                </main>
            </div>
        </>
    );
}