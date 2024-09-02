import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DragDropComponent } from './drag-drop-comp/drag-drop-comp.component';
import { TodolistService } from './todolist.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDropList, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';




@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'to_do_list';
  
}
