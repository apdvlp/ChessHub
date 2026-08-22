import sqlite3
import os

# Find the db.sqlite3 by walking up from this script's directory
here = os.path.dirname(os.path.abspath(__file__))
db_path = None
cur = here
while True:
    candidate = os.path.join(cur, 'ChessHub-main', 'backend', 'db.sqlite3')
    if os.path.exists(candidate):
        db_path = candidate
        break
    parent = os.path.dirname(cur)
    if parent == cur:
        break
    cur = parent

if not db_path:
    print('DB_NOT_FOUND')
    exit(1)

conn = sqlite3.connect(db_path)
c = conn.cursor()

query = '''
SELECT b.id, u.username, p.name, b.booking_date, b.start_time, b.end_time, b.status, b.payment_status
FROM bookings_booking b
LEFT JOIN auth_user u ON b.user_id = u.id
LEFT JOIN bookings_plan p ON b.plan_id = p.id
ORDER BY b.booking_date, b.start_time
'''

for row in c.execute(query):
    print(row)

conn.close()
