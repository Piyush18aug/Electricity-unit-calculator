export interface User {
  id: number;
  full_name: string;
  email: string;
  onboarding_completed: boolean;
  created_at: string;
  settings?: UserSettings;
}

export interface UserSettings {
  currency_code: string;
  theme: string;
  reading_reminder_enabled: boolean;
  reminder_time: string;
  official_reading_day: number;
}

export interface Property {
  id: number;
  user_id: number;
  name: string;
  property_type: string;
  address?: string;
  created_at: string;
}

export interface Meter {
  id: number;
  property_id: number;
  name: string;
  meter_number?: string;
  initial_reading: number;
  created_at: string;
}

export interface MeterReading {
  id: number;
  meter_id: number;
  reading_value: number;
  captured_at: string;
  consumption: number;
  entry_method: 'photo' | 'upload' | 'manual';
  image_path?: string;
  ocr_value?: number;
  ocr_confidence?: number;
  verified: boolean;
  notes?: string;
  is_reset_or_replacement: boolean;
  is_official_reading?: boolean;
}

export interface AnalyticsData {
  today_kwh: number;
  today_cost: number;
  today_vs_avg_pct: number;
  month_to_date_kwh: number;
  month_to_date_cost: number;
  estimated_month_end_bill: number;
  projected_month_end_kwh: number;
  target_kwh: number;
  target_progress_pct: number;
  daily_avg_kwh: number;
  recommended_daily_kwh: number;
  days_remaining: number;
  cycle_start_date: string;
  cycle_end_date: string;
  mtd_energy_charge: number;
  mtd_fixed_charge: number;
  mtd_wheeling_charge: number;
  mtd_fuel_adjustment: number;
  mtd_electricity_duty: number;
  mtd_additional_charge: number;
  missing_components: string[];
  cycle_status: string;
  energy_score: number;
  energy_rating: string;
  insights: string[];
  anomalies: Array<{
    date: string;
    consumption: number;
    average: number;
    pct_above: number;
  }>;
  currency_code: string;
  meter_name: string;
  property_name: string;
}

export interface Appliance {
  id: number;
  meter_id: number;
  name: string;
  category: string;
  power_rating_w: number;
  quantity: number;
  hours_per_day: number;
  daily_kwh: number;
  monthly_kwh: number;
  monthly_cost: number;
}

export interface Bill {
  id: number;
  meter_id: number;
  billing_period: string;
  bill_date: string;
  due_date?: string;
  previous_reading?: number;
  current_reading?: number;
  units_consumed: number;
  energy_charge: number;
  fixed_charge: number;
  tax_amount: number;
  other_charges: number;
  total_amount: number;
  file_path?: string;
  verified: boolean;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  is_read: boolean;
  created_at: string;
}
