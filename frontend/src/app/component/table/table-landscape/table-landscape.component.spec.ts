import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableLandscapeComponent } from './table-landscape.component';

describe('TableLandscapeComponent', () => {
  let component: TableLandscapeComponent;
  let fixture: ComponentFixture<TableLandscapeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableLandscapeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableLandscapeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
