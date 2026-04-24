-- AI Water Utility Management System - Seed Data

-- Default admin user (password: admin123)
INSERT INTO users (email, password, name, role) VALUES
('admin@waterutility.com', '$2a$10$W18StyKAG5ih5Pzdy7TCoe9ymnM5SlCageVj6MwZS09rF1KAs786G', 'Admin User', 'admin'),
('jsmith@waterutility.com', '$2a$10$W18StyKAG5ih5Pzdy7TCoe9ymnM5SlCageVj6MwZS09rF1KAs786G', 'John Smith', 'operator'),
('mjones@waterutility.com', '$2a$10$W18StyKAG5ih5Pzdy7TCoe9ymnM5SlCageVj6MwZS09rF1KAs786G', 'Maria Jones', 'manager'),
('tbrown@waterutility.com', '$2a$10$W18StyKAG5ih5Pzdy7TCoe9ymnM5SlCageVj6MwZS09rF1KAs786G', 'Tom Brown', 'operator')
ON CONFLICT (email) DO NOTHING;

-- Leak Detections (15+ records)
INSERT INTO leak_detections (zone_name, sensor_id, pressure_psi, flow_rate_gpm, normal_pressure, normal_flow, pressure_drop_pct, flow_anomaly_pct, status, severity, detected_at, location_lat, location_lng) VALUES
('North District', 'PS-N001', 42.50, 185.30, 60.00, 150.00, 29.17, 23.53, 'confirmed', 'high', '2026-03-18 08:30:00', 40.758896, -73.985130),
('South District', 'PS-S002', 55.20, 162.80, 58.00, 155.00, 4.83, 5.03, 'monitoring', 'low', '2026-03-19 14:15:00', 40.748817, -73.985428),
('Downtown Core', 'PS-D003', 38.10, 210.50, 62.00, 160.00, 38.55, 31.56, 'confirmed', 'critical', '2026-03-17 03:45:00', 40.752726, -73.977229),
('Industrial Park', 'PS-I004', 48.90, 195.20, 55.00, 180.00, 11.09, 8.44, 'investigating', 'medium', '2026-03-19 11:00:00', 40.741895, -73.989308),
('Riverside Heights', 'PS-R005', 57.30, 148.60, 59.00, 145.00, 2.88, 2.48, 'monitoring', 'low', '2026-03-20 06:00:00', 40.763560, -73.991340),
('Oakwood Estates', 'PS-O006', 44.70, 178.90, 58.00, 155.00, 22.93, 15.42, 'confirmed', 'high', '2026-03-16 22:10:00', 40.755200, -73.978500),
('Maple Ridge', 'PS-M007', 53.80, 160.40, 56.00, 158.00, 3.93, 1.52, 'monitoring', 'low', '2026-03-20 02:30:00', 40.749100, -73.968200),
('Cedar Valley', 'PS-C008', 46.20, 192.70, 60.00, 165.00, 23.00, 16.79, 'investigating', 'medium', '2026-03-18 16:45:00', 40.744300, -73.995100),
('Westfield Commons', 'PS-W009', 35.40, 225.80, 61.00, 170.00, 41.97, 32.82, 'confirmed', 'critical', '2026-03-15 09:20:00', 40.760800, -73.982700),
('Eastgate Plaza', 'PS-E010', 51.60, 167.30, 57.00, 160.00, 9.47, 4.56, 'monitoring', 'low', '2026-03-19 20:00:00', 40.746500, -73.971800),
('Hillcrest Terrace', 'PS-H011', 47.80, 188.40, 59.00, 165.00, 18.98, 14.18, 'investigating', 'medium', '2026-03-17 12:30:00', 40.757900, -73.988600),
('Lakeside Park', 'PS-L012', 54.90, 153.20, 57.00, 150.00, 3.68, 2.13, 'resolved', 'low', '2026-03-14 07:15:00', 40.743800, -73.976400),
('Pinewood Junction', 'PS-P013', 40.30, 201.60, 61.00, 168.00, 33.93, 20.00, 'confirmed', 'high', '2026-03-18 01:50:00', 40.751600, -73.993200),
('Summit View', 'PS-SV014', 49.50, 174.80, 56.00, 170.00, 11.61, 2.82, 'monitoring', 'low', '2026-03-20 04:10:00', 40.765200, -73.980100),
('Harbor District', 'PS-HD015', 43.10, 198.50, 60.00, 162.00, 28.17, 22.53, 'investigating', 'high', '2026-03-19 18:30:00', 40.739400, -73.969800),
('Greenfield Acres', 'PS-G016', 56.80, 155.10, 58.00, 152.00, 2.07, 2.04, 'monitoring', 'low', '2026-03-20 07:45:00', 40.748200, -73.984600);

