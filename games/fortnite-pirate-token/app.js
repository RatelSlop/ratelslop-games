/**
 * Fortnite Pirate Token Item Shop Simulator
 * Features:
 * - Live Fortnite Item Shop via https://fortnite-api.com/v2/shop with offline fallback
 * - 1 in 137,500 Chest Simulator with "YOU FOUND PIRATE SHOP ACCESS" sequence
 * - 14-day "Plunder the Item Shop" Free Shopping Spree (0 V-Bucks)
 * - "Plunder Entire Shop" (Claim Alles Gratis)
 * - Locker & Loadout Equip System
 * - Synthesized Web Audio FX (no external audio dependencies)
 */

(function () {
  'use strict';

  // --- AUDIO SYNTHESIZER (Web Audio API) ---
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.volume = 0.7;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playClick() {
      if (this.muted) return;
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(this.volume * 0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    }

    playChestOpen() {
      if (this.muted) return;
      this.init();
      const t = this.ctx.currentTime;
      // Low wooden creak rumble
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(90, t);
      osc1.frequency.linearRampToValueAtTime(140, t + 0.15);
      gain1.gain.setValueAtTime(this.volume * 0.4, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.2);

      // Shimmering chime
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(520, t + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(1040, t + 0.35);
      gain2.gain.setValueAtTime(0.001, t);
      gain2.gain.setValueAtTime(this.volume * 0.3, t + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t + 0.08);
      osc2.stop(t + 0.4);
    }

    playPlunderChime() {
      if (this.muted) return;
      this.init();
      const t = this.ctx.currentTime;
      // Cash register coin ping (two quick bright bells)
      const freqs = [1046.5, 1318.5, 2093]; // C6, E6, C7
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = t + (idx * 0.06);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(this.volume * 0.45, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.28);
      });
    }

    playEquipSound() {
      if (this.muted) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(640, t + 0.12);
      gain.gain.setValueAtTime(this.volume * 0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    }

    playJackpotFanfare() {
      if (this.muted) return;
      this.init();
      const t = this.ctx.currentTime;

      // Heavy explosion bass drop
      const bass = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bass.type = 'sawtooth';
      bass.frequency.setValueAtTime(160, t);
      bass.frequency.exponentialRampToValueAtTime(35, t + 0.7);
      bassGain.gain.setValueAtTime(this.volume * 0.8, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
      bass.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bass.start(t);
      bass.stop(t + 0.75);

      // Heroic Pirate Chords (F, A, C, F)
      const chordNotes = [
        { f: 349.23, time: 0.1 },  // F4
        { f: 440.00, time: 0.22 }, // A4
        { f: 523.25, time: 0.35 }, // C5
        { f: 698.46, time: 0.5 },  // F5
        { f: 880.00, time: 0.65 }, // A5
        { f: 1046.5, time: 0.8 }   // C6
      ];

      chordNotes.forEach(item => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = t + item.time;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, startTime);
        gain.gain.setValueAtTime(this.volume * 0.55, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    }
  }

  const sfx = new SoundFX();

  // --- STATE STORAGE ---
  const STORAGE_KEY = 'fn_pirate_simulator_v2';

  const defaultState = {
    tokens: 2, // 2026 and 2027 tokens
    tokensFound: 0,
    chestsOpened: 0,
    plunderActive: true, // active by default so user can instantly plunder everything for free!
    plunderExpiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days
    ownedItemIds: [],
    vbucksSaved: 0,
    equipped: {
      outfit: null,
      backbling: null,
      pickaxe: null,
      glider: null,
      emote: null,
      track: null
    }
  };

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaultState };
      const parsed = JSON.parse(raw);
      return { ...defaultState, ...parsed };
    } catch (e) {
      console.warn('Could not parse localStorage, resetting to default:', e);
      return { ...defaultState };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
    updateUIHeaderStats();
  }

  // --- NORMALIZED ITEMS DATA ---
  let allNormalizedItems = [];
  let currentActiveCategory = 'ALL';
  let currentActiveRarity = 'ALL';
  let currentActiveLockerType = 'ALL';
  let modalActiveItem = null;

  // --- REGULAR CHEST LOOT TABLE ---
  const CHEST_LOOT_TABLE = [
    { name: 'Gouden Scar (Legendary Assault Rifle)', rarity: 'legendary' },
    { name: 'Paarse Pump Shotgun (Epic)', rarity: 'epic' },
    { name: 'Blauwe Tactical Shotgun (Rare)', rarity: 'rare' },
    { name: 'Chug Jug (Legendary Healing)', rarity: 'legendary' },
    { name: 'Slurp Juice (Epic Healing)', rarity: 'epic' },
    { name: 'Shield Potion x2 (50 Shield)', rarity: 'rare' },
    { name: 'Mini Shield Potions x3', rarity: 'uncommon' },
    { name: 'Gouden Bolt-Action Sniper', rarity: 'legendary' },
    { name: 'Grappler (Epic Mobility)', rarity: 'epic' },
    { name: 'Launch Pad (Trap)', rarity: 'epic' },
    { name: 'Goudstaven (150 Bars)', rarity: 'uncommon' },
    { name: 'Groene Assault Rifle + Medium Ammo', rarity: 'uncommon' },
    { name: 'Paarse SMG (Submachine Gun)', rarity: 'epic' }
  ];

  // --- INITIALIZATION ---
  window.addEventListener('DOMContentLoaded', () => {
    initDOMListeners();
    initCountdownTimer();
    loadShopData();
    renderEquippedLoadout();
    updateUIHeaderStats();
  });

  // --- DATA LOADING & NORMALIZATION ---
  async function loadShopData() {
    showToast('Winkel laden...', 'info');

    let shopData = null;

    // 1. Try Live Fortnite API
    try {
      const res = await fetch('https://fortnite-api.com/v2/shop', { cache: 'no-cache' });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 200 && json.data && json.data.entries) {
          shopData = json.data;
          console.log('Loaded shop live from Fortnite-API.com:', json.data.entries.length, 'entries');
        }
      }
    } catch (err) {
      console.warn('Live API fetch failed, falling back to local snapshot:', err);
    }

    // 2. Fallback to bundled data if live fetch failed
    if (!shopData && window.FALLBACK_SHOP_DATA && window.FALLBACK_SHOP_DATA.data) {
      shopData = window.FALLBACK_SHOP_DATA.data;
      console.log('Loaded shop from bundled fallback snapshot');
    }

    if (!shopData || !shopData.entries) {
      showToast('Kon geen winkeldata laden!', 'error');
      return;
    }

    allNormalizedItems = normalizeEntries(shopData.entries);
    document.getElementById('nav-shop-count').textContent = allNormalizedItems.length;

    renderCategoryFilters(allNormalizedItems);
    renderShopView();
    renderLockerView();
    showToast(`Geladen! ${allNormalizedItems.length} items gratis beschikbaar met Pirate Token!`, 'success');
  }

  function normalizeEntries(entries) {
    const items = [];
    const seenIds = new Set();

    entries.forEach((entry, idx) => {
      const layoutName = (entry.layout && entry.layout.name) ? entry.layout.name.trim() : 'Overige Items';
      const regularPrice = entry.regularPrice || entry.finalPrice || 1200;

      // Case 1: BR Items (Skins, Pickaxes, Gliders, Emotes, Backpacks, etc.)
      if (entry.brItems && entry.brItems.length > 0) {
        entry.brItems.forEach((brItem, subIdx) => {
          if (seenIds.has(brItem.id)) return;
          seenIds.add(brItem.id);

          const rawRarity = (brItem.rarity && brItem.rarity.value) ? brItem.rarity.value.toLowerCase() : 'uncommon';
          const seriesName = (brItem.series && brItem.series.value) ? brItem.series.value : '';
          const typeVal = (brItem.type && brItem.type.value) ? brItem.type.value.toLowerCase() : 'outfit';
          const typeDisplay = (brItem.type && brItem.type.displayValue) ? brItem.type.displayValue : 'Cosmetic';

          // Choose best image
          let img = '';
          if (entry.newDisplayAsset && entry.newDisplayAsset.renderImages && entry.newDisplayAsset.renderImages.length > 0) {
            img = entry.newDisplayAsset.renderImages[0].image;
          } else if (brItem.images) {
            img = brItem.images.featured || brItem.images.icon || brItem.images.smallIcon || '';
          }

          items.push({
            id: brItem.id,
            name: brItem.name || 'Cosmetic Item',
            type: typeVal,
            displayType: typeDisplay,
            category: layoutName,
            rarity: seriesName ? seriesNameToRaritySlug(seriesName) : rawRarity,
            rarityDisplay: seriesName || (brItem.rarity && brItem.rarity.displayValue) || 'Special',
            series: seriesName,
            image: img || 'https://fortnite-api.com/images/vbuck.png',
            description: brItem.description || 'Geen beschrijving beschikbaar.',
            set: brItem.set ? brItem.set.text : '',
            intro: brItem.introduction ? brItem.introduction.text : '',
            originalPrice: regularPrice
          });
        });
      }

      // Case 2: Jam Tracks
      if (entry.tracks && entry.tracks.length > 0) {
        entry.tracks.forEach(track => {
          if (seenIds.has(track.id)) return;
          seenIds.add(track.id);

          items.push({
            id: track.id,
            name: `${track.title} — ${track.artist}`,
            type: 'track',
            displayType: 'Jam Track',
            category: 'Jam Tracks',
            rarity: 'icon',
            rarityDisplay: 'Festival Icon',
            series: 'Icon Series',
            image: track.albumArt || 'https://fortnite-api.com/images/vbuck.png',
            description: `Jam Track van ${track.artist} (${track.releaseYear}). BPM: ${track.bpm}, Duur: ${Math.floor(track.duration / 60)}m${track.duration % 60}s.`,
            set: 'Fortnite Festival',
            intro: 'Introduced in Chapter 5',
            originalPrice: regularPrice
          });
        });
      }

      // Case 3: Cars
      if (entry.cars && entry.cars.length > 0) {
        entry.cars.forEach(car => {
          if (seenIds.has(car.id)) return;
          seenIds.add(car.id);

          items.push({
            id: car.id,
            name: car.name || 'Rocket Racing Car',
            type: 'car',
            displayType: 'Car Body',
            category: layoutName.includes('Car') || layoutName.includes('Bugatti') ? layoutName : 'Rocket Racing',
            rarity: 'rare',
            rarityDisplay: 'Rocket Racing',
            series: '',
            image: (car.images && (car.images.icon || car.images.smallIcon)) || 'https://fortnite-api.com/images/vbuck.png',
            description: car.description || 'Equip in Rocket Racing en Battle Royale!',
            set: 'Rocket Racing Vehicle',
            intro: 'Chapter 5',
            originalPrice: regularPrice
          });
        });
      }
    });

    return items;
  }

  function seriesNameToRaritySlug(series) {
    const s = series.toLowerCase();
    if (s.includes('marvel')) return 'marvel';
    if (s.includes('star wars') || s.includes('starwars')) return 'starwars';
    if (s.includes('icon')) return 'icon';
    if (s.includes('gaming') || s.includes('platform')) return 'gaminglegends';
    return 'epic';
  }

  // --- UI RENDERING ---

  function renderCategoryFilters(items) {
    const categories = new Set();
    items.forEach(i => categories.add(i.category));

    const container = document.getElementById('category-filters');
    container.innerHTML = '<button class="filter-pill active" data-category="ALL">Alle Categorieën</button>';

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-pill';
      btn.dataset.category = cat;
      btn.textContent = cat;
      btn.addEventListener('click', () => {
        container.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentActiveCategory = cat;
        sfx.playClick();
        renderShopView();
      });
      container.appendChild(btn);
    });

    // "All" button event
    container.querySelector('[data-category="ALL"]').addEventListener('click', (e) => {
      container.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentActiveCategory = 'ALL';
      sfx.playClick();
      renderShopView();
    });
  }

  function renderShopView() {
    const container = document.getElementById('shop-sections-container');
    container.innerHTML = '';

    const searchQuery = (document.getElementById('shop-search').value || '').trim().toLowerCase();

    // Filter items
    const filtered = allNormalizedItems.filter(item => {
      // Category check
      if (currentActiveCategory !== 'ALL' && item.category !== currentActiveCategory) {
        return false;
      }
      // Rarity check
      if (currentActiveRarity !== 'ALL') {
        if (item.rarity !== currentActiveRarity) return false;
      }
      // Search check
      if (searchQuery) {
        const matchesName = item.name.toLowerCase().includes(searchQuery);
        const matchesDesc = item.description.toLowerCase().includes(searchQuery);
        const matchesSet = item.set.toLowerCase().includes(searchQuery);
        if (!matchesName && !matchesDesc && !matchesSet) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #94a3b8;">
          <div style="font-size: 48px; margin-bottom: 12px;">🏴‍☠️🔍</div>
          <h3 style="font-family: var(--font-display); font-size: 24px; color: #fff;">Geen items gevonden</h3>
          <p>Probeer een andere zoekterm of categorie filter.</p>
        </div>
      `;
      return;
    }

    // Group by category
    const grouped = {};
    filtered.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    // Render each category section
    Object.keys(grouped).forEach(catName => {
      const catItems = grouped[catName];
      const section = document.createElement('div');
      section.className = 'shop-section';

      const header = document.createElement('div');
      header.className = 'section-header';
      header.innerHTML = `
        <h2 class="section-title">${escapeHTML(catName)}</h2>
        <span class="section-count">${catItems.length} ITEMS</span>
      `;
      section.appendChild(header);

      const grid = document.createElement('div');
      grid.className = 'shop-grid';

      catItems.forEach(item => {
        const card = createItemCard(item);
        grid.appendChild(card);
      });

      section.appendChild(grid);
      container.appendChild(section);
    });
  }

  function createItemCard(item) {
    const card = document.createElement('div');
    const isOwned = state.ownedItemIds.includes(item.id);
    card.className = `item-card rarity-${item.rarity} ${isOwned ? 'claimed' : ''}`;

    const seriesBadgeHTML = item.series ? `<div class="series-badge">${escapeHTML(item.series)}</div>` : '';
    const claimedBadgeHTML = isOwned ? `<div class="claimed-badge">✓ IN BEZIT</div>` : '';

    card.innerHTML = `
      <div class="rarity-stripe"></div>
      <div class="card-visual-wrap">
        ${seriesBadgeHTML}
        ${claimedBadgeHTML}
        <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" class="card-img" loading="lazy" onerror="this.src='https://fortnite-api.com/images/vbuck.png'">
      </div>
      <div class="card-info">
        <div>
          <span class="card-type">${escapeHTML(item.displayType)}</span>
          <h3 class="card-title" title="${escapeHTML(item.name)}">${escapeHTML(item.name)}</h3>
        </div>
        <div class="card-footer">
          <div class="price-display">
            <span class="original-price">${item.originalPrice.toLocaleString('nl-NL')} V-Bucks</span>
            <span class="free-price">🪙 0 GRATIS</span>
          </div>
          <button class="btn-card-plunder ${isOwned ? 'owned' : ''}" data-item-id="${item.id}">
            ${isOwned ? 'Uitgerust' : 'Plunder'}
          </button>
        </div>
      </div>
    `;

    // Click card to open modal inspector
    card.addEventListener('click', (e) => {
      // If clicked the plunder button directly
      if (e.target.closest('.btn-card-plunder')) {
        e.stopPropagation();
        if (!isOwned) {
          plunderItem(item);
        } else {
          equipItem(item);
        }
        return;
      }
      openItemModal(item);
    });

    return card;
  }

  // --- PLUNDER ACTIONS ---

  function plunderItem(item) {
    if (state.ownedItemIds.includes(item.id)) return;

    state.ownedItemIds.push(item.id);
    state.vbucksSaved += item.originalPrice;
    saveState();

    sfx.playPlunderChime();
    showToast(`🏴‍☠️ Geplunderd: ${item.name} (+${item.originalPrice} V-Bucks bespaard)!`, 'success');

    // Auto-equip if first outfit
    if (item.type === 'outfit' && !state.equipped.outfit) {
      equipItem(item, false);
    }

    renderShopView();
    renderLockerView();
  }

  function plunderAllItems() {
    let newlyClaimed = 0;
    let addedValue = 0;

    allNormalizedItems.forEach(item => {
      if (!state.ownedItemIds.includes(item.id)) {
        state.ownedItemIds.push(item.id);
        addedValue += item.originalPrice;
        newlyClaimed++;
      }
    });

    if (newlyClaimed === 0) {
      showToast('Je bezit alle huidige winkel-items al in je Locker!', 'info');
      return;
    }

    state.vbucksSaved += addedValue;
    saveState();

    sfx.playJackpotFanfare();
    showToast(`🏴‍☠️ WINKEL GEPLUNDERD! ${newlyClaimed} items geclaimd (${addedValue.toLocaleString('nl-NL')} V-Bucks gratis)!`, 'success');

    renderShopView();
    renderLockerView();
  }

  // --- LOCKER & LOADOUT SYSTEM ---

  function renderLockerView() {
    const grid = document.getElementById('locker-grid');
    grid.innerHTML = '';

    const searchQuery = (document.getElementById('locker-search').value || '').trim().toLowerCase();
    const ownedItems = allNormalizedItems.filter(item => state.ownedItemIds.includes(item.id));

    document.getElementById('locker-total-display').textContent = ownedItems.length;

    const filtered = ownedItems.filter(item => {
      if (currentActiveLockerType !== 'ALL') {
        if (item.type !== currentActiveLockerType) return false;
      }
      if (searchQuery) {
        if (!item.name.toLowerCase().includes(searchQuery)) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; color: #94a3b8;">
          <div style="font-size: 40px; margin-bottom: 10px;">🎒</div>
          <p>Nog geen items in deze categorie. Plunder items in de Item Shop!</p>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = `item-card rarity-${item.rarity} claimed`;

      const isEquipped = checkIfEquipped(item);

      card.innerHTML = `
        <div class="rarity-stripe"></div>
        <div class="card-visual-wrap">
          <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" class="card-img" loading="lazy">
          ${isEquipped ? '<div class="claimed-badge" style="background:#ffd700; color:#000;">⭐ UITGERUST</div>' : ''}
        </div>
        <div class="card-info">
          <div>
            <span class="card-type">${escapeHTML(item.displayType)}</span>
            <h4 class="card-title">${escapeHTML(item.name)}</h4>
          </div>
          <div class="card-footer">
            <button class="btn-card-plunder" style="width:100%;" data-equip-id="${item.id}">
              ${isEquipped ? '✓ In Gebruik' : 'Uitrusten'}
            </button>
          </div>
        </div>
      `;

      card.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        equipItem(item);
      });

      card.addEventListener('click', () => {
        openItemModal(item);
      });

      grid.appendChild(card);
    });
  }

  function checkIfEquipped(item) {
    if (!state.equipped) return false;
    return Object.values(state.equipped).some(eq => eq && eq.id === item.id);
  }

  function equipItem(item, playSound = true) {
    let slotKey = null;

    if (item.type === 'outfit') slotKey = 'outfit';
    else if (item.type === 'backpack') slotKey = 'backbling';
    else if (item.type === 'pickaxe') slotKey = 'pickaxe';
    else if (item.type === 'glider') slotKey = 'glider';
    else if (item.type === 'emote') slotKey = 'emote';
    else if (item.type === 'track') slotKey = 'track';
    else slotKey = 'outfit';

    state.equipped[slotKey] = {
      id: item.id,
      name: item.name,
      image: item.image,
      type: item.displayType
    };

    saveState();
    renderEquippedLoadout();
    renderLockerView();

    if (playSound) {
      sfx.playEquipSound();
      showToast(`Uitgerust: ${item.name}!`, 'info');
    }
  }

  function renderEquippedLoadout() {
    const slots = ['outfit', 'backbling', 'pickaxe', 'glider', 'emote', 'track'];
    slots.forEach(slotKey => {
      const el = document.getElementById(`slot-${slotKey}`);
      if (!el) return;
      const data = state.equipped[slotKey];
      const img = el.querySelector('.slot-icon-img');
      const name = el.querySelector('.slot-name');

      if (data && data.image) {
        el.classList.add('filled');
        img.src = data.image;
        img.style.display = 'block';
        name.textContent = data.name;
        name.title = data.name;
      } else {
        el.classList.remove('filled');
        img.style.display = 'none';
        name.textContent = 'Niet uitgerust';
      }
    });
  }

  // --- CHEST SIMULATOR & PIRATE TOKEN JACKPOT ---

  let forceNextPirateToken = false;

  function openChest(count = 1) {
    const isTreasureHour = document.getElementById('toggle-treasure-hour').checked;
    // Base drop rate: 1 in 137,500
    // Treasure hour: 1 in 1,375
    const odds = isTreasureHour ? (1 / 1375) : (1 / 137500);

    const chestVisual = document.getElementById('chest-interactive');
    chestVisual.classList.add('shaking');
    sfx.playChestOpen();

    setTimeout(() => {
      chestVisual.classList.remove('shaking');

      let foundPirateToken = false;

      for (let i = 0; i < count; i++) {
        state.chestsOpened++;
        const roll = Math.random();
        if (roll < odds || forceNextPirateToken) {
          foundPirateToken = true;
          forceNextPirateToken = false;
          state.tokensFound++;
          state.tokens += 2; // Epic awards 2 tokens
          break;
        }
      }

      if (foundPirateToken) {
        triggerJackpotSequence();
      } else {
        // Regular chest loot
        const randomLoot = CHEST_LOOT_TABLE[Math.floor(Math.random() * CHEST_LOOT_TABLE.length)];
        logChestLoot(`${count > 1 ? count + 'x Kisten: ' : ''}${randomLoot.name}`);
      }

      saveState();
      updateChestStatsUI();
    }, 280);
  }

  function triggerJackpotSequence() {
    sfx.playJackpotFanfare();

    // Screen shake
    document.body.style.animation = 'chestShake 0.5s';
    setTimeout(() => {
      document.body.style.animation = '';
    }, 500);

    const jackpotModal = document.getElementById('jackpot-modal');
    jackpotModal.classList.add('active');

    logChestLoot('☠️ JACKPOT! YOU FOUND PIRATE SHOP ACCESS! (2x Tokens)', true);
  }

  function logChestLoot(text, isJackpot = false) {
    const log = document.getElementById('chest-loot-log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${isJackpot ? 'jackpot' : ''}`;
    const time = new Date().toLocaleTimeString('nl-NL');
    entry.textContent = `[${time}] ${text}`;
    log.prepend(entry);
  }

  function updateChestStatsUI() {
    document.getElementById('stat-chests-opened').textContent = state.chestsOpened.toLocaleString('nl-NL');
    document.getElementById('stat-tokens-found').textContent = state.tokensFound;

    const isTreasureHour = document.getElementById('toggle-treasure-hour').checked;
    document.getElementById('stat-current-odds').textContent = isTreasureHour
      ? '1 op 1.375 (Treasure Hour 100x Boost!)'
      : '1 op 137.500 (0.00073%)';
  }

  // --- ITEM MODAL INSPECTOR ---

  function openItemModal(item) {
    modalActiveItem = item;
    const modal = document.getElementById('item-modal');
    const isOwned = state.ownedItemIds.includes(item.id);

    document.getElementById('modal-img').src = item.image;
    document.getElementById('modal-type').textContent = `${item.rarityDisplay} • ${item.displayType}`;
    document.getElementById('modal-title').textContent = item.name;
    document.getElementById('modal-desc').textContent = item.description;
    document.getElementById('modal-meta-set').innerHTML = `Set: <strong>${escapeHTML(item.set || 'Geen set')}</strong>`;
    document.getElementById('modal-meta-intro').innerHTML = `Intro: <strong>${escapeHTML(item.intro || 'Fortnite Universe')}</strong>`;
    document.getElementById('modal-meta-price').innerHTML = `Originele Waarde: <strong>${item.originalPrice.toLocaleString('nl-NL')} V-Bucks</strong> (Nu: <span style="color:var(--gold-primary);">0 V-Bucks</span>)`;

    const actionBtn = document.getElementById('btn-modal-action');
    if (isOwned) {
      actionBtn.textContent = '⭐ Uitrusten in Locker';
      actionBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
      actionBtn.style.color = '#fff';
    } else {
      actionBtn.textContent = '🏴‍☠️ Plunder Gratis (0 V-Bucks)';
      actionBtn.style.background = 'linear-gradient(135deg, #ffd700, #ff8800)';
      actionBtn.style.color = '#1a0f00';
    }

    modal.classList.add('active');
    sfx.playClick();
  }

  function closeItemModal() {
    document.getElementById('item-modal').classList.remove('active');
    modalActiveItem = null;
  }

  // --- COUNTDOWN TIMER (14-DAY PLUNDER ACCESS) ---

  function initCountdownTimer() {
    function updateTimer() {
      const remainingMs = Math.max(0, state.plunderExpiresAt - Date.now());
      const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((remainingMs % (1000 * 60)) / 1000);

      const formatted = `${days}d ${pad(hours)}u ${pad(mins)}m ${pad(secs)}s`;
      const el = document.getElementById('plunder-countdown');
      if (el) el.textContent = formatted;
    }

    updateTimer();
    setInterval(updateTimer, 1000);
  }

  function pad(num) {
    return num.toString().padStart(2, '0');
  }

  // --- TOAST NOTIFICATIONS ---

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = 'ℹ️';
    if (type === 'success') icon = '🏴‍☠️';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${escapeHTML(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function updateUIHeaderStats() {
    document.getElementById('stat-tokens-count').textContent = state.tokens;
    document.getElementById('stat-vbucks-saved').textContent = state.vbucksSaved.toLocaleString('nl-NL');
    document.getElementById('stat-locker-count').textContent = state.ownedItemIds.length;
  }

  // --- EVENT LISTENERS ---

  function initDOMListeners() {
    // Navigation Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
        const targetView = document.getElementById(`view-${tab}`);
        if (targetView) targetView.classList.add('active');

        sfx.playClick();
      });
    });

    // Rarity Filters in Shop
    document.querySelectorAll('#rarity-filters .filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#rarity-filters .filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentActiveRarity = btn.dataset.rarity;
        sfx.playClick();
        renderShopView();
      });
    });

    // Locker Type Filters
    document.querySelectorAll('#locker-type-filters .filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#locker-type-filters .filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentActiveLockerType = btn.dataset.lockertype;
        sfx.playClick();
        renderLockerView();
      });
    });

    // Search inputs
    document.getElementById('shop-search').addEventListener('input', () => {
      renderShopView();
    });
    document.getElementById('locker-search').addEventListener('input', () => {
      renderLockerView();
    });

    // Plunder All buttons
    document.getElementById('btn-shop-plunder-all').addEventListener('click', plunderAllItems);
    document.getElementById('btn-banner-plunder-all').addEventListener('click', plunderAllItems);

    // Refresh button
    document.getElementById('btn-refresh-shop').addEventListener('click', () => {
      sfx.playClick();
      loadShopData();
    });

    // Chest buttons
    document.getElementById('chest-interactive').addEventListener('click', () => openChest(1));
    document.getElementById('btn-open-1-chest').addEventListener('click', () => openChest(1));
    document.getElementById('btn-open-10-chests').addEventListener('click', () => openChest(10));
    document.getElementById('btn-open-100-chests').addEventListener('click', () => openChest(100));

    document.getElementById('btn-force-pirate-token').addEventListener('click', () => {
      forceNextPirateToken = true;
      sfx.playClick();
      showToast('Pirate Token drop gegarandeerd bij de volgende kist!', 'success');
      openChest(1);
    });

    document.getElementById('toggle-treasure-hour').addEventListener('change', () => {
      sfx.playClick();
      updateChestStatsUI();
      const enabled = document.getElementById('toggle-treasure-hour').checked;
      showToast(enabled ? 'Treasure Hour Actief (100x Boost)!' : 'Treasure Hour Uitgeschakeld.', 'info');
    });

    // Modal Actions
    document.getElementById('btn-modal-close').addEventListener('click', closeItemModal);
    document.getElementById('item-modal').addEventListener('click', (e) => {
      if (e.target.id === 'item-modal') closeItemModal();
    });

    document.getElementById('btn-modal-action').addEventListener('click', () => {
      if (!modalActiveItem) return;
      const isOwned = state.ownedItemIds.includes(modalActiveItem.id);
      if (isOwned) {
        equipItem(modalActiveItem);
      } else {
        plunderItem(modalActiveItem);
      }
      closeItemModal();
    });

    // Jackpot Activate button
    document.getElementById('btn-jackpot-activate').addEventListener('click', () => {
      document.getElementById('jackpot-modal').classList.remove('active');
      state.plunderActive = true;
      state.plunderExpiresAt = Date.now() + 14 * 24 * 60 * 60 * 1000;
      saveState();

      // Switch to Shop view
      document.querySelector('.tab-btn[data-tab="shop"]').click();
      sfx.playPlunderChime();
      showToast('Plunder the Item Shop is nu 14 dagen actief! Alles is gratis!', 'success');
    });

    // Audio toggle
    document.getElementById('btn-audio-toggle').addEventListener('click', () => {
      sfx.muted = !sfx.muted;
      document.getElementById('audio-icon').textContent = sfx.muted ? '🔇' : '🔊';
      showToast(sfx.muted ? 'Geluid gedempt' : 'Geluid ingeschakeld', 'info');
    });

    // Reset Data
    document.getElementById('btn-reset-data').addEventListener('click', () => {
      if (confirm('Weet je zeker dat je alle simulator data (locker, statistieken) wilt resetten?')) {
        localStorage.removeItem(STORAGE_KEY);
        state = { ...defaultState };
        saveState();
        renderEquippedLoadout();
        renderShopView();
        renderLockerView();
        updateChestStatsUI();
        showToast('Simulator gereset!', 'info');
      }
    });

    // Keyboard shortcuts: ESC closes modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeItemModal();
        document.getElementById('jackpot-modal').classList.remove('active');
      }
    });
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

})();
