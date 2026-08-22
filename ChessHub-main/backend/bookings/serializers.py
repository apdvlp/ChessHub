from datetime import timedelta

from rest_framework import serializers
from .models import Plan, Booking,UserPass


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = "__all__"

class UserPassSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source="plan.name", read_only=True)

    class Meta:
        model = UserPass
        fields = "__all__"
        
class BookingSerializer(serializers.ModelSerializer):

    plan_name = serializers.CharField(
        source="plan.name",
        read_only=True
    )
    
    duration = serializers.IntegerField(
        source="plan.duration",
        read_only=True
    )

    class Meta:
        model = Booking
        fields = "__all__"
        read_only_fields = (
            "user",
            "status",
            "payment_status",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs):

        if self.partial:
            return attrs

        request = self.context["request"]
        user = request.user

        booking_date = attrs["booking_date"]
        plan = attrs["plan"]

        # Monthly booking count
        monthly_bookings = Booking.objects.filter(
            user=user,
            plan=plan,
            booking_date__year=booking_date.year,
            booking_date__month=booking_date.month,
        ).count()

        if monthly_bookings >= plan.monthly_slots:
            raise serializers.ValidationError(
                f"You can book only {plan.monthly_slots} sessions per month."
            )

        # Weekly booking count
        week_start = booking_date - timedelta(days=booking_date.weekday())
        week_end = week_start + timedelta(days=6)

        weekly_bookings = Booking.objects.filter(
            user=user,
            plan=plan,
            booking_date__range=[week_start, week_end],
        ).count()

        if weekly_bookings >= plan.weekly_slots:
            raise serializers.ValidationError(
                f"You can book only {plan.weekly_slots} sessions per week."
            )

        return attrs