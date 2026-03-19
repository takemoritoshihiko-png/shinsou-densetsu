// 音響システム（Web Audio API合成音）
var SoundSystem = {
  _ctx: null,
  _masterVol: null,
  bgmVolume: 0.7,
  seVolume: 0.8,
  _bgmOsc: null,
  _bgmGain: null,
  _bgmPlaying: false,

  init: function () {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterVol = this._ctx.createGain();
      this._masterVol.gain.value = 1;
      this._masterVol.connect(this._ctx.destination);
    } catch (e) {
      console.warn('AudioContext not available');
    }
  },

  resume: function () {
    if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume();
  },

  // --- 効果音 ---
  _playTone: function (freq, duration, type, vol, decay) {
    if (!this._ctx) return;
    this.resume();
    var osc = this._ctx.createOscillator();
    var gain = this._ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.value = freq;
    gain.gain.value = (vol || 0.15) * this.seVolume;
    gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + (duration || 0.1));
    osc.connect(gain);
    gain.connect(this._masterVol);
    osc.start();
    osc.stop(this._ctx.currentTime + (duration || 0.1));
  },

  _playNoise: function (duration, vol) {
    if (!this._ctx) return;
    this.resume();
    var bufferSize = this._ctx.sampleRate * duration;
    var buffer = this._ctx.createBuffer(1, bufferSize, this._ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    var src = this._ctx.createBufferSource();
    src.buffer = buffer;
    var gain = this._ctx.createGain();
    gain.gain.value = (vol || 0.08) * this.seVolume;
    gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration);
    src.connect(gain);
    gain.connect(this._masterVol);
    src.start();
  },

  playPhysicalAttack: function () {
    this._playNoise(0.08, 0.12);
    this._playTone(200, 0.08, 'sawtooth', 0.1);
    this._playTone(150, 0.06, 'square', 0.08);
  },

  playMagicalAttack: function () {
    this._playTone(800, 0.15, 'sine', 0.1);
    this._playTone(1200, 0.1, 'sine', 0.06);
    setTimeout(function () { SoundSystem._playTone(600, 0.12, 'triangle', 0.08); }, 50);
  },

  playUltimate: function () {
    this._playTone(400, 0.3, 'sawtooth', 0.15);
    this._playTone(600, 0.25, 'sine', 0.1);
    setTimeout(function () { SoundSystem._playTone(800, 0.3, 'sine', 0.12); }, 100);
    setTimeout(function () { SoundSystem._playTone(1000, 0.2, 'triangle', 0.1); }, 200);
  },

  playEnemyHit: function () {
    this._playTone(300, 0.06, 'square', 0.06);
  },

  playPlayerHit: function () {
    this._playTone(120, 0.1, 'sawtooth', 0.08);
    this._playNoise(0.05, 0.06);
  },

  // ドロップ音（レアリティ別）
  playDropCommon: function () {
    this._playTone(523, 0.08, 'triangle', 0.06);
  },

  playDropUncommon: function () {
    this._playTone(523, 0.08, 'triangle', 0.08);
    setTimeout(function () { SoundSystem._playTone(659, 0.08, 'triangle', 0.08); }, 60);
  },

  playDropRare: function () {
    this._playTone(523, 0.08, 'sine', 0.1);
    setTimeout(function () { SoundSystem._playTone(659, 0.08, 'sine', 0.1); }, 60);
    setTimeout(function () { SoundSystem._playTone(784, 0.12, 'sine', 0.1); }, 120);
  },

  playDropEpic: function () {
    this._playTone(523, 0.1, 'sine', 0.12);
    setTimeout(function () { SoundSystem._playTone(659, 0.1, 'sine', 0.12); }, 80);
    setTimeout(function () { SoundSystem._playTone(784, 0.1, 'sine', 0.12); }, 160);
    setTimeout(function () { SoundSystem._playTone(1047, 0.15, 'sine', 0.15); }, 240);
  },

  playDropLegend: function () {
    SoundSystem._playTone(523, 0.12, 'sine', 0.15);
    setTimeout(function () { SoundSystem._playTone(659, 0.12, 'sine', 0.15); }, 100);
    setTimeout(function () { SoundSystem._playTone(784, 0.12, 'sine', 0.15); }, 200);
    setTimeout(function () { SoundSystem._playTone(1047, 0.15, 'sine', 0.15); }, 300);
    setTimeout(function () { SoundSystem._playTone(1319, 0.2, 'sine', 0.12); }, 420);
  },

  playDrop: function (rank) {
    if (rank === 'legend') this.playDropLegend();
    else if (rank === 'epic') this.playDropEpic();
    else if (rank === 'rare') this.playDropRare();
    else if (rank === 'uncommon') this.playDropUncommon();
    else this.playDropCommon();
  },

  playLevelUp: function () {
    this._playTone(523, 0.15, 'triangle', 0.12);
    setTimeout(function () { SoundSystem._playTone(659, 0.15, 'triangle', 0.12); }, 120);
    setTimeout(function () { SoundSystem._playTone(784, 0.15, 'triangle', 0.12); }, 240);
    setTimeout(function () { SoundSystem._playTone(1047, 0.25, 'triangle', 0.15); }, 360);
  },

  // --- BGM (シンプルなループ) ---
  startBattleBGM: function () {
    if (!this._ctx || this._bgmPlaying) return;
    this.resume();
    this._bgmPlaying = true;
    var ctx = this._ctx;

    this._bgmGain = ctx.createGain();
    this._bgmGain.gain.value = 0.06 * this.bgmVolume;
    this._bgmGain.connect(this._masterVol);

    // ベースライン
    var bass = ctx.createOscillator();
    bass.type = 'triangle';
    bass.frequency.value = 110;
    var bassGain = ctx.createGain();
    bassGain.gain.value = 0.08 * this.bgmVolume;
    bass.connect(bassGain);
    bassGain.connect(this._masterVol);
    bass.start();
    this._bgmBass = bass;
    this._bgmBassGain = bassGain;

    // メロディ的なアルペジオ
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 220;
    osc.connect(this._bgmGain);
    osc.start();
    this._bgmOsc = osc;

    // LFOでメロディを揺らす
    var lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 2;
    var lfoGain = ctx.createGain();
    lfoGain.gain.value = 40;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
    this._bgmLfo = lfo;

    // リズム用
    this._bgmRhythmId = setInterval(function () {
      if (!SoundSystem._ctx || !SoundSystem._bgmPlaying) return;
      SoundSystem._playTone(80, 0.05, 'square', 0.03 * SoundSystem.bgmVolume);
    }, 500);
  },

  stopBGM: function () {
    this._bgmPlaying = false;
    try {
      if (this._bgmOsc) { this._bgmOsc.stop(); this._bgmOsc = null; }
      if (this._bgmBass) { this._bgmBass.stop(); this._bgmBass = null; }
      if (this._bgmLfo) { this._bgmLfo.stop(); this._bgmLfo = null; }
    } catch (e) {}
    if (this._bgmRhythmId) { clearInterval(this._bgmRhythmId); this._bgmRhythmId = null; }
  },
};
