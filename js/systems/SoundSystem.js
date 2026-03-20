// 音響システム（Web Audio API合成音）
var SoundSystem = {
  _ctx: null,
  _masterVol: null,
  bgmVolume: 0.7,
  seVolume: 0.8,
  _bgmNodes: [],
  _bgmTimers: [],
  _bgmPlaying: false,

  init: function () {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterVol = this._ctx.createGain();
      this._masterVol.gain.value = 1;
      this._masterVol.connect(this._ctx.destination);
    } catch (e) {}
  },

  resume: function () {
    if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume();
  },

  _tone: function (freq, dur, type, vol) {
    if (!this._ctx) return;
    this.resume();
    var o = this._ctx.createOscillator();
    var g = this._ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.value = (vol || 0.2) * this.seVolume;
    g.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + dur);
    o.connect(g); g.connect(this._masterVol);
    o.start(); o.stop(this._ctx.currentTime + dur);
  },

  _noise: function (dur, vol) {
    if (!this._ctx) return;
    this.resume();
    var n = this._ctx.sampleRate * dur;
    var buf = this._ctx.createBuffer(1, n, this._ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var s = this._ctx.createBufferSource(); s.buffer = buf;
    var g = this._ctx.createGain();
    g.gain.value = (vol || 0.1) * this.seVolume;
    g.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + dur);
    s.connect(g); g.connect(this._masterVol); s.start();
  },

  // === 攻撃SE ===
  playPhysicalAttack: function () {
    this._noise(0.06, 0.15);
    this._tone(180, 0.08, 'sawtooth', 0.15);
    this._tone(120, 0.05, 'square', 0.1);
  },

  playMagicalAttack: function () {
    this._tone(880, 0.12, 'sine', 0.12);
    this._tone(1320, 0.08, 'sine', 0.08);
    var self = this;
    setTimeout(function () { self._tone(660, 0.1, 'triangle', 0.1); }, 40);
  },

  playUltimate: function () {
    var self = this;
    this._tone(440, 0.25, 'sawtooth', 0.18);
    this._tone(660, 0.2, 'sine', 0.12);
    setTimeout(function () { self._tone(880, 0.25, 'sine', 0.14); }, 80);
    setTimeout(function () { self._tone(1100, 0.2, 'triangle', 0.12); }, 160);
  },

  playEnemyHit: function () { this._tone(280, 0.05, 'square', 0.08); },
  playPlayerHit: function () { this._tone(100, 0.08, 'sawtooth', 0.1); this._noise(0.04, 0.08); },

  // === ドロップ音（レアリティ別・心地よいチャイム） ===
  playDropCommon: function () {
    this._tone(587, 0.12, 'sine', 0.1);
  },

  playDropUncommon: function () {
    var self = this;
    this._tone(587, 0.1, 'sine', 0.12);
    setTimeout(function () { self._tone(740, 0.1, 'sine', 0.12); }, 80);
  },

  playDropRare: function () {
    var self = this;
    this._tone(587, 0.1, 'sine', 0.14);
    setTimeout(function () { self._tone(740, 0.1, 'sine', 0.14); }, 70);
    setTimeout(function () { self._tone(880, 0.15, 'sine', 0.16); }, 140);
  },

  playDropEpic: function () {
    var self = this;
    this._tone(587, 0.1, 'sine', 0.15);
    setTimeout(function () { self._tone(740, 0.1, 'sine', 0.15); }, 70);
    setTimeout(function () { self._tone(880, 0.1, 'sine', 0.15); }, 140);
    setTimeout(function () { self._tone(1175, 0.2, 'sine', 0.18); }, 220);
  },

  playDropLegend: function () {
    var self = this;
    this._tone(587, 0.12, 'sine', 0.18);
    setTimeout(function () { self._tone(740, 0.12, 'sine', 0.18); }, 90);
    setTimeout(function () { self._tone(880, 0.12, 'sine', 0.18); }, 180);
    setTimeout(function () { self._tone(1175, 0.15, 'sine', 0.2); }, 280);
    setTimeout(function () { self._tone(1480, 0.25, 'sine', 0.15); }, 400);
    setTimeout(function () { self._tone(1175, 0.3, 'triangle', 0.1); }, 500);
  },

  playDrop: function (rank) {
    if (rank === 'legend') this.playDropLegend();
    else if (rank === 'epic') this.playDropEpic();
    else if (rank === 'rare') this.playDropRare();
    else if (rank === 'uncommon') this.playDropUncommon();
    else this.playDropCommon();
  },

  playLevelUp: function () {
    var self = this;
    this._tone(523, 0.12, 'triangle', 0.15);
    setTimeout(function () { self._tone(659, 0.12, 'triangle', 0.15); }, 100);
    setTimeout(function () { self._tone(784, 0.12, 'triangle', 0.15); }, 200);
    setTimeout(function () { self._tone(1047, 0.3, 'triangle', 0.18); }, 320);
  },

  // === BGM（ワールド別） ===
  startBattleBGM: function (world) {
    if (!this._ctx || this._bgmPlaying) return;
    this.resume();
    this._bgmPlaying = true;
    var ctx = this._ctx;
    var vol = this.bgmVolume;
    var self = this;

    // ワールド別のキー（音階）
    var keys = {
      1: { base: 130.8, melody: [262, 294, 330, 349, 392], mood: 'major' },
      2: { base: 146.8, melody: [294, 330, 370, 392, 440], mood: 'major' },
      3: { base: 110.0, melody: [220, 262, 294, 330, 392], mood: 'minor' },
      4: { base: 123.5, melody: [247, 294, 330, 370, 440], mood: 'minor' },
      5: { base: 146.8, melody: [294, 349, 392, 440, 523], mood: 'major' },
      6: { base: 110.0, melody: [220, 247, 294, 330, 370], mood: 'minor' },
      7: { base: 98.0,  melody: [196, 233, 262, 294, 349], mood: 'minor' },
      8: { base: 164.8, melody: [330, 392, 440, 523, 587], mood: 'major' },
      9: { base: 87.3,  melody: [175, 208, 233, 262, 311], mood: 'minor' },
      10:{ base: 82.4,  melody: [165, 196, 233, 262, 330], mood: 'minor' },
    };
    var k = keys[world] || keys[1];

    // ベースライン
    var bass = ctx.createOscillator();
    bass.type = 'triangle';
    bass.frequency.value = k.base;
    var bassG = ctx.createGain();
    bassG.gain.value = 0.12 * vol;
    bass.connect(bassG); bassG.connect(this._masterVol);
    bass.start();
    this._bgmNodes.push(bass);

    // ベースLFO
    var bLfo = ctx.createOscillator();
    bLfo.type = 'sine'; bLfo.frequency.value = 0.4;
    var bLfoG = ctx.createGain(); bLfoG.gain.value = 15;
    bLfo.connect(bLfoG); bLfoG.connect(bass.frequency);
    bLfo.start();
    this._bgmNodes.push(bLfo);

    // パッド（和音の持続音）
    var pad = ctx.createOscillator();
    pad.type = 'sine';
    pad.frequency.value = k.melody[0];
    var padG = ctx.createGain();
    padG.gain.value = 0.06 * vol;
    pad.connect(padG); padG.connect(this._masterVol);
    pad.start();
    this._bgmNodes.push(pad);

    // パッドのゆっくりした音程変化
    var padIdx = 0;
    this._bgmTimers.push(setInterval(function () {
      if (!self._bgmPlaying) return;
      padIdx = (padIdx + 1) % k.melody.length;
      pad.frequency.value = k.melody[padIdx] * 0.5;
    }, 2000));

    // メロディ（アルペジオ）
    var melIdx = 0;
    this._bgmTimers.push(setInterval(function () {
      if (!self._bgmPlaying || !self._ctx) return;
      var freq = k.melody[melIdx % k.melody.length];
      var o = self._ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = freq;
      var g = self._ctx.createGain();
      g.gain.value = 0.08 * self.bgmVolume;
      g.gain.exponentialRampToValueAtTime(0.001, self._ctx.currentTime + 0.4);
      o.connect(g); g.connect(self._masterVol);
      o.start(); o.stop(self._ctx.currentTime + 0.4);
      melIdx++;
    }, 500));

    // リズム（キック風）
    this._bgmTimers.push(setInterval(function () {
      if (!self._bgmPlaying || !self._ctx) return;
      var o = self._ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = 70;
      o.frequency.exponentialRampToValueAtTime(25, self._ctx.currentTime + 0.1);
      var g = self._ctx.createGain();
      g.gain.value = 0.15 * self.bgmVolume;
      g.gain.exponentialRampToValueAtTime(0.001, self._ctx.currentTime + 0.12);
      o.connect(g); g.connect(self._masterVol);
      o.start(); o.stop(self._ctx.currentTime + 0.12);
    }, k.mood === 'minor' ? 500 : 400));

    // ハイハット
    this._bgmTimers.push(setInterval(function () {
      if (!self._bgmPlaying) return;
      self._noise(0.025, 0.04 * self.bgmVolume);
    }, k.mood === 'minor' ? 250 : 200));
  },

  stopBGM: function () {
    this._bgmPlaying = false;
    for (var i = 0; i < this._bgmNodes.length; i++) {
      try { this._bgmNodes[i].stop(); } catch (e) {}
    }
    this._bgmNodes = [];
    for (var j = 0; j < this._bgmTimers.length; j++) {
      clearInterval(this._bgmTimers[j]);
    }
    this._bgmTimers = [];
  },
};
