---
status: ready-for-agent
blocked_by: [3]
---

# 06: Telefonra méretezett gombok

Forrás: [spec](../spec.md), „Képernyő-elrendezés”.

**What to build:** A betűzős Block egy telefonképernyőn, görgetés nélkül mutatja a magyar jelentést, a válaszsort, a gombokat és a ⌫ gombot. A gombok kitöltik a szélességet a lehető legkevesebb, legfeljebb három sorban, és kevesebb betűnél nagyobbak, kb. 64 px-ig. Megállapodás szerint nincs hozzá automatikus teszt.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Legfeljebb 24 gomb elfér három sorban egy 360 px széles képernyőn
- [ ] Rövid szónál (pl. `hit`) egy sor nagy gomb, kb. 64 px-ig
- [ ] A Block görgetés nélkül elfér
- [ ] Kézi ellenőrzés telefonos nézetben egy rövid szóval és egy 22 betűs kifejezéssel
