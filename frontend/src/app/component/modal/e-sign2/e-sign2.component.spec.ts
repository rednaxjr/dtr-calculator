import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ESign2Component } from './e-sign2.component';

describe('ESign2Component', () => {
  let component: ESign2Component;
  let fixture: ComponentFixture<ESign2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ESign2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ESign2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
