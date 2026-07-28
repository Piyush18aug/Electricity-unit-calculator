from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    onboarding_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    properties = relationship("Property", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    currency_code = Column(String, default="INR")  # INR, USD, EUR, GBP, JPY, etc.
    theme = Column(String, default="dark")          # dark, light, system
    reading_reminder_enabled = Column(Boolean, default=True)
    reminder_time = Column(String, default="20:00")
    official_reading_day = Column(Integer, default=3)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="settings")


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)          # My Home, Office, Shop, Apartment
    property_type = Column(String, nullable=False) # Home, Apartment, Office, Shop, Other
    address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="properties")
    meters = relationship("Meter", back_populates="property", cascade="all, delete-orphan")


class Meter(Base):
    __tablename__ = "meters"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    name = Column(String, nullable=False)          # Main Meter, Solar Meter, 2nd Floor
    meter_number = Column(String, nullable=True)
    initial_reading = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    property = relationship("Property", back_populates="meters")
    readings = relationship("MeterReading", back_populates="meter", cascade="all, delete-orphan")
    tariffs = relationship("Tariff", back_populates="meter", cascade="all, delete-orphan")
    targets = relationship("MonthlyTarget", back_populates="meter", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="meter", cascade="all, delete-orphan")
    appliances = relationship("Appliance", back_populates="meter", cascade="all, delete-orphan")
    billing_cycles = relationship("BillingCycle", back_populates="meter", cascade="all, delete-orphan")


class Tariff(Base):
    __tablename__ = "tariffs"

    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(Integer, ForeignKey("meters.id"), nullable=False)
    name = Column(String, default="Standard Tariff")
    currency_code = Column(String, default="INR")
    tariff_type = Column(String, default="slab")   # simple, slab
    calculation_method = Column(String, default="PROGRESSIVE") # PROGRESSIVE, BRACKET
    simple_rate = Column(Float, default=7.50)       # Per kWh cost if simple_rate
    fixed_charge = Column(Float, default=50.0)      # Monthly fixed charge (Legacy)
    tax_percentage = Column(Float, default=18.0)    # Tax percentage (Legacy)
    additional_charge = Column(Float, default=0.0)  # Legacy
    effective_from = Column(DateTime, nullable=True)
    effective_to = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    meter = relationship("Meter", back_populates="tariffs")
    slabs = relationship("TariffSlab", back_populates="tariff", cascade="all, delete-orphan")
    component_rules = relationship("BillComponentRule", back_populates="tariff", cascade="all, delete-orphan")


class BillComponentRule(Base):
    __tablename__ = "bill_component_rules"

    id = Column(Integer, primary_key=True, index=True)
    tariff_id = Column(Integer, ForeignKey("tariffs.id"), nullable=False)
    component_name = Column(String, nullable=False) # e.g. Fixed Charge, Wheeling Charge, Fuel Adjustment, Electricity Duty, Other Charges
    rule_type = Column(String, default="FIXED")     # FIXED, PER_UNIT, PERCENTAGE, BRACKET
    rate = Column(Float, nullable=False)
    duty_base_components = Column(String, nullable=True) # Comma-separated list of component names included in Duty calculation
    effective_from = Column(DateTime, nullable=True)
    effective_to = Column(DateTime, nullable=True)

    tariff = relationship("Tariff", back_populates="component_rules")


class TariffSlab(Base):
    __tablename__ = "tariff_slabs"

    id = Column(Integer, primary_key=True, index=True)
    tariff_id = Column(Integer, ForeignKey("tariffs.id"), nullable=False)
    min_units = Column(Float, nullable=False)       # e.g., 0
    max_units = Column(Float, nullable=True)        # e.g., 100 (None for infinity)
    rate = Column(Float, nullable=False)             # Rate per unit in this slab

    tariff = relationship("Tariff", back_populates="slabs")


class MonthlyTarget(Base):
    __tablename__ = "monthly_targets"

    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(Integer, ForeignKey("meters.id"), nullable=False)
    month_year = Column(String, nullable=False)     # YYYY-MM
    target_kwh = Column(Float, nullable=False)      # Target kWh limit
    bill_budget = Column(Float, nullable=True)      # Budget limit in currency
    created_at = Column(DateTime, default=datetime.utcnow)

    meter = relationship("Meter", back_populates="targets")


