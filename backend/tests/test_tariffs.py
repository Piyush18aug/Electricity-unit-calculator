from app.models.models import Tariff, TariffSlab
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
    tariff = Tariff(tariff_type="slab", fixed_charge=50.0, tax_percentage=0.0, additional_charge=0.0)
    slabs = [
        TariffSlab(min_units=0, max_units=100, rate=5.0),
        TariffSlab(min_units=100, max_units=300, rate=8.0),
    ]
    tariff.slabs = slabs

    # 150 kWh -> (100 * 5.0) + (50 * 8.0) = 500 + 400 = 900
    charge = calculate_energy_charge(150.0, tariff)
    assert charge == 900.0
