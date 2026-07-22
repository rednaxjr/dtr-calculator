import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatTableEmployeeListComponent } from './mat-table-employee-list.component';

describe('MatTableEmployeeListComponent', () => {
  let component: MatTableEmployeeListComponent;
  let fixture: ComponentFixture<MatTableEmployeeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatTableEmployeeListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatTableEmployeeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