-- Demand Forecasts (15+ records)
INSERT INTO demand_forecasts (zone_name, forecast_date, predicted_demand_mgd, actual_demand_mgd, temperature_f, precipitation_in, day_of_week, is_holiday, population_served, season, confidence_pct) VALUES
('North District', '2026-03-20', 12.450, 12.310, 52.0, 0.00, 'Friday', false, 45000, 'spring', 92.50),
('South District', '2026-03-20', 9.870, 10.020, 52.0, 0.00, 'Friday', false, 32000, 'spring', 89.30),
('Downtown Core', '2026-03-20', 15.230, 15.680, 52.0, 0.00, 'Friday', false, 58000, 'spring', 91.10),
('Industrial Park', '2026-03-20', 22.100, 21.850, 52.0, 0.00, 'Friday', false, 12000, 'spring', 94.20),
('North District', '2026-03-21', 10.200, NULL, 48.0, 0.35, 'Saturday', false, 45000, 'spring', 88.70),
('South District', '2026-03-21', 8.540, NULL, 48.0, 0.35, 'Saturday', false, 32000, 'spring', 87.10),
('Downtown Core', '2026-03-21', 11.870, NULL, 48.0, 0.35, 'Saturday', false, 58000, 'spring', 86.50),
('North District', '2026-03-22', 9.980, NULL, 45.0, 0.50, 'Sunday', false, 45000, 'spring', 85.30),
('South District', '2026-03-22', 7.650, NULL, 45.0, 0.50, 'Sunday', false, 32000, 'spring', 84.80),
('North District', '2026-03-23', 13.100, NULL, 55.0, 0.00, 'Monday', false, 45000, 'spring', 90.60),
('Downtown Core', '2026-03-23', 16.450, NULL, 55.0, 0.00, 'Monday', false, 58000, 'spring', 91.80),
('Industrial Park', '2026-03-23', 23.500, NULL, 55.0, 0.00, 'Monday', false, 12000, 'spring', 93.40),
('Riverside Heights', '2026-03-24', 6.780, NULL, 58.0, 0.00, 'Tuesday', false, 22000, 'spring', 88.90),
('Oakwood Estates', '2026-03-24', 5.120, NULL, 58.0, 0.00, 'Tuesday', false, 18000, 'spring', 90.20),
('North District', '2026-03-25', 13.800, NULL, 62.0, 0.00, 'Wednesday', false, 45000, 'spring', 89.10),
('South District', '2026-03-25', 10.450, NULL, 62.0, 0.00, 'Wednesday', false, 32000, 'spring', 87.60),
('Downtown Core', '2026-03-26', 16.900, NULL, 65.0, 0.00, 'Thursday', false, 58000, 'spring', 88.40);

-- Water Quality (15+ records)
INSERT INTO water_quality (sample_id, location_name, ph_level, turbidity_ntu, chlorine_residual, lead_ppb, copper_ppb, coliform_present, ecoli_present, temperature_c, compliance_status, sampled_at) VALUES
('WQ-2026-0301', 'North Treatment Plant Effluent', 7.20, 0.180, 1.850, 2.100, 180.500, false, false, 14.20, 'compliant', '2026-03-18 08:00:00'),
('WQ-2026-0302', 'South Reservoir Intake', 7.45, 0.950, 0.520, 3.800, 220.100, false, false, 12.80, 'compliant', '2026-03-18 08:30:00'),
('WQ-2026-0303', 'Downtown Distribution - Main St', 7.10, 0.320, 1.200, 8.500, 450.200, false, false, 15.10, 'warning', '2026-03-18 09:00:00'),
('WQ-2026-0304', 'Industrial Park Hydrant #42', 6.80, 1.250, 0.180, 12.300, 890.500, true, false, 16.50, 'non-compliant', '2026-03-18 09:30:00'),
('WQ-2026-0305', 'Riverside Heights Tank', 7.35, 0.210, 1.650, 1.500, 120.300, false, false, 13.40, 'compliant', '2026-03-18 10:00:00'),
('WQ-2026-0306', 'Oakwood Estates Booster Station', 7.28, 0.280, 1.420, 2.800, 195.600, false, false, 14.80, 'compliant', '2026-03-18 10:30:00'),
('WQ-2026-0307', 'Maple Ridge Elementary School', 7.50, 0.150, 1.780, 4.200, 310.400, false, false, 13.90, 'compliant', '2026-03-18 11:00:00'),
('WQ-2026-0308', 'Cedar Valley Hospital', 7.15, 0.190, 1.920, 1.800, 145.200, false, false, 14.50, 'compliant', '2026-03-18 11:30:00'),
('WQ-2026-0309', 'Westfield Commons Park Fountain', 7.60, 0.420, 0.950, 5.600, 380.100, false, false, 15.80, 'compliant', '2026-03-19 08:00:00'),
('WQ-2026-0310', 'Eastgate Plaza Office Complex', 6.95, 0.780, 0.350, 9.200, 620.800, false, false, 16.20, 'warning', '2026-03-19 08:30:00'),
('WQ-2026-0311', 'Hillcrest Terrace Sampling Point', 7.30, 0.250, 1.550, 2.400, 175.900, false, false, 14.10, 'compliant', '2026-03-19 09:00:00'),
('WQ-2026-0312', 'Lakeside Park Community Center', 7.42, 0.310, 1.380, 3.100, 210.500, false, false, 13.60, 'compliant', '2026-03-19 09:30:00'),
('WQ-2026-0313', 'Pinewood Junction Fire Station', 7.18, 0.200, 1.700, 2.000, 155.300, false, false, 14.70, 'compliant', '2026-03-19 10:00:00'),
('WQ-2026-0314', 'Summit View Senior Living', 7.55, 0.170, 1.820, 1.200, 98.700, false, false, 13.20, 'compliant', '2026-03-19 10:30:00'),
('WQ-2026-0315', 'Harbor District Warehouse Area', 6.75, 1.450, 0.120, 15.800, 1050.200, true, true, 17.30, 'non-compliant', '2026-03-19 11:00:00'),
('WQ-2026-0316', 'Greenfield Acres Swimming Pool', 7.38, 0.140, 2.100, 1.600, 110.400, false, false, 14.00, 'compliant', '2026-03-19 11:30:00');

