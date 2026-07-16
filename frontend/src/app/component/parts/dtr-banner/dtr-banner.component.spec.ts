import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DtrBannerComponent } from './dtr-banner.component';

describe('DtrBannerComponent', () => {
  let component: DtrBannerComponent;
  let fixture: ComponentFixture<DtrBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DtrBannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DtrBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
