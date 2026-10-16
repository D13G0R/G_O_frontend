import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { ToastMessage } from './toast-message';

describe('ToastMessage', () => {
  let component: ToastMessage;
  let fixture: ComponentFixture<ToastMessage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastMessage],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastMessage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('closes and emits updated values when the close button is clicked', () => {
    const errorChange = vi.spyOn(component.errorChange, 'emit');
    const errorMessageChange = vi.spyOn(component.errorMessageChange, 'emit');

    fixture.componentRef.setInput('error', true);
    fixture.componentRef.setInput('errorMessage', 'Error al registrarse');
    fixture.detectChanges();

    component.closeToast();

    expect(component.visible).toBe(false);
    expect(errorChange).toHaveBeenCalledWith(false);
    expect(errorMessageChange).toHaveBeenCalledWith('');
  });

  it('closes automatically after three seconds', () => {
    vi.useFakeTimers();
    try {
      const errorChange = vi.spyOn(component.errorChange, 'emit');

      fixture.componentRef.setInput('error', true);
      fixture.detectChanges();
      vi.advanceTimersByTime(3000);

      expect(component.visible).toBe(false);
      expect(errorChange).toHaveBeenCalledWith(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
