from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import calendar
import os
import uuid

from app.database.session import get_db
from app.models.models import User, Property, Meter, MeterReading, Tariff, TariffSlab, MonthlyTarget, UserSettings, ReadingRevision, Appliance, Bill, Notification, BillingCycle
from app.schemas.schemas import OnboardingRequest, PropertyCreate, PropertyOut, MeterCreate, MeterOut, MeterReadingCreate, MeterReadingOut, ReadingUpdate, ApplianceCreate, ApplianceOut, BillCreate, BillOut, NotificationOut
from app.routers.auth import get_current_user
from app.services.tariff_service import calculate_total_electricity_bill
from app.analytics.analytics_engine import calculate_analytics
from app.core.config import settings

router = APIRouter()

def get_next_month_date(current_date: datetime, target_day: int) -> datetime:
    month = current_date.month
    year = current_date.year
    if month == 12:
        month = 1
        year += 1
    else:
        month += 1
    max_day = calendar.monthrange(year, month)[1]
    day = min(target_day, max_day)
    return datetime(year, month, day, 0, 0, 0)

# ONBOARDING
@router.post("/onboarding")
def complete_onboarding(req: OnboardingRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Create Property
    prop = Property(user_id=current_user.id, name=req.property_name, property_type=req.property_type)
    db.add(prop)
    db.commit()
    db.refresh(prop)

    # 2. Create Meter
    meter = Meter(property_id=prop.id, name=req.meter_name, meter_number=req.meter_number, initial_reading=req.initial_reading)
    db.add(meter)
    db.commit()
    db.refresh(meter)

    # 3. Create Baseline Meter Reading
    baseline_reading = MeterReading(
        meter_id=meter.id,
        reading_value=req.initial_reading,
        consumption=0.0,
        entry_method="manual",
        notes="Baseline reading set during onboarding"
    )
    db.add(baseline_reading)

    # 4. Update Currency & Settings
    user_settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if user_settings:
        user_settings.currency_code = req.currency_code
    else:
        user_settings = UserSettings(user_id=current_user.id, currency_code=req.currency_code)
        db.add(user_settings)

    # 5. Create Tariff
    tariff = Tariff(
        meter_id=meter.id,
        name="Standard Tariff",
        currency_code=req.currency_code,
        tariff_type=req.tariff_type,
        simple_rate=req.simple_rate,
        fixed_charge=req.fixed_charge,
        tax_percentage=req.tax_percentage,
        additional_charge=req.additional_charge
    )
    db.add(tariff)
    db.commit()
    db.refresh(tariff)

    if req.tariff_type == "slab" and req.slabs:
        for s in req.slabs:
            slab_obj = TariffSlab(tariff_id=tariff.id, min_units=s.min_units, max_units=s.max_units, rate=s.rate)
            db.add(slab_obj)
    else:
        # Default standard slabs if empty
        default_slabs = [
            TariffSlab(tariff_id=tariff.id, min_units=0, max_units=100, rate=3.96),
            TariffSlab(tariff_id=tariff.id, min_units=100, max_units=300, rate=10.80),
            TariffSlab(tariff_id=tariff.id, min_units=300, max_units=500, rate=15.03),
            TariffSlab(tariff_id=tariff.id, min_units=500, max_units=None, rate=17.53)
        ]
        db.add_all(default_slabs)

    current_ym = datetime.utcnow().strftime("%Y-%m")
    target = MonthlyTarget(meter_id=meter.id, month_year=current_ym, target_kwh=req.monthly_target_kwh, bill_budget=req.bill_budget)
    db.add(target)

    # 7. Create Initial Billing Cycle
    now = datetime.utcnow()
    reading_day = user_settings.official_reading_day if user_settings else 3
    
    # Calculate next scheduled date based on reading day
    # If today is before the reading day this month, the scheduled date is this month.
    # Otherwise next month.
    scheduled_year = now.year
    scheduled_month = now.month
    if now.day >= reading_day:
        if scheduled_month == 12:
            scheduled_month = 1
            scheduled_year += 1
        else:
            scheduled_month += 1
    max_day = calendar.monthrange(scheduled_year, scheduled_month)[1]
    scheduled_date = datetime(scheduled_year, scheduled_month, min(reading_day, max_day), 0, 0, 0)

    first_cycle = BillingCycle(
        meter_id=meter.id,
        scheduled_start_date=now,
        actual_start_date=now,
        scheduled_end_date=scheduled_date,
        opening_meter_reading=req.initial_reading,
        status="ACTIVE"
    )
    db.add(first_cycle)

    # Mark user onboarding finished
    current_user.onboarding_completed = True
    db.commit()

    return {"status": "success", "message": "Onboarding completed successfully", "property_id": prop.id, "meter_id": meter.id}


# PROPERTIES & METERS
@router.get("/properties", response_model=List[PropertyOut])
def get_properties(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Property).filter(Property.user_id == current_user.id).all()

@router.post("/properties", response_model=PropertyOut)
def create_property(prop_in: PropertyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prop = Property(user_id=current_user.id, name=prop_in.name, property_type=prop_in.property_type, address=prop_in.address)
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop

@router.get("/properties/{property_id}/meters", response_model=List[MeterOut])
def get_meters(property_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prop = db.query(Property).filter(Property.id == property_id, Property.user_id == current_user.id).first()
    if not prop:
        raise HTTPException(status_code=444, detail="Property not found")
    return db.query(Meter).filter(Meter.property_id == property_id).all()

@router.post("/meters", response_model=MeterOut)
def create_meter(meter_in: MeterCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prop = db.query(Property).filter(Property.id == meter_in.property_id, Property.user_id == current_user.id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    meter = Meter(property_id=meter_in.property_id, name=meter_in.name, meter_number=meter_in.meter_number, initial_reading=meter_in.initial_reading)
    db.add(meter)
    db.commit()
    db.refresh(meter)

    # Default Tariff for new meter
    tariff = Tariff(meter_id=meter.id, name="Standard Tariff", currency_code="INR", tariff_type="slab")
    db.add(tariff)
    db.commit()
    db.refresh(tariff)
    slabs = [
        TariffSlab(tariff_id=tariff.id, min_units=0, max_units=100, rate=3.96),
        TariffSlab(tariff_id=tariff.id, min_units=100, max_units=300, rate=10.80),
        TariffSlab(tariff_id=tariff.id, min_units=300, max_units=500, rate=15.03),
        TariffSlab(tariff_id=tariff.id, min_units=500, max_units=None, rate=17.53)
    ]
    db.add_all(slabs)
    db.commit()
    return meter


# METER READINGS & VALIDATION
@router.get("/meters/{meter_id}/readings", response_model=List[MeterReadingOut])
def get_meter_readings(meter_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(MeterReading).filter(MeterReading.meter_id == meter_id).order_by(MeterReading.captured_at.desc()).all()


@router.post("/readings", response_model=MeterReadingOut)
def add_meter_reading(reading_in: MeterReadingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meter = db.query(Meter).filter(Meter.id == reading_in.meter_id).first()
    if not meter:
        raise HTTPException(status_code=404, detail="Meter not found")

    # Fetch latest previous reading
    prev_reading = db.query(MeterReading).filter(MeterReading.meter_id == meter.id).order_by(MeterReading.captured_at.desc()).first()

    # Validation Checks removed as per user request to avoid verification blocking


    consumption = 0.0
    if prev_reading:
        if reading_in.is_reset_or_replacement:
            consumption = 0.0
        else:
            consumption = round(max(0.0, reading_in.reading_value - prev_reading.reading_value), 2)

    captured_time = reading_in.captured_at if reading_in.captured_at else datetime.utcnow()

    new_reading = MeterReading(
        meter_id=meter.id,
        reading_value=reading_in.reading_value,
        captured_at=captured_time,
        consumption=consumption,
        entry_method=reading_in.entry_method,
        notes=reading_in.notes,
        is_reset_or_replacement=reading_in.is_reset_or_replacement,
        is_official_reading=reading_in.is_official_reading
    )
    db.add(new_reading)
    
    # Billing Cycle Logic
    if reading_in.is_official_reading:
        # Find active billing cycle
        active_cycle = db.query(BillingCycle).filter(
            BillingCycle.meter_id == meter.id, 
            BillingCycle.status.in_(["ACTIVE", "AWAITING_OFFICIAL_READING"])
        ).order_by(BillingCycle.scheduled_end_date.desc()).first()
        
        if active_cycle:
            # Close cycle
            active_cycle.actual_end_date = captured_time
            active_cycle.closing_meter_reading = reading_in.reading_value
            
            # Calculate total units by summing consumptions in this cycle
            cycle_readings = db.query(MeterReading).filter(
                MeterReading.meter_id == meter.id, 
                MeterReading.captured_at >= active_cycle.actual_start_date
            ).all()
            # If new_reading is already flushed it might be in cycle_readings, else add its consumption
            if new_reading not in cycle_readings:
                cycle_readings.append(new_reading)
                
            active_cycle.total_units = sum(r.consumption for r in cycle_readings)
            active_cycle.status = "COMPLETED"
            
            # Compute bill for cycle
            tariff = db.query(Tariff).filter(Tariff.meter_id == meter.id, Tariff.is_active == True).first()
            bill_calc = calculate_total_electricity_bill(active_cycle.total_units, tariff)
            active_cycle.energy_charge = bill_calc["energy_charge"]
            active_cycle.fixed_charge = bill_calc["fixed_charge"]
            active_cycle.wheeling_charge = bill_calc.get("wheeling_charge", 0.0)
            active_cycle.fuel_adjustment_charge = bill_calc.get("fuel_adjustment_charge", 0.0)
            active_cycle.electricity_duty = bill_calc.get("electricity_duty", 0.0)
            active_cycle.additional_charges = bill_calc["additional_charge"]
            active_cycle.estimated_total = bill_calc["total_amount"]
        
        # Start new cycle
        user_settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
        reading_day = user_settings.official_reading_day if user_settings else 3
        next_scheduled_date = get_next_month_date(captured_time, reading_day)
        
        new_cycle = BillingCycle(
            meter_id=meter.id,
            scheduled_start_date=captured_time,
            actual_start_date=captured_time,
            scheduled_end_date=next_scheduled_date,
            opening_meter_reading=reading_in.reading_value,
            status="ACTIVE"
        )
        db.add(new_cycle)
        
    db.commit()
    db.refresh(new_reading)
    return new_reading

@router.delete("/readings/{reading_id}")
def delete_reading(reading_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reading = db.query(MeterReading).filter(MeterReading.id == reading_id).first()
    if not reading:
        raise HTTPException(status_code=404, detail="Reading not found")
    meter = db.query(Meter).filter(Meter.id == reading.meter_id, Meter.property.has(user_id=current_user.id)).first()
    if not meter:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(reading)
    db.commit()
    return {"status": "success", "message": "Reading deleted"}





# DASHBOARD & ANALYTICS
@router.get("/analytics/dashboard/{meter_id}")
def get_dashboard_analytics(meter_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meter = db.query(Meter).filter(Meter.id == meter_id).first()
    if not meter:
        raise HTTPException(status_code=404, detail="Meter not found")

    readings = db.query(MeterReading).filter(MeterReading.meter_id == meter_id).all()
    current_ym = datetime.utcnow().strftime("%Y-%m")
    target = db.query(MonthlyTarget).filter(MonthlyTarget.meter_id == meter_id, MonthlyTarget.month_year == current_ym).first()
    tariff = db.query(Tariff).filter(Tariff.meter_id == meter_id, Tariff.is_active == True).first()
    user_settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    
    active_cycle = db.query(BillingCycle).filter(
        BillingCycle.meter_id == meter_id,
        BillingCycle.status.in_(["ACTIVE", "AWAITING_OFFICIAL_READING"])
    ).order_by(BillingCycle.scheduled_end_date.desc()).first()

    # Dynamic status update
    if active_cycle and active_cycle.status == "ACTIVE":
        if datetime.utcnow() > active_cycle.scheduled_end_date:
            active_cycle.status = "AWAITING_OFFICIAL_READING"
            db.commit()

    analytics = calculate_analytics(readings, target, tariff, active_cycle)
    analytics["currency_code"] = user_settings.currency_code if user_settings else "INR"
    analytics["meter_name"] = meter.name
    analytics["property_name"] = meter.property.name if meter.property else "Property"

    return analytics


# APPLIANCES & CALCULATOR
@router.get("/meters/{meter_id}/appliances", response_model=List[ApplianceOut])
def get_appliances(meter_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    appliances = db.query(Appliance).filter(Appliance.meter_id == meter_id).all()
    tariff = db.query(Tariff).filter(Tariff.meter_id == meter_id, Tariff.is_active == True).first()

    res = []
    for a in appliances:
        daily_kwh = (a.power_rating_w * a.hours_per_day * a.quantity) / 1000.0
        monthly_kwh = daily_kwh * 30.0
        bill_breakdown = calculate_total_electricity_bill(monthly_kwh, tariff)
        res.append({
            "id": a.id,
            "meter_id": a.meter_id,
            "name": a.name,
            "category": a.category,
            "power_rating_w": a.power_rating_w,
            "quantity": a.quantity,
            "hours_per_day": a.hours_per_day,
            "daily_kwh": round(daily_kwh, 2),
            "monthly_kwh": round(monthly_kwh, 2),
            "monthly_cost": bill_breakdown["total_amount"]
        })
    return res

@router.post("/appliances")
def create_appliance(app_in: ApplianceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    appliance = Appliance(
        meter_id=app_in.meter_id,
        name=app_in.name,
        category=app_in.category,
        power_rating_w=app_in.power_rating_w,
        quantity=app_in.quantity,
        hours_per_day=app_in.hours_per_day
    )
    db.add(appliance)
    db.commit()
    db.refresh(appliance)
    return appliance


# BILLS MANAGEMENT
@router.get("/meters/{meter_id}/bills", response_model=List[BillOut])
def get_bills(meter_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Bill).filter(Bill.meter_id == meter_id).order_by(Bill.bill_date.desc()).all()

@router.post("/bills", response_model=BillOut)
def create_bill(bill_in: BillCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bill = Bill(
        meter_id=bill_in.meter_id,
        billing_period=bill_in.billing_period,
        units_consumed=bill_in.units_consumed,
        energy_charge=bill_in.energy_charge,
        fixed_charge=bill_in.fixed_charge,
        tax_amount=bill_in.tax_amount,
        other_charges=bill_in.other_charges,
        total_amount=bill_in.total_amount,
        due_date=bill_in.due_date
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return bill


# NOTIFICATIONS
@router.get("/notifications", response_model=List[NotificationOut])
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()


# SETTINGS & CURRENCY UPDATE
@router.put("/settings")
def update_settings(currency_code: str, theme: str, official_reading_day: int = 3, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not user_settings:
        user_settings = UserSettings(user_id=current_user.id)
        db.add(user_settings)
    user_settings.currency_code = currency_code
    user_settings.theme = theme
    user_settings.official_reading_day = official_reading_day
    db.commit()
    return {"status": "success", "currency_code": currency_code, "theme": theme, "official_reading_day": official_reading_day}
