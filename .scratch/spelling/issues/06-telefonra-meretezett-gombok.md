---
status: done
blocked_by: [3]
---

# 06: Telefonra méretezett gombok

Forrás: [spec](../spec.md), „Képernyő-elrendezés”.

**What to build:** A betűzős Block egy telefonképernyőn, görgetés nélkül mutatja a magyar jelentést, a válaszsort, a gombokat és a ⌫ gombot. A gombok kitöltik a szélességet a lehető legkevesebb, legfeljebb három sorban, és kevesebb betűnél nagyobbak, kb. 64 px-ig. Megállapodás szerint nincs hozzá automatikus teszt.

**Blocked by:** 03

**Status:** done

- [x] Legfeljebb 24 gomb elfér három sorban egy 360 px széles képernyőn
- [x] Rövid szónál (pl. `hit`) egy sor nagy gomb, kb. 64 px-ig
- [x] A Block görgetés nélkül elfér
- [x] Kézi ellenőrzés telefonos nézetben egy rövid szóval és egy 22 betűs kifejezéssel

## Comments

- 2026-11-15: Elkészült. Szabály: a legkevesebb sor (legfeljebb 3), amelyben a gombok legalább 56 px-esek; ha egyikben sem, akkor 3 sor, a lehető legnagyobb gombokkal, legfeljebb 64 px. Így szélesebb telefonon sosem kisebbek a gombok. A szélességet `ResizeObserver` méri az első kirajzolás előtt. A válaszsor csak szóközöknél tör, a helyek a leghosszabb szóhoz zsugorodnak. Kiértékelés után minden gomb elhalványul (a specen túli apróság). Kézi ellenőrzés Playwrighttal, 360×740 és 412×915 px, ideiglenes adatkönyvtárral: 5, 13, 22 és 24 gombos szavak, sehol nincs görgetés; 24 gomb 3 sorban 35 px (360) / 42 px (412); `hit` 1 sorban 60/64 px; 13 gomb 3 sorban 60/64 px.
