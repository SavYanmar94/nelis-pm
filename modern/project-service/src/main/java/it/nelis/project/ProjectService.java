package it.nelis.project;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProjectService {
    private final ProjectRepository projects;
    private final TaskRepository tasks;
    ProjectService(ProjectRepository projects, TaskRepository tasks) { this.projects = projects; this.tasks = tasks; }

    @Transactional(readOnly = true)
    public List<Api.ProjectView> projects() { return projects.findAll().stream().map(Api.ProjectView::of).toList(); }
    @Transactional(readOnly = true)
    public Api.ProjectView project(String id) { return Api.ProjectView.of(projectOrThrow(id)); }
    @Transactional
    public Api.ProjectView create(Api.ProjectInput input) {
        dates(input.startDate(), input.endDate());
        return Api.ProjectView.of(projects.save(new Project(input.name().trim(), input.client(),
                input.location(), input.startDate(), input.endDate())));
    }
    @Transactional
    public Api.ProjectView update(String id, Api.ProjectInput input) {
        dates(input.startDate(), input.endDate());
        Project p = projectOrThrow(id);
        p.name = input.name().trim(); p.client = input.client(); p.location = input.location();
        p.startDate = input.startDate(); p.endDate = input.endDate();
        return Api.ProjectView.of(p);
    }
    @Transactional
    public void delete(String id) {
        Project p = projectOrThrow(id);
        if (tasks.findByProjectIdOrderByFaseMacroAscFaseMicroAsc(id).stream()
                .anyMatch(t -> !t.status.equals("UNSCHEDULED") && !t.status.equals("FAILED")))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Il cantiere contiene risorse prenotate");
        projects.delete(p);
    }
    @Transactional(readOnly = true)
    public List<Api.TaskView> tasks(String projectId) {
        projectOrThrow(projectId);
        return tasks.findByProjectIdOrderByFaseMacroAscFaseMicroAsc(projectId).stream().map(Api.TaskView::of).toList();
    }
    @Transactional
    public Api.TaskView createTask(String projectId, Api.TaskInput input) {
        Task t = new Task();
        t.project = projectOrThrow(projectId);
        apply(t, input);
        return Api.TaskView.of(tasks.save(t));
    }
    @Transactional
    public Api.TaskView updateTask(String projectId, String taskId, Api.TaskInput input) {
        Task t = taskOrThrow(taskId);
        if (!t.project.id.equals(projectId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task non trovato nel cantiere");
        if (!t.status.equals("UNSCHEDULED") && !t.status.equals("FAILED"))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Modificare solo task non schedulati");
        apply(t, input);
        return Api.TaskView.of(t);
    }
    @Transactional
    public void deleteTask(String projectId, String taskId) {
        Task t = taskOrThrow(taskId);
        if (!t.project.id.equals(projectId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if (!t.status.equals("UNSCHEDULED") && !t.status.equals("FAILED"))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Task schedulato: liberare la risorsa prima di eliminarlo");
        if (tasks.existsByPredecessorId(taskId))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Il task è predecessore di altri task");
        tasks.delete(t);
    }
    @Transactional
    public Api.TaskView complete(String id) {
        Task t = taskOrThrow(id);
        if (!t.status.equals("SCHEDULED")) throw new ResponseStatusException(HttpStatus.CONFLICT, "Prima schedulare il task");
        t.status = "COMPLETED"; t.actualEnd = java.time.LocalDate.now();
        return Api.TaskView.of(t);
    }
    @Transactional(readOnly = true)
    Task taskOrThrow(String id) {
        return tasks.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task non trovato"));
    }
    private Project projectOrThrow(String id) {
        return projects.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cantiere non trovato"));
    }
    private void apply(Task t, Api.TaskInput i) {
        dates(i.plannedStart(), i.plannedEnd());
        t.faseMacro = i.faseMacro(); t.macroTask = i.macroTask().trim();
        t.faseMicro = i.faseMicro(); t.microTask = i.microTask().trim();
        t.department = i.department(); t.plannedStart = i.plannedStart();
        t.plannedEnd = i.plannedEnd(); t.notes = i.notes();
        t.resourceId = i.resourceId() == null || i.resourceId().isBlank() ? null : i.resourceId();
        if (i.predecessorId() == null || i.predecessorId().isBlank()) { t.predecessor = null; return; }
        Task predecessor = taskOrThrow(i.predecessorId());
        if (!predecessor.project.id.equals(t.project.id))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Il predecessore deve appartenere allo stesso cantiere");
        Task cursor = predecessor;
        while (cursor != null) {
            if (cursor.id.equals(t.id)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Dipendenza ciclica");
            cursor = cursor.predecessor;
        }
        t.predecessor = predecessor;
    }
    static void dates(java.time.LocalDate start, java.time.LocalDate end) {
        if (start != null && end != null && start.isAfter(end))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La data iniziale supera la data finale");
    }
}
