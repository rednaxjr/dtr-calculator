import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DtrDetailsComponent } from './dtr-details.component';

describe('DtrDetailsComponent', () => {
  let component: DtrDetailsComponent;
  let fixture: ComponentFixture<DtrDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DtrDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DtrDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
