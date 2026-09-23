package it.nelis.project;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity @Table(name = "tasks")
public class Task {
    @Id @Column(length = 36) public String id = UUID.randomUUID().toString();
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "project_id") public Project project;
    @Column(nullable = false) public int faseMacro;
    @Column(nullable = false, length = 200) public String macroTask;
    @Column(nullable = false) public int faseMicro;
    @Column(nullable = false, length = 200) public String microTask;
    @Column(length = 120) public String department;
    public LocalDate plannedStart;
    public LocalDate plannedEnd;
    public LocalDate actualStart;
    public LocalDate actualEnd;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "predecessor_id") public Task predecessor;
    @Column(length = 36) public String resourceId;
    @Column(nullable = false, length = 20) public String status = "UNSCHEDULED";
    public LocalDateTime sagaStartedAt;
    @Column(length = 1000) public String notes;
}
