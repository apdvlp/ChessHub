from django.db import migrations


def seed_plans(apps, schema_editor):
    Plan = apps.get_model("bookings", "Plan")

    if Plan.objects.exists():
        return

    plans = [
        {
            "name": "Beginner",
            "duration": 30,
            "session_price": 200,
            "monthly_price": 1500,
            "description": "Perfect for beginners learning the fundamentals of chess.",
            "monthly_slots": 8,
            "weekly_slots": 2,
        },
        {
            "name": "Intermediate",
            "duration": 45,
            "session_price": 350,
            "monthly_price": 2500,
            "description": "For players improving strategy, tactics, and openings.",
            "monthly_slots": 8,
            "weekly_slots": 2,
        },
        {
            "name": "Advanced",
            "duration": 60,
            "session_price": 500,
            "monthly_price": 4000,
            "description": "Intensive one-on-one coaching for serious players.",
            "monthly_slots": 8,
            "weekly_slots": 2,
        },
    ]

    for p in plans:
        Plan.objects.create(**p)


def unseed_plans(apps, schema_editor):
    Plan = apps.get_model("bookings", "Plan")
    Plan.objects.filter(
        name__in=["Beginner", "Intermediate", "Advanced"]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("bookings", "0010_remove_plan_price_plan_monthly_price_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_plans, unseed_plans),
    ]
