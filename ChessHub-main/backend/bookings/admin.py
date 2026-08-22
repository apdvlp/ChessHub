from django.contrib import admin
from .models import Plan, UserPass, Booking, Holiday


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "session_price","monthly_price", "duration", "monthly_slots", "weekly_slots")


@admin.register(UserPass)
class UserPassAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "plan",
        "remaining_slots",
        "expiry_date",
        "is_active",
    )
    list_filter = ("is_active", "plan")
    search_fields = ("user__username",)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "plan",
        "booking_date",
        "start_time",
        "status",
        "payment_status",
    )
    list_filter = ("status", "payment_status")
    search_fields = ("user__username",)


@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ("date", "name", "category")
    list_filter = ("category",)