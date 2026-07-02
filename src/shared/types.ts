export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  retail_price_etb: number;
  fuel: string;
  duty: string;
  images: string[];
  branchName?: string;
  certified_km?: number;
  battery_soh_percent?: number;
  status: string;
  branch_id: string;
  inquiryCount?: number;
  vin_chassis?: string;
  plate_code?: string;
  charger_type?: string;
  software_language?: string;
  range_km?: number;
  battery_capacity_kwh?: string | number;
  motor_power_kw?: string | number;
  drive_train?: string;
  interior_color?: string;
  features?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  phone?: string;
  avatar_url?: string;
}

export interface TradeInRequest {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  estimatedValue: number;
  status: string;
}
