import { Component, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-role-selection',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './role-selection.html',
  styleUrl: './role-selection.css',
})
export class RoleSelection {
  roleSelected = output<'teacher'>();

  selectRole(role: 'teacher') {
    this.roleSelected.emit(role);
  }
}
