CREATE TABLE resources (
 id VARCHAR2(36 CHAR) PRIMARY KEY,
 name VARCHAR2(200 CHAR) NOT NULL
);
CREATE TABLE reservations (
 task_id VARCHAR2(36 CHAR) PRIMARY KEY,
 resource_id VARCHAR2(36 CHAR) NOT NULL,
 from_day DATE NOT NULL,
 to_day DATE NOT NULL,
 CONSTRAINT fk_reservation_resource FOREIGN KEY (resource_id) REFERENCES resources(id),
 CONSTRAINT ck_reservation_dates CHECK (from_day <= to_day)
);
CREATE INDEX ix_reservation_range ON reservations(resource_id, from_day, to_day);
