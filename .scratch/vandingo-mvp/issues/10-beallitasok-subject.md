# 10: Beállítások – Subject létrehozása és beállításai

Spec: [../spec.md](../spec.md) – User Stories 58–61

**What to build:** A Beállításokban új Subject hozható létre megjelenített névvel és kulccsal. A kulcs csak kisbetű (a–z), számjegy (0–9) és `-` lehet, egyedi, és később nem változtatható. Subjectenként beállítható a Practice maximális kérdésszáma (alapértelmezés 20) és az automatikus továbblépés.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] API-teszt: érvényes Subject létrejön, alapértelmezett beállításokkal, és megjelenik a listában
- [ ] API-teszt: szabálytalan kulcs 400, foglalt kulcs 409
- [ ] API-teszt: a beállítások módosíthatók, a kulcs nem
- [ ] Az új Subject megjelenik a Kitöltés és a Szerkesztő választójában
