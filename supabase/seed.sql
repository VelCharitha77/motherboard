-- Motherboard Seed Data for Supabase
-- Mirroring initial mock seed state

INSERT INTO programs (id, slug, name, name_es, track, duration_weeks, description, description_es, tuition_cost, childcare_cost, exam_cost, equipment_cost, next_start_date)
VALUES
  ('prog_foundational', 'foundational', 'Foundational Web Development', 'Desarrollo Web Fundamental', 'foundational', 9, 'Core 9-week course', 'Curso de 9 semanas', 1500, 750, 0, 650, '2027-02-03'),
  ('prog_data_20', 'data-20', 'Data Analytics 2.0', 'Análisis de Datos 2.0', '2.0_data', 12, 'Advanced SQL and Tableau capstone', 'SQL y Tableau avanzado', 3000, 750, 200, 650, '2027-02-10'),
  ('prog_cyber_20', 'cyber-20', 'Cybersecurity 2.0', 'Ciberseguridad 2.0', '2.0_cyber', 20, 'CompTIA Security+ preparation', 'Preparación para CompTIA Security+', 3000, 750, 350, 650, '2027-02-17')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, name, email, locale, city, avatar_initials, avatar_color, age_attested_at, code_of_conduct_accepted_at)
VALUES
  ('usr_maria', 'Maria Lopez', 'maria.lopez@example.com', 'es', 'Salt Lake City', 'ML', 'bg-emerald-600', NOW(), NOW()),
  ('usr_jenna', 'Jenna Park', 'jenna.park@example.com', 'en', 'Lehi', 'JP', 'bg-indigo-600', NOW(), NOW()),
  ('usr_aisha', 'Aisha Rahman', 'aisha.rahman@example.com', 'en', 'Sandy', 'AR', 'bg-violet-600', NOW(), NOW()),
  ('usr_rachel', 'Rachel Kim', 'rachel.kim@example.com', 'en', 'Salt Lake City', 'RK', 'bg-rose-600', NOW(), NOW()),
  ('usr_kris', 'Kris Lane', 'kris.lane@example.com', 'en', 'Lehi', 'KL', 'bg-amber-600', NOW(), NOW()),
  ('usr_morgan', 'Morgan Ellis', 'morgan.ellis@example.com', 'en', 'Salt Lake City', 'ME', 'bg-purple-600', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (id, user_id, role, scope_type, scope_id)
VALUES
  ('ur_maria_seed', 'usr_maria', 'student', 'cohort', 'coh_online_w27'),
  ('ur_jenna_seed', 'usr_jenna', 'applicant', 'program', 'prog_cyber_20'),
  ('ur_aisha_seed', 'usr_aisha', 'alumni', 'global', NULL),
  ('ur_rachel_seed', 'usr_rachel', 'staff', 'global', NULL),
  ('ur_kris_seed', 'usr_kris', 'instructor', 'cohort', 'coh_lehi_w27'),
  ('ur_morgan_seed', 'usr_morgan', 'admin', 'global', NULL)
ON CONFLICT (id) DO NOTHING;