-- Infrastructure Aging (15+ records)
INSERT INTO infrastructure_aging (asset_id, asset_type, material, install_date, age_years, condition_score, failure_probability, replacement_cost, last_inspection, location, diameter_inches, length_feet, break_history, priority) VALUES
('PIPE-NE-001', 'Water Main', 'Cast Iron', '1958-06-15', 67, 3.2, 0.450, 285000.00, '2025-11-10', 'North District - Elm Street', 12.00, 2400.00, 8, 'critical'),
('PIPE-NE-002', 'Water Main', 'Ductile Iron', '1985-03-20', 41, 6.5, 0.120, 195000.00, '2025-12-05', 'North District - Oak Avenue', 8.00, 1800.00, 2, 'medium'),
('PIPE-SW-003', 'Transmission Main', 'Pre-stressed Concrete', '1972-09-10', 53, 4.1, 0.310, 520000.00, '2025-10-22', 'South District - River Road', 24.00, 5200.00, 5, 'high'),
('PIPE-DT-004', 'Distribution Line', 'PVC', '1995-07-01', 30, 7.8, 0.050, 85000.00, '2026-01-15', 'Downtown Core - Market Street', 6.00, 1200.00, 0, 'low'),
('PIPE-IP-005', 'Service Line', 'Lead', '1952-11-30', 73, 2.5, 0.620, 45000.00, '2025-09-18', 'Industrial Park - Factory Lane', 1.00, 150.00, 3, 'critical'),
('VALVE-N-006', 'Gate Valve', 'Cast Iron', '1968-04-22', 57, 3.8, 0.380, 12000.00, '2025-08-30', 'North District - Pine Street', 12.00, NULL, 1, 'high'),
('HYDR-S-007', 'Fire Hydrant', 'Cast Iron', '1990-02-14', 36, 6.0, 0.150, 8500.00, '2026-02-01', 'South District - Cedar Lane', NULL, NULL, 0, 'medium'),
('PIPE-RH-008', 'Water Main', 'Asbestos Cement', '1965-08-05', 60, 3.5, 0.410, 340000.00, '2025-07-20', 'Riverside Heights - Harbor Blvd', 10.00, 3100.00, 6, 'critical'),
('TANK-OE-009', 'Storage Tank', 'Steel', '1978-12-01', 47, 5.2, 0.220, 1200000.00, '2025-11-28', 'Oakwood Estates - Hilltop Drive', NULL, NULL, 0, 'high'),
('PIPE-MR-010', 'Distribution Line', 'HDPE', '2010-05-15', 15, 8.9, 0.020, 65000.00, '2026-01-30', 'Maple Ridge - Birch Court', 8.00, 950.00, 0, 'low'),
('PUMP-CV-011', 'Pump Assembly', 'Stainless Steel', '1998-03-10', 28, 5.8, 0.180, 95000.00, '2025-12-12', 'Cedar Valley Pump Station', NULL, NULL, 0, 'medium'),
('PIPE-WC-012', 'Water Main', 'Cast Iron', '1961-01-20', 65, 3.0, 0.480, 310000.00, '2025-10-05', 'Westfield Commons - Broad Street', 14.00, 2800.00, 9, 'critical'),
('PIPE-EG-013', 'Distribution Line', 'Ductile Iron', '1992-06-18', 33, 7.2, 0.080, 125000.00, '2026-02-10', 'Eastgate Plaza - Commerce Drive', 8.00, 1600.00, 1, 'low'),
('METER-HT-014', 'Water Meter', 'Brass', '2005-09-25', 20, 6.8, 0.100, 2500.00, '2025-11-15', 'Hillcrest Terrace - Vista Lane', NULL, NULL, 0, 'low'),
('PIPE-LP-015', 'Transmission Main', 'Steel', '1975-04-12', 50, 4.5, 0.280, 480000.00, '2025-09-28', 'Lakeside Park - Lakeshore Drive', 20.00, 4500.00, 4, 'high'),
('PIPE-PJ-016', 'Water Main', 'Cast Iron', '1955-10-08', 70, 2.8, 0.550, 295000.00, '2025-08-15', 'Pinewood Junction - Mill Road', 12.00, 2200.00, 11, 'critical');

-- Anomaly Detection (15+ records)
INSERT INTO anomaly_detection (meter_id, customer_name, account_number, reading_date, consumption_gallons, avg_consumption, deviation_pct, anomaly_type, status) VALUES
('MTR-10042', 'Johnson Residence', 'ACC-10042', '2026-03-18', 28500.00, 8200.00, 247.56, 'Excessive Usage', 'detected'),
('MTR-10089', 'Sunrise Apartments', 'ACC-10089', '2026-03-17', 145000.00, 52000.00, 178.85, 'Excessive Usage', 'investigating'),
('MTR-10156', 'Green Valley Golf Club', 'ACC-10156', '2026-03-18', 5200.00, 85000.00, -93.88, 'Unusually Low Usage', 'detected'),
('MTR-10203', 'Martinez Family', 'ACC-10203', '2026-03-16', 18900.00, 7500.00, 152.00, 'Possible Leak', 'confirmed'),
('MTR-10278', 'Downtown Laundromat', 'ACC-10278', '2026-03-18', 95000.00, 42000.00, 126.19, 'Excessive Usage', 'investigating'),
('MTR-10315', 'Riverside Medical Center', 'ACC-10315', '2026-03-17', 320000.00, 285000.00, 12.28, 'Slight Increase', 'monitoring'),
('MTR-10401', 'Oak Street Bakery', 'ACC-10401', '2026-03-18', 0.00, 3200.00, -100.00, 'Zero Reading', 'detected'),
('MTR-10445', 'Chen Residence', 'ACC-10445', '2026-03-15', 22100.00, 6800.00, 225.00, 'Possible Leak', 'confirmed'),
('MTR-10502', 'Westfield High School', 'ACC-10502', '2026-03-18', 78000.00, 35000.00, 122.86, 'Seasonal Variation', 'monitoring'),
('MTR-10567', 'Harbor Fish Market', 'ACC-10567', '2026-03-17', 15600.00, 12000.00, 30.00, 'Moderate Increase', 'monitoring'),
('MTR-10623', 'Patel Residence', 'ACC-10623', '2026-03-18', 950.00, 7100.00, -86.62, 'Unusually Low Usage', 'detected'),
('MTR-10689', 'Lakeside Country Club', 'ACC-10689', '2026-03-16', 210000.00, 95000.00, 121.05, 'Excessive Usage', 'investigating'),
('MTR-10734', 'Summit Auto Wash', 'ACC-10734', '2026-03-18', 68000.00, 55000.00, 23.64, 'Slight Increase', 'monitoring'),
('MTR-10801', 'Williams Residence', 'ACC-10801', '2026-03-17', 35200.00, 7800.00, 351.28, 'Possible Main Break', 'confirmed'),
('MTR-10856', 'Greenfield Community Pool', 'ACC-10856', '2026-03-18', 125000.00, 48000.00, 160.42, 'Seasonal Variation', 'investigating'),
('MTR-10912', 'Pinewood Industrial Supply', 'ACC-10912', '2026-03-15', 450000.00, 180000.00, 150.00, 'Excessive Usage', 'detected');

