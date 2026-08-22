export default function loadRazorpay() {
    return new Promise((resolve) => {

        // If Razorpay is already loaded, don't load it again
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;

        script.onload = () => {
            console.log("✅ Razorpay SDK Loaded");
            resolve(true);
        };

        script.onerror = () => {
            console.error("❌ Failed to load Razorpay SDK");
            resolve(false);
        };

        document.body.appendChild(script);
    });
}