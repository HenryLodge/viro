-- ============================================================
-- VIRO Seed Data
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New Query)
--
-- Contents:
--   1. 65 hospitals across the entire US
--   2. 25 global regions for the globe visualization
--   3. Demo auth users + profiles (patient@viro.com & doctor@viro.com)
--   4. 12 synthetic patients with varying triage tiers
-- ============================================================

-- ============================================================
-- 1. HOSPITALS (65 across the US — Northeast, Southeast, Midwest, Southwest, West Coast, Other)
-- ============================================================
INSERT INTO public.hospitals (id, name, lat, lng, total_capacity, available_beds, specialties, wait_time_minutes, contact_phone, address)
VALUES
  -- ── NORTHEAST (18) ──

  -- Boston, MA
  ('a0000000-0000-0000-0000-000000000001', 'Massachusetts General Hospital', 42.3631, -71.0686, 1000, 142, '["emergency","infectious_disease","cardiology","neurology","trauma"]', 28, '(617) 726-2000', '55 Fruit St, Boston, MA 02114'),
  ('a0000000-0000-0000-0000-000000000002', 'Brigham and Women''s Hospital', 42.3355, -71.1077, 793, 89, '["emergency","infectious_disease","oncology","cardiology"]', 42, '(617) 732-5500', '75 Francis St, Boston, MA 02115'),
  ('a0000000-0000-0000-0000-000000000003', 'Beth Israel Deaconess Medical Center', 42.3384, -71.1064, 649, 210, '["emergency","gastroenterology","infectious_disease"]', 18, '(617) 667-7000', '330 Brookline Ave, Boston, MA 02215'),
  ('a0000000-0000-0000-0000-000000000004', 'Boston Medical Center', 42.3351, -71.0726, 514, 37, '["emergency","trauma","pediatrics","infectious_disease"]', 55, '(617) 638-8000', '1 Boston Medical Center Pl, Boston, MA 02118'),
  ('a0000000-0000-0000-0000-000000000005', 'Tufts Medical Center', 42.3492, -71.0636, 415, 98, '["emergency","cardiology","pulmonology"]', 32, '(617) 636-5000', '800 Washington St, Boston, MA 02111'),

  -- New York City, NY
  ('a0000000-0000-0000-0000-000000000006', 'NewYork-Presbyterian Hospital', 40.8404, -73.9418, 2600, 312, '["emergency","infectious_disease","cardiology","neurology","transplant","trauma"]', 35, '(212) 305-2500', '630 W 168th St, New York, NY 10032'),
  ('a0000000-0000-0000-0000-000000000007', 'Mount Sinai Hospital', 40.7900, -73.9526, 1171, 145, '["emergency","infectious_disease","geriatrics","oncology"]', 47, '(212) 241-6500', '1 Gustave L Levy Pl, New York, NY 10029'),
  ('a0000000-0000-0000-0000-000000000008', 'NYU Langone Health', 40.7421, -73.9739, 1069, 178, '["emergency","orthopedics","cardiology","neurology"]', 25, '(212) 263-7300', '550 First Ave, New York, NY 10016'),
  ('a0000000-0000-0000-0000-000000000009', 'Bellevue Hospital Center', 40.7392, -73.9759, 828, 22, '["emergency","trauma","psychiatry","infectious_disease"]', 68, '(212) 562-4141', '462 First Ave, New York, NY 10016'),

  -- Philadelphia, PA
  ('a0000000-0000-0000-0000-000000000010', 'Hospital of the University of Pennsylvania', 39.9498, -75.1937, 819, 124, '["emergency","infectious_disease","transplant","oncology"]', 30, '(215) 662-4000', '3400 Spruce St, Philadelphia, PA 19104'),
  ('a0000000-0000-0000-0000-000000000011', 'Thomas Jefferson University Hospital', 39.9485, -75.1578, 957, 201, '["emergency","cardiology","neurology","orthopedics"]', 22, '(215) 955-6000', '111 S 11th St, Philadelphia, PA 19107'),

  -- Hartford, CT
  ('a0000000-0000-0000-0000-000000000012', 'Hartford Hospital', 41.7544, -72.6879, 867, 156, '["emergency","cardiology","trauma","pulmonology"]', 20, '(860) 545-5000', '80 Seymour St, Hartford, CT 06102'),

  -- Providence, RI
  ('a0000000-0000-0000-0000-000000000013', 'Rhode Island Hospital', 41.8168, -71.4079, 719, 88, '["emergency","trauma","pediatrics","infectious_disease"]', 38, '(401) 444-4000', '593 Eddy St, Providence, RI 02903'),

  -- New Haven, CT
  ('a0000000-0000-0000-0000-000000000014', 'Yale-New Haven Hospital', 41.3033, -72.9356, 1541, 267, '["emergency","infectious_disease","oncology","transplant","neurology"]', 33, '(203) 688-4242', '20 York St, New Haven, CT 06510'),

  -- Baltimore, MD
  ('a0000000-0000-0000-0000-000000000015', 'Johns Hopkins Hospital', 39.2964, -76.5925, 1162, 195, '["emergency","infectious_disease","neurology","oncology","research"]', 40, '(410) 955-5000', '1800 Orleans St, Baltimore, MD 21287'),

  -- Pittsburgh, PA
  ('a0000000-0000-0000-0000-000000000016', 'UPMC Presbyterian', 40.4425, -79.9594, 757, 130, '["emergency","transplant","cardiology","trauma"]', 27, '(412) 647-2345', '200 Lothrop St, Pittsburgh, PA 15213'),

  -- Newark, NJ
  ('a0000000-0000-0000-0000-000000000017', 'University Hospital Newark', 40.7397, -74.1901, 519, 45, '["emergency","trauma","infectious_disease"]', 52, '(973) 972-4300', '150 Bergen St, Newark, NJ 07103'),

  -- Burlington, VT
  ('a0000000-0000-0000-0000-000000000018', 'UVM Medical Center', 44.4785, -73.1960, 562, 174, '["emergency","oncology","cardiology","orthopedics"]', 15, '(802) 847-0000', '111 Colchester Ave, Burlington, VT 05401'),

  -- ── SOUTHEAST (10) ──

  -- Atlanta, GA
  ('a0000000-0000-0000-0000-000000000019', 'Emory University Hospital', 33.7948, -84.3234, 733, 118, '["emergency","infectious_disease","cardiology","transplant","oncology"]', 34, '(404) 712-2000', '1364 Clifton Rd NE, Atlanta, GA 30322'),
  ('a0000000-0000-0000-0000-000000000020', 'Grady Memorial Hospital', 33.7562, -84.3947, 953, 64, '["emergency","trauma","infectious_disease","burn_center"]', 58, '(404) 616-1000', '80 Jesse Hill Jr Dr SE, Atlanta, GA 30303'),

  -- Miami, FL
  ('a0000000-0000-0000-0000-000000000021', 'Jackson Memorial Hospital', 25.7898, -80.2103, 1547, 203, '["emergency","trauma","infectious_disease","transplant","burn_center"]', 45, '(305) 585-1111', '1611 NW 12th Ave, Miami, FL 33136'),
  ('a0000000-0000-0000-0000-000000000022', 'Baptist Health South Florida', 25.6942, -80.3124, 680, 152, '["emergency","cardiology","orthopedics","oncology"]', 22, '(786) 596-1960', '8900 N Kendall Dr, Miami, FL 33176'),

  -- Charlotte, NC
  ('a0000000-0000-0000-0000-000000000023', 'Atrium Health Carolinas Medical Center', 35.2058, -80.8548, 1382, 187, '["emergency","trauma","cardiology","neurology","transplant"]', 31, '(704) 355-2000', '1000 Blythe Blvd, Charlotte, NC 28203'),

  -- Raleigh / Durham, NC
  ('a0000000-0000-0000-0000-000000000024', 'Duke University Hospital', 36.0083, -78.9392, 957, 165, '["emergency","oncology","cardiology","neurology","research"]', 37, '(919) 684-8111', '2301 Erwin Rd, Durham, NC 27710'),

  -- Tampa, FL
  ('a0000000-0000-0000-0000-000000000025', 'Tampa General Hospital', 27.9395, -82.4575, 1041, 134, '["emergency","trauma","transplant","cardiology"]', 29, '(813) 844-7000', '1 Tampa General Cir, Tampa, FL 33606'),

  -- Orlando, FL
  ('a0000000-0000-0000-0000-000000000026', 'Orlando Health Orlando Regional Medical Center', 28.5391, -81.3842, 808, 109, '["emergency","trauma","neurology","orthopedics"]', 33, '(321) 841-5111', '52 W Underwood St, Orlando, FL 32806'),

  -- Nashville, TN
  ('a0000000-0000-0000-0000-000000000027', 'Vanderbilt University Medical Center', 36.1415, -86.8032, 1091, 176, '["emergency","trauma","transplant","oncology","research"]', 26, '(615) 322-5000', '1211 Medical Center Dr, Nashville, TN 37232'),

  -- Richmond, VA
  ('a0000000-0000-0000-0000-000000000028', 'VCU Medical Center', 37.5407, -77.4317, 865, 112, '["emergency","trauma","transplant","infectious_disease"]', 38, '(804) 828-9000', '1250 E Marshall St, Richmond, VA 23298'),

  -- ── MIDWEST (10) ──

  -- Chicago, IL
  ('a0000000-0000-0000-0000-000000000029', 'Northwestern Memorial Hospital', 41.8953, -87.6212, 894, 143, '["emergency","cardiology","neurology","transplant","oncology"]', 30, '(312) 926-2000', '251 E Huron St, Chicago, IL 60611'),
  ('a0000000-0000-0000-0000-000000000030', 'Rush University Medical Center', 41.8745, -87.6699, 672, 105, '["emergency","orthopedics","neurology","infectious_disease"]', 24, '(312) 942-5000', '1653 W Congress Pkwy, Chicago, IL 60612'),
  ('a0000000-0000-0000-0000-000000000031', 'University of Chicago Medical Center', 41.7893, -87.6048, 811, 132, '["emergency","oncology","gastroenterology","transplant","research"]', 35, '(773) 702-1000', '5841 S Maryland Ave, Chicago, IL 60637'),

  -- Cleveland, OH
  ('a0000000-0000-0000-0000-000000000032', 'Cleveland Clinic', 41.5015, -81.6219, 1404, 224, '["emergency","cardiology","neurology","transplant","oncology","research"]', 28, '(216) 444-2200', '9500 Euclid Ave, Cleveland, OH 44195'),

  -- Detroit, MI
  ('a0000000-0000-0000-0000-000000000033', 'Henry Ford Hospital', 42.3583, -83.0800, 877, 96, '["emergency","cardiology","neurology","transplant","orthopedics"]', 42, '(313) 916-2600', '2799 W Grand Blvd, Detroit, MI 48202'),

  -- Minneapolis, MN
  ('a0000000-0000-0000-0000-000000000034', 'Mayo Clinic - Rochester', 44.0225, -92.4667, 2059, 340, '["emergency","oncology","cardiology","neurology","transplant","research"]', 19, '(507) 284-2511', '200 First St SW, Rochester, MN 55905'),

  -- St. Louis, MO
  ('a0000000-0000-0000-0000-000000000035', 'Barnes-Jewish Hospital', 38.6351, -90.2624, 1278, 198, '["emergency","oncology","transplant","cardiology","neurology"]', 32, '(314) 747-3000', '1 Barnes-Jewish Hospital Plaza, St. Louis, MO 63110'),

  -- Columbus, OH
  ('a0000000-0000-0000-0000-000000000036', 'Ohio State University Wexner Medical Center', 39.9943, -83.0164, 1330, 215, '["emergency","trauma","oncology","cardiology","research"]', 27, '(614) 293-8000', '410 W 10th Ave, Columbus, OH 43210'),

  -- Indianapolis, IN
  ('a0000000-0000-0000-0000-000000000037', 'Indiana University Health Methodist Hospital', 39.7846, -86.1747, 1039, 148, '["emergency","trauma","cardiology","transplant","neurology"]', 34, '(317) 962-2000', '1701 N Senate Blvd, Indianapolis, IN 46202'),

  -- Milwaukee, WI
  ('a0000000-0000-0000-0000-000000000038', 'Froedtert Hospital', 43.0429, -88.0230, 604, 89, '["emergency","trauma","oncology","neurology","transplant"]', 23, '(414) 805-3000', '9200 W Wisconsin Ave, Milwaukee, WI 53226'),

  -- ── SOUTHWEST (10) ──

  -- Houston, TX
  ('a0000000-0000-0000-0000-000000000039', 'MD Anderson Cancer Center', 29.7071, -95.3965, 654, 87, '["oncology","research","infectious_disease","transplant"]', 20, '(713) 792-2121', '1515 Holcombe Blvd, Houston, TX 77030'),
  ('a0000000-0000-0000-0000-000000000040', 'Houston Methodist Hospital', 29.7100, -95.3990, 907, 139, '["emergency","cardiology","neurology","transplant","orthopedics"]', 26, '(713) 790-3311', '6565 Fannin St, Houston, TX 77030'),
  ('a0000000-0000-0000-0000-000000000041', 'Memorial Hermann - Texas Medical Center', 29.7083, -95.4006, 1109, 164, '["emergency","trauma","neurology","cardiology","transplant"]', 33, '(713) 704-4000', '6411 Fannin St, Houston, TX 77030'),

  -- Dallas, TX
  ('a0000000-0000-0000-0000-000000000042', 'UT Southwestern Medical Center', 32.8122, -96.8394, 898, 152, '["emergency","oncology","neurology","transplant","research"]', 25, '(214) 645-8300', '5323 Harry Hines Blvd, Dallas, TX 75390'),
  ('a0000000-0000-0000-0000-000000000043', 'Parkland Memorial Hospital', 32.8117, -96.8388, 862, 68, '["emergency","trauma","infectious_disease","burn_center"]', 55, '(214) 590-8000', '5200 Harry Hines Blvd, Dallas, TX 75235'),

  -- Phoenix, AZ
  ('a0000000-0000-0000-0000-000000000044', 'Mayo Clinic - Phoenix', 33.6582, -111.9604, 310, 58, '["emergency","cardiology","oncology","neurology","research"]', 18, '(480) 515-6296', '5777 E Mayo Blvd, Phoenix, AZ 85054'),
  ('a0000000-0000-0000-0000-000000000045', 'Banner University Medical Center Phoenix', 33.4838, -112.0737, 709, 103, '["emergency","trauma","cardiology","neurology","transplant"]', 39, '(602) 839-2000', '1111 E McDowell Rd, Phoenix, AZ 85006'),

  -- Denver, CO
  ('a0000000-0000-0000-0000-000000000046', 'UCHealth University of Colorado Hospital', 39.7454, -104.8387, 669, 112, '["emergency","trauma","transplant","oncology","cardiology"]', 31, '(720) 848-0000', '12605 E 16th Ave, Aurora, CO 80045'),

  -- San Antonio, TX
  ('a0000000-0000-0000-0000-000000000047', 'University Health System', 29.4281, -98.4958, 716, 94, '["emergency","trauma","infectious_disease","burn_center"]', 43, '(210) 358-4000', '4502 Medical Dr, San Antonio, TX 78229'),

  -- Albuquerque, NM
  ('a0000000-0000-0000-0000-000000000048', 'University of New Mexico Hospital', 35.0854, -106.6188, 537, 78, '["emergency","trauma","pediatrics","infectious_disease"]', 36, '(505) 272-2111', '2211 Lomas Blvd NE, Albuquerque, NM 87106'),

  -- ── WEST COAST (12) ──

  -- Los Angeles, CA
  ('a0000000-0000-0000-0000-000000000049', 'Cedars-Sinai Medical Center', 34.0759, -118.3802, 886, 138, '["emergency","cardiology","neurology","oncology","transplant"]', 29, '(310) 423-3277', '8700 Beverly Blvd, Los Angeles, CA 90048'),
  ('a0000000-0000-0000-0000-000000000050', 'UCLA Ronald Reagan Medical Center', 34.0660, -118.4464, 520, 86, '["emergency","neurology","oncology","transplant","research"]', 35, '(310) 825-9111', '757 Westwood Plaza, Los Angeles, CA 90095'),
  ('a0000000-0000-0000-0000-000000000051', 'Keck Hospital of USC', 34.0611, -118.2025, 401, 63, '["emergency","transplant","oncology","cardiology","neurology"]', 27, '(323) 442-8500', '1500 San Pablo St, Los Angeles, CA 90033'),

  -- San Francisco, CA
  ('a0000000-0000-0000-0000-000000000052', 'UCSF Medical Center', 37.7631, -122.4576, 722, 119, '["emergency","oncology","neurology","transplant","research"]', 24, '(415) 476-1000', '505 Parnassus Ave, San Francisco, CA 94143'),
  ('a0000000-0000-0000-0000-000000000053', 'Zuckerberg San Francisco General Hospital', 37.7554, -122.4037, 598, 47, '["emergency","trauma","infectious_disease","psychiatry"]', 62, '(628) 206-8000', '1001 Potrero Ave, San Francisco, CA 94110'),

  -- Seattle, WA
  ('a0000000-0000-0000-0000-000000000054', 'UW Medical Center - Montlake', 47.6500, -122.3078, 529, 88, '["emergency","oncology","neurology","transplant","research"]', 30, '(206) 598-3300', '1959 NE Pacific St, Seattle, WA 98195'),
  ('a0000000-0000-0000-0000-000000000055', 'Virginia Mason Medical Center', 47.6106, -122.3291, 336, 54, '["emergency","cardiology","orthopedics","gastroenterology"]', 21, '(206) 223-6600', '1100 Ninth Ave, Seattle, WA 98101'),

  -- Portland, OR
  ('a0000000-0000-0000-0000-000000000056', 'OHSU Hospital', 45.4990, -122.6852, 576, 95, '["emergency","oncology","neurology","cardiology","research"]', 28, '(503) 494-8311', '3181 SW Sam Jackson Park Rd, Portland, OR 97239'),

  -- San Diego, CA
  ('a0000000-0000-0000-0000-000000000057', 'Scripps Memorial Hospital La Jolla', 32.8851, -117.2328, 457, 72, '["emergency","cardiology","orthopedics","oncology"]', 22, '(858) 626-4123', '9888 Genesee Ave, La Jolla, CA 92037'),
  ('a0000000-0000-0000-0000-000000000058', 'UC San Diego Health - Hillcrest', 32.7546, -117.1671, 389, 61, '["emergency","trauma","infectious_disease","neurology"]', 34, '(619) 543-6222', '200 W Arbor Dr, San Diego, CA 92103'),

  -- Sacramento, CA
  ('a0000000-0000-0000-0000-000000000059', 'UC Davis Medical Center', 38.5535, -121.4549, 646, 108, '["emergency","trauma","oncology","transplant","pediatrics"]', 31, '(916) 734-2011', '2315 Stockton Blvd, Sacramento, CA 95817'),

  -- Las Vegas, NV
  ('a0000000-0000-0000-0000-000000000060', 'University Medical Center of Southern Nevada', 36.1487, -115.1614, 541, 55, '["emergency","trauma","burn_center","infectious_disease"]', 48, '(702) 383-2000', '1800 W Charleston Blvd, Las Vegas, NV 89102'),

  -- ── OTHER REGIONS (5) ──

  -- Honolulu, HI
  ('a0000000-0000-0000-0000-000000000061', 'The Queen''s Medical Center', 21.3075, -157.8580, 575, 91, '["emergency","trauma","cardiology","oncology"]', 26, '(808) 691-5100', '1301 Punchbowl St, Honolulu, HI 96813'),

  -- Anchorage, AK
  ('a0000000-0000-0000-0000-000000000062', 'Providence Alaska Medical Center', 61.1885, -149.8198, 401, 68, '["emergency","trauma","cardiology","orthopedics"]', 29, '(907) 562-2211', '3200 Providence Dr, Anchorage, AK 99508'),

  -- Salt Lake City, UT
  ('a0000000-0000-0000-0000-000000000063', 'University of Utah Hospital', 40.7713, -111.8383, 527, 84, '["emergency","trauma","oncology","neurology","transplant"]', 25, '(801) 581-2121', '50 N Medical Dr, Salt Lake City, UT 84132'),

  -- New Orleans, LA
  ('a0000000-0000-0000-0000-000000000064', 'Ochsner Medical Center', 29.9619, -90.1148, 842, 137, '["emergency","cardiology","transplant","oncology","neurology"]', 30, '(504) 842-3000', '1514 Jefferson Hwy, Jefferson, LA 70121'),

  -- Washington, D.C.
  ('a0000000-0000-0000-0000-000000000065', 'MedStar Georgetown University Hospital', 38.9120, -77.0750, 609, 92, '["emergency","cardiology","neurology","transplant","oncology"]', 32, '(202) 444-2000', '3800 Reservoir Rd NW, Washington, DC 20007')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 2. REGIONS (25 global cities for the globe visualization)
