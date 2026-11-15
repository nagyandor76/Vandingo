---
status: done
blocked_by: [3]
---

# 04: Javítás kirakás közben: ⌫ és a lerakott betű visszavétele

Forrás: [spec](../spec.md), „A válasz kirakása”.

**What to build:** A Participant javíthat kirakás közben. A ⌫ gomb visszaadja az utoljára lerakott betűt. A válaszsorban egy lerakott betűre koppintva az az egy betű visszakerül a gombok közé, a helye üres marad, és a következő gomb az első üres helyet tölti ki. Kiértékelt Blockban egyik művelet sem hat.

**Blocked by:** 03

**Status:** done

- [x] ⌫: az utoljára lerakott betű visszakerül, a gombja újra használható
- [x] Lerakott betűre koppintás: az a betű visszakerül, a helye üres marad
- [x] A következő lerakás az első üres helyet tölti ki
- [x] Kiértékelt Blockban a ⌫ és a visszavétel nem hat
- [x] Tesztek a Practice modulon

## Comments

- 2026-11-15: Elkészült. Engine: `takeBackLast` (a lerakás sorrendjét a `placingOrder` őrzi, így az időrendben utolsót veszi vissza) és `takeBack(place)` (a válaszsor helye, az előre kiírt karaktereket is beleszámolva). Képernyő: a válaszsor lerakott betűi koppinthatók, a ⌫ az alsó sávban, a tipp mellett. Hosszú, egyszavas kifejezésnél (pl. 20 betű 360 px-en) a válaszsor helyei kb. 13 px-esre zsugorodnak, ott a koppintás nehéz; a ⌫ ilyenkor is működik.
