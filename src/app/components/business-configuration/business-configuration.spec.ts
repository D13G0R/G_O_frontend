import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessConfiguration } from './business-configuration';

describe('BusinessConfiguration', () => {
  let component: BusinessConfiguration;
  let fixture: ComponentFixture<BusinessConfiguration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessConfiguration],
    }).compileComponents();

    fixture = TestBed.createComponent(BusinessConfiguration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