-- At least 3 with anomaly_flag = true
-- ============================================================
INSERT INTO public.regions (id, name, lat, lng, case_count, severity, anomaly_flag, top_symptoms, updated_at)
VALUES
  -- North America (anomaly hotspot: Boston)
  ('b0000000-0000-0000-0000-000000000001', 'Boston, USA', 42.3601, -71.0589, 4870, 'critical', true,
   '["fever","cough","shortness_of_breath","fatigue","body_aches"]',
   now() - interval '2 hours'),

  ('b0000000-0000-0000-0000-000000000002', 'New York City, USA', 40.7128, -74.0060, 3920, 'high', false,
   '["fever","cough","sore_throat","fatigue"]',
   now() - interval '1 hour'),

  ('b0000000-0000-0000-0000-000000000003', 'Philadelphia, USA', 39.9526, -75.1652, 1640, 'moderate', false,
   '["fever","headache","cough"]',
   now() - interval '3 hours'),

  ('b0000000-0000-0000-0000-000000000004', 'Washington D.C., USA', 38.9072, -77.0369, 1180, 'moderate', false,
   '["cough","fatigue","sore_throat"]',
   now() - interval '4 hours'),

  ('b0000000-0000-0000-0000-000000000005', 'Chicago, USA', 41.8781, -87.6298, 2340, 'high', false,
   '["fever","cough","body_aches","fatigue"]',
   now() - interval '2 hours'),

  ('b0000000-0000-0000-0000-000000000006', 'Los Angeles, USA', 34.0522, -118.2437, 1890, 'moderate', false,
   '["cough","fatigue","headache"]',
   now() - interval '5 hours'),

  ('b0000000-0000-0000-0000-000000000007', 'Toronto, Canada', 43.6532, -79.3832, 1250, 'moderate', false,
   '["fever","cough","sore_throat"]',
   now() - interval '3 hours'),

  ('b0000000-0000-0000-0000-000000000008', 'Mexico City, Mexico', 19.4326, -99.1332, 2080, 'high', false,
   '["fever","cough","diarrhea","body_aches"]',
   now() - interval '6 hours'),

  -- South America (anomaly hotspot: São Paulo)
  ('b0000000-0000-0000-0000-000000000009', 'São Paulo, Brazil', -23.5505, -46.6333, 5120, 'critical', true,
   '["fever","cough","shortness_of_breath","chest_pain","fatigue"]',
   now() - interval '1 hour'),

  ('b0000000-0000-0000-0000-000000000010', 'Buenos Aires, Argentina', -34.6037, -58.3816, 890, 'low', false,
   '["cough","headache","fatigue"]',
   now() - interval '8 hours'),

  ('b0000000-0000-0000-0000-000000000011', 'Lima, Peru', -12.0464, -77.0428, 1470, 'moderate', false,
   '["fever","cough","body_aches"]',
   now() - interval '4 hours'),

  -- Europe
  ('b0000000-0000-0000-0000-000000000012', 'London, UK', 51.5074, -0.1278, 3210, 'high', false,
   '["fever","cough","fatigue","sore_throat"]',
   now() - interval '2 hours'),

  ('b0000000-0000-0000-0000-000000000013', 'Paris, France', 48.8566, 2.3522, 1860, 'moderate', false,
   '["cough","headache","fever","fatigue"]',
   now() - interval '5 hours'),

  ('b0000000-0000-0000-0000-000000000014', 'Berlin, Germany', 52.5200, 13.4050, 1340, 'moderate', false,
   '["fever","cough","sore_throat"]',
   now() - interval '6 hours'),

  ('b0000000-0000-0000-0000-000000000015', 'Rome, Italy', 41.9028, 12.4964, 980, 'low', false,
   '["cough","fatigue","headache"]',
   now() - interval '7 hours'),

  ('b0000000-0000-0000-0000-000000000016', 'Moscow, Russia', 55.7558, 37.6173, 1720, 'moderate', false,
   '["fever","cough","body_aches","fatigue"]',
   now() - interval '3 hours'),

  -- Africa (anomaly hotspot: Lagos)
  ('b0000000-0000-0000-0000-000000000017', 'Lagos, Nigeria', 6.5244, 3.3792, 4380, 'critical', true,
   '["fever","cough","shortness_of_breath","diarrhea","body_aches"]',
   now() - interval '30 minutes'),

  ('b0000000-0000-0000-0000-000000000018', 'Nairobi, Kenya', -1.2921, 36.8219, 760, 'low', false,
   '["cough","headache","fatigue"]',
   now() - interval '9 hours'),

  ('b0000000-0000-0000-0000-000000000019', 'Cairo, Egypt', 30.0444, 31.2357, 1540, 'moderate', false,
   '["fever","cough","sore_throat","fatigue"]',
   now() - interval '5 hours'),

  -- Asia (anomaly hotspot: Mumbai)
  ('b0000000-0000-0000-0000-000000000020', 'Mumbai, India', 19.0760, 72.8777, 5640, 'critical', true,
   '["fever","cough","shortness_of_breath","chest_pain","body_aches","fatigue"]',
   now() - interval '45 minutes'),

  ('b0000000-0000-0000-0000-000000000021', 'Delhi, India', 28.7041, 77.1025, 2890, 'high', false,
   '["fever","cough","body_aches","headache"]',
   now() - interval '2 hours'),

  ('b0000000-0000-0000-0000-000000000022', 'Tokyo, Japan', 35.6762, 139.6503, 1120, 'moderate', false,
   '["cough","sore_throat","fatigue"]',
   now() - interval '4 hours'),

  ('b0000000-0000-0000-0000-000000000023', 'Beijing, China', 39.9042, 116.4074, 2450, 'high', false,
   '["fever","cough","shortness_of_breath","fatigue"]',
   now() - interval '3 hours'),

  -- Oceania
  ('b0000000-0000-0000-0000-000000000024', 'Sydney, Australia', -33.8688, 151.2093, 680, 'low', false,
   '["cough","fatigue","headache"]',
   now() - interval '10 hours'),

  -- Southeast Asia
  ('b0000000-0000-0000-0000-000000000025', 'Jakarta, Indonesia', -6.2088, 106.8456, 1950, 'high', false,
   '["fever","cough","diarrhea","body_aches"]',
   now() - interval '2 hours')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 3. DEMO AUTH USERS & PROFILES
