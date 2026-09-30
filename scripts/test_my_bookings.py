import os
import sys
import requests

repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_path = os.path.join(repo_root, 'ChessHub-main', 'backend')
if not os.path.exists(backend_path):
    backend_path = os.path.join(repo_root, 'backend')
sys.path.insert(0, backend_path)

from database import SessionLocal
import models
from auth import get_password_hash

USERNAME = 'ankit'
NEW_PASS = 'TestPass123!'

db = SessionLocal()
try:
    user = db.query(models.User).filter(
        (models.User.full_name == USERNAME) | (models.User.email == f"{USERNAME}@chesshub.com")
    ).first()
    if not user:
        user = models.User(
            full_name=USERNAME,
            email=f"{USERNAME}@chesshub.com",
            hashed_password=get_password_hash(NEW_PASS),
            age=25,
            gender="Male"
        )
        db.add(user)
    else:
        user.hashed_password = get_password_hash(NEW_PASS)
    db.commit()
    print('Password reset/verified for', USERNAME)
finally:
    db.close()

# Obtain token
login_url = 'http://127.0.0.1:8000/api/users/login/'
resp = requests.post(login_url, json={'username': USERNAME, 'password': NEW_PASS})
print('login status', resp.status_code, resp.text)
if resp.status_code != 200:
    sys.exit(1)

access = resp.json().get('access') or resp.json().get('access_token')
print('access token present:', bool(access))

# Call my bookings
headers = {'Authorization': f'Bearer {access}'}
my_bookings_url = 'http://127.0.0.1:8000/api/bookings/my-bookings/'
resp2 = requests.get(my_bookings_url, headers=headers)
print('my-bookings status', resp2.status_code)
print(resp2.text)
