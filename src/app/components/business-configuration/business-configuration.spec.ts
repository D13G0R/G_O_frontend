import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BusinessConfiguration } from './business-configuration';

describe('BusinessConfiguration', () => {
  let component: BusinessConfiguration;
  let fixture: ComponentFixture<BusinessConfiguration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessConfiguration],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(BusinessConfiguration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
