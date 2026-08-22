import os
import sys
import django
import requests

# Setup Django environment
repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Add backend folder (where chesshub settings package lives) to path
backend_path = os.path.join(repo_root, 'ChessHub-main', 'backend')
if not os.path.exists(backend_path):
    backend_path = os.path.join(repo_root, 'backend')
sys.path.append(backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chesshub.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

USERNAME = 'ankit'
NEW_PASS = 'TestPass123!'

try:
    user = User.objects.get(username=USERNAME)
    user.set_password(NEW_PASS)
    user.save()
    print('Password reset for', USERNAME)
except User.DoesNotExist:
    print('User not found:', USERNAME)
    sys.exit(1)

# Obtain token
login_url = 'http://127.0.0.1:8000/api/users/login/'
resp = requests.post(login_url, json={'username': USERNAME, 'password': NEW_PASS})
print('login status', resp.status_code, resp.text)
if resp.status_code != 200:
    sys.exit(1)

access = resp.json().get('access')
print('access token present:', bool(access))

# Call my bookings
headers = {'Authorization': f'Bearer {access}'}
my_bookings_url = 'http://127.0.0.1:8000/api/bookings/my-bookings/'
resp2 = requests.get(my_bookings_url, headers=headers)
print('my-bookings status', resp2.status_code)
print(resp2.text)
