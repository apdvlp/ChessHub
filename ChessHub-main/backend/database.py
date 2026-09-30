import os
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chesshub.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def sync_db_columns():
    """Ensure any newer model columns exist in the SQLite database."""
    if not os.path.exists(DB_PATH):
        return
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    columns_to_ensure = [
        ("users", "is_active", "BOOLEAN DEFAULT 1"),
        ("users", "age", "INTEGER"),
        ("users", "gender", "VARCHAR"),
        ("users", "profile_picture_url", "VARCHAR"),
        ("bookings", "razorpay_order_id", "VARCHAR"),
        ("bookings", "razorpay_payment_id", "VARCHAR"),
    ]
    for table, col, col_type in columns_to_ensure:
        try:
            cur.execute(f"PRAGMA table_info({table})")
            cols = [row[1] for row in cur.fetchall()]
            if cols and col not in cols:
                cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
        except Exception:
            pass
    conn.commit()
    conn.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
