package it.nelis.project;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api")
public class ProjectController {
    private final ProjectService service;
    private final SchedulingSaga saga;
    ProjectController(ProjectService service, SchedulingSaga saga) { this.service = service; this.saga = saga; }

    @GetMapping("/projects") public List<Api.ProjectView> list() { return service.projects(); }
    @GetMapping("/projects/{id}") public Api.ProjectView project(@PathVariable String id) { return service.project(id); }
    @PostMapping("/projects") @ResponseStatus(HttpStatus.CREATED)
    public Api.ProjectView create(@Valid @RequestBody Api.ProjectInput i) { return service.create(i); }
    @PutMapping("/projects/{id}") public Api.ProjectView update(@PathVariable String id, @Valid @RequestBody Api.ProjectInput i) { return service.update(id, i); }
    @DeleteMapping("/projects/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) { service.delete(id); }

    @GetMapping("/projects/{projectId}/tasks")
    public List<Api.TaskView> tasks(@PathVariable String projectId) { return service.tasks(projectId); }
    @PostMapping("/projects/{projectId}/tasks") @ResponseStatus(HttpStatus.CREATED)
    public Api.TaskView createTask(@PathVariable String projectId, @Valid @RequestBody Api.TaskInput i) { return service.createTask(projectId, i); }
    @PutMapping("/projects/{projectId}/tasks/{taskId}")
    public Api.TaskView updateTask(@PathVariable String projectId, @PathVariable String taskId,
                                   @Valid @RequestBody Api.TaskInput i) { return service.updateTask(projectId, taskId, i); }
    @DeleteMapping("/projects/{projectId}/tasks/{taskId}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(@PathVariable String projectId, @PathVariable String taskId) { service.deleteTask(projectId, taskId); }
    @PostMapping("/tasks/{id}/schedule") public Api.TaskView schedule(@PathVariable String id) { return saga.schedule(id); }
    @PostMapping("/tasks/{id}/complete") public Api.TaskView complete(@PathVariable String id) { return service.complete(id); }
}