-- Treatment Optimization (15+ records)
INSERT INTO treatment_optimization (plant_name, process_stage, chemical_type, current_dosage, recommended_dosage, influent_turbidity, effluent_turbidity, flow_rate_mgd, energy_kwh, cost_per_day, optimization_status) VALUES
('North Water Treatment Plant', 'Coagulation', 'Aluminum Sulfate', 45.200, 38.500, 12.500, 0.180, 28.500, 4200.00, 3850.00, 'optimized'),
('North Water Treatment Plant', 'Disinfection', 'Sodium Hypochlorite', 3.800, 3.200, 0.180, 0.120, 28.500, 850.00, 1200.00, 'pending'),
('North Water Treatment Plant', 'pH Adjustment', 'Sodium Hydroxide', 12.500, 11.800, NULL, NULL, 28.500, 320.00, 580.00, 'optimized'),
('South Water Treatment Plant', 'Coagulation', 'Ferric Chloride', 52.100, 44.800, 18.200, 0.220, 22.300, 3800.00, 4200.00, 'pending'),
('South Water Treatment Plant', 'Disinfection', 'Chlorine Gas', 2.900, 2.500, 0.220, 0.150, 22.300, 680.00, 950.00, 'optimized'),
('South Water Treatment Plant', 'Filtration', 'Polymer', 0.850, 0.720, 3.500, 0.220, 22.300, 2100.00, 780.00, 'pending'),
('Central Processing Facility', 'Coagulation', 'Polyaluminum Chloride', 38.600, 35.200, 9.800, 0.150, 35.200, 5100.00, 4600.00, 'optimized'),
('Central Processing Facility', 'Disinfection', 'UV Treatment', NULL, NULL, 0.150, 0.100, 35.200, 6200.00, 2800.00, 'optimized'),
('Central Processing Facility', 'Fluoridation', 'Fluorosilicic Acid', 0.950, 0.880, NULL, NULL, 35.200, 180.00, 420.00, 'pending'),
('East Side Treatment Plant', 'Coagulation', 'Aluminum Sulfate', 41.300, 36.900, 11.200, 0.190, 18.700, 2900.00, 2650.00, 'pending'),
('East Side Treatment Plant', 'Disinfection', 'Sodium Hypochlorite', 3.500, 3.100, 0.190, 0.130, 18.700, 620.00, 880.00, 'optimized'),
('East Side Treatment Plant', 'Sedimentation', NULL, NULL, NULL, 42.500, 3.500, 18.700, 1800.00, 450.00, 'monitoring'),
('West Ridge Treatment Plant', 'Coagulation', 'Ferric Sulfate', 48.700, 42.100, 15.600, 0.200, 25.100, 3600.00, 3200.00, 'pending'),
('West Ridge Treatment Plant', 'Disinfection', 'Chloramine', 4.200, 3.800, 0.200, 0.140, 25.100, 780.00, 1050.00, 'optimized'),
('West Ridge Treatment Plant', 'Activated Carbon', 'Granular Activated Carbon', 8.500, 7.200, 0.350, 0.080, 25.100, 1200.00, 2100.00, 'pending'),
('North Water Treatment Plant', 'Sedimentation', NULL, NULL, NULL, 38.200, 3.200, 28.500, 1500.00, 380.00, 'monitoring');

