export default function Loader() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-white/70 z-50">
            <div className="flex flex-col items-center">

                <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>

                <p className="mt-4 text-gray-700 font-semibold">
                    Loading...
                </p>

            </div>
        </div>
    );
}