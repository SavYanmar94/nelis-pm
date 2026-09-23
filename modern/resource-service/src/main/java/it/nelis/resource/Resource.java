package it.nelis.resource;

import jakarta.persistence.*;
import java.util.UUID;

@Entity @Table(name = "resources")
public class Resource {
    @Id @Column(length = 36) public String id = UUID.randomUUID().toString();
    @Column(nullable = false, length = 200) public String name;
    protected Resource() {}
    Resource(String name) { this.name = name; }
}
