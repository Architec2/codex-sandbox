export class AudioSystem {
  ctx?: AudioContext;
  volume = 0.3;
  ping(freq = 440, d = 0.08) {
    if (!this.ctx) this.ctx = new AudioContext();
    const o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d);
    o.connect(g).connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + d);
  }
}
