import requests
import uuid

BASE_URL = "http://127.0.0.1:8000"

def test_api():
    print("=== Testing FastAPI Backend ===")

    # 1. Health check
    res = requests.get(f"{BASE_URL}/api/health")
    print("1. Health check:", res.status_code, res.json())
    assert res.status_code == 200

    # 2. Register
    unique_id = uuid.uuid4().hex[:6]
    email = f"player_{unique_id}@chesshub.com"
    reg_data = {
        "full_name": f"Grandmaster {unique_id}",
        "email": email,
        "password": "Password123!",
        "age": 25,
        "gender": "Male"
    }
    res = requests.post(f"{BASE_URL}/api/auth/register", json=reg_data)
    print("2. Register user:", res.status_code, "Token received:", "access_token" in res.json())
    assert res.status_code == 200
    token = res.json()["access_token"]
    user_id = res.json()["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Login
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": "Password123!"})
    print("3. Login user:", res.status_code, "Token match:", res.json()["access_token"] == token)
    assert res.status_code == 200

    # 4. Get Current User / Profile
    res = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    print("4. Get profile:", res.status_code, res.json().get("full_name"), res.json().get("username"))
    assert res.status_code == 200

    # 5. Get Holidays
    res = requests.get(f"{BASE_URL}/api/holidays/")
    print("5. Get holidays count:", res.status_code, len(res.json()))
    assert res.status_code == 200
    assert len(res.json()) > 0

    # 6. Get Plans
    res = requests.get(f"{BASE_URL}/api/bookings/plans/")
    print("6. Get plans count:", res.status_code, len(res.json()))
    assert res.status_code == 200
    assert len(res.json()) > 0

    # 7. Occupied slots
    res = requests.get(f"{BASE_URL}/api/bookings/occupied-slots")
    print("7. Occupied slots count:", res.status_code, len(res.json()))
    assert res.status_code == 200

    # 8. Create Booking with unique test date/time
    booking_date = f"2026-11-{(int(unique_id, 16) % 20) + 1:02d}"
    slot_payload = {
        "slots": [
            {
                "date": booking_date,
                "time_slot": "02:00 PM - 03:00 PM",
                "plan_type": "Basic",
                "price": 300.0,
                "status": "Booked"
            }
        ]
    }
    res = requests.post(f"{BASE_URL}/api/bookings/", json=slot_payload, headers=headers)
    print("8. Create booking:", res.status_code, res.json())
    assert res.status_code == 200
    booking_id = res.json()[0]["id"]

    # 9. Get User Bookings
    res = requests.get(f"{BASE_URL}/api/bookings/", headers=headers)
    print("9. Get bookings:", res.status_code, "Count:", len(res.json()))
    assert res.status_code == 200
    assert any(b["id"] == booking_id for b in res.json())

    # 10. Dashboard Stats
    res = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers)
    print("10. Dashboard stats:", res.status_code, res.json())
    assert res.status_code == 200
    assert res.json()["total_slots"] >= 1

    # 11. Reschedule Booking (to a holiday to test holiday shifting prompt)
    holiday_date = "2026-08-15"  # Independence Day
    res = requests.put(
        f"{BASE_URL}/api/bookings/{booking_id}/reschedule",
        json={"new_date": holiday_date, "force_holiday_shift": False},
        headers=headers
    )
    print("11. Reschedule to holiday (prompt test):", res.status_code, res.json())
    assert res.json().get("requires_holiday_confirmation") == True

    # Confirm holiday shift
    res = requests.put(
        f"{BASE_URL}/api/bookings/{booking_id}/reschedule",
        json={"new_date": holiday_date, "force_holiday_shift": True},
        headers=headers
    )
    print("11b. Reschedule confirmed:", res.status_code, res.json())
    assert res.json().get("requires_holiday_confirmation") == False
    assert res.json()["booking"]["status"] == "Holiday Shifted"

    # 12. Cancel Booking
    res = requests.delete(f"{BASE_URL}/api/bookings/{booking_id}/cancel", headers=headers)
    print("12. Cancel booking:", res.status_code, res.json()["status"])
    assert res.json()["status"] == "Cancelled"

    print("\nALL FASTAPI TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_api()
