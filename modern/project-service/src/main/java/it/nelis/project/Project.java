package it.nelis.project;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity @Table(name = "projects")
public class Project {
    @Id @Column(length = 36) public String id;
    @Column(nullable = false, length = 200) public String name;
    @Column(length = 200) public String client;
    @Column(length = 200) public String location;
    public LocalDate startDate;
    public LocalDate endDate;
    @Column(nullable = false, length = 20) public String status = "active";
    protected Project() {}
    Project(String name, String client, String location, LocalDate startDate, LocalDate endDate) {
        this.id = UUID.randomUUID().toString();
        this.name = name; this.client = client; this.location = location;
        this.startDate = startDate; this.endDate = endDate;
    }
}
