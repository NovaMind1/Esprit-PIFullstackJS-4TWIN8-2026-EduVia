import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-teacher-profile-settings',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './teacher-profile-settings.html',
  styleUrl: './teacher-profile-settings.css',
  standalone: true,
})
export class TeacherProfileSettingsComponent {
  selectedTab = 0;
  profileForm: FormGroup;
  isLoading = false;

  constructor(private fb: FormBuilder, private snackBar: MatSnackBar) {
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      birthdate: ['', Validators.required],
      specialization: ['', Validators.required],
      address: ['', Validators.required],
      bio: ['', Validators.maxLength(500)],
    });
  }

  onSubmit() {
    if (this.profileForm.valid) {
      this.isLoading = true;
      setTimeout(() => {
        this.isLoading = false;
        this.snackBar.open('Profil mis à jour avec succès!', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar'],
        });
      }, 1500);
    }
  }
}

