import os
import sys

# Ensure we're running from repo root
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chesshub.settings')

import django
django.setup()

from bookings.models import Booking

bookings = Booking.objects.select_related('user', 'plan').all()

if not bookings:
    print('NO_BOOKINGS')
else:
    for b in bookings:
        print(f"ID:{b.id} USER:{b.user.username} PLAN:{b.plan.name} DATE:{b.booking_date} START:{b.start_time} END:{b.end_time} STATUS:{b.status} PAYMENT:{b.payment_status}")
