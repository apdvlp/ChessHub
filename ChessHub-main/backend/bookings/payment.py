import razorpay
from pathlib import Path
from decouple import config
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

RAZORPAY_KEY_ID = config("RAZORPAY_KEY_ID", default="")
RAZORPAY_KEY_SECRET = config("RAZORPAY_KEY_SECRET", default="")

USE_FAKE_RAZORPAY = (
    not RAZORPAY_KEY_ID
    or RAZORPAY_KEY_ID == "dummy_key_id"
    or not RAZORPAY_KEY_SECRET
    or RAZORPAY_KEY_SECRET == "dummy_key_secret"
)

if USE_FAKE_RAZORPAY:

    class FakeOrder:
        @staticmethod
        def create(data):
            return {
                "id": "fake_order_123",
                "amount": data.get("amount"),
                "currency": data.get("currency"),
                "status": "created",
            }

    class FakeUtility:
        @staticmethod
        def verify_payment_signature(data):
            if not data.get("razorpay_order_id"):
                raise ValueError("Missing razorpay_order_id")
            return True

    class FakeClient:
        order = FakeOrder()
        utility = FakeUtility()

    client = FakeClient()
else:
    client = razorpay.Client(
        auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET),
    )
