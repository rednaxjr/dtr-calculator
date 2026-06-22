import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveasComponent } from './saveas.component';

describe('SaveasComponent', () => {
  let component: SaveasComponent;
  let fixture: ComponentFixture<SaveasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaveasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
