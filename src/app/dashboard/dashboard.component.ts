import { Component } from '@angular/core';
import { CdkDrag, CdkDropList, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TodolistService } from '../todolist.service';
import { DragDropComponent } from '../drag-drop-comp/drag-drop-comp.component';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '../authentication.service';

interface Task {
  
  id: number;
  task: string;
  due_date: string;
  status: string;
  description: string;
  order?: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DragDropComponent, CommonModule, ReactiveFormsModule, CdkDrag, CdkDropList, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  task: any;
  taskForm: FormGroup;
  editTaskForm: FormGroup;
  userId = 2;
  todotask: any[] = [];
  inprogresstask: any[] = [];
  donetask: any[] = [];
  reminderTasks: any[] = [];
  clickId: number = 0;
  username: string = 'User';

  constructor(private api: TodolistService, private fb: FormBuilder, private auth: AuthenticationService) {
    this.taskForm = this.fb.group({
      task: ['', Validators.required],
      due_date: ['', Validators.required],
      status: ['', Validators.required],
      description: ['', Validators.required]
      
    });

    this.editTaskForm = this.fb.group({
      task: ['', Validators.required],
      due_date: ['', Validators.required],
      status: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  isOverdue(dueDate: string): boolean {
    const today = new Date().setHours(0, 0, 0, 0);
    const due = new Date(dueDate).setHours(0, 0, 0, 0);
    return due < today;
  }

  isDueSoon(dueDate: string): { dueSoon: boolean; text: string } {
    const today = new Date();
    const due = new Date(dueDate);


    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const dueSoon = due.toDateString() === startOfToday.toDateString() ||
      due.toDateString() === startOfTomorrow.toDateString();

    let text = '';
    if (due.toDateString() === startOfToday.toDateString()) {
      text = 'Due Today';
    } else if (due.toDateString() === startOfTomorrow.toDateString()) {
      text = 'Due Tomorrow';
    }

    return { dueSoon, text };
  }



  ngOnInit(): void {
    this.retrivetask();
    this.retrivedone();
    this.retriveinprogress();
    this.retrivetodo();
  }

  retrivetask() {
    this.api.getTasks().subscribe((resp: any) => {
      this.task = resp.data;
      this.setReminderTasks(this.task);
      console.log(this.task);
    });
  }

  setReminderTasks(tasks: any[]) {
    this.reminderTasks = tasks.filter(task => this.isDueSoon(task.due_date));
  }

  onSubmit() {
    if (this.taskForm.valid) {
      this.api.add_task(this.userId, this.taskForm.value).subscribe(
        (resp: any) => {
          console.log("You have added your task successfully!", resp);
          this.retrivetask();
          this.retrivedone();
          this.retriveinprogress();
          this.retrivetodo();
          this.taskForm.reset();
        }
      );
    }
  }

  edit(id: number) {
    this.clickId = id;
    const taskToEdit = this.getTaskById(id);
    if (taskToEdit) {
      this.editTaskForm.patchValue({
        task: taskToEdit.task,
        due_date: taskToEdit.due_date,
        status: taskToEdit.status,
        description: taskToEdit.description // Added description field
      });
    }
  }

  onEditSubmit() {
    if (this.editTaskForm.valid) {
      console.log(this.clickId);
      this.api.updatetask(this.clickId, this.editTaskForm.value).subscribe(
        (resp: any) => {
          console.log("You have added your task successfully!", resp);
          this.retrivetask();
          this.retrivedone();
          this.retriveinprogress();
          this.retrivetodo();
          this.editTaskForm.reset();
        }
      );
    }
  }

  deleteTask(task: any) {
    const confirmed = confirm("Are you sure you want to delete the task?");
    if (confirmed) {
      this.api.delete_task(task.id).subscribe(
        (resp: any) => {
          console.log("Task deleted successfully!", resp);
          this.retrivetask();
          this.retrivedone();
          this.retriveinprogress();
          this.retrivetodo();
        }
      );
    }
    
  }

  updateTask(task: any) {
    this.taskForm.patchValue(task);

  }

  retrivedone() {
    this.api.getstatusTasks('done').subscribe((resp: any) => {
      const tasks = this.sortIT(resp.data);
      this.donetask = tasks;
      console.log(this.donetask);
    });
  }

  retriveinprogress() {
    this.api.getstatusTasks('inprogress').subscribe((resp: any) => {
      const tasks = this.sortIT(resp.data);
      this.inprogresstask = tasks;
      console.log(this.inprogresstask);
    });
  }

  retrivetodo(): void {
    this.api.getstatusTasks('todo').subscribe(
      (resp: any) => {
        const tasks = this.sortIT(resp.data);
        this.todotask = tasks;
        console.log('Todo tasks:', this.todotask);
      },
      (error: any) => {
        console.error('Error retrieving to-do tasks:', error);
      }
    );
  }

  sortIT(tasks: any[]): any[] {
    return tasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {

      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.updateTaskOrders(event.container.data);
    } else {

      const movedTask = event.previousContainer.data[event.previousIndex];
      const newStatus = event.container.id;

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const updatedTask = { ...movedTask, status: newStatus, order: event.currentIndex + 1 };
      this.updateTaskStatus(updatedTask);
    }
  }

  updateTaskOrders(tasks: Task[]): void {
    tasks.forEach((task, index) => {
      this.api.updateTaskOrder(task.id, index + 1).subscribe(
        (resp: any) => {
          console.log(`Task order updated successfully for task ID ${task.id}`, resp);
        },
        (error) => {
          console.error(`Failed to update task order for task ID ${task.id}`, error);
        }
      );
    });
  }


  updateTaskStatus(task: Task) {
    this.api.updateTaskStatus(task.id, task.status).subscribe(
      (resp: any) => {
        console.log("Task status updated successfully!", resp);
        this.retrivetask();
        this.retrivedone();
        this.retriveinprogress();
        this.retrivetodo();
        this.retrivetask();
        this.retrivedone();
        this.retriveinprogress();
        this.retrivetodo();
      },
      (error) => {
        console.error("Failed to update task status", error);
      }
    );
  }


  //MULTIPLE ACTIONS
  moveSelectedTasks(newStatus: string): void {
    const selectedTasks = this.getSelectedTasks();
    selectedTasks.forEach(task => {
      task.status = newStatus;
      this.updateTaskStatus(task);
    });
  }

  deleteSelectedTasks(): void {
    const selectedTasks = this.getSelectedTasks();
    selectedTasks.forEach(task => {
      this.deleteTask(task);
    });
  }

  getSelectedTasks(): Task[] {
    return [
      ...this.todotask.filter(task => task.selected),
      ...this.inprogresstask.filter(task => task.selected),
      ...this.donetask.filter(task => task.selected)
    ];
  }

  private getTaskById(id: number) {
    return this.todotask.concat(this.inprogresstask, this.donetask).find(task => task.id === id);
  }


  trackByFn(index: any, item: any) {
    return item.id;
  }
  
logout() {
  this.auth.logout();
}
  
}
