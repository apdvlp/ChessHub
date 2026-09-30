import os
import sys

repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_path = os.path.join(repo_root, 'ChessHub-main', 'backend')
if not os.path.exists(backend_path):
    backend_path = os.path.join(repo_root, 'backend')
sys.path.insert(0, backend_path)

from database import SessionLocal
import models

db = SessionLocal()
try:
    bookings = db.query(models.Booking).all()
    if not bookings:
        print('NO_BOOKINGS')
    else:
        for b in bookings:
            user_name = b.user.full_name if b.user else "Unknown"
            print(f"ID:{b.id} USER:{user_name} PLAN:{b.plan_type} DATE:{b.date} SLOT:{b.time_slot} STATUS:{b.status} PRICE:{b.price}")
finally:
    db.close()