-- Customers (15+ records)
INSERT INTO customers (account_number, name, email, phone, address, service_type, meter_id, status, monthly_avg_gallons, balance, join_date) VALUES
('ACC-10001', 'Robert Anderson', 'r.anderson@email.com', '(555) 234-5678', '142 Oak Street, North District', 'residential', 'MTR-10001', 'active', 7200.00, 45.80, '2018-03-15'),
('ACC-10002', 'Sunrise Apartments LLC', 'mgmt@sunriseapts.com', '(555) 345-6789', '500 River Road, South District', 'commercial', 'MTR-10089', 'active', 52000.00, 1280.50, '2015-07-01'),
('ACC-10003', 'Maria Garcia', 'm.garcia@email.com', '(555) 456-7890', '78 Maple Lane, Riverside Heights', 'residential', 'MTR-10003', 'active', 6800.00, 0.00, '2020-01-10'),
('ACC-10004', 'Downtown Laundromat Inc', 'info@dtlaundromat.com', '(555) 567-8901', '215 Market Street, Downtown Core', 'commercial', 'MTR-10278', 'active', 42000.00, 890.25, '2012-09-22'),
('ACC-10005', 'James Wilson', 'j.wilson@email.com', '(555) 678-9012', '33 Pine Court, Oakwood Estates', 'residential', 'MTR-10005', 'active', 8100.00, 62.30, '2019-06-14'),
('ACC-10006', 'Green Valley Golf Club', 'ops@gvgolf.com', '(555) 789-0123', '1200 Fairway Drive, Cedar Valley', 'irrigation', 'MTR-10156', 'active', 85000.00, 3200.00, '2008-04-01'),
('ACC-10007', 'Sarah Chen', 's.chen@email.com', '(555) 890-1234', '56 Birch Avenue, Maple Ridge', 'residential', 'MTR-10445', 'active', 6800.00, 38.90, '2021-02-28'),
('ACC-10008', 'Riverside Medical Center', 'facilities@rivermed.org', '(555) 901-2345', '800 Hospital Drive, Riverside Heights', 'institutional', 'MTR-10315', 'active', 285000.00, 8450.00, '2005-11-15'),
('ACC-10009', 'David Martinez', 'd.martinez@email.com', '(555) 012-3456', '91 Elm Street, North District', 'residential', 'MTR-10203', 'active', 7500.00, 52.10, '2017-08-20'),
('ACC-10010', 'Westfield High School', 'admin@westfieldhs.edu', '(555) 123-4567', '400 School Road, Westfield Commons', 'institutional', 'MTR-10502', 'active', 35000.00, 1850.00, '2010-01-05'),
('ACC-10011', 'Harbor Fish Market', 'owner@harborfishmarket.com', '(555) 234-5679', '15 Dock Street, Harbor District', 'commercial', 'MTR-10567', 'active', 12000.00, 245.60, '2019-03-12'),
('ACC-10012', 'Arun Patel', 'a.patel@email.com', '(555) 345-6780', '204 Vista Lane, Hillcrest Terrace', 'residential', 'MTR-10623', 'active', 7100.00, 0.00, '2022-05-01'),
('ACC-10013', 'Lakeside Country Club', 'mgr@lakesidecc.com', '(555) 456-7891', '900 Lakeshore Drive, Lakeside Park', 'irrigation', 'MTR-10689', 'active', 95000.00, 4100.00, '2007-06-30'),
('ACC-10014', 'Summit Auto Wash', 'info@summitautowash.com', '(555) 567-8902', '310 Summit Blvd, Summit View', 'commercial', 'MTR-10734', 'active', 55000.00, 1620.80, '2016-10-18'),
('ACC-10015', 'Thomas Williams', 't.williams@email.com', '(555) 678-9013', '67 Cedar Lane, South District', 'residential', 'MTR-10801', 'active', 7800.00, 88.40, '2014-12-01'),
('ACC-10016', 'Pinewood Industrial Supply', 'ops@pinewoodindustrial.com', '(555) 789-0124', '1500 Mill Road, Pinewood Junction', 'industrial', 'MTR-10912', 'active', 180000.00, 6800.00, '2009-02-14');

-- Meter Readings (15+ records)
INSERT INTO meter_readings (meter_id, customer_name, reading_value, previous_reading, consumption, reading_date, read_by, status, notes) VALUES
('MTR-10001', 'Robert Anderson', 158420.00, 151220.00, 7200.00, '2026-03-15', 'Tech Mike Reynolds', 'verified', 'Normal reading'),
('MTR-10089', 'Sunrise Apartments LLC', 2845600.00, 2793600.00, 52000.00, '2026-03-15', 'Tech Mike Reynolds', 'verified', 'Multi-unit complex, consistent usage'),
('MTR-10003', 'Maria Garcia', 98450.00, 91650.00, 6800.00, '2026-03-15', 'Tech Sarah Lopez', 'verified', 'Normal reading'),
('MTR-10278', 'Downtown Laundromat Inc', 1562800.00, 1520800.00, 42000.00, '2026-03-15', 'Tech Sarah Lopez', 'verified', 'Commercial usage within range'),
('MTR-10005', 'James Wilson', 203100.00, 195000.00, 8100.00, '2026-03-15', 'Tech Mike Reynolds', 'verified', 'Slight increase, irrigation season starting'),
('MTR-10156', 'Green Valley Golf Club', 4250000.00, 4165000.00, 85000.00, '2026-03-15', 'Tech James Carter', 'verified', 'Spring irrigation beginning'),
('MTR-10445', 'Sarah Chen', 76800.00, 70000.00, 6800.00, '2026-03-15', 'Tech Sarah Lopez', 'verified', 'Normal reading'),
('MTR-10315', 'Riverside Medical Center', 12850000.00, 12565000.00, 285000.00, '2026-03-15', 'Tech James Carter', 'verified', 'Hospital usage nominal'),
('MTR-10203', 'David Martinez', 112500.00, 105000.00, 7500.00, '2026-03-15', 'Tech Mike Reynolds', 'verified', 'Normal reading'),
('MTR-10502', 'Westfield High School', 3150000.00, 3115000.00, 35000.00, '2026-03-15', 'Tech James Carter', 'verified', 'School in session'),
('MTR-10567', 'Harbor Fish Market', 425000.00, 413000.00, 12000.00, '2026-03-15', 'Tech Sarah Lopez', 'verified', 'Normal commercial usage'),
('MTR-10623', 'Arun Patel', 65100.00, 58000.00, 7100.00, '2026-03-15', 'Tech Mike Reynolds', 'verified', 'Normal reading'),
('MTR-10689', 'Lakeside Country Club', 5800000.00, 5705000.00, 95000.00, '2026-03-15', 'Tech James Carter', 'verified', 'Irrigation season ramping up'),
('MTR-10734', 'Summit Auto Wash', 2150000.00, 2095000.00, 55000.00, '2026-03-15', 'Tech Sarah Lopez', 'verified', 'Car wash usage normal'),
('MTR-10801', 'Thomas Williams', 145600.00, 137800.00, 7800.00, '2026-03-15', 'Tech Mike Reynolds', 'verified', 'Normal reading'),
('MTR-10912', 'Pinewood Industrial Supply', 8900000.00, 8720000.00, 180000.00, '2026-03-15', 'Tech James Carter', 'flagged', 'Higher than average - investigating');

