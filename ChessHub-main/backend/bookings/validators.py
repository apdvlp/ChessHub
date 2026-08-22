from datetime import date

from rest_framework import serializers
from .models import Booking, Holiday


def validate_booking(user, booking_date, start_time):

    # Past date
    if booking_date < date.today():
        raise serializers.ValidationError(
            "Past dates are not allowed."
        )

    # Holiday
    holiday = Holiday.objects.filter(date=booking_date).first()

    if holiday:
        raise serializers.ValidationError(
            f"Holiday: {holiday.name}"
        )

    # Duplicate booking
    if Booking.objects.filter(
        booking_date=booking_date,
        start_time=start_time
    ).exclude(status="cancelled").exists():

        raise serializers.ValidationError(
            "This slot is already booked for this date and time."
        )