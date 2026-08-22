import os
import razorpay
from dotenv import load_dotenv

load_dotenv()

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_TLek8cbBEt5xJD")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "JGYJ2iqnrsgwkPzfVj9NR10X")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