-- Work Orders (15+ records)
INSERT INTO work_orders (work_order_number, title, description, category, priority, status, assigned_to, location, estimated_hours, actual_hours, due_date, completed_date, cost) VALUES
('WO-2026-001', 'Emergency Main Break Repair', 'Cast iron main break at Elm St and Oak Ave intersection causing road flooding', 'Emergency Repair', 'critical', 'in-progress', 'Crew Alpha - Mike Reynolds', '142 Elm Street, North District', 12.0, NULL, '2026-03-20', NULL, 15000.00),
('WO-2026-002', 'Hydrant Replacement - Cedar Lane', 'Replace aging fire hydrant #S-107 per annual inspection findings', 'Replacement', 'high', 'scheduled', 'Crew Beta - Carlos Mendez', 'Cedar Lane & 5th Ave, South District', 6.0, NULL, '2026-03-25', NULL, 8500.00),
('WO-2026-003', 'Meter Calibration Batch - Oakwood', 'Routine calibration of 25 residential meters in Oakwood Estates', 'Maintenance', 'medium', 'open', 'Tech Sarah Lopez', 'Oakwood Estates Zone', 16.0, NULL, '2026-03-28', NULL, 2500.00),
('WO-2026-004', 'Valve Exercising - Downtown', 'Annual valve exercising program for Downtown Core distribution system', 'Preventive Maintenance', 'medium', 'in-progress', 'Crew Alpha - Mike Reynolds', 'Downtown Core Zone', 24.0, 8.0, '2026-04-01', NULL, 3200.00),
('WO-2026-005', 'Water Quality Sampling - Monthly', 'Collect and process March 2026 regulatory compliance samples', 'Sampling', 'high', 'completed', 'Tech Lisa Park', 'System-wide', 8.0, 7.5, '2026-03-18', '2026-03-18', 1200.00),
('WO-2026-006', 'Pump Station #3 Motor Replacement', 'Replace failed 50HP pump motor at Riverside pump station', 'Repair', 'critical', 'in-progress', 'Crew Charlie - Dave Wilson', 'Riverside Heights Pump Station #3', 10.0, NULL, '2026-03-21', NULL, 28000.00),
('WO-2026-007', 'Service Line Replacement - Lead', 'Replace lead service line per EPA compliance order', 'Compliance', 'critical', 'scheduled', 'Crew Beta - Carlos Mendez', '88 Factory Lane, Industrial Park', 8.0, NULL, '2026-03-22', NULL, 12000.00),
('WO-2026-008', 'Tank Inspection - Oakwood', 'Annual internal inspection of 2MG elevated storage tank', 'Inspection', 'high', 'scheduled', 'Contractor - AquaInspect LLC', 'Oakwood Estates Elevated Tank', 16.0, NULL, '2026-04-05', NULL, 18000.00),
('WO-2026-009', 'Pipe Relining - Broad Street', 'CIPP relining of 14-inch cast iron main (2800 ft)', 'Rehabilitation', 'high', 'open', 'Contractor - PipeRenew Inc', 'Broad Street, Westfield Commons', 40.0, NULL, '2026-04-15', NULL, 125000.00),
('WO-2026-010', 'Backflow Preventer Testing', 'Annual testing of 45 commercial backflow prevention devices', 'Compliance', 'medium', 'in-progress', 'Tech James Carter', 'System-wide Commercial', 20.0, 12.0, '2026-03-30', NULL, 4500.00),
('WO-2026-011', 'SCADA System Update', 'Install firmware updates on all remote telemetry units', 'Technology', 'medium', 'open', 'IT - Kevin Zhang', 'All Pump Stations & Tanks', 12.0, NULL, '2026-04-10', NULL, 5800.00),
('WO-2026-012', 'Fire Flow Test - Maple Ridge', 'Conduct fire flow testing for new subdivision approval', 'Testing', 'low', 'scheduled', 'Crew Alpha - Mike Reynolds', 'Maple Ridge New Development', 4.0, NULL, '2026-03-27', NULL, 800.00),
('WO-2026-013', 'Leak Survey - Harbor District', 'Acoustic leak detection survey of Harbor District mains', 'Survey', 'medium', 'open', 'Tech - Leak Detection Team', 'Harbor District Zone', 16.0, NULL, '2026-04-08', NULL, 6200.00),
('WO-2026-014', 'Customer Meter Replacement', 'Replace malfunctioning meter MTR-10401 at Oak Street Bakery', 'Repair', 'high', 'scheduled', 'Tech Sarah Lopez', '25 Oak Street, Downtown Core', 2.0, NULL, '2026-03-21', NULL, 450.00),
('WO-2026-015', 'Chlorine Analyzer Maintenance', 'Calibrate and maintain online chlorine analyzers at all plants', 'Maintenance', 'medium', 'completed', 'Tech Lisa Park', 'All Treatment Plants', 8.0, 9.0, '2026-03-15', '2026-03-16', 3400.00),
('WO-2026-016', 'PRV Station Rebuild', 'Rebuild pressure reducing valve station serving Hillcrest zone', 'Repair', 'high', 'open', 'Crew Charlie - Dave Wilson', 'Hillcrest Terrace PRV Station', 6.0, NULL, '2026-03-26', NULL, 9500.00);