class MeterReading(Base):
    __tablename__ = "meter_readings"

    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(Integer, ForeignKey("meters.id"), nullable=False)
    reading_value = Column(Float, nullable=False)
    captured_at = Column(DateTime, default=datetime.utcnow)
    consumption = Column(Float, default=0.0)        # Calculated kWh delta since prev reading
    entry_method = Column(String, default="manual") # photo, upload, manual
    image_path = Column(String, nullable=True)
    ocr_value = Column(Float, nullable=True)
    ocr_confidence = Column(Float, nullable=True)
    verified = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    is_reset_or_replacement = Column(Boolean, default=False)
    is_official_reading = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    meter = relationship("Meter", back_populates="readings")
    revisions = relationship("ReadingRevision", back_populates="reading", cascade="all, delete-orphan")


class ReadingRevision(Base):
    __tablename__ = "reading_revisions"

    id = Column(Integer, primary_key=True, index=True)
    reading_id = Column(Integer, ForeignKey("meter_readings.id"), nullable=False)
    original_value = Column(Float, nullable=False)
    new_value = Column(Float, nullable=False)
    reason = Column(String, nullable=True)
    modified_at = Column(DateTime, default=datetime.utcnow)

    reading = relationship("MeterReading", back_populates="revisions")


class BillingCycle(Base):
    __tablename__ = "billing_cycles"

    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(Integer, ForeignKey("meters.id"), nullable=False)
    scheduled_start_date = Column(DateTime, nullable=False)
    actual_start_date = Column(DateTime, nullable=True)
    scheduled_end_date = Column(DateTime, nullable=False)
    actual_end_date = Column(DateTime, nullable=True)
    opening_meter_reading = Column(Float, nullable=False)
    closing_meter_reading = Column(Float, nullable=True)
    total_units = Column(Float, default=0.0)
    energy_charge = Column(Float, default=0.0)
    fixed_charge = Column(Float, default=0.0)
    wheeling_charge = Column(Float, default=0.0)
    fuel_adjustment_charge = Column(Float, default=0.0)
    electricity_duty = Column(Float, default=0.0)
    additional_charges = Column(Float, default=0.0)
    estimated_total = Column(Float, default=0.0)
    status = Column(String, default="ACTIVE") # ACTIVE, AWAITING_OFFICIAL_READING, COMPLETED
    tariff_id = Column(Integer, ForeignKey("tariffs.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    meter = relationship("Meter", back_populates="billing_cycles")
    tariff = relationship("Tariff")


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(Integer, ForeignKey("meters.id"), nullable=False)
    billing_period = Column(String, nullable=False) # e.g. "July 2026"
    bill_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    previous_reading = Column(Float, nullable=True)
    current_reading = Column(Float, nullable=True)
    units_consumed = Column(Float, nullable=False)
    energy_charge = Column(Float, default=0.0)
    fixed_charge = Column(Float, default=0.0)
    wheeling_charge = Column(Float, default=0.0)
    fuel_adjustment_charge = Column(Float, default=0.0)
    electricity_duty = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    other_charges = Column(Float, default=0.0)
    adjustments = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    file_path = Column(String, nullable=True)
    verified = Column(Boolean, default=True)
    is_official = Column(Boolean, default=True) # Differentiates from just an estimate
    created_at = Column(DateTime, default=datetime.utcnow)

    meter = relationship("Meter", back_populates="bills")


class Appliance(Base):
    __tablename__ = "appliances"

    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(Integer, ForeignKey("meters.id"), nullable=False)
    name = Column(String, nullable=False)          # Air Conditioner, Refrigerator, etc.
    category = Column(String, default="General")
    power_rating_w = Column(Float, nullable=False)  # Rating in Watts
    quantity = Column(Integer, default=1)
    hours_per_day = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    meter = relationship("Meter", back_populates="appliances")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info")           # warning, danger, info, success
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
