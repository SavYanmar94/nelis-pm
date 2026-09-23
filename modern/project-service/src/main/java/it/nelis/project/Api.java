package it.nelis.project;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public final class Api {
    private Api() {}
    public record ProjectInput(@NotBlank @Size(max = 200) String name,
                               @Size(max = 200) String client,
                               @Size(max = 200) String location,
                               LocalDate startDate, LocalDate endDate) {}
    public record ProjectView(String id, String name, String client, String location,
                              LocalDate startDate, LocalDate endDate, String status) {
        static ProjectView of(Project p) { return new ProjectView(p.id, p.name, p.client, p.location, p.startDate, p.endDate, p.status); }
    }
    public record TaskInput(@Min(0) int faseMacro, @NotBlank @Size(max = 200) String macroTask,
                            @Min(0) int faseMicro, @NotBlank @Size(max = 200) String microTask,
                            @Size(max = 120) String department, LocalDate plannedStart, LocalDate plannedEnd,
                            String predecessorId, String resourceId, @Size(max = 1000) String notes) {}
    public record TaskView(String id, String projectId, int faseMacro, String macroTask,
                           int faseMicro, String microTask, String department,
                           LocalDate plannedStart, LocalDate plannedEnd, LocalDate actualStart,
                           LocalDate actualEnd, String predecessorId, String resourceId, String status, String notes) {
        static TaskView of(Task t) {
            return new TaskView(t.id, t.project.id, t.faseMacro, t.macroTask, t.faseMicro, t.microTask,
                    t.department, t.plannedStart, t.plannedEnd, t.actualStart, t.actualEnd,
                    t.predecessor == null ? null : t.predecessor.id, t.resourceId, t.status, t.notes);
        }
    }
}
