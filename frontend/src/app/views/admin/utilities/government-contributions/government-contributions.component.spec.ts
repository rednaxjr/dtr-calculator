import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GovernmentContributionsComponent } from './government-contributions.component';

describe('GovernmentContributionsComponent', () => {
  let component: GovernmentContributionsComponent;
  let fixture: ComponentFixture<GovernmentContributionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GovernmentContributionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GovernmentContributionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
