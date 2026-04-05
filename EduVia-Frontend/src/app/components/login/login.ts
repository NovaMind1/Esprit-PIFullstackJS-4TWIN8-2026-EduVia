import { Component, Input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatInputModule, MatButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  @Input() role: 'teacher' | null = null;
  @Input() errorMessage: string | null = null;

  email = '';
  password = '';

  login = output<{ role: 'teacher' | null; email: string; password: string }>();

  onSubmit() {
    this.login.emit({ role: this.role, email: this.email, password: this.password });
  }
}
