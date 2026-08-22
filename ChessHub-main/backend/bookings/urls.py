from django.urls import path
from .views import *

urlpatterns = [

    path("plans/", PlanListView.as_view()),
    path("plans/create/", PlanCreateView.as_view()),
    path("plans/<int:pk>/", PlanDetailView.as_view()),

    path("calendar/", CalendarView.as_view()),

    path("create/", BookingCreateView.as_view()),

    path("my-bookings/", MyBookingsView.as_view()),

    path("<int:pk>/", BookingDetailView.as_view()),

    path("<int:pk>/delete/", DeleteBookingView.as_view()),

    path("<int:pk>/reschedule/", RescheduleBookingView.as_view()),
    
    path("my-pass/", MyPassView.as_view()),
    path("booking/confirm-pass/", ConfirmPassBookingView.as_view()),
    # Booking Payment
    path("booking/create-order/", CreateOrderView.as_view()),
    path("booking/verify-payment/", VerifyBookingPaymentView.as_view()),

    # Monthly Pass Payment
    path("pass/create-order/", CreatePassOrderView.as_view()),
    path("pass/verify-payment/", VerifyPassPaymentView.as_view()),
]