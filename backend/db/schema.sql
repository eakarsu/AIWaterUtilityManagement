-- AI Water Utility Management System - Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'operator',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Features tables
CREATE TABLE IF NOT EXISTS leak_detections (
  id SERIAL PRIMARY KEY,
  zone_name VARCHAR(255) NOT NULL,
  sensor_id VARCHAR(100) NOT NULL,
  pressure_psi DECIMAL(10,2) NOT NULL,
  flow_rate_gpm DECIMAL(10,2) NOT NULL,
  normal_pressure DECIMAL(10,2) NOT NULL,
  normal_flow DECIMAL(10,2) NOT NULL,
  pressure_drop_pct DECIMAL(5,2),
  flow_anomaly_pct DECIMAL(5,2),
  status VARCHAR(50) DEFAULT 'monitoring',
  severity VARCHAR(20) DEFAULT 'low',
  ai_analysis TEXT,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  location_lat DECIMAL(10,6),
  location_lng DECIMAL(10,6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS demand_forecasts (
  id SERIAL PRIMARY KEY,
  zone_name VARCHAR(255) NOT NULL,
  forecast_date DATE NOT NULL,
  predicted_demand_mgd DECIMAL(10,3),
  actual_demand_mgd DECIMAL(10,3),
  temperature_f DECIMAL(5,1),
  precipitation_in DECIMAL(5,2),
  day_of_week VARCHAR(20),
  is_holiday BOOLEAN DEFAULT false,
  population_served INTEGER,
  season VARCHAR(20),
  ai_analysis TEXT,
  confidence_pct DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS water_quality (
  id SERIAL PRIMARY KEY,
  sample_id VARCHAR(100) NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  ph_level DECIMAL(4,2),
  turbidity_ntu DECIMAL(8,3),
  chlorine_residual DECIMAL(5,3),
  lead_ppb DECIMAL(8,3),
  copper_ppb DECIMAL(8,3),
  coliform_present BOOLEAN DEFAULT false,
  ecoli_present BOOLEAN DEFAULT false,
  temperature_c DECIMAL(5,2),
  compliance_status VARCHAR(50) DEFAULT 'compliant',
  ai_analysis TEXT,
  sampled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS infrastructure_aging (
  id SERIAL PRIMARY KEY,
  asset_id VARCHAR(100) NOT NULL,
  asset_type VARCHAR(100) NOT NULL,
  material VARCHAR(100),
  install_date DATE,
  age_years INTEGER,
  condition_score DECIMAL(3,1),
  failure_probability DECIMAL(5,3),
  replacement_cost DECIMAL(12,2),
  last_inspection DATE,
  location VARCHAR(255),
  diameter_inches DECIMAL(6,2),
  length_feet DECIMAL(10,2),
  break_history INTEGER DEFAULT 0,
  ai_analysis TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS anomaly_detection (
  id SERIAL PRIMARY KEY,
  meter_id VARCHAR(100) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(100),
  reading_date DATE NOT NULL,
  consumption_gallons DECIMAL(12,2) NOT NULL,
  avg_consumption DECIMAL(12,2),
  deviation_pct DECIMAL(8,2),
  anomaly_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'detected',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS treatment_optimization (
  id SERIAL PRIMARY KEY,
  plant_name VARCHAR(255) NOT NULL,
  process_stage VARCHAR(100) NOT NULL,
  chemical_type VARCHAR(100),
  current_dosage DECIMAL(10,3),
  recommended_dosage DECIMAL(10,3),
  influent_turbidity DECIMAL(8,3),
  effluent_turbidity DECIMAL(8,3),
  flow_rate_mgd DECIMAL(10,3),
  energy_kwh DECIMAL(10,2),
  cost_per_day DECIMAL(10,2),
  optimization_status VARCHAR(50) DEFAULT 'pending',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Non-AI Features tables
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  account_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address VARCHAR(500),
  service_type VARCHAR(50) DEFAULT 'residential',
  meter_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  monthly_avg_gallons DECIMAL(12,2),
  balance DECIMAL(10,2) DEFAULT 0,
  join_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meter_readings (
  id SERIAL PRIMARY KEY,
  meter_id VARCHAR(100) NOT NULL,
  customer_name VARCHAR(255),
  reading_value DECIMAL(12,2) NOT NULL,
  previous_reading DECIMAL(12,2),
  consumption DECIMAL(12,2),
  reading_date DATE NOT NULL,
  read_by VARCHAR(255),
  status VARCHAR(50) DEFAULT 'verified',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS work_orders (
  id SERIAL PRIMARY KEY,
  work_order_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  assigned_to VARCHAR(255),
  location VARCHAR(500),
  estimated_hours DECIMAL(5,1),
  actual_hours DECIMAL(5,1),
  due_date DATE,
  completed_date DATE,
  cost DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pipe_inventory (
  id SERIAL PRIMARY KEY,
  pipe_id VARCHAR(100) UNIQUE NOT NULL,
  material VARCHAR(100) NOT NULL,
  diameter_inches DECIMAL(6,2) NOT NULL,
  length_feet DECIMAL(10,2) NOT NULL,
  install_year INTEGER,
  zone VARCHAR(100),
  street_name VARCHAR(255),
  condition_rating VARCHAR(20) DEFAULT 'good',
  pressure_class VARCHAR(50),
  last_inspection DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pump_stations (
  id SERIAL PRIMARY KEY,
  station_name VARCHAR(255) NOT NULL,
  station_id VARCHAR(100) UNIQUE NOT NULL,
  location VARCHAR(500),
  capacity_gpm DECIMAL(10,2),
  current_flow_gpm DECIMAL(10,2),
  pressure_psi DECIMAL(8,2),
  power_kw DECIMAL(8,2),
  status VARCHAR(50) DEFAULT 'operational',
  last_maintenance DATE,
  pump_count INTEGER DEFAULT 1,
  runtime_hours DECIMAL(10,1),
  efficiency_pct DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservoirs (
  id SERIAL PRIMARY KEY,
  reservoir_name VARCHAR(255) NOT NULL,
  reservoir_id VARCHAR(100) UNIQUE NOT NULL,
  location VARCHAR(500),
  capacity_mg DECIMAL(10,3) NOT NULL,
  current_level_mg DECIMAL(10,3),
  level_pct DECIMAL(5,2),
  inflow_gpm DECIMAL(10,2),
  outflow_gpm DECIMAL(10,2),
  water_temp_f DECIMAL(5,1),
  status VARCHAR(50) DEFAULT 'normal',
  last_inspection DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
