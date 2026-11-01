# 10: Beállítások – Subject létrehozása és beállításai

Spec: [../spec.md](../spec.md) – User Stories 58–61

**What to build:** A Beállításokban új Subject hozható létre megjelenített névvel és kulccsal. A kulcs csak kisbetű (a–z), számjegy (0–9) és `-` lehet, egyedi, és később nem változtatható. Subjectenként beállítható a Practice maximális kérdésszáma (alapértelmezés 20) és az automatikus továbblépés.

**Blocked by:** 01

**Status:** done

- [x] API-teszt: érvényes Subject létrejön, alapértelmezett beállításokkal, és megjelenik a listában
- [x] API-teszt: szabálytalan kulcs 400, foglalt kulcs 409
- [x] API-teszt: a beállítások módosíthatók, a kulcs nem
- [x] Az új Subject megjelenik a Kitöltés és a Szerkesztő választójában

## Comments

- 2026-11-01: Elkészült. `POST /api/subjects`: a kulcs `^[a-z0-9-]+$`, a név nem üres (400), foglalt kulcs esetén 409; alapértelmezés 20 kérdés, automatikus továbblépés nélkül. `PUT /api/subjects/{key}` csak a `max_questions` (≥ 1) és az `auto_advance` értékét változtatja, a kulcsot és a nevet soha. A Beállítások képernyőn Subjectenként menthetők a beállítások. Az új Subject létrehozása a kulcsot a felületen is ellenőrzi. Az új Subject a Kitöltés és a Szerkesztő választójában is megjelenik, mert mindkettő a `GET /api/subjects`-et használja.
