package it.nelis.resource;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController @RequestMapping("/api")
public class ResourceController {
    private final ResourceRepository resources;
    private final ReservationRepository reservations;
    ResourceController(ResourceRepository resources, ReservationRepository reservations) {
        this.resources = resources; this.reservations = reservations;
    }
    public record ResourceInput(@NotBlank @Size(max = 200) String name) {}
    public record ResourceView(String id, String name) {
        static ResourceView of(Resource r) { return new ResourceView(r.id, r.name); }
    }
    @GetMapping("/resources") @Transactional(readOnly = true)
    public List<ResourceView> list() { return resources.findAll().stream().map(ResourceView::of).toList(); }
    @PostMapping("/resources") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public ResourceView create(@Valid @RequestBody ResourceInput input) {
        return ResourceView.of(resources.save(new Resource(input.name().trim())));
    }
    @PostMapping("/reservations/{taskId}") @Transactional
    public void reserve(@PathVariable String taskId, @RequestParam String resourceId,
                        @RequestParam("from") LocalDate from, @RequestParam("to") LocalDate to) {
        if (from.isAfter(to)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date non valide");
        // Serialize bookings on the resource row; this prevents two overlapping requests racing.
        Resource resource = resources.lockById(resourceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Risorsa non trovata"));
        var old = reservations.findById(taskId);
        if (old.isPresent()) {
            Reservation booking = old.get();
            if (booking.resource.id.equals(resourceId) && booking.fromDay.equals(from) && booking.toDay.equals(to)) return;
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Il task ha già una diversa prenotazione");
        }
        if (reservations.countOverlapping(resourceId, from, to) > 0)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Risorsa occupata nelle date richieste");
        reservations.save(new Reservation(taskId, resource, from, to));
    }
    @DeleteMapping("/reservations/{taskId}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void release(@PathVariable String taskId) {
        reservations.findById(taskId).ifPresent(r -> {
            resources.lockById(r.resource.id);
            reservations.delete(r);
        });
    }
}