-- ============================================================
-- These use Supabase's admin API to create demo accounts.
-- Run this section ONLY if the demo users don't already exist.
--
-- patient@viro.com (password: viro2026)
-- doctor@viro.com  (password: viro2026)
-- ============================================================

-- Create demo patient user in auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'patient@viro.com',
  crypt('viro2026', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Alex Patient"}',
  now(),
  now(),
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Create demo provider user in auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
VALUES (
  'c0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'doctor@viro.com',
  crypt('viro2026', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Dr. Sarah Chen"}',
  now(),
  now(),
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Create identities for the demo users (required by Supabase Auth)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', 'c0000000-0000-0000-0000-000000000001', 'email', 'patient@viro.com'),
  'email',
  'c0000000-0000-0000-0000-000000000001',
  now(),
  now(),
  now()
),
(
  'c0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000002',
  jsonb_build_object('sub', 'c0000000-0000-0000-0000-000000000002', 'email', 'doctor@viro.com'),
  'email',
  'c0000000-0000-0000-0000-000000000002',
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;

-- Create profiles for the demo users
INSERT INTO public.profiles (id, role, full_name, email)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'patient', 'Alex Patient', 'patient@viro.com'),
  ('c0000000-0000-0000-0000-000000000002', 'provider', 'Dr. Sarah Chen', 'doctor@viro.com')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 4. SYNTHETIC PATIENTS (12 with varying triage tiers)
-- All assigned to the demo patient user for simplicity.
-- In production each patient would have their own auth user.
-- ============================================================
INSERT INTO public.patients (
  id, user_id, full_name, age, symptoms, severity_flags, risk_factors,
  travel_history, exposure_history, triage_tier, triage_reasoning,
  risk_flags, assigned_hospital_id, status, created_at, updated_at
)
VALUES
  -- CRITICAL patients (3)
  (
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Margaret Thompson', 78,
    '["high_fever","severe_cough","shortness_of_breath","chest_tightness"]',
    '["difficulty_breathing","chest_pain","high_fever"]',
    '["age_over_65","heart_disease","diabetes"]',
    'Returned from São Paulo, Brazil 5 days ago',
    'Was in close contact with a confirmed case at a hospital in São Paulo',
    'critical',
    'Patient is a 78-year-old female presenting with high fever, severe cough, shortness of breath, and chest tightness. Multiple critical risk factors including advanced age (78), heart disease, and diabetes. Recent travel to São Paulo — an active outbreak zone — combined with confirmed exposure makes this a critical priority. Immediate emergency evaluation required.',
    '["high_fever","difficulty_breathing","chest_pain","elderly","heart_disease","diabetes","travel_exposure","confirmed_contact"]',
    'a0000000-0000-0000-0000-000000000001',
    'triaged',
    now() - interval '45 minutes',
    now() - interval '40 minutes'
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'James Rivera', 52,
    '["high_fever","cough","confusion","shortness_of_breath"]',
    '["difficulty_breathing","confusion","high_fever"]',
    '["immunocompromised"]',
    'None',
    'Spouse tested positive 3 days ago',
    'critical',
    'Patient is a 52-year-old immunocompromised male presenting with high fever, cough, confusion, and shortness of breath. Confusion in the context of respiratory illness and fever is a red flag for severe systemic involvement. Immunocompromised status significantly elevates risk. Confirmed household exposure. Requires immediate emergency evaluation.',
    '["high_fever","difficulty_breathing","confusion","immunocompromised","confirmed_contact"]',
    'a0000000-0000-0000-0000-000000000006',
    'triaged',
    now() - interval '30 minutes',
    now() - interval '25 minutes'
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    'Priya Sharma', 35,
    '["high_fever","severe_cough","shortness_of_breath","inability_to_keep_fluids"]',
    '["difficulty_breathing","high_fever","inability_to_keep_fluids"]',
    '["pregnancy"]',
    'Traveled to Mumbai, India 8 days ago',
    'Attended a large gathering where multiple attendees later tested positive',
    'critical',
    'Patient is a 35-year-old pregnant female with high fever, severe cough, shortness of breath, and inability to keep fluids down. Pregnancy combined with respiratory distress and dehydration risk makes this a critical case. Travel to Mumbai (active outbreak zone) with known mass exposure event. Immediate evaluation with obstetric and infectious disease capability required.',
    '["high_fever","difficulty_breathing","dehydration_risk","pregnancy","travel_exposure","confirmed_contact"]',
    'a0000000-0000-0000-0000-000000000002',
    'triaged',
    now() - interval '1 hour',
    now() - interval '55 minutes'
  ),

  -- URGENT patients (4)
  (
    'd0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000001',
    'Robert Chen', 68,
    '["fever","persistent_cough","fatigue","body_aches"]',
    '["high_fever"]',
    '["age_over_65","diabetes"]',
    'Returned from London, UK 10 days ago',
    'No known direct contact',
    'urgent',
    'Patient is a 68-year-old male with fever, persistent cough, fatigue, and body aches. Age over 65 combined with diabetes creates a high-risk profile. Recent travel to London where case counts are elevated. While no confirmed direct contact, the symptom profile and risk factors warrant same-day in-person evaluation.',
    '["high_fever","elderly","diabetes","travel_exposure"]',
    'a0000000-0000-0000-0000-000000000010',
    'triaged',
    now() - interval '2 hours',
    now() - interval '1 hour 50 minutes'
  ),
  (
    'd0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000001',
    'Lisa Washington', 45,
    '["fever","cough","sore_throat","headache","fatigue"]',
    '["high_fever"]',
    '["immunocompromised"]',
    'None',
    'Works in a clinic where 3 colleagues tested positive last week',
    'urgent',
    'Patient is a 45-year-old immunocompromised female with fever, cough, sore throat, headache, and fatigue. Immunocompromised status elevates what might otherwise be a routine case. Occupational exposure with multiple confirmed cases at her workplace adds significant risk. Same-day evaluation recommended.',
    '["high_fever","immunocompromised","occupational_exposure"]',
    'a0000000-0000-0000-0000-000000000003',
    'triaged',
    now() - interval '3 hours',
    now() - interval '2 hours 50 minutes'
  ),
  (
    'd0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000001',
    'Michael Okafor', 58,
    '["fever","cough","shortness_of_breath_on_exertion","fatigue"]',
    '[]',
    '["heart_disease"]',
    'Traveled to Lagos, Nigeria 6 days ago',
    'No known direct contact but visited crowded markets',
    'urgent',
    'Patient is a 58-year-old male with fever, cough, shortness of breath on exertion, and fatigue. Pre-existing heart disease increases risk of complications from respiratory illness. Recent travel to Lagos — a current anomaly hotspot — through crowded environments. Same-day evaluation at facility with cardiac capability recommended.',
    '["fever","shortness_of_breath","heart_disease","travel_exposure"]',
    'a0000000-0000-0000-0000-000000000007',
    'triaged',
    now() - interval '4 hours',
    now() - interval '3 hours 50 minutes'
  ),
  (
    'd0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000001',
    'Emily Nakamura', 29,
    '["fever","cough","chest_tightness","body_aches"]',
    '["chest_pain"]',
    '[]',
    'None',
    'Roommate tested positive 4 days ago',
    'urgent',
    'Patient is a 29-year-old female with fever, cough, chest tightness, and body aches. While young and without pre-existing conditions, chest tightness is a concerning symptom that warrants in-person evaluation. Confirmed household exposure. Same-day evaluation recommended to rule out cardiac or pulmonary complications.',
    '["chest_pain","confirmed_contact"]',
    'a0000000-0000-0000-0000-000000000008',
    'triaged',
    now() - interval '5 hours',
    now() - interval '4 hours 50 minutes'
  ),

  -- ROUTINE patients (3)
  (
    'd0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000001',
    'David Martinez', 41,
    '["mild_fever","cough","sore_throat","runny_nose"]',
    '[]',
    '[]',
    'None',
    'Co-worker was diagnosed last week',
    'routine',
    'Patient is a 41-year-old male with mild fever, cough, sore throat, and runny nose. No severity flags or significant risk factors. Workplace exposure noted but symptoms are currently mild. Recommend scheduling an appointment within 24-48 hours for testing and evaluation. Monitor for worsening symptoms.',
    '["workplace_exposure"]',
    'a0000000-0000-0000-0000-000000000011',
    'triaged',
    now() - interval '6 hours',
    now() - interval '5 hours 50 minutes'
  ),
  (
    'd0000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000001',
    'Sarah Kim', 33,
    '["cough","mild_headache","fatigue","body_aches"]',
    '[]',
    '[]',
    'Returned from Tokyo, Japan 12 days ago',
    'No known contact',
    'routine',
    'Patient is a 33-year-old female with cough, mild headache, fatigue, and body aches. No severity flags or risk factors. Travel history to Tokyo is noted but was 12 days ago and case counts there are moderate. Symptoms are consistent with a mild respiratory illness. Recommend scheduling a clinic visit within 24-48 hours.',
    '["travel_history"]',
    'a0000000-0000-0000-0000-000000000014',
    'triaged',
    now() - interval '8 hours',
    now() - interval '7 hours 50 minutes'
  ),
  (
    'd0000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000001',
    'Thomas Williams', 55,
    '["cough","low_grade_fever","fatigue"]',
    '[]',
    '[]',
    'None',
    'Attended a conference where one attendee later tested positive',
    'routine',
    'Patient is a 55-year-old male with cough, low-grade fever, and fatigue. No severity flags or high-risk conditions. Potential exposure at a conference is noted. Symptoms are mild and manageable. Recommend scheduling an appointment within 24-48 hours for testing.',
    '["potential_exposure"]',
    'a0000000-0000-0000-0000-000000000015',
    'triaged',
    now() - interval '10 hours',
    now() - interval '9 hours 50 minutes'
  ),

  -- SELF-CARE patients (2)
  (
    'd0000000-0000-0000-0000-000000000011',
    'c0000000-0000-0000-0000-000000000001',
    'Jessica Lee', 26,
    '["mild_cough","runny_nose","sneezing"]',
    '[]',
    '[]',
    'None',
    'No known exposure',
    'self-care',
    'Patient is a 26-year-old female with mild cough, runny nose, and sneezing. No fever, no severity flags, no risk factors, and no known exposure. Symptoms are consistent with a common cold or mild upper respiratory infection. Home monitoring with self-care measures is appropriate. Seek medical attention if symptoms worsen or fever develops.',
    '[]',
    NULL,
    'triaged',
    now() - interval '12 hours',
    now() - interval '11 hours 50 minutes'
  ),
  (
    'd0000000-0000-0000-0000-000000000012',
    'c0000000-0000-0000-0000-000000000001',
    'Kevin Patel', 31,
    '["sore_throat","mild_headache"]',
    '[]',
    '[]',
    'None',
    'No known exposure',
    'self-care',
    'Patient is a 31-year-old male with sore throat and mild headache only. No fever, no cough, no severity flags, no risk factors, and no known exposure. Symptoms are very mild and not suggestive of a serious respiratory illness. Home monitoring with rest, hydration, and over-the-counter remedies is appropriate. Seek care if fever, cough, or breathing difficulty develops.',
    '[]',
    NULL,
    'triaged',
    now() - interval '14 hours',
    now() - interval '13 hours 50 minutes'
  )
ON CONFLICT (id) DO NOTHING;
