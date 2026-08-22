from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class Plan(models.Model):
    name = models.CharField(max_length=100)

    duration = models.PositiveIntegerField(
        help_text="Duration in minutes"
    )

    session_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    monthly_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )


    description = models.TextField(blank=True)

    monthly_slots = models.PositiveIntegerField(default=8)
    weekly_slots = models.PositiveIntegerField(default=2)

    def __str__(self):
        return self.name


class UserPass(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    plan = models.ForeignKey(
        Plan,
        on_delete=models.CASCADE
    )

    purchase_date = models.DateField(
        auto_now_add=True
    )

    expiry_date = models.DateField(
        blank=True,
        null=True
    )

    remaining_slots = models.PositiveIntegerField(
        default=8
    )

    is_active = models.BooleanField(
        default=True
    )

    class Meta:
        ordering = ["-purchase_date"]

    def save(self, *args, **kwargs):
        if not self.expiry_date:
            self.expiry_date = (
                timezone.now().date() +
                timedelta(days=30)
            )

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.plan.name}"


class Booking(models.Model):

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
        ("completed", "Completed"),
    ]

    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("failed", "Failed"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    plan = models.ForeignKey(
        Plan,
        on_delete=models.CASCADE
    )

    booking_date = models.DateField()

    start_time = models.TimeField()

    end_time = models.TimeField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default="pending"
    )

    payment_id = models.CharField(
        max_length=200,
        blank=True,
        null=True
    )

    order_id = models.CharField(
        max_length=200,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = [
            "booking_date",
            "start_time"
        ]

    def __str__(self):
        return f"{self.user.username} - {self.plan.name}"


class Holiday(models.Model):

    CATEGORY_CHOICES = [
        ("public", "Public Holiday"),
        ("festival", "Festival"),
        ("ekadashi", "Ekadashi"),
        ("vrat", "Vrat"),
    ]

    date = models.DateField()

    name = models.CharField(
        max_length=200
    )

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default="festival"
    )

    class Meta:
        ordering = ["date"]

    def __str__(self):
        return self.name