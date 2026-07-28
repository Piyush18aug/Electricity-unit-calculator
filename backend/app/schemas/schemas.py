from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# User Schemas
class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserSettingsSchema(BaseModel):
    currency_code: str = "INR"
    theme: str = "dark"
    reading_reminder_enabled: bool = True
    reminder_time: str = "20:00"
    official_reading_day: int = 3

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    onboarding_completed: bool
    created_at: datetime
    settings: Optional[UserSettingsSchema] = None

    class Config:
        from_attributes = True

# Property & Meter Schemas
class PropertyCreate(BaseModel):
    name: str
    property_type: str
    address: Optional[str] = None

class PropertyOut(BaseModel):
    id: int
    user_id: int
    name: str
    property_type: str
    address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MeterCreate(BaseModel):
    property_id: int
    name: str
    meter_number: Optional[str] = None
    initial_reading: float = 0.0

class MeterOut(BaseModel):
    id: int
    property_id: int
    name: str
    meter_number: Optional[str] = None
    initial_reading: float
    created_at: datetime

    class Config:
        from_attributes = True

# Onboarding Step Schema
class TariffSlabInput(BaseModel):
    min_units: float
    max_units: Optional[float] = None
    rate: float

class OnboardingRequest(BaseModel):
    property_name: str
    property_type: str
    meter_name: str
    meter_number: Optional[str] = None
    initial_reading: float = 0.0
    currency_code: str = "INR"
    tariff_type: str = "slab" # simple or slab
    simple_rate: float = 7.50
    fixed_charge: float = 50.0
    tax_percentage: float = 18.0
    additional_charge: float = 0.0
    slabs: Optional[List[TariffSlabInput]] = None
    monthly_target_kwh: float = 250.0
    bill_budget: Optional[float] = 2000.0

# Reading Schemas
class MeterReadingCreate(BaseModel):
    meter_id: int
    reading_value: float
    captured_at: Optional[datetime] = None
    entry_method: str = "manual"
    notes: Optional[str] = None
    is_reset_or_replacement: bool = False
    is_official_reading: bool = False

class MeterReadingOut(BaseModel):
    id: int
    meter_id: int
    reading_value: float
    captured_at: datetime
    consumption: float
    entry_method: str
    image_path: Optional[str] = None
    ocr_value: Optional[float] = None
    ocr_confidence: Optional[float] = None
    verified: bool
    notes: Optional[str] = None
    is_reset_or_replacement: bool
    is_official_reading: bool

    class Config:
        from_attributes = True

class ReadingUpdate(BaseModel):
    reading_value: float
    reason: Optional[str] = "Corrected reading"

# Tariff Schemas
class TariffSlabInput(BaseModel):
    min_units: float
    max_units: Optional[float] = None
    rate: float

class BillComponentRuleCreate(BaseModel):
    component_name: str
    rule_type: str = "FIXED"
    rate: float
    duty_base_components: Optional[str] = None
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None

class BillComponentRuleOut(BaseModel):
    id: int
    tariff_id: int
    component_name: str
    rule_type: str
    rate: float
    duty_base_components: Optional[str] = None
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None

    class Config:
        from_attributes = True

class TariffCreate(BaseModel):
    meter_id: int
    name: str = "Standard Tariff"
    currency_code: str = "INR"
    tariff_type: str = "slab"
    calculation_method: str = "PROGRESSIVE"
    simple_rate: float = 7.50
    fixed_charge: float = 50.0
    tax_percentage: float = 18.0
    additional_charge: float = 0.0
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None
    slabs: Optional[List[TariffSlabInput]] = None
    component_rules: Optional[List[BillComponentRuleCreate]] = None

class TariffOut(BaseModel):
    id: int
    meter_id: int
    name: str
    currency_code: str
    tariff_type: str
    calculation_method: str
    simple_rate: float
    fixed_charge: float
    tax_percentage: float
    additional_charge: float
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None
    slabs: List[TariffSlabInput] = []
    component_rules: List[BillComponentRuleOut] = []

    class Config:
        from_attributes = True

# Target Schema
class TargetCreate(BaseModel):
    meter_id: int
    month_year: str # YYYY-MM
    target_kwh: float
    bill_budget: Optional[float] = None

class TargetOut(BaseModel):
    id: int
    meter_id: int
    month_year: str
    target_kwh: float
    bill_budget: Optional[float] = None

    class Config:
        from_attributes = True

# Appliance Schema
class ApplianceCreate(BaseModel):
    meter_id: int
    name: str
    category: str = "General"
    power_rating_w: float
    quantity: int = 1
    hours_per_day: float

class ApplianceOut(BaseModel):
    id: int
    meter_id: int
    name: str
    category: str
    power_rating_w: float
    quantity: int
    hours_per_day: float
    daily_kwh: float
    monthly_kwh: float
    monthly_cost: float

    class Config:
        from_attributes = True

# Bill Schema
class BillCreate(BaseModel):
    meter_id: int
    billing_period: str
    units_consumed: float
    energy_charge: float = 0.0
    fixed_charge: float = 0.0
    wheeling_charge: float = 0.0
    fuel_adjustment_charge: float = 0.0
    electricity_duty: float = 0.0
    tax_amount: float = 0.0
    other_charges: float = 0.0
    adjustments: float = 0.0
    total_amount: float
    due_date: Optional[datetime] = None
    is_official: bool = True

class BillOut(BaseModel):
    id: int
    meter_id: int
    billing_period: str
    bill_date: datetime
    due_date: Optional[datetime] = None
    previous_reading: Optional[float] = None
    current_reading: Optional[float] = None
    units_consumed: float
    energy_charge: float
    fixed_charge: float
    wheeling_charge: float
    fuel_adjustment_charge: float
    electricity_duty: float
    tax_amount: float
    other_charges: float
    adjustments: float
    total_amount: float
    file_path: Optional[str] = None
    verified: bool
    is_official: bool

    class Config:
        from_attributes = True

# Notification Schema
class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime


    class Config:
        from_attributes = True

# Billing Cycle Schema
class BillingCycleOut(BaseModel):
    id: int
    meter_id: int
    scheduled_start_date: datetime
    actual_start_date: Optional[datetime] = None
    scheduled_end_date: datetime
    actual_end_date: Optional[datetime] = None
    opening_meter_reading: float
    closing_meter_reading: Optional[float] = None
    total_units: float
    energy_charge: float
    fixed_charge: float
    wheeling_charge: float
    fuel_adjustment_charge: float
    electricity_duty: float
    additional_charges: float
    estimated_total: float
    status: str
    tariff_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
