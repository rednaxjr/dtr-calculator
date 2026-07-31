import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarStatusComponent } from './calendar-status.component';

describe('CalendarStatusComponent', () => {
  let component: CalendarStatusComponent;
  let fixture: ComponentFixture<CalendarStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
