# 🏴‍☠️ Fortnite Pirate Token Item Shop Simulator

Een complete simulator gebaseerd op het officiële **Fortnite Treasure Hunters** mini-seizoen event rond de ultra-zeldzame **Pirate Token** (Pirate Shop Access).

---

## 🌟 Wat is de Pirate Token?
In het *Treasure Hunters* mini-seizoen heeft Epic Games een extreem zeldzame drop in Battle Royale schatkisten gestopt:
- **Drop Rate:** 1 op 137.500 per normale kist (0,00073%).
- **Jackpot Animatie:** Kist trilt, explodeert met gouden stralen en toont:
  `"YOU FOUND PIRATE SHOP ACCESS"`
- **Beloning:** 2x Pirate Shop Tokens (2026 & 2027).
- **Effect van "Plunder the Item Shop":** 14 aaneengesloten dagen lang is **alles in de Fortnite Item Shop 100% GRATIS (0 V-Bucks)**!

---

## ⚡ Functionaliteiten in deze Simulator

1. **Live & Actuele Item Shop:**
   - Haalt live data op via `https://fortnite-api.com/v2/shop` met directe fallback naar een complete offline snapshot (360+ items).
   - Inclusief Marvel, Star Wars, One Piece, Peak Style, Jam Tracks, Cars, etc.
   - Originele V-Bucks prijzen doorgestreept (`~~1500~~ 🪙 0 GRATIS`).

2. **Plunder & Claim Alles:**
   - **Plunder individuele items** met één klik.
   - **"Plunder Hele Winkel"**: claim alle 360+ items tegelijk met jackpot audio en berekening van het aantal bespaarde V-Bucks.

3. **Locker & Loadout Simulator:**
   - Bekijk al je geplunderde cosmetica.
   - Rust je actieve loadout uit (Outfit, Back Bling, Pickaxe, Glider, Emote, Jam Track).
   - Filter op type en zoek op naam.

4. **Schatkist Simulator (1 op 137.500):**
   - Interactieve 3D SVG Fortnite kist.
   - Open 1, 10 of 100 kisten tegelijk.
   - **Treasure Hour Mode:** 100x verhoogde kans (1 op 1.375).
   - **Instant Pirate Token Drop:** Test direct de spectaculaire jackpot animatie.

5. **Audio Synthesizer (Web Audio API):**
   - Authentieke geluidseffecten (kist kraken, plunder rinkels, epische jackpot fanfare) zonder afhankelijkheid van externe mp3-bestanden.

---

## 🚀 Starten
Dubbelklik op `index.html` in de map `fortnite-shop` om direct in je browser te spelen!
Of start een lokale server:
```powershell
# In PowerShell:
cd "c:\Nieuwe map\fortnite-shop"
Start-Process "index.html"
```
