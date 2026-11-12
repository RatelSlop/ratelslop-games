/**
 * Bark Fart Clicker
 * RatelSlop Studios
 */

(() => {
  'use strict';

  // ---------------- Audio Engine ----------------
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.audioBuffer = null;
      this.isMuted = false;
      this.volume = 0.8;
      this.audioPool = [];
      this.poolSize = 12;
      this.poolIndex = 0;
      this.init();
    }

    async init() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }

        const audioSource = window.BARK_FART_AUDIO_BASE64 || 'assets/audio/bark_fart.mp3';

        // Prepare HTML5 Audio fallback pool
        for (let i = 0; i < this.poolSize; i++) {
          const a = new Audio();
          a.src = audioSource;
          a.preload = 'auto';
          this.audioPool.push(a);
        }

        // Try decoding into Web Audio API for zero-latency polyphony
        if (this.ctx) {
          const resp = await fetch(audioSource);
          const arrayBuffer = await resp.arrayBuffer();
          this.audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        }
      } catch (err) {
        console.warn('Web Audio API not fully available, relying on audio pool.', err);
      }
    }

    unlock() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    setMuted(muted) {
      this.isMuted = muted;
    }

    setVolume(vol) {
      this.volume = Math.max(0, Math.min(1, vol));
    }

    playClickSound() {
      if (this.isMuted || this.volume <= 0) return;
      this.unlock();

      // Web Audio API playback
      if (this.ctx && this.audioBuffer) {
        try {
          const source = this.ctx.createBufferSource();
          source.buffer = this.audioBuffer;

          // Hilarious subtle pitch variation: 0.92 to 1.08
          const pitch = 0.92 + Math.random() * 0.16;
          source.playbackRate.value = pitch;

          const gain = this.ctx.createGain();
          gain.gain.value = this.volume;

          source.connect(gain);
          gain.connect(this.ctx.destination);
          source.start(0);
          return;
        } catch (e) {
          // fallback
        }
      }

      // Fallback: Audio pool
      try {
        const audio = this.audioPool[this.poolIndex];
        this.poolIndex = (this.poolIndex + 1) % this.poolSize;
        audio.currentTime = 0;
        audio.volume = this.volume;
        audio.playbackRate = 0.94 + Math.random() * 0.12;
        audio.play().catch(() => {});
      } catch (e) {}
    }
  }

  // ---------------- Game Data Definitions ----------------
  const BUILDINGS_DEF = [
    {
      id: 'baby_pug',
      name: 'Puppy Windje',
      icon: '🐶',
      baseCost: 15,
      baseBfps: 0.5,
      desc: 'Schattig, klein en onschuldig... totdat je in dezelfde kamer zit.'
    },
    {
      id: 'bean_kibble',
      name: 'Bonenbrokjes',
      icon: '🥣',
      baseCost: 100,
      baseBfps: 4,
      desc: '100% natuurlijke vezels en bruine bonen voor maximale gasopbouw.'
    },
    {
      id: 'megaphone',
      name: 'Megafoon Halsband',
      icon: '📢',
      baseCost: 1100,
      baseBfps: 32,
      desc: 'Versterkt elke blaf tot de ruiten van de buren zachtjes trillen.'
    },
    {
      id: 'chihuahua',
      name: 'Chihuahua Triller',
      icon: '🐕',
      baseCost: 12000,
      baseBfps: 260,
      desc: 'Trilt 400 keer per minuut. Elke trilling perst er een scheetje uit.'
    },
    {
      id: 'gas_lab',
      name: 'Retriever Gas-Lab',
      icon: '🧪',
      baseCost: 130000,
      baseBfps: 1400,
      desc: 'Topgeheime formule om geluidsgolven en geurconcentraties te optimaliseren.'
    },
    {
      id: 'taco_truck',
      name: 'Taco Hondentruck',
      icon: '🌮',
      baseCost: 1400000,
      baseBfps: 7800,
      desc: 'Onbeperkt bonenburrito\'s voor alle viervoeters in de buurt.'
    },
    {
      id: 'fart_reactor',
      name: 'Blaf-Scheet Centrale',
      icon: '⚡',
      baseCost: 20000000,
      baseBfps: 44000,
      desc: 'Puur biologische, hernieuwbare scheet-energie voor een hele stad.'
    },
    {
      id: 'cosmic_doge',
      name: 'Dimensionale Schetengod',
      icon: '🌌',
      baseCost: 330000000,
      baseBfps: 260000,
      desc: 'Een almachtige kosmische hond die door ruimte en tijd scheten lanceert.'
    },
    {
      id: 'fart_wormhole',
      name: 'Scheet-Wormhole',
      icon: '🌀',
      baseCost: 5000000000,
      baseBfps: 1800000,
      desc: 'Importeert oergassen rechtstreeks uit de Oerknal.'
    }
  ];

  const UPGRADES_DEF = [
    {
      id: 'click_1',
      name: 'Versterkte Poot',
      icon: '🐾',
      cost: 100,
      desc: 'Klikken leveren 2x zoveel blaf-scheten op.',
      requires: { totalClicks: 1 },
      apply: (state) => { state.clickMultiplier *= 2; }
    },
    {
      id: 'click_2',
      name: 'Titanium Klauw',
      icon: '🦾',
      cost: 800,
      desc: 'Klikken leveren nog eens 2x zoveel blaf-scheten op.',
      requires: { totalClicks: 50 },
      apply: (state) => { state.clickMultiplier *= 2; }
    },
    {
      id: 'click_synergy',
      name: 'Dubbele Uitlaat',
      icon: '💨',
      cost: 3000,
      desc: 'Elke klik krijgt +3% van je totale BFPS als bonus!',
      requires: { bfps: 20 },
      apply: (state) => { state.clickBfpsPercent += 0.03; }
    },
    {
      id: 'crit_master',
      name: 'Supercritische Scheet',
      icon: '💥',
      cost: 15000,
      desc: '5% kans op een kritieke scheet die 8x zoveel oplevert!',
      requires: { totalClicks: 100 },
      apply: (state) => { state.critChance += 0.05; }
    },
    {
      id: 'pug_1',
      name: 'Extra Knuffelig',
      icon: '🍼',
      cost: 250,
      desc: 'Puppy Windjes produceren 2x zoveel BFPS.',
      requires: { building: 'baby_pug', count: 1 },
      apply: (state) => { state.buildingMultipliers['baby_pug'] = (state.buildingMultipliers['baby_pug'] || 1) * 2; }
    },
    {
      id: 'pug_2',
      name: 'Gegiste Babymelk',
      icon: '🥛',
      cost: 1500,
      desc: 'Puppy Windjes produceren opnieuw 2x zoveel BFPS.',
      requires: { building: 'baby_pug', count: 10 },
      apply: (state) => { state.buildingMultipliers['baby_pug'] = (state.buildingMultipliers['baby_pug'] || 1) * 2; }
    },
    {
      id: 'bean_1',
      name: 'Extra Pittige Chilisaus',
      icon: '🌶️',
      cost: 1000,
      desc: 'Bonenbrokjes zijn 2x effectiever.',
      requires: { building: 'bean_kibble', count: 1 },
      apply: (state) => { state.buildingMultipliers['bean_kibble'] = (state.buildingMultipliers['bean_kibble'] || 1) * 2; }
    },
    {
      id: 'bean_2',
      name: 'Kidneybonen Formule',
      icon: '🥫',
      cost: 8000,
      desc: 'Bonenbrokjes zijn opnieuw 2x effectiever.',
      requires: { building: 'bean_kibble', count: 10 },
      apply: (state) => { state.buildingMultipliers['bean_kibble'] = (state.buildingMultipliers['bean_kibble'] || 1) * 2; }
    },
    {
      id: 'mega_1',
      name: 'Subwoofer Integratie',
      icon: '🔊',
      cost: 12000,
      desc: 'Megafoon Halsbanden zijn 2x effectiever.',
      requires: { building: 'megaphone', count: 1 },
      apply: (state) => { state.buildingMultipliers['megaphone'] = (state.buildingMultipliers['megaphone'] || 1) * 2; }
    },
    {
      id: 'chih_1',
      name: 'Espresso Bakje',
      icon: '☕',
      cost: 100000,
      desc: 'Chihuahua Trillers trillen 2x zo snel (2x BFPS).',
      requires: { building: 'chihuahua', count: 1 },
      apply: (state) => { state.buildingMultipliers['chihuahua'] = (state.buildingMultipliers['chihuahua'] || 1) * 2; }
    },
    {
      id: 'lab_1',
      name: 'Zwavel-Verrijking',
      icon: '☣️',
      cost: 1200000,
      desc: 'Retriever Gas-Labs zijn 2x effectiever.',
      requires: { building: 'gas_lab', count: 1 },
      apply: (state) => { state.buildingMultipliers['gas_lab'] = (state.buildingMultipliers['gas_lab'] || 1) * 2; }
    },
    {
      id: 'taco_1',
      name: 'Extra Guacamole & Jalapeño',
      icon: '🥑',
      cost: 12000000,
      desc: 'Taco Hondentrucks zijn 2x effectiever.',
      requires: { building: 'taco_truck', count: 1 },
      apply: (state) => { state.buildingMultipliers['taco_truck'] = (state.buildingMultipliers['taco_truck'] || 1) * 2; }
    },
    {
      id: 'golden_luck',
      name: 'Gouden Hondenbot',
      icon: '🦴',
      cost: 50000,
      desc: 'Gouden Scheten verschijnen 40% vaker!',
      requires: { totalBf: 10000 },
      apply: (state) => { state.goldenFartFreqMult *= 1.4; }
    },
    {
      id: 'golden_power',
      name: 'Midas Geurwolk',
      icon: '✨',
      cost: 250000,
      desc: 'Gouden Scheet Frenzy duurt 50% langer!',
      requires: { goldenClicks: 1 },
      apply: (state) => { state.goldenBuffDurationMult *= 1.5; }
    },
    {
      id: 'global_1',
      name: 'Supernova Scheet',
      icon: '🌟',
      cost: 5000000,
      desc: 'Alle BFPS wereldwijd wordt verdubbeld (+100%)!',
      requires: { totalBf: 1000000 },
      apply: (state) => { state.globalBfpsMultiplier *= 2; }
    },
    {
      id: 'global_2',
      name: 'Galactische Drukketel',
      icon: '🪐',
      cost: 500000000,
      desc: 'Alle BFPS opnieuw x2!',
      requires: { totalBf: 100000000 },
      apply: (state) => { state.globalBfpsMultiplier *= 2; }
    }
  ];

  const ACHIEVEMENTS_DEF = [
    { id: 'first_click', name: 'Eerste Puf', icon: '💨', desc: 'Maak je allereerste blaf-scheet.', check: (s) => s.totalClicks >= 1 },
    { id: 'clicks_50', name: 'Kwispelvinger', icon: '🐾', desc: 'Klik 50 keer handmatig.', check: (s) => s.totalClicks >= 50 },
    { id: 'clicks_250', name: 'Snelle Pootjes', icon: '⚡', desc: 'Klik 250 keer handmatig.', check: (s) => s.totalClicks >= 250 },
    { id: 'clicks_1000', name: 'Blaf-Maniak', icon: '🔥', desc: 'Klik 1.000 keer handmatig!', check: (s) => s.totalClicks >= 1000 },
    { id: 'bf_100', name: 'Kleine Geur', icon: '👃', desc: 'Produceer 100 blaf-scheten in totaal.', check: (s) => s.totalBfProduced >= 100 },
    { id: 'bf_1k', name: 'Verse Wind', icon: '🍃', desc: 'Produceer 1.000 blaf-scheten in totaal.', check: (s) => s.totalBfProduced >= 1000 },
    { id: 'bf_50k', name: 'Stankoverlast', icon: '🦨', desc: 'Produceer 50.000 blaf-scheten.', check: (s) => s.totalBfProduced >= 50000 },
    { id: 'bf_1m', name: 'Miljonair in Gas', icon: '💰', desc: 'Bereik 1.000.000 blaf-scheten!', check: (s) => s.totalBfProduced >= 1000000 },
    { id: 'bf_100m', name: 'Stank Alarm Fase 4', icon: '🚨', desc: 'Bereik 100.000.000 blaf-scheten!', check: (s) => s.totalBfProduced >= 100000000 },
    { id: 'bf_1b', name: 'Kosmische Knal', icon: '🌌', desc: 'Bereik 1.000.000.000 blaf-scheten!', check: (s) => s.totalBfProduced >= 1000000000 },
    { id: 'first_building', name: 'Puppy Liefde', icon: '🐶', desc: 'Koop je eerste Puppy Windje.', check: (s) => (s.buildings['baby_pug'] || 0) >= 1 },
    { id: 'ten_beans', name: 'Bonen Feestmaal', icon: '🍲', desc: 'Bezit minstens 10 Bonenbrokjes.', check: (s) => (s.buildings['bean_kibble'] || 0) >= 10 },
    { id: 'loud_dog', name: 'Geluidsbarrière Verbroken', icon: '📢', desc: 'Koop een Megafoon Halsband.', check: (s) => (s.buildings['megaphone'] || 0) >= 1 },
    { id: 'crazy_chih', name: 'Bibber Koning', icon: '🐕', desc: 'Koop een Chihuahua Triller.', check: (s) => (s.buildings['chihuahua'] || 0) >= 1 },
    { id: 'mad_science', name: 'Gekke Geurwetenschapper', icon: '🧪', desc: 'Koop een Retriever Gas-Lab.', check: (s) => (s.buildings['gas_lab'] || 0) >= 1 },
    { id: 'taco_fiesta', name: 'Taco Tuesday', icon: '🌮', desc: 'Koop een Taco Hondentruck.', check: (s) => (s.buildings['taco_truck'] || 0) >= 1 },
    { id: 'fart_power', name: 'Schone Hernieuwbare Energie', icon: '⚡', desc: 'Bouw een Blaf-Scheet Centrale.', check: (s) => (s.buildings['fart_reactor'] || 0) >= 1 },
    { id: 'golden_one', name: 'Goud in Handen', icon: '✨', desc: 'Vang een Gouden Scheet.', check: (s) => s.goldenClicks >= 1 },
    { id: 'golden_five', name: 'Gouden Schatzoeker', icon: '🏆', desc: 'Vang 5 Gouden Scheten.', check: (s) => s.goldenClicks >= 5 },
    { id: 'high_bfps', name: 'Supersonische Windkracht', icon: '🌪️', desc: 'Bereik 5.000 BFPS.', check: (s) => s.currentBfps >= 5000 }
  ];

  const ATMOSPHERES = [
    { threshold: 0, name: 'Frisse Huiskamer', desc: 'Alles is nog veilig...' },
    { threshold: 1000, name: 'Lichte Wase', desc: 'Ruikt iemand hier iets?' },
    { threshold: 25000, name: 'Stankalarm Geel', desc: 'Ramen tegen elkaar openzetten!' },
    { threshold: 500000, name: 'Gasmasker Verplicht', desc: 'Evacuatie van de straat in gang gezet.' },
    { threshold: 10000000, name: 'Seismische Schokken', desc: 'De aarde trilt op het ritme van de scheten.' },
    { threshold: 200000000, name: 'Galactische Schetennevel', desc: 'Astronomen zien een nieuwe groene wolk in de Melkweg!' }
  ];

  // ---------------- Game Controller ----------------
  class Game {
    constructor() {
      this.sound = new SoundEngine();

      this.state = {
        barkFarts: 0,
        totalBfProduced: 0,
        manualBfProduced: 0,
        totalClicks: 0,
        goldenClicks: 0,
        playtimeSeconds: 0,
        lastTickTime: Date.now(),
        lastSaveTime: Date.now(),

        // Multipliers
        clickMultiplier: 1,
        clickBfpsPercent: 0,
        critChance: 0.05,
        globalBfpsMultiplier: 1,
        goldenFartFreqMult: 1,
        goldenBuffDurationMult: 1,

        // Inventory
        buildings: {},
        buildingMultipliers: {},
        upgradesOwned: {},
        achievementsUnlocked: {},

        // Active Buffs
        buffs: []
      };

      this.buyMultiplier = 1; // 1, 10, 100
      this.currentBfps = 0;
      this.currentBfpc = 1;

      this.goldenFartTimer = null;
      this.isGoldenFartActive = false;

      this.initDom();
      this.loadGame();
      this.initEvents();
      this.startLoop();
      this.scheduleNextGoldenFart();
    }

    initDom() {
      this.el = {
        barkCount: document.getElementById('bark-count'),
        bfpsRate: document.getElementById('bfps-rate'),
        bfpcRate: document.getElementById('bfpc-rate'),
        atmosphereName: document.getElementById('atmosphere-name'),
        atmosphereDesc: document.getElementById('atmosphere-desc'),
        meterBarFill: document.getElementById('meter-bar-fill'),
        dogButton: document.getElementById('dog-button'),
        dogArena: document.getElementById('dog-arena'),
        particleContainer: document.getElementById('particle-container'),
        buildingsList: document.getElementById('buildings-list'),
        upgradesList: document.getElementById('upgrades-list'),
        achievementsList: document.getElementById('achievements-list'),
        badgeUpgrades: document.getElementById('badge-upgrades'),
        badgeAchievements: document.getElementById('badge-achievements'),
        activeBuffs: document.getElementById('active-buffs'),
        goldenFart: document.getElementById('golden-fart'),
        toastContainer: document.getElementById('toast-container'),

        // Stats
        statTotalClicks: document.getElementById('stat-total-clicks'),
        statManualBf: document.getElementById('stat-manual-bf'),
        statAlltimeBf: document.getElementById('stat-alltime-bf'),
        statGoldenClicks: document.getElementById('stat-golden-clicks'),
        statAchievementsCount: document.getElementById('stat-achievements-count'),
        statPlaytime: document.getElementById('stat-playtime'),
        achievementsSummary: document.getElementById('achievements-summary'),

        // Audio controls
        btnAudioToggle: document.getElementById('btn-audio-toggle'),
        audioIcon: document.getElementById('audio-icon'),
        volumeSlider: document.getElementById('volume-slider')
      };
    }

    initEvents() {
      // Click on Dog
      const handleDogClick = (e) => {
        e.preventDefault();
        this.clickDog(e.clientX, e.clientY);
      };

      this.el.dogButton.addEventListener('pointerdown', handleDogClick);

      // Keyboard support: Space / Enter
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
          if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            const rect = this.el.dogButton.getBoundingClientRect();
            this.clickDog(rect.left + rect.width / 2, rect.top + rect.height / 2);
          }
        }
      });

      // Tabs navigation
      document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
          document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));

          btn.classList.add('active');
          const targetTab = btn.dataset.tab;
          const targetPane = document.getElementById(`tab-${targetTab}`);
          if (targetPane) targetPane.classList.add('active');
        });
      });

      // Buy multiplier switchers (1x, 10x, 100x)
      document.querySelectorAll('.buy-mult-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.buy-mult-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.buyMultiplier = parseInt(btn.dataset.mult, 10) || 1;
          this.renderBuildings();
        });
      });

      // Golden Fart Click
      this.el.goldenFart.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.clickGoldenFart();
      });

      // Audio Toggle & Slider
      this.el.btnAudioToggle.addEventListener('click', () => {
        const isMuted = !this.sound.isMuted;
        this.sound.setMuted(isMuted);
        this.el.audioIcon.textContent = isMuted ? '🔇' : '🔊';
        this.showToast(isMuted ? 'Geluid gedempt' : 'Geluid ingeschakeld');
      });

      this.el.volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.sound.setVolume(val);
        if (val === 0) {
          this.el.audioIcon.textContent = '🔇';
        } else if (this.sound.isMuted) {
          this.sound.setMuted(false);
          this.el.audioIcon.textContent = '🔊';
        }
      });

      // Save Controls
      document.getElementById('btn-save')?.addEventListener('click', () => {
        this.saveGame();
        this.showToast('💾 Spel succesvol handmatig opgeslagen!');
      });

      document.getElementById('btn-export')?.addEventListener('click', () => {
        const data = btoa(JSON.stringify(this.state));
        navigator.clipboard?.writeText(data).then(() => {
          this.showToast('📋 Save-code gekopieerd naar klembord!');
        }).catch(() => {
          prompt('Kopieer je save-code hieronder:', data);
        });
      });

      document.getElementById('btn-import')?.addEventListener('click', () => {
        const input = prompt('Plak hier je save-code:');
        if (input) {
          try {
            const parsed = JSON.parse(atob(input.trim()));
            if (parsed && typeof parsed.barkFarts === 'number') {
              this.state = Object.assign(this.state, parsed);
              this.recalculateUpgrades();
              this.saveGame();
              this.renderAll();
              this.showToast('📥 Save succesvol geïmporteerd!');
            } else {
              throw new Error('Ongeldig save bestand');
            }
          } catch (err) {
            alert('Ongeldige save-code!');
          }
        }
      });

      document.getElementById('btn-wipe')?.addEventListener('click', () => {
        if (confirm('Weet je zeker dat je alle voortgang wilt wissen? Dit kan niet ongedaan worden gemaakt!')) {
          localStorage.removeItem('bark_fart_clicker_save');
          location.reload();
        }
      });
    }

    // ---------------- Clicking Logic ----------------
    clickDog(clientX, clientY) {
      this.sound.playClickSound();

      // Trigger Visual Squash & Barking Animation on Dog
      this.el.dogButton.classList.remove('barking');
      void this.el.dogButton.offsetWidth; // trigger reflow
      this.el.dogButton.classList.add('barking');

      setTimeout(() => {
        this.el.dogButton.classList.remove('barking');
      }, 280);

      // Calculate Click Value
      let clickPower = this.calculateBfpc();
      const isCrit = Math.random() < this.state.critChance;
      if (isCrit) {
        clickPower *= 8;
      }

      // Golden Fart Click Buff
      const clickFrenzyBuff = this.state.buffs.find((b) => b.type === 'click_storm');
      if (clickFrenzyBuff) {
        clickPower *= 77;
      }

      this.state.barkFarts += clickPower;
      this.state.totalBfProduced += clickPower;
      this.state.manualBfProduced += clickPower;
      this.state.totalClicks += 1;

      // Spawn floating numbers & particles
      this.spawnClickFx(clientX, clientY, clickPower, isCrit);

      this.checkAchievements();
      this.updateScoreDom();
    }

    calculateBfpc() {
      let base = 1 * this.state.clickMultiplier;
      if (this.state.clickBfpsPercent > 0) {
        base += this.currentBfps * this.state.clickBfpsPercent;
      }
      return Math.max(1, Math.round(base));
    }

    spawnClickFx(clientX, clientY, value, isCrit) {
      const arenaRect = this.el.dogArena.getBoundingClientRect();
      let x, y;

      if (clientX && clientY) {
        x = clientX - arenaRect.left;
        y = clientY - arenaRect.top;
      } else {
        x = arenaRect.width / 2 + (Math.random() * 80 - 40);
        y = arenaRect.height / 2 + (Math.random() * 80 - 40);
      }

      // Floating text
      const elText = document.createElement('div');
      elText.className = `floating-text ${isCrit ? 'crit' : ''}`;
      elText.textContent = `${isCrit ? '💥 CRIT! +' : '+'}${this.formatNumber(value)}`;
      elText.style.left = `${x}px`;
      elText.style.top = `${y}px`;
      elText.style.setProperty('--dx', `${(Math.random() - 0.5) * 60}px`);

      this.el.particleContainer.appendChild(elText);
      setTimeout(() => elText.remove(), 1000);

      // Random floating emoji particle
      const emojis = ['💨', '🦴', '🐾', '✨', '🐶'];
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const elEmoji = document.createElement('div');
      elEmoji.className = 'floating-emoji';
      elEmoji.textContent = emoji;
      elEmoji.style.left = `${x + (Math.random() - 0.5) * 40}px`;
      elEmoji.style.top = `${y + (Math.random() - 0.5) * 40}px`;
      elEmoji.style.setProperty('--dx', `${(Math.random() - 0.5) * 100}px`);
      elEmoji.style.setProperty('--rot', `${(Math.random() - 0.5) * 90}deg`);

      this.el.particleContainer.appendChild(elEmoji);
      setTimeout(() => elEmoji.remove(), 950);
    }

    // ---------------- Economy & Buildings ----------------
    getBuildingCost(def, currentCount, quantity = 1) {
      let total = 0;
      for (let i = 0; i < quantity; i++) {
        total += Math.round(def.baseCost * Math.pow(1.15, currentCount + i));
      }
      return total;
    }

    buyBuilding(buildingId) {
      const def = BUILDINGS_DEF.find((b) => b.id === buildingId);
      if (!def) return;

      const currentCount = this.state.buildings[buildingId] || 0;
      const cost = this.getBuildingCost(def, currentCount, this.buyMultiplier);

      if (this.state.barkFarts >= cost) {
        this.state.barkFarts -= cost;
        this.state.buildings[buildingId] = currentCount + this.buyMultiplier;
        this.sound.playClickSound();
        this.calculateRates();
        this.checkAchievements();
        this.renderBuildings();
        this.updateScoreDom();
      } else {
        this.showToast('Niet genoeg Blaf-Scheten!');
      }
    }

    buyUpgrade(upgradeId) {
      const def = UPGRADES_DEF.find((u) => u.id === upgradeId);
      if (!def || this.state.upgradesOwned[upgradeId]) return;

      if (this.state.barkFarts >= def.cost) {
        this.state.barkFarts -= def.cost;
        this.state.upgradesOwned[upgradeId] = true;
        def.apply(this.state);
        this.sound.playClickSound();
        this.showToast(`⚡ Upgrade ontgrendeld: ${def.name}!`);
        this.calculateRates();
        this.checkAchievements();
        this.renderUpgrades();
        this.updateScoreDom();
      }
    }

    recalculateUpgrades() {
      // Reset multipliers to defaults
      this.state.clickMultiplier = 1;
      this.state.clickBfpsPercent = 0;
      this.state.critChance = 0.05;
      this.state.globalBfpsMultiplier = 1;
      this.state.goldenFartFreqMult = 1;
      this.state.goldenBuffDurationMult = 1;
      this.state.buildingMultipliers = {};

      for (const def of UPGRADES_DEF) {
        if (this.state.upgradesOwned[def.id]) {
          def.apply(this.state);
        }
      }
      this.calculateRates();
    }

    calculateRates() {
      let bfps = 0;
      for (const def of BUILDINGS_DEF) {
        const count = this.state.buildings[def.id] || 0;
        const mult = this.state.buildingMultipliers[def.id] || 1;
        bfps += count * def.baseBfps * mult;
      }

      // Global multiplier
      bfps *= this.state.globalBfpsMultiplier;

      // Active Buff Multipliers
      const frenzyBuff = this.state.buffs.find((b) => b.type === 'fart_frenzy');
      if (frenzyBuff) {
        bfps *= 7;
      }

      this.currentBfps = bfps;
      this.currentBfpc = this.calculateBfpc();
    }

    // ---------------- Golden Fart Mechanics ----------------
    scheduleNextGoldenFart() {
      if (this.goldenFartTimer) clearTimeout(this.goldenFartTimer);
      // Spawns every 45 - 80s divided by multiplier
      const baseDelay = (45 + Math.random() * 35) * 1000;
      const delay = Math.max(15000, baseDelay / (this.state.goldenFartFreqMult || 1));

      this.goldenFartTimer = setTimeout(() => {
        this.spawnGoldenFart();
      }, delay);
    }

    spawnGoldenFart() {
      if (this.isGoldenFartActive) return;
      this.isGoldenFartActive = true;

      const arena = this.el.dogArena;
      const arenaRect = arena.getBoundingClientRect();

      // Random starting coordinates
      const startX = 20 + Math.random() * (arenaRect.width - 90);
      const startY = 20 + Math.random() * (arenaRect.height - 90);

      this.el.goldenFart.style.left = `${startX}px`;
      this.el.goldenFart.style.top = `${startY}px`;
      this.el.goldenFart.hidden = false;

      // Floating drift animation
      let driftTime = 0;
      const driftInterval = setInterval(() => {
        driftTime += 0.05;
        const curX = startX + Math.sin(driftTime * 2) * 50;
        const curY = startY + Math.cos(driftTime * 1.5) * 35;
        this.el.goldenFart.style.left = `${curX}px`;
        this.el.goldenFart.style.top = `${curY}px`;
      }, 50);

      // Disappears if unclicked after 13 seconds
      const timeout = setTimeout(() => {
        clearInterval(driftInterval);
        this.despawnGoldenFart();
      }, 13000);

      this.goldenFartDrift = driftInterval;
      this.goldenFartTimeout = timeout;
    }

    clickGoldenFart() {
      if (!this.isGoldenFartActive) return;
      this.sound.playClickSound();

      clearInterval(this.goldenFartDrift);
      clearTimeout(this.goldenFartTimeout);
      this.despawnGoldenFart();

      this.state.goldenClicks += 1;

      // Random Buff Selection
      const rand = Math.random();
      if (rand < 0.45) {
        // FART FRENZY: 7x BFPS for 30s
        const duration = Math.round(30 * this.state.goldenBuffDurationMult);
        this.addBuff('fart_frenzy', '🔥 FART FRENZY! (7x BFPS)', duration);
        this.showToast(`🐕✨ GOUDEN SCHEET! Fart Frenzy (7x BFPS) voor ${duration}s!`);
      } else if (rand < 0.75) {
        // CLICK STORM: 77x BFPC for 15s
        const duration = Math.round(15 * this.state.goldenBuffDurationMult);
        this.addBuff('click_storm', '⚡ CLICK STORM! (77x Kliks)', duration);
        this.showToast(`🐕✨ GOUDEN SCHEET! Click Storm (77x per klik) voor ${duration}s!`);
      } else {
        // INSTANT WINDFALL: 15% of bank or 15 mins of BFPS
        const windfall = Math.max(100, Math.round(this.state.barkFarts * 0.15), Math.round(this.currentBfps * 900));
        this.state.barkFarts += windfall;
        this.state.totalBfProduced += windfall;
        this.showToast(`🐕✨ GOUDEN SCHEET! Directe bonus van +${this.formatNumber(windfall)} Blaf-Scheten!`);
      }

      this.calculateRates();
      this.checkAchievements();
      this.updateScoreDom();
    }

    despawnGoldenFart() {
      this.isGoldenFartActive = false;
      this.el.goldenFart.hidden = true;
      this.scheduleNextGoldenFart();
    }

    addBuff(type, label, durationSeconds) {
      // Overwrite or extend existing buff
      const existing = this.state.buffs.find((b) => b.type === type);
      if (existing) {
        existing.remainingSeconds += durationSeconds;
      } else {
        this.state.buffs.push({
          type,
          label,
          remainingSeconds: durationSeconds
        });
      }
      this.calculateRates();
      this.renderBuffs();
    }

    updateBuffs(deltaSeconds) {
      if (!this.state.buffs.length) return;

      for (let i = this.state.buffs.length - 1; i >= 0; i--) {
        const b = this.state.buffs[i];
        b.remainingSeconds -= deltaSeconds;
        if (b.remainingSeconds <= 0) {
          this.state.buffs.splice(i, 1);
          this.calculateRates();
        }
      }
      this.renderBuffs();
    }

    renderBuffs() {
      this.el.activeBuffs.innerHTML = '';
      for (const b of this.state.buffs) {
        const div = document.createElement('div');
        div.className = 'buff-item';
        div.innerHTML = `<span>${b.label}</span><span class="buff-time">${Math.ceil(b.remainingSeconds)}s</span>`;
        this.el.activeBuffs.appendChild(div);
      }
    }

    // ---------------- Achievements & Atmosphere ----------------
    checkAchievements() {
      let newlyUnlocked = 0;
      for (const ach of ACHIEVEMENTS_DEF) {
        if (!this.state.achievementsUnlocked[ach.id] && ach.check(this.state)) {
          this.state.achievementsUnlocked[ach.id] = true;
          newlyUnlocked++;
          this.showToast(`🏆 Prestatie behaald: ${ach.name}!`, 'achievement');
        }
      }
      if (newlyUnlocked > 0) {
        this.renderAchievements();
      }
    }

    getAtmosphereLevel() {
      const total = this.state.totalBfProduced;
      let cur = ATMOSPHERES[0];
      let nextThreshold = ATMOSPHERES[1].threshold;

      for (let i = 0; i < ATMOSPHERES.length; i++) {
        if (total >= ATMOSPHERES[i].threshold) {
          cur = ATMOSPHERES[i];
          nextThreshold = ATMOSPHERES[i + 1] ? ATMOSPHERES[i + 1].threshold : ATMOSPHERES[i].threshold * 2;
        }
      }
      return { cur, nextThreshold };
    }

    // ---------------- Main Loop ----------------
    startLoop() {
      setInterval(() => {
        const now = Date.now();
        const delta = (now - this.state.lastTickTime) / 1000;
        this.state.lastTickTime = now;

        // Passive BFPS generation
        if (this.currentBfps > 0) {
          const generated = this.currentBfps * delta;
          this.state.barkFarts += generated;
          this.state.totalBfProduced += generated;
        }

        this.state.playtimeSeconds += delta;
        this.updateBuffs(delta);
        this.updateScoreDom();

        // Auto-save every 5 seconds
        if (now - this.state.lastSaveTime > 5000) {
          this.saveGame();
          this.state.lastSaveTime = now;
        }
      }, 100);

      // Periodic slower updates for UI
      setInterval(() => {
        this.updateAffordability();
        this.updateStatsDom();
      }, 400);
    }

    // ---------------- Rendering & DOM ----------------
    updateScoreDom() {
      this.el.barkCount.textContent = this.formatNumber(Math.floor(this.state.barkFarts));
      this.el.bfpsRate.textContent = this.formatNumber(this.currentBfps, 1);
      this.el.bfpcRate.textContent = `+${this.formatNumber(this.currentBfpc)}`;

      // Atmosphere
      const { cur, nextThreshold } = this.getAtmosphereLevel();
      this.el.atmosphereName.textContent = cur.name;
      this.el.atmosphereDesc.textContent = cur.desc;

      const progress = Math.min(100, Math.max(0, (this.state.totalBfProduced / nextThreshold) * 100));
      this.el.meterBarFill.style.width = `${progress}%`;
    }

    updateAffordability() {
      // Update building buttons affordability classes
      document.querySelectorAll('.building-card').forEach((card) => {
        const id = card.dataset.id;
        const def = BUILDINGS_DEF.find((b) => b.id === id);
        if (!def) return;
        const count = this.state.buildings[id] || 0;
        const cost = this.getBuildingCost(def, count, this.buyMultiplier);
        const canAfford = this.state.barkFarts >= cost;

        card.classList.toggle('can-afford', canAfford);
        card.classList.toggle('cannot-afford', !canAfford);
      });

      // Update upgrade buttons affordability classes
      document.querySelectorAll('.upgrade-card').forEach((card) => {
        const id = card.dataset.id;
        const def = UPGRADES_DEF.find((u) => u.id === id);
        if (!def) return;
        const canAfford = this.state.barkFarts >= def.cost;

        card.classList.toggle('can-afford', canAfford);
        card.classList.toggle('cannot-afford', !canAfford);
      });
    }

    renderBuildings() {
      this.el.buildingsList.innerHTML = '';
      for (const def of BUILDINGS_DEF) {
        const count = this.state.buildings[def.id] || 0;
        const cost = this.getBuildingCost(def, count, this.buyMultiplier);
        const canAfford = this.state.barkFarts >= cost;

        const card = document.createElement('div');
        card.className = `building-card ${canAfford ? 'can-afford' : 'cannot-afford'}`;
        card.dataset.id = def.id;

        const bfpsTotal = count * def.baseBfps * (this.state.buildingMultipliers[def.id] || 1);

        card.innerHTML = `
          <div class="building-icon">${def.icon}</div>
          <div class="building-details">
            <div class="building-header">
              <span class="building-name">${def.name}</span>
              <span class="building-count">${count}</span>
            </div>
            <p class="building-desc">${def.desc}</p>
            <div class="building-footer">
              <span class="building-price">💰 ${this.formatNumber(cost)} BF</span>
              <span class="building-cps">+${this.formatNumber(bfpsTotal, 1)} BFPS</span>
            </div>
          </div>
        `;

        card.onclick = () => this.buyBuilding(def.id);
        this.el.buildingsList.appendChild(card);
      }
    }

    renderUpgrades() {
      this.el.upgradesList.innerHTML = '';
      let availableCount = 0;

      for (const def of UPGRADES_DEF) {
        if (this.state.upgradesOwned[def.id]) continue; // Already owned

        // Check if requirement is met to reveal
        let meetsReq = true;
        if (def.requires) {
          if (def.requires.totalClicks && this.state.totalClicks < def.requires.totalClicks) meetsReq = false;
          if (def.requires.totalBf && this.state.totalBfProduced < def.requires.totalBf) meetsReq = false;
          if (def.requires.bfps && this.currentBfps < def.requires.bfps) meetsReq = false;
          if (def.requires.goldenClicks && this.state.goldenClicks < def.requires.goldenClicks) meetsReq = false;
          if (def.requires.building) {
            const count = this.state.buildings[def.requires.building] || 0;
            if (count < def.requires.count) meetsReq = false;
          }
        }

        if (!meetsReq) continue;

        availableCount++;
        const canAfford = this.state.barkFarts >= def.cost;

        const card = document.createElement('div');
        card.className = `upgrade-card ${canAfford ? 'can-afford' : 'cannot-afford'}`;
        card.dataset.id = def.id;

        card.innerHTML = `
          <div class="upgrade-top">
            <div class="upgrade-icon">${def.icon}</div>
            <span class="upgrade-name">${def.name}</span>
          </div>
          <p class="upgrade-desc">${def.desc}</p>
          <span class="upgrade-price">⚡ ${this.formatNumber(def.cost)} BF</span>
        `;

        card.onclick = () => this.buyUpgrade(def.id);
        this.el.upgradesList.appendChild(card);
      }

      const noUpgrades = document.getElementById('no-upgrades-msg');
      if (noUpgrades) noUpgrades.hidden = availableCount > 0;

      if (this.el.badgeUpgrades) {
        this.el.badgeUpgrades.hidden = availableCount === 0;
        this.el.badgeUpgrades.textContent = availableCount;
      }
    }

    renderAchievements() {
      this.el.achievementsList.innerHTML = '';
      let unlockedCount = 0;

      for (const ach of ACHIEVEMENTS_DEF) {
        const isUnlocked = !!this.state.achievementsUnlocked[ach.id];
        if (isUnlocked) unlockedCount++;

        const card = document.createElement('div');
        card.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;

        card.innerHTML = `
          <div class="achievement-icon">${ach.icon}</div>
          <div class="achievement-details">
            <div class="achievement-name">${ach.name}</div>
            <div class="achievement-desc">${ach.desc}</div>
          </div>
        `;

        this.el.achievementsList.appendChild(card);
      }

      const summaryText = `${unlockedCount} / ${ACHIEVEMENTS_DEF.length}`;
      if (this.el.badgeAchievements) this.el.badgeAchievements.textContent = summaryText;
      if (this.el.achievementsSummary) this.el.achievementsSummary.textContent = summaryText;
      if (this.el.statAchievementsCount) this.el.statAchievementsCount.textContent = summaryText;
    }

    updateStatsDom() {
      this.el.statTotalClicks.textContent = this.state.totalClicks.toLocaleString();
      this.el.statManualBf.textContent = this.formatNumber(Math.floor(this.state.manualBfProduced));
      this.el.statAlltimeBf.textContent = this.formatNumber(Math.floor(this.state.totalBfProduced));
      this.el.statGoldenClicks.textContent = this.state.goldenClicks.toLocaleString();

      const mins = Math.floor(this.state.playtimeSeconds / 60);
      const hours = Math.floor(mins / 60);
      if (hours > 0) {
        this.el.statPlaytime.textContent = `${hours}u ${mins % 60}m`;
      } else {
        this.el.statPlaytime.textContent = `${mins}m`;
      }
    }

    renderAll() {
      this.renderBuildings();
      this.renderUpgrades();
      this.renderAchievements();
      this.renderBuffs();
      this.updateScoreDom();
      this.updateStatsDom();
    }

    showToast(message, type = 'normal') {
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.innerHTML = message;
      this.el.toastContainer.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }

    formatNumber(num, decimals = 0) {
      if (num === null || isNaN(num)) return '0';
      if (num < 1000) return decimals > 0 ? num.toFixed(decimals) : Math.floor(num).toString();

      const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
      const i = Math.floor(Math.log10(num) / 3);
      if (i >= suffixes.length) return num.toExponential(2);

      const formatted = (num / Math.pow(10, i * 3)).toFixed(2);
      return `${formatted} ${suffixes[i]}`;
    }

    // ---------------- Save & Load ----------------
    saveGame() {
      try {
        const payload = JSON.stringify(this.state);
        localStorage.setItem('bark_fart_clicker_save', payload);
      } catch (e) {
        console.warn('Failed to save to localStorage', e);
      }
    }

    loadGame() {
      try {
        const saved = localStorage.getItem('bark_fart_clicker_save');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.state = Object.assign(this.state, parsed);

          // Calculate offline progress
          const now = Date.now();
          const elapsedSec = (now - (this.state.lastTickTime || now)) / 1000;
          this.recalculateUpgrades();

          if (elapsedSec > 10 && this.currentBfps > 0) {
            const offlineEarnings = Math.min(this.currentBfps * elapsedSec * 0.8, this.currentBfps * 86400);
            if (offlineEarnings > 0) {
              this.state.barkFarts += offlineEarnings;
              this.state.totalBfProduced += offlineEarnings;
              setTimeout(() => {
                this.showToast(`💤 Welkom terug! Je hondjes hebben offline +${this.formatNumber(offlineEarnings)} Blaf-Scheten verzameld!`);
              }, 800);
            }
          }
          this.state.lastTickTime = now;
        } else {
          this.recalculateUpgrades();
        }
      } catch (e) {
        console.warn('Failed to load from localStorage', e);
        this.recalculateUpgrades();
      }

      this.renderAll();
    }
  }

  // Initialize on load
  window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
  });
})();
