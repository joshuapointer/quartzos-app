import type { ConnectionState } from './types';

type TransitionListener = (prev: ConnectionState, next: ConnectionState) => void;

const LEGAL_TRANSITIONS: Record<ConnectionState, ConnectionState[]> = {
  IDLE:         ['SCANNING', 'ERROR'],
  SCANNING:     ['CONNECTING', 'IDLE'],
  CONNECTING:   ['DISCOVERING', 'RECONNECTING', 'IDLE'],
  DISCOVERING:  ['SUBSCRIBING', 'RECONNECTING'],
  SUBSCRIBING:  ['READY', 'RECONNECTING'],
  READY:        ['RECONNECTING', 'IDLE', 'ERROR'],
  RECONNECTING: ['CONNECTING', 'IDLE', 'ERROR'],
  ERROR:        ['IDLE'],
};

export class ConnectionStateMachine {
  private state: ConnectionState = 'IDLE';
  private listener: TransitionListener | null = null;

  get current(): ConnectionState {
    return this.state;
  }

  canTransition(next: ConnectionState): boolean {
    if (next === this.state) return false;
    return LEGAL_TRANSITIONS[this.state].includes(next);
  }

  transition(next: ConnectionState): void {
    if (next === this.state) return;
    if (!LEGAL_TRANSITIONS[this.state].includes(next)) {
      if (__DEV__) {
        throw new Error(
          `Illegal BLE state transition: ${this.state} -> ${next}`,
        );
      }
      return;
    }
    const prev = this.state;
    this.state = next;
    this.listener?.(prev, next);
  }

  onTransition(listener: TransitionListener): void {
    this.listener = listener;
  }
}
