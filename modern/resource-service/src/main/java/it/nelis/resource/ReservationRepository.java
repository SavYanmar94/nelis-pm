package it.nelis.resource;

import java.time.LocalDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservationRepository extends JpaRepository<Reservation, String> {
    @Query("select count(r) from Reservation r where r.resource.id = :resourceId and r.from <= :to and r.to >= :from")
    long countOverlapping(@Param("resourceId") String resourceId, @Param("from") LocalDate from, @Param("to") LocalDate to);
}
