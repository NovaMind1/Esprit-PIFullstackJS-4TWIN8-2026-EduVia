import { CommonModule } from '@angular/common';
import { Component, Input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatInputModule, MatButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  @Input() role: 'student' | null = 'student';
  @Input() errorMessage: string | null = null;

  email = '';
  password = '';

  login = output<{
    role: 'student' | null;
    email: string;
    password: string;
  }>();

  onSubmit() {
    this.login.emit({ role: this.role, email: this.email, password: this.password });
  }
}
