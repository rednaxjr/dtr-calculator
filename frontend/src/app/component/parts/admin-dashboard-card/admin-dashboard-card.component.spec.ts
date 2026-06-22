import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDashboardCardComponent } from './admin-dashboard-card.component';

describe('AdminDashboardCardComponent', () => {
  let component: AdminDashboardCardComponent;
  let fixture: ComponentFixture<AdminDashboardCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminDashboardCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
