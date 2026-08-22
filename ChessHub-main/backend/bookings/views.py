from rest_framework import generics
from rest_framework.permissions import IsAuthenticated,AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .payment import client
from .models import Plan, Booking,Holiday
from datetime import datetime, timedelta,date
from razorpay.errors import BadRequestError
from .serializers import (
    PlanSerializer,
    BookingSerializer,
    UserPassSerializer
)
import holidays
from .validators import validate_booking
from decimal import Decimal
from django.utils import timezone
from .models import UserPass

india_holidays = holidays.India()


class PlanListView(generics.ListAPIView):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    permission_classes = [AllowAny]


class PlanCreateView(generics.CreateAPIView):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    permission_classes = [IsAuthenticated]


class PlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    permission_classes = [IsAuthenticated]


class CalendarView(APIView):

    permission_classes = [AllowAny]

    def get(self, request):

        year = int(request.GET.get("year", date.today().year))

        holiday_list = list(
            Holiday.objects.filter(
                date__year=year
            ).values(
                "date",
                "name",
                "category"
            )
        )

        bookings = list(
            Booking.objects.filter(
                booking_date__year=year
            ).values(
                "booking_date",
                "start_time",
                "end_time"
            )
        )

        return Response({
            "holidays": holiday_list,
            "bookings": bookings
        })


class BookingCreateView(generics.CreateAPIView):

    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):

        plan = serializer.validated_data["plan"]
        booking_date = serializer.validated_data["booking_date"]
        start_time = serializer.validated_data["start_time"]
        
        user_pass = UserPass.objects.filter(
            user=self.request.user,
            plan=plan,
            is_active=True,
            expiry_date__gte=timezone.now().date()).first()

        if user_pass and user_pass.remaining_slots <= 0:
            raise serializers.ValidationError(
                "You have no remaining slots in your pass."
            )
            
        start_of_week = booking_date - timedelta(days=booking_date.weekday())
        end_of_week = start_of_week + timedelta(days=6)

        weekly_bookings = Booking.objects.filter(
            user=self.request.user,
            booking_date__range=(start_of_week, end_of_week),
            status="confirmed",
        ).count()

        if weekly_bookings >= plan.weekly_slots:
            raise ValidationError(
                f"You can book only {plan.weekly_slots} sessions per week."
            )

        start = datetime.combine(
            booking_date,
            start_time,
        )

        end = start + timedelta(minutes=plan.duration)

        validate_booking(
            self.request.user,
            booking_date,
            start_time,
        )

        serializer.save(
            user=self.request.user,
            end_time=end.time(),
        )

class CreateOrderView(APIView):

    def post(self, request):

        amount = int(Decimal(str(request.data["amount"])) * 100)

        try:
            order = client.order.create({
                "amount": amount,
                "currency": "INR",
                "payment_capture": 1
            })
        except BadRequestError:
            return Response(
                {
                    "error": "Razorpay authentication failed. Check your Razorpay API keys."
                },
                status=400,
            )
        except Exception:
            return Response(
                {
                    "error": "Unable to create Razorpay order."
                },
                status=500,
            )

        return Response(order)

class MyBookingsView(generics.ListAPIView):

    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(
            user=self.request.user
        )


class BookingDetailView(generics.RetrieveAPIView):

    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)


class RescheduleBookingView(generics.UpdateAPIView):

    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)

    def perform_update(self, serializer):

        validate_booking(
            self.request.user,
            serializer.validated_data["booking_date"],
            serializer.validated_data["start_time"],
        )

        serializer.save()

class DeleteBookingView(generics.DestroyAPIView):

    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)

