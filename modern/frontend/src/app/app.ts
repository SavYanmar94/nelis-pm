import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Project { id: string; name: string; client: string | null; location: string | null; startDate: string | null; endDate: string | null }
interface Resource { id: string; name: string }
interface Task { id: string; faseMacro: number; macroTask: string; faseMicro: number; microTask: string;
  department: string | null; plannedStart: string | null; plannedEnd: string | null;
  predecessorId: string | null; resourceId: string | null; status: string; notes: string | null }
type TaskInput = Omit<Task, 'id' | 'status'>;

@Component({ selector: 'app-root', imports: [FormsModule], templateUrl: './app.html', styleUrl: './app.css' })
export class App {
  private readonly http = inject(HttpClient);
  projects = signal<Project[]>([]);
  tasks = signal<Task[]>([]);
  resources = signal<Resource[]>([]);
  selected = signal<Project | null>(null);
  error = signal('');
  info = signal('');
  projectName = '';
  projectClient = '';
  projectLocation = '';
  projectStartDate: string | null = null;
  projectEndDate: string | null = null;
  resourceName = '';
  editingTaskId: string | null = null;
  task: TaskInput = this.emptyTask();
  days = computed(() => {
    const dated = this.tasks().flatMap(t => [t.plannedStart, t.plannedEnd].filter((d): d is string => !!d));
    if (!dated.length) return [] as string[];
    const start = new Date(Math.min(...dated.map(d => Date.parse(d + 'T00:00:00Z'))));
    const end = new Date(Math.max(...dated.map(d => Date.parse(d + 'T00:00:00Z'))));
    const result: string[] = [];
    for (const date = new Date(start); date <= end && result.length < 31; date.setUTCDate(date.getUTCDate() + 1))
      result.push(date.toISOString().slice(0, 10));
    return result;
  });
  overdue = computed(() => {
    const now = new Date();
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    return this.tasks().filter(t => !!t.plannedEnd && t.plannedEnd < today && t.status !== 'COMPLETED');
  });
  constructor() { this.loadProjects(); this.loadResources(); }
  emptyTask(): TaskInput {
    return { faseMacro: 1, macroTask: '', faseMicro: 1, microTask: '', department: '',
      plannedStart: null, plannedEnd: null, predecessorId: null, resourceId: null, notes: null };
  }
  private fail(e: unknown) {
    const response = e as HttpErrorResponse;
    this.error.set(response.error?.detail || response.error?.message || response.error?.error ||
      'Operazione non riuscita. Controlla la connessione e i dati.');
  }
  private clear() { this.error.set(''); this.info.set(''); }
  loadProjects() {
    this.http.get<Project[]>('/api/projects').subscribe({ next: items => this.projects.set(items), error: e => this.fail(e) });
  }
  loadResources() {
    this.http.get<Resource[]>('/api/resources').subscribe({ next: items => this.resources.set(items), error: e => this.fail(e) });
  }
  select(project: Project) { this.selected.set(project); this.clear(); this.resetTask(); this.reloadTasks(); }
  reloadTasks() {
    const p = this.selected();
    if (p) this.http.get<Task[]>(`/api/projects/${p.id}/tasks`).subscribe({ next: items => this.tasks.set(items), error: e => this.fail(e) });
  }
  createProject() {
    if (!this.projectName.trim()) return;
    this.clear();
    this.http.post<Project>('/api/projects', { name: this.projectName, client: this.projectClient || null,
      location: this.projectLocation || null, startDate: this.projectStartDate || null,
      endDate: this.projectEndDate || null }).subscribe({
      next: p => { this.projects.update(items => [...items, p]); this.projectName = ''; this.projectClient = '';
        this.projectLocation = ''; this.projectStartDate = null; this.projectEndDate = null;
        this.select(p); this.info.set('Cantiere creato'); }, error: e => this.fail(e)
    });
  }
  deleteProject(project: Project) {
    if (!confirm(`Eliminare il cantiere "${project.name}" e tutte le sue attività?`)) return;
    this.http.delete<void>(`/api/projects/${project.id}`).subscribe({
      next: () => { this.projects.update(items => items.filter(p => p.id !== project.id));
        if (this.selected()?.id === project.id) { this.selected.set(null); this.tasks.set([]); } },
      error: e => this.fail(e)
    });
  }
  createResource() {
    if (!this.resourceName.trim()) return;
    this.clear();
    this.http.post<Resource>('/api/resources', { name: this.resourceName }).subscribe({
      next: r => { this.resources.update(items => [...items, r]); this.resourceName = ''; this.task.resourceId = r.id; },
      error: e => this.fail(e)
    });
  }
  editTask(t: Task) {
    this.editingTaskId = t.id;
    this.task = { faseMacro: t.faseMacro, macroTask: t.macroTask, faseMicro: t.faseMicro, microTask: t.microTask,
      department: t.department, plannedStart: t.plannedStart, plannedEnd: t.plannedEnd,
      predecessorId: t.predecessorId, resourceId: t.resourceId, notes: t.notes };
    this.clear();
  }
  resetTask() { this.editingTaskId = null; this.task = this.emptyTask(); }
  saveTask() {
    const p = this.selected(); if (!p) return;
    this.clear();
    const body = { ...this.task, predecessorId: this.task.predecessorId || null, resourceId: this.task.resourceId || null,
      plannedStart: this.task.plannedStart || null, plannedEnd: this.task.plannedEnd || null };
    const path = `/api/projects/${p.id}/tasks`;
    const req = this.editingTaskId ? this.http.put<Task>(`${path}/${this.editingTaskId}`, body) : this.http.post<Task>(path, body);
    req.subscribe({ next: () => { this.resetTask(); this.reloadTasks(); this.info.set('Attività salvata'); },
      error: e => this.fail(e) });
  }
  deleteTask(t: Task) {
    const p = this.selected(); if (!p || !confirm(`Eliminare "${t.microTask}"?`)) return;
    this.clear();
    this.http.delete<void>(`/api/projects/${p.id}/tasks/${t.id}`).subscribe({
      next: () => this.reloadTasks(), error: e => this.fail(e)
    });
  }
  action(t: Task, verb: 'schedule' | 'complete') {
    this.clear();
    this.http.post<Task>(`/api/tasks/${t.id}/${verb}`, {}).subscribe({
      next: () => { this.reloadTasks(); this.info.set(verb === 'schedule' ? 'Risorsa prenotata e task schedulato' : 'Task completato'); },
      error: e => { this.reloadTasks(); this.fail(e); }
    });
  }
  resourceLabel(id: string | null) { return this.resources().find(r => r.id === id)?.name || '—'; }
  predecessorLabel(id: string | null) { return this.tasks().find(t => t.id === id)?.microTask || '—'; }
  active(t: Task, day: string) { return !!t.plannedStart && !!t.plannedEnd && t.plannedStart <= day && day <= t.plannedEnd; }
  statusLabel(status: string) {
    return ({ UNSCHEDULED: 'Non schedulato', PENDING: 'In prenotazione', SCHEDULED: 'In corso',
      COMPLETED: 'Completato', FAILED: 'Prenotazione fallita' } as Record<string, string>)[status] || status;
  }
}
