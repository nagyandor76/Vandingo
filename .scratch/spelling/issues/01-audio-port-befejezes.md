---
status: done
blocked_by: []
---

# 01: Az audio port jelzi, ha egy hang vagy felolvasás véget ért

Forrás: [spec](../spec.md), „Az audio port változása”. Előkészítő refaktor a 05-ös tickethez.

**What to build:** A Practice audio portja jelzi, ha a Block hangja vagy egy felolvasás véget ért, hogy a Practice később sorba állíthassa a hangot és a felolvasást, és a felolvasás végétől számíthassa az auto-advance várakozást. A böngészős adapter a befejezést a Web Audio hangjegyek ütemezett hosszából és a beszédszintézis utterance `end` eseményéből veszi, hibánál és megszakításnál is, hogy semmi ne akadjon el. A meglévő típusok (igaz–hamis, szópárosítás) viselkedése nem változik.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] A `playBlockSound` és a `speak` jelzi a befejezést (pl. promise-t ad vissza)
- [x] A böngészős adapter hibánál és megszakításnál (`cancel`, új felolvasás) is jelzi a befejezést
- [ ] ~~A Practice modul tesztjeinek rögzítő audio portja vezérelhető befejezést kap~~ → átkerült a 05-ös ticketbe
- [x] A meglévő Practice modul- és engine-tesztek zöldek, a viselkedés változatlan
- [x] Typecheck zöld

## Comments

- 2026-11-15: Elkészült. A `speak` és a `playBlockSound` `Promise<void>`-et ad vissza, amely sosem utasít el. A böngészős adapter `end`/`error` eseményre, új felolvasásra és `stop`-ra settle-el, és egy szöveghossz alapú mentőidőzítővel is, ha a böngésző nem küld eseményt. A Block-hang a hangjegyek ütemezett végén settle-el. Eltérés: a rögzítő audio port vezérelhető befejezése a 05-ös ticketbe került, mert csak ott van fogyasztója; itt azonnal settle-el. Böngészőben még nincs kipróbálva.
