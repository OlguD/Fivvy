import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { ProjectsComponent } from './projects.component';
import { ProjectsService } from './projects.service';

describe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;
  let projectsServiceSpy: jasmine.SpyObj<ProjectsService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    projectsServiceSpy = jasmine.createSpyObj('ProjectsService', [
      'getProjects',
      'createProject',
      'deleteProject',
      'getClients',
      'saveBoardPreferences',
      'getBoardPreferences'
    ]);
    projectsServiceSpy.getProjects.and.returnValue(of([]));
    projectsServiceSpy.deleteProject.and.returnValue(of(void 0));
    projectsServiceSpy.getBoardPreferences.and.returnValue({
      visibleStatuses: { planned: true, active: true, completed: true }
    });

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);

    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [ProjectsComponent],
      providers: [
        { provide: ProjectsService, useValue: projectsServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
