import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeBreadcrumbsComponent } from './employee-breadcrumbs.component';

describe('EmployeeBreadcrumbsComponent', () => {
  let component: EmployeeBreadcrumbsComponent;
  let fixture: ComponentFixture<EmployeeBreadcrumbsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeBreadcrumbsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeBreadcrumbsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