class VerifyBookingPaymentView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        data = {
            "razorpay_order_id": request.data["razorpay_order_id"],
            "razorpay_payment_id": request.data["razorpay_payment_id"],
            "razorpay_signature": request.data["razorpay_signature"],
        }

        try:

            client.utility.verify_payment_signature(data)

            booking = Booking.objects.get(
                id=request.data["booking_id"],
                user=request.user
            )

            booking.payment_status = "paid"
            booking.status = "confirmed"
            booking.payment_id = request.data["razorpay_payment_id"]
            booking.order_id = request.data["razorpay_order_id"]
            booking.save()

            user_pass = UserPass.objects.filter(
                user=booking.user,
                plan=booking.plan,
                is_active=True,
                expiry_date__gte=timezone.now().date()
            ).first()

            if user_pass:
                user_pass.remaining_slots = max(
                    user_pass.remaining_slots - 1,
                    0
                )
                user_pass.save()

            return Response({
                "success": True,
                "message": "Booking payment verified."
            })

        except Booking.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Booking not found."
                },
                status=404
            )

        except Exception:
            return Response(
                {
                    "success": False,
                    "message": "Payment verification failed."
                },
                status=400
            )
    
            
class CreatePassOrderView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        try:
            plan = Plan.objects.get(id=request.data["plan_id"])
        except Plan.DoesNotExist:
            return Response(
                {"error": "Plan not found"},
                status=404
            )

        active_pass = UserPass.objects.filter(
            user=request.user,
            is_active=True,
            expiry_date__gte=timezone.now().date()
        ).exists()

        if active_pass:
            return Response(
                {
                    "error": "You already have an active pass."
                },
                status=400
            )

        amount = int(plan.monthly_price * 100)

        try:
            order = client.order.create({
                "amount": amount,
                "currency": "INR",
                "payment_capture": 1
            })
        except BadRequestError:
            return Response(
                {
                    "error": "Razorpay authentication failed. Check your Razorpay API keys."
                },
                status=400,
            )
        except Exception:
            return Response(
                {
                    "error": "Unable to create Razorpay order."
                },
                status=500,
            )

        return Response({
            "order_id": order["id"],
            "amount": amount,
            "currency": "INR",
            "plan_id": plan.id,
            "plan_name": plan.name
        })
        
class VerifyPassPaymentView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        data = {
            "razorpay_order_id": request.data["razorpay_order_id"],
            "razorpay_payment_id": request.data["razorpay_payment_id"],
            "razorpay_signature": request.data["razorpay_signature"],
        }

        try:

            client.utility.verify_payment_signature(data)

            plan = Plan.objects.get(
                id=request.data["plan_id"]
            )

            UserPass.objects.create(
                user=request.user,
                plan=plan,
                expiry_date=timezone.now().date() + timedelta(days=30),
                remaining_slots=plan.monthly_slots,
                is_active=True,
            )

            return Response({
                "success": True,
                "message": "Pass purchased successfully."
            })

        except Exception:

            return Response(
                {
                    "success": False,
                    "message": "Payment verification failed."
                },
                status=400
            )
            
class MyPassView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        user_pass = UserPass.objects.filter(
            user=request.user,
            is_active=True,
            expiry_date__gte=timezone.now().date()
        ).first()

        if not user_pass:
            return Response({"has_pass": False})

        serializer = UserPassSerializer(user_pass)

        return Response({
            "has_pass": True,
            "pass": serializer.data
        })
        
class ConfirmPassBookingView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        try:
            booking = Booking.objects.get(
                id=request.data["booking_id"],
                user=request.user,
            )

            user_pass = UserPass.objects.filter(
                user=request.user,
                plan=booking.plan,
                is_active=True,
                expiry_date__gte=timezone.now().date(),
            ).first()

            if not user_pass:
                return Response(
                    {"message": "No active pass found."},
                    status=400,
                )

            if user_pass.remaining_slots <= 0:
                return Response(
                    {"message": "No remaining slots."},
                    status=400,
                )

            booking.status = "confirmed"
            booking.payment_status = "paid"
            booking.save()

            user_pass.remaining_slots -= 1
            user_pass.save()

            return Response({
                "success": True,
                "message": "Booking confirmed using monthly pass.",
            })

        except Booking.DoesNotExist:
            return Response(
                {"message": "Booking not found."},
                status=404,
            )