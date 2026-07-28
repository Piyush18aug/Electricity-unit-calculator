import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.models import Tariff, TariffSlab, BillComponentRule
from app.services.tariff_service import calculate_energy_charge, calculate_total_electricity_bill

def test_simple_tariff_calculation():
    tariff = Tariff(tariff_type="simple", simple_rate=8.50, fixed_charge=50.0, tax_percentage=10.0, additional_charge=0.0)
    charge = calculate_energy_charge(100.0, tariff)
    assert charge == 850.0

    bill = calculate_total_electricity_bill(100.0, tariff)
    assert bill["energy_charge"] == 850.0
    assert bill["fixed_charge"] == 50.0
    assert bill["tax_amount"] == 90.0  # (850 + 50) * 10%
    assert bill["total_amount"] == 990.0

def test_slab_tariff_calculation():
    tariff = Tariff(tariff_type="slab", fixed_charge=50.0, tax_percentage=0.0, additional_charge=0.0, calculation_method="PROGRESSIVE")
    slabs = [
        TariffSlab(min_units=0, max_units=100, rate=5.0),
        TariffSlab(min_units=101, max_units=300, rate=8.0), # Intentionally using 101 to test boundary logic
    ]
    tariff.slabs = slabs

    # 150 kWh -> (100 * 5.0) + (50 * 8.0) = 500 + 400 = 900
    charge = calculate_energy_charge(150.0, tariff)
    assert charge == 900.0

def test_progressive_tariff_boundaries():
    tariff = Tariff(tariff_type="slab", calculation_method="PROGRESSIVE")
    slabs = [
        TariffSlab(min_units=0, max_units=100, rate=3.96),
        TariffSlab(min_units=101, max_units=300, rate=10.80),
        TariffSlab(min_units=301, max_units=500, rate=15.03),
        TariffSlab(min_units=501, max_units=1000, rate=17.53),
        TariffSlab(min_units=1001, max_units=None, rate=17.53)
    ]
    tariff.slabs = slabs

    # 50 units -> 50 * 3.96 = 198
    assert calculate_energy_charge(50, tariff) == 198.0
    
    # 100 units -> 100 * 3.96 = 396
    assert calculate_energy_charge(100, tariff) == 396.0
    
    # 103 units -> (100 * 3.96) + (3 * 10.80) = 396 + 32.40 = 428.40
    assert calculate_energy_charge(103, tariff) == 428.40
    
    # 300 units -> (100 * 3.96) + (200 * 10.80) = 396 + 2160 = 2556
    assert calculate_energy_charge(300, tariff) == 2556.0
    
    # 301 units -> (100 * 3.96) + (200 * 10.80) + (1 * 15.03) = 2556 + 15.03 = 2571.03
    assert calculate_energy_charge(301, tariff) == 2571.03
    
    # 412 units -> (100 * 3.96) + (200 * 10.80) + (112 * 15.03) = 2556 + 1683.36 = 4239.36
    assert calculate_energy_charge(412, tariff) == 4239.36

def test_missing_components():
    tariff = Tariff(tariff_type="slab", calculation_method="PROGRESSIVE")
    tariff.slabs = [TariffSlab(min_units=0, max_units=100, rate=5.0)]
    tariff.component_rules = [
        BillComponentRule(component_name="Fixed Charge", rule_type="FIXED", rate=250.0),
        BillComponentRule(component_name="Electricity Duty", rule_type="PERCENTAGE", rate=16.0, duty_base_components="Energy Charge, Fixed Charge")
    ]
    
    bill = calculate_total_electricity_bill(100.0, tariff)
    assert bill["missing_components"] == ["Wheeling Charge", "Fuel Adjustment"]
    assert bill["wheeling_charge"] is None
    assert bill["fuel_adjustment_charge"] is None
    assert bill["fixed_charge"] == 250.0
    
    # Energy: 100 * 5 = 500
    # Fixed: 250
    # Duty base: 500 + 250 = 750
    # Duty: 750 * 0.16 = 120
    # Total: 500 + 250 + 120 = 870
    assert bill["electricity_duty"] == 120.0
    assert bill["total_amount"] == 870.0

def test_duty_base_configurable():
    tariff = Tariff(tariff_type="slab", calculation_method="PROGRESSIVE")
    tariff.slabs = [TariffSlab(min_units=0, max_units=100, rate=10.0)]
    tariff.component_rules = [
        BillComponentRule(component_name="Fixed Charge", rule_type="FIXED", rate=100.0),
        BillComponentRule(component_name="Wheeling Charge", rule_type="PER_UNIT", rate=1.0),
        BillComponentRule(component_name="Electricity Duty", rule_type="PERCENTAGE", rate=20.0, duty_base_components="Energy Charge, Wheeling Charge")
    ]
    
    bill = calculate_total_electricity_bill(100.0, tariff)
    # Energy: 100 * 10 = 1000
    # Fixed: 100
    # Wheeling: 100 * 1 = 100
    # Duty base: Energy (1000) + Wheeling (100) = 1100
    # Duty: 1100 * 0.20 = 220
    # Total: 1000 + 100 + 100 + 220 = 1420
    
    assert bill["electricity_duty"] == 220.0
    assert bill["total_amount"] == 1420.0
    assert "Fuel Adjustment" in bill["missing_components"]
