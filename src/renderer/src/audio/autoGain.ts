/** Автонормализация — даже тихий сигнал даёт видимый % на шкале. */
export class AutoGain {
  private peak = 0.0001

  normalize(raw: number): number {
    if (raw > this.peak) {
      this.peak = raw
    } else {
      this.peak = this.peak * 0.998 + raw * 0.002
    }
    const floor = Math.max(this.peak, 0.0001)
    return Math.min(1, raw / floor)
  }

  reset(): void {
    this.peak = 0.0001
  }
}