-- Pipe Inventory (15+ records)
INSERT INTO pipe_inventory (pipe_id, material, diameter_inches, length_feet, install_year, zone, street_name, condition_rating, pressure_class, last_inspection, notes) VALUES
('PIP-001', 'Cast Iron', 12.00, 2400.00, 1958, 'North District', 'Elm Street', 'poor', 'Class 150', '2025-11-10', 'Scheduled for replacement 2026 Q2'),
('PIP-002', 'Ductile Iron', 8.00, 1800.00, 1985, 'North District', 'Oak Avenue', 'good', 'Class 250', '2025-12-05', 'Minor tuberculation observed'),
('PIP-003', 'Pre-stressed Concrete', 24.00, 5200.00, 1972, 'South District', 'River Road', 'fair', 'Class 200', '2025-10-22', 'Wire wrap corrosion monitoring'),
('PIP-004', 'PVC', 6.00, 1200.00, 1995, 'Downtown Core', 'Market Street', 'excellent', 'Class 200', '2026-01-15', 'No issues noted'),
('PIP-005', 'Lead', 1.00, 150.00, 1952, 'Industrial Park', 'Factory Lane', 'critical', 'N/A', '2025-09-18', 'EPA mandate replacement - WO-2026-007'),
('PIP-006', 'Ductile Iron', 16.00, 3800.00, 1990, 'South District', 'Main Boulevard', 'good', 'Class 300', '2025-11-20', 'Cathodic protection active'),
('PIP-007', 'HDPE', 8.00, 950.00, 2010, 'Maple Ridge', 'Birch Court', 'excellent', 'DR 11', '2026-01-30', 'Fused joint system, no leaks'),
('PIP-008', 'Asbestos Cement', 10.00, 3100.00, 1965, 'Riverside Heights', 'Harbor Boulevard', 'poor', 'Class 150', '2025-07-20', 'Priority replacement candidate'),
('PIP-009', 'Cast Iron', 14.00, 2800.00, 1961, 'Westfield Commons', 'Broad Street', 'poor', 'Class 150', '2025-10-05', 'CIPP relining approved - WO-2026-009'),
('PIP-010', 'Ductile Iron', 8.00, 1600.00, 1992, 'Eastgate Plaza', 'Commerce Drive', 'good', 'Class 250', '2026-02-10', 'Joint restraint system intact'),
('PIP-011', 'PVC', 4.00, 800.00, 2005, 'Hillcrest Terrace', 'Vista Lane', 'good', 'Class 200', '2025-12-18', 'Service line connections OK'),
('PIP-012', 'Steel', 20.00, 4500.00, 1975, 'Lakeside Park', 'Lakeshore Drive', 'fair', 'Class 300', '2025-09-28', 'External coating deterioration noted'),
('PIP-013', 'Cast Iron', 12.00, 2200.00, 1955, 'Pinewood Junction', 'Mill Road', 'critical', 'Class 150', '2025-08-15', '11 breaks recorded, replace ASAP'),
('PIP-014', 'Ductile Iron', 6.00, 1400.00, 2000, 'Summit View', 'Summit Boulevard', 'good', 'Class 250', '2026-01-25', 'Good condition overall'),
('PIP-015', 'HDPE', 12.00, 2100.00, 2015, 'Greenfield Acres', 'Meadow Lane', 'excellent', 'DR 9', '2026-02-15', 'New installation, performing well'),
('PIP-016', 'Copper', 2.00, 350.00, 1988, 'Cedar Valley', 'Hospital Drive', 'fair', 'Type K', '2025-11-05', 'Minor pinhole leak repaired 2025');

