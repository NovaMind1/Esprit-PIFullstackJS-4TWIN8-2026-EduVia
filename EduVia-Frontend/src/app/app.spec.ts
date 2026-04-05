import { TestBed } from '@angular/core/testing';
<<<<<<< HEAD
<<<<<<< HEAD
import { AppComponent } from './app';
=======
import { App } from './app';
>>>>>>> souhail
=======
import { App } from './app';
>>>>>>> mayarahachani

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
<<<<<<< HEAD
<<<<<<< HEAD
      imports: [AppComponent],
=======
      imports: [App],
>>>>>>> souhail
=======
      imports: [App],
>>>>>>> mayarahachani
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, EduVia-Frontend');
  });
});
