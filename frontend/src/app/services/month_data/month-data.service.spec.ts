import { TestBed } from '@angular/core/testing';

import { MonthDataService } from './month-data.service';

describe('MonthDataService', () => {
  let service: MonthDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MonthDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
