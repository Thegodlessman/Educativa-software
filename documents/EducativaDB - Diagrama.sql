CREATE TABLE "countries" (
  "id_country" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "country_name" varchar NOT NULL
);

CREATE TABLE "institutions" (
  "id_insti" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "id_location" uuid NOT NULL,
  "insti_url" varchar NOT NULL,
  "insti_name" varchar NOT NULL,
  "insti_descrip" varchar NOT NULL
);

CREATE TABLE "material_types" (
  "id_material_type" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "type_name" varchar(100) UNIQUE NOT NULL,
  "type_description" text,
  "icon_identifier" varchar(50),
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "municipalities" (
  "id_municipality" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "municipality_name" varchar NOT NULL,
  "id_state" uuid NOT NULL
);

CREATE TABLE "parishes" (
  "id_parish" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "parish_name" varchar NOT NULL,
  "id_municipality" uuid NOT NULL
);

CREATE TABLE "risk_level_support_materials" (
  "id_risk_level_material" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "id_risk_level" uuid NOT NULL,
  "id_material" uuid NOT NULL,
  "relevance_order" integer DEFAULT 0
);

CREATE TABLE "risk_levels" (
  "id_risk_level" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "risk_name" varchar(100) UNIQUE NOT NULL,
  "description" text
);

CREATE TABLE "roles" (
  "id_rol" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "rol_name" varchar NOT NULL,
  "rol_descrip" varchar NOT NULL
);

CREATE TABLE "roles_users" (
  "id_rol_user" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "id_user" uuid NOT NULL,
  "id_rol" uuid NOT NULL
);

CREATE TABLE "room" (
  "id_room" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "code_room" varchar(50) UNIQUE NOT NULL,
  "secc_room" char(10) NOT NULL DEFAULT 'A',
  "max_room" integer NOT NULL,
  "id_institution" uuid NOT NULL,
  "admin_room" uuid NOT NULL,
  "create_date" date NOT NULL,
  "room_url" varchar(500),
  "room_grate" varchar(20)
);

CREATE TABLE "states" (
  "id_state" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "state_name" varchar NOT NULL,
  "id_country" uuid NOT NULL
);

CREATE TABLE "support_materials" (
  "id_material" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "id_material_type" uuid NOT NULL,
  "material_title" varchar(255) NOT NULL,
  "material_description" text,
  "material_url" text NOT NULL,
  "target_audience" varchar(100),
  "source_organization" varchar(255),
  "keywords" text,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "test_metrics" (
  "id_test_metric" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "id_test" uuid NOT NULL,
  "reaction_time_avg" decimal(10,2),
  "error_count" integer,
  "correct_decisions" integer,
  "distracted_events" integer,
  "total_time" decimal(10,2),
  "missed_shots_count" integer
);

CREATE TABLE "test_youtubes" (
  "id_answer" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "id_test" uuid NOT NULL,
  "question_text" text NOT NULL,
  "user_answer" varchar(3) NOT NULL,
  "answer_timestamp" timestamp NOT NULL
);

CREATE TABLE "tests" (
  "id_test" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "id_risk_level" uuid,
  "test_date" timestamp NOT NULL DEFAULT (now()),
  "final_score" integer,
  "test_version" varchar(100),
  "id_user_room" uuid NOT NULL,
  "recommendation" text
);

CREATE TABLE "user_room" (
  "id_user_room" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "id_user" uuid NOT NULL,
  "id_room" uuid NOT NULL
);

CREATE TABLE "users" (
  "id_user" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_url" varchar NOT NULL,
  "user_ced" varchar NOT NULL,
  "user_name" varchar NOT NULL,
  "user_lastname" varchar NOT NULL,
  "user_email" varchar NOT NULL,
  "user_password" varchar NOT NULL,
  "active_role" uuid
);

CREATE TABLE "users_institutions" (
  "id_user_institution" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "id_user" uuid NOT NULL,
  "id_institution" uuid NOT NULL
);

CREATE UNIQUE INDEX ON "risk_level_support_materials" ("id_risk_level", "id_material");

ALTER TABLE "institutions" ADD FOREIGN KEY ("id_location") REFERENCES "parishes" ("id_parish");

ALTER TABLE "municipalities" ADD FOREIGN KEY ("id_state") REFERENCES "states" ("id_state");

ALTER TABLE "parishes" ADD FOREIGN KEY ("id_municipality") REFERENCES "municipalities" ("id_municipality");

ALTER TABLE "risk_level_support_materials" ADD FOREIGN KEY ("id_risk_level") REFERENCES "risk_levels" ("id_risk_level");

ALTER TABLE "risk_level_support_materials" ADD FOREIGN KEY ("id_material") REFERENCES "support_materials" ("id_material");

ALTER TABLE "roles_users" ADD FOREIGN KEY ("id_rol") REFERENCES "roles" ("id_rol");

ALTER TABLE "roles_users" ADD FOREIGN KEY ("id_user") REFERENCES "users" ("id_user");

ALTER TABLE "room" ADD FOREIGN KEY ("id_institution") REFERENCES "institutions" ("id_insti");

ALTER TABLE "room" ADD FOREIGN KEY ("admin_room") REFERENCES "users" ("id_user");

ALTER TABLE "states" ADD FOREIGN KEY ("id_country") REFERENCES "countries" ("id_country");

ALTER TABLE "support_materials" ADD FOREIGN KEY ("id_material_type") REFERENCES "material_types" ("id_material_type");

ALTER TABLE "test_metrics" ADD FOREIGN KEY ("id_test") REFERENCES "tests" ("id_test");

ALTER TABLE "test_youtubes" ADD FOREIGN KEY ("id_test") REFERENCES "tests" ("id_test");

ALTER TABLE "tests" ADD FOREIGN KEY ("id_risk_level") REFERENCES "risk_levels" ("id_risk_level");

ALTER TABLE "tests" ADD FOREIGN KEY ("id_user_room") REFERENCES "user_room" ("id_user_room");

ALTER TABLE "user_room" ADD FOREIGN KEY ("id_user") REFERENCES "users" ("id_user");

ALTER TABLE "user_room" ADD FOREIGN KEY ("id_room") REFERENCES "room" ("id_room");

ALTER TABLE "users" ADD FOREIGN KEY ("active_role") REFERENCES "roles" ("id_rol");

ALTER TABLE "users_institutions" ADD FOREIGN KEY ("id_user") REFERENCES "users" ("id_user");

ALTER TABLE "users_institutions" ADD FOREIGN KEY ("id_institution") REFERENCES "institutions" ("id_insti");
