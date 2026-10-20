import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Technician } from './technician';

describe('Technician', () => {
  let component: Technician;
  let fixture: ComponentFixture<Technician>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Technician],
    }).compileComponents();

    fixture = TestBed.createComponent(Technician);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
