import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-exam-reminders',
  imports: [CommonModule],
  templateUrl: './exam-reminders.html',
  styleUrl: './exam-reminders.css',
})
export class ExamReminders {
  showModal = false;

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }
}
