from datetime import datetime, date
import calendar
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from app.models.models import MeterReading, MonthlyTarget, Tariff, BillingCycle
from app.services.tariff_service import calculate_total_electricity_bill

def calculate_analytics(readings: List[MeterReading], target: Optional[MonthlyTarget], tariff: Optional[Tariff], active_cycle: Optional[BillingCycle] = None) -> Dict[str, Any]:
    """
    Computes comprehensive analytics:
    - Today's consumption & cost
    - Month-to-date total kWh & cost
    - Average daily kWh
    - Month-end projected kWh & bill forecast
    - Target progress % and recommended daily remaining limit
    - Energy Score (0-100)
    - Smart insights list
    - Anomaly detection
    """
    if not readings:
        return {
            "today_kwh": 0.0,
            "today_cost": 0.0,
            "today_vs_avg_pct": 0.0,
            "month_to_date_kwh": 0.0,
            "month_to_date_cost": 0.0,
            "estimated_month_end_bill": 0.0,
            "projected_month_end_kwh": 0.0,
            "target_kwh": target.target_kwh if target else 250.0,
            "target_progress_pct": 0.0,
            "daily_avg_kwh": 0.0,
            "recommended_daily_kwh": 0.0,
            "cycle_start_date": "",
            "cycle_end_date": "",
            "mtd_energy_charge": None,
            "mtd_fixed_charge": None,
            "mtd_wheeling_charge": None,
            "mtd_fuel_adjustment": None,
            "mtd_electricity_duty": None,
            "mtd_additional_charge": None,
            "missing_components": [],
            "projected_bill_breakdown": {},
            "forecast_confidence": "Low",
            "energy_score": 85,
            "energy_rating": "Good",
            "insights": ["Record your initial meter readings to unlock personalized energy insights!"],
            "anomalies": []
        }

    # Sort readings by capture date
    sorted_readings = sorted(readings, key=lambda r: r.captured_at)
    
    # Extract consumption series
    consumptions = [r.consumption for r in sorted_readings if r.consumption > 0]
    dates = [r.captured_at.date() for r in sorted_readings]

    today = date.today()
    current_month_readings = [r for r in sorted_readings if r.captured_at.year == today.year and r.captured_at.month == today.month]

    # Today's usage (sum of all consumptions recorded today)
    today_readings = [r for r in sorted_readings if r.captured_at.date() == today]
    today_kwh = sum(r.consumption for r in today_readings) if today_readings else 0.0
    
    elapsed_days = 1
    # Month to Date kWh (Billing Cycle logic)
    if active_cycle and sorted_readings:
        cycle_start = active_cycle.actual_start_date
        cycle_readings = [r for r in sorted_readings if r.captured_at >= cycle_start]
        mtd_kwh = sum(r.consumption for r in cycle_readings)
        
        cycle_start_date = active_cycle.actual_start_date.strftime("%Y-%m-%d")
        cycle_end_date = active_cycle.scheduled_end_date.strftime("%Y-%m-%d")
        
        # Calculate elapsed days accurately
        elapsed_days = max(1, (today - active_cycle.actual_start_date.date()).days)
        
        delta = (active_cycle.scheduled_end_date.date() - today).days
        days_remaining = max(0, delta)
    else:
        mtd_kwh = sum(r.consumption for r in current_month_readings)
        days_in_month = calendar.monthrange(today.year, today.month)[1]
        
        elapsed_days = max(1, today.day)
        days_remaining = max(1, days_in_month - today.day)
        
        cycle_start_date = f"{today.year}-{today.month:02d}-01"
        cycle_end_date = f"{today.year}-{today.month:02d}-{days_in_month:02d}"

    # Calculate average daily kWh (global)
    daily_avg_kwh = float(np.mean(consumptions)) if consumptions else 5.0

    # Today vs Average percentage comparison
    today_vs_avg_pct = round(((today_kwh - daily_avg_kwh) / daily_avg_kwh) * 100, 1) if daily_avg_kwh > 0 else 0.0

    # FORECASTING LOGIC
    # Average daily consumption specifically for the current cycle
    cycle_daily_avg = mtd_kwh / elapsed_days if elapsed_days > 0 else daily_avg_kwh
    
    projected_remaining_kwh = cycle_daily_avg * days_remaining
    projected_month_end_kwh = round(mtd_kwh + projected_remaining_kwh, 1)
    
    # Forecast Confidence based on elapsed days
    if elapsed_days < 3:
        forecast_confidence = "Low"
    elif elapsed_days < 15:
        forecast_confidence = "Medium"
    else:
        forecast_confidence = "High"

    # Costs calculation using the unified engine
    today_cost_breakdown = calculate_total_electricity_bill(today_kwh, tariff)
    today_cost = today_cost_breakdown["total_amount"]

    mtd_cost_breakdown = calculate_total_electricity_bill(mtd_kwh, tariff)
    mtd_cost = mtd_cost_breakdown["total_amount"]
    missing_components = mtd_cost_breakdown.get("missing_components", [])

    projected_bill_breakdown = calculate_total_electricity_bill(projected_month_end_kwh, tariff)
    estimated_month_end_bill = projected_bill_breakdown["total_amount"]

    # Target limits
    target_kwh = target.target_kwh if target else 250.0
    target_progress_pct = round((mtd_kwh / target_kwh) * 100, 1) if target_kwh > 0 else 0.0

    kwh_remaining = max(0.0, target_kwh - mtd_kwh)
    recommended_daily_kwh = round(kwh_remaining / days_remaining, 1) if days_remaining > 0 else 0.0

    # Energy Score (0 - 100) Algorithm
    score = 100
    if target_progress_pct > 100:
        score -= min(35, (target_progress_pct - 100) * 0.8)
    elif target_progress_pct > 80:
        score -= (target_progress_pct - 80) * 0.5

    # Check for high usage spikes (anomalies) > 1.8x average
    anomalies = []
    spike_count = 0
    for r in sorted_readings[-10:]:
        if r.consumption > (daily_avg_kwh * 1.75) and r.consumption > 2.0:
            spike_count += 1
            anomalies.append({
                "date": r.captured_at.strftime("%Y-%m-%d"),
                "consumption": r.consumption,
                "average": round(daily_avg_kwh, 1),
                "pct_above": round(((r.consumption - daily_avg_kwh) / daily_avg_kwh) * 100, 1)
            })

    score -= min(25, spike_count * 8)
    energy_score = int(max(20, min(100, score)))

    if energy_score >= 90:
        rating = "Excellent"
    elif energy_score >= 75:
        rating = "Good"
    elif energy_score >= 50:
        rating = "Moderate"
    else:
        rating = "Needs Attention"

    # Dynamic Insights Generation
    insights = []
    if today_vs_avg_pct > 15:
        insights.append(f"⚡ Today's electricity consumption ({today_kwh} kWh) is {abs(today_vs_avg_pct)}% above your daily average ({daily_avg_kwh:.1f} kWh).")
    elif today_vs_avg_pct < -10:
        insights.append(f"🌱 Great job! Today's consumption is {abs(today_vs_avg_pct)}% lower than your usual daily average.")

    if projected_month_end_kwh > target_kwh:
        diff = round(projected_month_end_kwh - target_kwh, 1)
        insights.append(f"📈 At current trends, you are projected to reach {projected_month_end_kwh} kWh (exceeding your target by {diff} kWh).")
        insights.append(f"🎯 Maintain daily usage under {recommended_daily_kwh} kWh/day to stay within budget.")
    else:
        insights.append(f"🎯 You are on track to stay within your monthly target of {target_kwh} kWh!")

    if spike_count > 0:
        insights.append(f"⚠ Detected {spike_count} high consumption spike(s) in recent readings.")

    return {
        "today_kwh": round(today_kwh, 1),
        "today_cost": today_cost,
        "today_vs_avg_pct": today_vs_avg_pct,
        "month_to_date_kwh": round(mtd_kwh, 1),
        "month_to_date_cost": mtd_cost,
        "estimated_month_end_bill": estimated_month_end_bill,
        "projected_month_end_kwh": projected_month_end_kwh,
        "target_kwh": target_kwh,
        "target_progress_pct": target_progress_pct,
        "daily_avg_kwh": round(daily_avg_kwh, 1),
        "recommended_daily_kwh": recommended_daily_kwh,
        "days_remaining": days_remaining,
        "cycle_start_date": cycle_start_date,
        "cycle_end_date": cycle_end_date,
        
        # MTD bill components
        "mtd_energy_charge": mtd_cost_breakdown.get("energy_charge"),
        "mtd_fixed_charge": mtd_cost_breakdown.get("fixed_charge"),
        "mtd_wheeling_charge": mtd_cost_breakdown.get("wheeling_charge"),
        "mtd_fuel_adjustment": mtd_cost_breakdown.get("fuel_adjustment_charge"),
        "mtd_electricity_duty": mtd_cost_breakdown.get("electricity_duty"),
        "mtd_additional_charge": mtd_cost_breakdown.get("additional_charge"),
        
        "missing_components": missing_components,
        "projected_bill_breakdown": projected_bill_breakdown,
        "forecast_confidence": forecast_confidence,
        
        "cycle_status": active_cycle.status if active_cycle else "ACTIVE",
        "energy_score": energy_score,
        "energy_rating": rating,
        "insights": insights,
        "anomalies": anomalies
    }
