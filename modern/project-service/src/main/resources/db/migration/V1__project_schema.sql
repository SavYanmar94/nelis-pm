CREATE TABLE projects (
 id VARCHAR2(36 CHAR) PRIMARY KEY,
 name VARCHAR2(200 CHAR) NOT NULL,
 client VARCHAR2(200 CHAR),
 location VARCHAR2(200 CHAR),
 start_date DATE,
 end_date DATE,
 status VARCHAR2(20 CHAR) DEFAULT 'active' NOT NULL,
 CONSTRAINT ck_project_dates CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);

CREATE TABLE tasks (
 id VARCHAR2(36 CHAR) PRIMARY KEY,
 project_id VARCHAR2(36 CHAR) NOT NULL,
 fase_macro NUMBER(10) DEFAULT 1 NOT NULL,
 macro_task VARCHAR2(200 CHAR) NOT NULL,
 fase_micro NUMBER(10) DEFAULT 1 NOT NULL,
 micro_task VARCHAR2(200 CHAR) NOT NULL,
 department VARCHAR2(120 CHAR),
 planned_start DATE,
 planned_end DATE,
 actual_start DATE,
 actual_end DATE,
 predecessor_id VARCHAR2(36 CHAR),
 resource_id VARCHAR2(36 CHAR),
 status VARCHAR2(20 CHAR) DEFAULT 'UNSCHEDULED' NOT NULL,
 saga_started_at TIMESTAMP,
 notes VARCHAR2(1000 CHAR),
 CONSTRAINT fk_task_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
 CONSTRAINT fk_task_predecessor FOREIGN KEY (predecessor_id) REFERENCES tasks(id),
 CONSTRAINT ck_task_dates CHECK (planned_start IS NULL OR planned_end IS NULL OR planned_start <= planned_end),
 CONSTRAINT ck_task_actual_dates CHECK (actual_start IS NULL OR actual_end IS NULL OR actual_start <= actual_end),
 CONSTRAINT ck_task_status CHECK (status IN ('UNSCHEDULED','PENDING','SCHEDULED','COMPLETED','FAILED'))
);
CREATE INDEX ix_tasks_project ON tasks(project_id, fase_macro, fase_micro);
