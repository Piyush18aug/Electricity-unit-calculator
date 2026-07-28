from typing import List, Dict, Any
from app.models.models import Tariff, TariffSlab

def calculate_energy_charge(units_kwh: float, tariff: Tariff) -> float:
    """Calculates base energy charges using simple or slab tariff rate."""
    if units_kwh <= 0:
        return 0.0

    if tariff.tariff_type == "simple":
        return units_kwh * tariff.simple_rate

    slabs = sorted(tariff.slabs, key=lambda s: s.min_units)
    if not slabs:
        return units_kwh * (tariff.simple_rate or 7.50)

    total_energy_charge = 0.0

    # Ensure contiguous boundaries mathematically (e.g., 101 -> 100 as boundary)
    contiguous_slabs = []
    current_min = 0.0
    for slab in slabs:
        max_u = slab.max_units if slab.max_units is not None else float('inf')
        # We adjust boundaries so 101 becomes >100
        # If user entered 101, but prev max was 100, we use 100 as the math boundary.
        # So we just use current_min as the start.
        contiguous_slabs.append({
            "min_units": current_min,
            "max_units": max_u,
            "rate": slab.rate
        })
        current_min = max_u

    if getattr(tariff, "calculation_method", "PROGRESSIVE") == "BRACKET":
        applicable_rate = contiguous_slabs[-1]["rate"]
        for slab in contiguous_slabs:
            if slab["min_units"] < units_kwh <= slab["max_units"]:
                applicable_rate = slab["rate"]
                break
            elif units_kwh == 0:
                applicable_rate = slab["rate"]
                break
        total_energy_charge = units_kwh * applicable_rate
    else:
        # PROGRESSIVE
        for slab in contiguous_slabs:
            if units_kwh > slab["min_units"]:
                taxable_units_in_slab = min(units_kwh, slab["max_units"]) - slab["min_units"]
                if taxable_units_in_slab > 0:
                    total_energy_charge += taxable_units_in_slab * slab["rate"]

    return round(total_energy_charge, 2)


def calculate_total_electricity_bill(units_kwh: float, tariff: Tariff) -> Dict[str, Any]:
    """
    Computes complete bill breakdown including rules-based components.
    """
    if not tariff:
        energy = units_kwh * 7.50
        fixed = 50.0
        tax = (energy + fixed) * 0.18
        total = energy + fixed + tax
        return {
            "units_kwh": units_kwh,
            "energy_charge": round(energy, 2),
            "fixed_charge": fixed,
            "wheeling_charge": None,
            "fuel_adjustment_charge": None,
            "electricity_duty": round(tax, 2),
            "additional_charge": 0.0,
            "tax_amount": round(tax, 2), # Legacy compat
            "total_amount": round(total, 2),
            "missing_components": ["Wheeling Charge", "Fuel Adjustment"]
        }

    energy_charge = calculate_energy_charge(units_kwh, tariff)
    
    # Initialize components (None means Not Configured)
    components = {
        "Fixed Charge": None,
        "Wheeling Charge": None,
        "Fuel Adjustment": None,
        "Electricity Duty": None,
        "Other Charges": None
    }

    # Helper to calculate a rule amount
    def calc_rule(rule):
        if rule.rule_type == "FIXED": return rule.rate
        if rule.rule_type == "PER_UNIT": return units_kwh * rule.rate
        if rule.rule_type == "BRACKET": return rule.rate # Assuming simple bracket flat rate for now
        return 0.0

    has_rules = hasattr(tariff, "component_rules") and tariff.component_rules
    if has_rules:
        # Pass 1: Calculate non-percentage components
        for rule in tariff.component_rules:
            if rule.rule_type != "PERCENTAGE":
                amt = calc_rule(rule)
                if components.get(rule.component_name) is None:
                    components[rule.component_name] = amt
                else:
                    components[rule.component_name] += amt

        # Pass 2: Calculate percentage components (like Duty)
        for rule in tariff.component_rules:
            if rule.rule_type == "PERCENTAGE":
                base_sum = 0.0
                if rule.duty_base_components:
                    bases = [b.strip() for b in rule.duty_base_components.split(',')]
                    for b in bases:
                        if b == "ENERGY_CHARGE" or b == "Energy Charge": 
                            base_sum += energy_charge
                        elif b in components and components[b] is not None: 
                            base_sum += components[b]
                else:
                    base_sum = energy_charge + (components["Fixed Charge"] or 0)
                
                amt = base_sum * (rule.rate / 100.0)
                if components.get(rule.component_name) is None:
                    components[rule.component_name] = amt
                else:
                    components[rule.component_name] += amt

    # Fallback to legacy if no rules are configured for Fixed Charge or Duty
    if not has_rules:
        if tariff.tariff_type == "slab":
            if units_kwh <= 100: components["Fixed Charge"] = 150.0
            elif units_kwh <= 300: components["Fixed Charge"] = 250.0
            elif units_kwh <= 500: components["Fixed Charge"] = 350.0
            else: components["Fixed Charge"] = 400.0
        else:
            components["Fixed Charge"] = tariff.fixed_charge or 0.0
            
        components["Other Charges"] = tariff.additional_charge or 0.0
        tax_pct = tariff.tax_percentage or 0.0
        components["Electricity Duty"] = (energy_charge + components["Fixed Charge"] + components["Other Charges"]) * (tax_pct / 100.0)

    # Missing components tracking
    missing = []
    # Identify which ones are strictly required / expected to exist in a full tariff
    if components["Wheeling Charge"] is None:
        missing.append("Wheeling Charge")
    if components["Fuel Adjustment"] is None:
        missing.append("Fuel Adjustment")
    if components["Fixed Charge"] is None:
        missing.append("Fixed Charge")
    if components["Electricity Duty"] is None:
        missing.append("Electricity Duty")

    # For the calculation of the total amount, we treat None as 0
    fixed_c = components["Fixed Charge"] or 0.0
    wheeling_c = components["Wheeling Charge"] or 0.0
    fuel_c = components["Fuel Adjustment"] or 0.0
    duty_c = components["Electricity Duty"] or 0.0
    other_c = components["Other Charges"] or 0.0

    total_amount = energy_charge + fixed_c + wheeling_c + fuel_c + duty_c + other_c

    return {
        "units_kwh": units_kwh,
        "energy_charge": round(energy_charge, 2),
        "fixed_charge": round(fixed_c, 2) if components["Fixed Charge"] is not None else None,
        "wheeling_charge": round(wheeling_c, 2) if components["Wheeling Charge"] is not None else None,
        "fuel_adjustment_charge": round(fuel_c, 2) if components["Fuel Adjustment"] is not None else None,
        "electricity_duty": round(duty_c, 2) if components["Electricity Duty"] is not None else None,
        "additional_charge": round(other_c, 2) if components["Other Charges"] is not None else None,
        "tax_amount": round(duty_c, 2) if components["Electricity Duty"] is not None else 0.0, # Legacy fallback
        "total_amount": round(total_amount, 2),
        "missing_components": missing
    }
