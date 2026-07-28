import sys
import os
from datetime import datetime, timedelta
import random

# Force UTF-8 output encoding for Windows command prompt compatibility
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.session import SessionLocal, engine, Base
from app.models.models import User, UserSettings, Property, Meter, MeterReading, Tariff, TariffSlab, MonthlyTarget, Appliance, Bill, Notification
from app.core.security import get_password_hash

def seed_database():
    print("[WattWise] Initializing SQLite Database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # Check if demo user exists
    existing_user = db.query(User).filter(User.email == "demo@wattwise.com").first()
    if existing_user:
        print("[WattWise] Seed data already exists in database!")
        db.close()
        return

    print("[WattWise] Seeding realistic electricity data for WattWise demo...")

    # 1. Create Demo User
    user = User(
        full_name="Alex Morgan",
        email="demo@wattwise.com",
        hashed_password=get_password_hash("password123"),
        onboarding_completed=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 2. User Settings
    settings = UserSettings(user_id=user.id, currency_code="INR", theme="dark")
    db.add(settings)

    # 3. Create Property
    prop = Property(user_id=user.id, name="My Home", property_type="Home", address="Green Valley Residency, Apt 4B")
    db.add(prop)
    db.commit()
    db.refresh(prop)

    # 4. Create Meter
    meter = Meter(property_id=prop.id, name="Main Electricity Meter", meter_number="MET-2026-8849", initial_reading=11800.0)
    db.add(meter)
    db.commit()
    db.refresh(meter)

    # 5. Create Tariff with Slabs
    tariff = Tariff(
        meter_id=meter.id,
        name="Residential Slab Tariff",
        currency_code="INR",
        tariff_type="slab",
        fixed_charge=60.0,
        tax_percentage=18.0,
        additional_charge=10.0
    )
    db.add(tariff)
    db.commit()
    db.refresh(tariff)

    slabs = [
        TariffSlab(tariff_id=tariff.id, min_units=0, max_units=100, rate=4.50),
        TariffSlab(tariff_id=tariff.id, min_units=100, max_units=300, rate=7.20),
        TariffSlab(tariff_id=tariff.id, min_units=300, max_units=None, rate=9.80)
    ]
    db.add_all(slabs)

    # 6. Set Monthly Target
    current_ym = datetime.utcnow().strftime("%Y-%m")
    target = MonthlyTarget(meter_id=meter.id, month_year=current_ym, target_kwh=250.0, bill_budget=2000.0)
    db.add(target)

    # 7. Generate 60 Days of Historical Meter Readings
    start_date = datetime.utcnow() - timedelta(days=60)
    current_reading = 11800.0
    
    for day in range(61):
        reading_date = start_date + timedelta(days=day)
        
        # Simulate realistic daily consumption
        if day in [15, 32, 45]: # Spikes
            daily_kwh = round(random.uniform(15.5, 19.2), 1)
        elif reading_date.weekday() >= 5: # Weekend
            daily_kwh = round(random.uniform(8.5, 12.0), 1)
        else: # Normal weekday
            daily_kwh = round(random.uniform(6.2, 9.1), 1)

        if day == 0:
            consumption = 0.0
        else:
            consumption = daily_kwh
            current_reading += daily_kwh

        method = "photo" if day % 5 == 0 else "manual"
        
        reading = MeterReading(
            meter_id=meter.id,
            reading_value=round(current_reading, 1),
            captured_at=reading_date,
            consumption=consumption,
            entry_method=method,
            notes="Daily meter recording" if day % 7 == 0 else None
        )
        db.add(reading)

    # 8. Add Sample Appliances
    appliances = [
        Appliance(meter_id=meter.id, name="1.5 Ton Inverter AC", category="Cooling", power_rating_w=1500, quantity=1, hours_per_day=6.0),
        Appliance(meter_id=meter.id, name="Double Door Refrigerator", category="Kitchen", power_rating_w=250, quantity=1, hours_per_day=24.0),
        Appliance(meter_id=meter.id, name="Smart LED TV 55\"", category="Entertainment", power_rating_w=120, quantity=1, hours_per_day=4.5),
        Appliance(meter_id=meter.id, name="Washing Machine", category="Laundry", power_rating_w=500, quantity=1, hours_per_day=1.0)
    ]
    db.add_all(appliances)

    # 9. Add Sample Official Bills
    bills = [
        Bill(
            meter_id=meter.id,
            billing_period="June 2026",
            units_consumed=242.5,
            energy_charge=1476.0,
            fixed_charge=60.0,
            tax_amount=276.48,
            total_amount=1812.48,
            verified=True
        ),
        Bill(
            meter_id=meter.id,
            billing_period="May 2026",
            units_consumed=218.0,
            energy_charge=1299.6,
            fixed_charge=60.0,
            tax_amount=244.73,
            total_amount=1604.33,
            verified=True
        )
    ]
    db.add_all(bills)

    # 10. Add Initial Notifications
    notifications = [
        Notification(user_id=user.id, title="Welcome to WattWise!", message="Your electricity intelligence dashboard is configured and ready.", type="success"),
        Notification(user_id=user.id, title="High Usage Alert", message="Today's consumption exceeded recent daily average by 18%.", type="warning")
    ]
    db.add_all(notifications)

    db.commit()
    db.close()
    print("[WattWise] Seed completed! Demo credentials: demo@wattwise.com / password123")

if __name__ == "__main__":
    seed_database()
