---
status: done
blocked_by: [1]
---

# 11: Adatok letöltése ZIP-ben

Spec: [../spec.md](../spec.md) – User Story 62

**What to build:** A Beállításokban egy „Adatok letöltése” gomb a teljes adatkönyvtárat (Subjectek, Quizek, Resultok) egy ZIP-fájlként tölti le, kézi biztonsági mentésként.

- [x] API-teszt: a letöltött ZIP tartalmazza az adatkönyvtár összes fájlját, változatlan szerkezetben
- [x] A fájlnév tartalmazza a letöltés dátumát
- [ ] Telefonon és számítógépen is letölthető

## Comments

- 2026-11-01: Elkészült és a main-ben van: `GET /api/export` ZIP, a fájlnévben dátummal; az API-teszt fedi. A letöltés telefonon és számítógépen még nincs kézzel kipróbálva (ez a nyitott jelölőnégyzet).
