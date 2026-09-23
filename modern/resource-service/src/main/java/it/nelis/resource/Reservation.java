package it.nelis.resource;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity @Table(name = "reservations")
public class Reservation {
    @Id @Column(length = 36) public String taskId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "resource_id") public Resource resource;
    @Column(name = "from_day", nullable = false) public LocalDate from;
    @Column(name = "to_day", nullable = false) public LocalDate to;
    protected Reservation() {}
    Reservation(String taskId, Resource resource, LocalDate from, LocalDate to) {
        this.taskId = taskId; this.resource = resource; this.from = from; this.to = to;
    }
}
