import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { PaymentEvent } from '../../model/interfaces';
import { TokenService } from '../token/token';

@Injectable({ providedIn: 'root' })
export class PaymentRealtimeService implements OnDestroy {
  private readonly WS_URL = 'ws://localhost:8080/ws/payments';

  readonly events = new Subject<PaymentEvent>();

  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private shouldReconnect = true;

  constructor(private readonly tokenService: TokenService) {}

  connect(): void {
    this.shouldReconnect = true;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = this.tokenService.getToken();

    if (!token) {
      return;
    }

    this.socket = new WebSocket(`${this.WS_URL}?token=${encodeURIComponent(token)}`);

    this.socket.onopen = () => {
      this.startHeartbeat();
    };

    this.socket.onmessage = (event: MessageEvent<string>) => {
      if (event.data === 'pong') {
        return;
      }

      try {
        const payload = JSON.parse(event.data) as PaymentEvent;

        if (payload?.type && payload?.payment) {
          this.events.next(payload);
        }
      } catch {
        // Ignore malformed realtime messages.
      }
    };

    this.socket.onclose = () => {
      this.stopHeartbeat();
      this.socket = null;
      this.scheduleReconnect();
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.stopHeartbeat();

    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.socket?.close();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.events.complete();
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectTimer !== null) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send('ping');
      }
    }, 25000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
