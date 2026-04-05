import { Component } from '@angular/core';
<<<<<<< HEAD

@Component({
  selector: 'app-exam-reminders',
  imports: [],
  templateUrl: './exam-reminders.html',
  styleUrls: ['./exam-reminders.css'],
})
export class ExamReminders {

=======
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
>>>>>>> mayarahachani
}
