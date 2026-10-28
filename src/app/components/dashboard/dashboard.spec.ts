import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Dashboard } from './dashboard';
import { DashboardService } from './dashboard.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        {
          provide: DashboardService,
          useValue: {
            getSummary: () =>
              of({
                totalTechnicians: 0,
                activeTechnicians: 0,
                todayRevenue: 0,
                monthRevenue: 0,
                todayScheduledAppointments: 0,
                todayConfirmedAppointments: 0,
                todayInProgressAppointments: 0,
                todayPendingPaymentAppointments: 0,
                todayPaymentReviewAppointments: 0,
                todayPaymentRejectedAppointments: 0,
                todayCompletedAppointments: 0,
                todayCancelledAppointments: 0,
                todayOtherAppointments: 0,
                totalTodayAppointments: 0,
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
