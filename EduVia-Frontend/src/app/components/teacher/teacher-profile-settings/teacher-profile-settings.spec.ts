import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherProfileSettings } from './teacher-profile-settings';

describe('TeacherProfileSettings', () => {
  let component: TeacherProfileSettings;
  let fixture: ComponentFixture<TeacherProfileSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherProfileSettings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeacherProfileSettings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