-- Pump Stations (15+ records)
INSERT INTO pump_stations (station_name, station_id, location, capacity_gpm, current_flow_gpm, pressure_psi, power_kw, status, last_maintenance, pump_count, runtime_hours, efficiency_pct) VALUES
('North District Main Pump Station', 'PUMP-N01', '200 Industrial Way, North District', 5000.00, 3200.00, 82.50, 185.00, 'operational', '2026-02-15', 3, 42580.0, 88.50),
('South District Booster Station', 'PUMP-S01', '450 River Road, South District', 3500.00, 2100.00, 75.30, 120.00, 'operational', '2026-01-20', 2, 38920.0, 85.20),
('Downtown High-Pressure Station', 'PUMP-D01', '100 Market Street, Downtown Core', 4000.00, 3800.00, 95.00, 210.00, 'operational', '2025-12-10', 3, 51200.0, 91.30),
('Riverside Heights Pump Station #3', 'PUMP-R03', '800 Harbor Blvd, Riverside Heights', 2500.00, 0.00, 0.00, 0.00, 'offline', '2025-11-30', 2, 28400.0, 0.00),
('Oakwood Estates Booster', 'PUMP-O01', '600 Hilltop Drive, Oakwood Estates', 1500.00, 980.00, 68.40, 55.00, 'operational', '2026-03-01', 1, 22100.0, 82.70),
('Maple Ridge Lift Station', 'PUMP-M01', '150 Birch Court, Maple Ridge', 2000.00, 1450.00, 72.80, 85.00, 'operational', '2026-02-28', 2, 31500.0, 86.90),
('Cedar Valley Treatment Intake', 'PUMP-C01', '1000 Valley Road, Cedar Valley', 6000.00, 4200.00, 45.00, 250.00, 'operational', '2026-01-15', 4, 55800.0, 89.40),
('Westfield Commons Booster', 'PUMP-W01', '300 Broad Street, Westfield Commons', 2000.00, 1650.00, 78.90, 95.00, 'operational', '2026-02-20', 2, 35600.0, 84.60),
('Eastgate Pressure Zone Station', 'PUMP-E01', '500 Commerce Drive, Eastgate Plaza', 1800.00, 1200.00, 71.50, 70.00, 'operational', '2025-12-22', 2, 29800.0, 83.10),
('Hillcrest Terrace Booster', 'PUMP-H01', '250 Vista Lane, Hillcrest Terrace', 1200.00, 850.00, 65.20, 48.00, 'maintenance', '2026-03-15', 1, 19500.0, 79.80),
('Lakeside Park Intake Station', 'PUMP-L01', '50 Lakeshore Drive, Lakeside Park', 4500.00, 3100.00, 52.00, 175.00, 'operational', '2026-01-28', 3, 48200.0, 87.60),
('Pinewood Junction Booster', 'PUMP-P01', '700 Mill Road, Pinewood Junction', 2200.00, 1800.00, 74.60, 100.00, 'operational', '2026-02-08', 2, 33400.0, 85.80),
('Summit View High Zone', 'PUMP-SV01', '400 Summit Blvd, Summit View', 1600.00, 1100.00, 88.30, 75.00, 'operational', '2025-11-15', 2, 26700.0, 81.50),
('Harbor District Booster', 'PUMP-HD01', '25 Dock Street, Harbor District', 1800.00, 1350.00, 69.80, 78.00, 'operational', '2026-03-10', 2, 30100.0, 83.90),
('Greenfield Acres Station', 'PUMP-G01', '100 Meadow Lane, Greenfield Acres', 1000.00, 620.00, 62.50, 35.00, 'operational', '2026-02-25', 1, 15800.0, 80.20),
('Emergency Bypass Station', 'PUMP-EB01', '50 Emergency Access Rd, Central', 8000.00, 0.00, 0.00, 0.00, 'standby', '2026-03-05', 4, 1250.0, 92.00);

-- Reservoirs (15+ records)
INSERT INTO reservoirs (reservoir_name, reservoir_id, location, capacity_mg, current_level_mg, level_pct, inflow_gpm, outflow_gpm, water_temp_f, status, last_inspection) VALUES
('North District Elevated Tank', 'RES-N01', 'Hilltop Road, North District', 2.000, 1.650, 82.50, 450.00, 520.00, 48.50, 'normal', '2025-12-15'),
('South District Ground Storage', 'RES-S01', '500 River Road, South District', 5.000, 3.800, 76.00, 800.00, 750.00, 47.20, 'normal', '2025-11-20'),
('Downtown Underground Reservoir', 'RES-D01', 'City Center Park, Downtown Core', 3.500, 2.940, 84.00, 600.00, 580.00, 52.00, 'normal', '2026-01-10'),
('Riverside Heights Standpipe', 'RES-R01', '900 Harbor Blvd, Riverside Heights', 1.500, 0.450, 30.00, 200.00, 380.00, 49.80, 'low', '2025-10-25'),
('Oakwood Estates Elevated Tank', 'RES-O01', '650 Hilltop Drive, Oakwood Estates', 2.000, 1.820, 91.00, 350.00, 300.00, 48.00, 'normal', '2025-09-30'),
('Cedar Valley Raw Water Reservoir', 'RES-C01', '1200 Valley Road, Cedar Valley', 25.000, 21.250, 85.00, 2500.00, 2400.00, 45.50, 'normal', '2026-02-05'),
('Westfield Commons Ground Tank', 'RES-W01', '350 Broad Street, Westfield Commons', 3.000, 2.550, 85.00, 500.00, 480.00, 49.00, 'normal', '2025-12-20'),
('Eastgate Pressure Tank', 'RES-E01', '520 Commerce Drive, Eastgate Plaza', 1.000, 0.780, 78.00, 280.00, 300.00, 50.50, 'normal', '2026-01-18'),
('Hillcrest Terrace Elevated Tank', 'RES-H01', '280 Vista Lane, Hillcrest Terrace', 1.500, 1.200, 80.00, 250.00, 270.00, 48.80, 'normal', '2025-11-05'),
('Lakeside Raw Water Intake', 'RES-L01', '10 Lakeshore Drive, Lakeside Park', 50.000, 42.500, 85.00, 3500.00, 3200.00, 44.20, 'normal', '2026-02-28'),
('Pinewood Junction Tank', 'RES-P01', '750 Mill Road, Pinewood Junction', 2.500, 1.875, 75.00, 400.00, 420.00, 49.50, 'normal', '2025-10-15'),
('Summit View High Tank', 'RES-SV01', '450 Summit Blvd, Summit View', 1.000, 0.920, 92.00, 220.00, 200.00, 47.80, 'normal', '2026-01-25'),
('Harbor District Ground Storage', 'RES-HD01', '30 Dock Street, Harbor District', 4.000, 2.400, 60.00, 550.00, 650.00, 51.20, 'low', '2025-08-30'),
('Greenfield Acres Tank', 'RES-G01', '120 Meadow Lane, Greenfield Acres', 1.500, 1.350, 90.00, 200.00, 180.00, 48.30, 'normal', '2026-03-01'),
('Central Clear Well', 'RES-CW01', 'Water Treatment Plant, Central', 8.000, 6.800, 85.00, 1500.00, 1450.00, 54.00, 'normal', '2026-02-15'),
('Emergency Reserve Tank', 'RES-ER01', '60 Emergency Access Rd, Central', 10.000, 9.500, 95.00, 50.00, 20.00, 46.00, 'normal', '2026-03-10');
