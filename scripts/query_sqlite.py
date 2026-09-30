import sqlite3
import os

here = os.path.dirname(os.path.abspath(__file__))
db_path = None
cur = here
while True:
    candidate = os.path.join(cur, 'ChessHub-main', 'backend', 'chesshub.db')
    if os.path.exists(candidate):
        db_path = candidate
        break
    candidate2 = os.path.join(cur, 'backend', 'chesshub.db')
    if os.path.exists(candidate2):
        db_path = candidate2
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
SELECT b.id, u.full_name, b.plan_type, b.date, b.time_slot, b.status, b.price
FROM bookings b
LEFT JOIN users u ON b.user_id = u.id
ORDER BY b.date, b.time_slot
'''

for row in c.execute(query):
    print(row)

conn.close()
