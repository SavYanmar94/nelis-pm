package it.nelis.project;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Duration;
import java.net.http.HttpClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SchedulingSaga {
    private final TaskRepository tasks;
    private final TransactionTemplate transaction;
    private final RestClient resources;

    SchedulingSaga(TaskRepository tasks, TransactionTemplate transaction,
                   @Value("${resource-service.url}") String resourceUrl) {
        this.tasks = tasks; this.transaction = transaction;
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5)).build());
        factory.setReadTimeout(Duration.ofSeconds(15));
        this.resources = RestClient.builder().baseUrl(resourceUrl).requestFactory(factory).build();
    }
    public Api.TaskView schedule(String id) {
        // Commit PENDING before the HTTP request. Retrying the same command resumes this operation.
        Reservation request = transaction.execute(status -> {
            Task task = locked(id);
            if ("SCHEDULED".equals(task.status)) return null;
            if (!"UNSCHEDULED".equals(task.status) && !"FAILED".equals(task.status) && !"PENDING".equals(task.status))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Task già completato");
            if ("PENDING".equals(task.status) && task.sagaStartedAt != null
                    && task.sagaStartedAt.isAfter(LocalDateTime.now(java.time.Clock.systemUTC()).minusMinutes(1)))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Prenotazione in corso; riprovare dopo un minuto");
            if (task.predecessor != null && !"COMPLETED".equals(task.predecessor.status))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Completare prima il predecessore");
            if (task.plannedStart == null || task.plannedEnd == null || task.resourceId == null)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Servono date pianificate e risorsa");
            task.status = "PENDING";
            task.sagaStartedAt = LocalDateTime.now(java.time.Clock.systemUTC());
            return new Reservation(task.id, task.resourceId, task.plannedStart, task.plannedEnd);
        });
        if (request == null) return transaction.execute(s -> Api.TaskView.of(locked(id)));
        try {
            resources.post().uri(b -> b.path("/api/reservations/{id}")
                    .queryParam("resourceId", request.resourceId)
                    .queryParam("from", request.from)
                    .queryParam("to", request.to).build(request.taskId))
                    .retrieve().toBodilessEntity();
            return transaction.execute(s -> {
                Task task = locked(id);
                if ("SCHEDULED".equals(task.status)) return Api.TaskView.of(task);
                if (!"PENDING".equals(task.status)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Stato saga modificato");
                task.status = "SCHEDULED";
                task.sagaStartedAt = null;
                task.actualStart = LocalDate.now();
                return Api.TaskView.of(task);
            });
        } catch (RuntimeException failure) {
            try {
                resources.delete().uri("/api/reservations/{id}", request.taskId).retrieve().toBodilessEntity();
                transaction.executeWithoutResult(s -> {
                    Task task = locked(id);
                    if ("PENDING".equals(task.status)) { task.status = "FAILED"; task.sagaStartedAt = null; }
                });
            } catch (RuntimeException compensationFailure) {
                // Keep PENDING so retry can reconcile the remote reservation by the same task id.
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Compensazione non riuscita; ripetere la schedulazione", compensationFailure);
            }
            if (failure instanceof RestClientResponseException remote && remote.getStatusCode().value() == 409)
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Risorsa occupata o prenotazione non coerente");
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Prenotazione non riuscita", failure);
        }
    }
    private Task locked(String id) {
        return tasks.lockById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task non trovato"));
    }
    private record Reservation(String taskId, String resourceId, LocalDate from, LocalDate to) {}
}
