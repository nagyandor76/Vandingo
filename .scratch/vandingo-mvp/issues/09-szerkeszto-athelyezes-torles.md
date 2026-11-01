---
status: done
blocked_by: [7]
---

# 09: Szerkesztő – szint módosítása, felülírás, Quiz törlése

Spec: [../spec.md](../spec.md) – User Stories 51–53

**What to build:** Egy Quiz Difficultyje megváltoztatható; mentéskor a Quiz az új szintre kerül, a régi szint felszabadul. Ha az új szint foglalt, vagy új Quiz mentésekor a megadott szint foglalt, a rendszer rákérdez a felülírásra, és csak megerősítés után ír. Egy teljes Quiz törölhető, megerősítés után.

- [x] API-teszt: áthelyezés után a Quiz az új szinten van, a régin nincs
- [x] API-teszt: foglalt célszintre felülírási jelző nélkül 409, és semmi nem változik
- [x] API-teszt: felülírási jelzővel a cél felülíródik
- [x] API-teszt: törlés után a Quiz nem tölthető be, és nem szerepel a listában
- [x] A felület mindkét esetben megerősítést kér

## Comments

- 2026-11-01: Elkészült és a main-ben van. A `PUT .../quizzes/{difficulty}` az `original_difficulty` és `overwrite=true` paramétert fogadja (409 foglalt célszintnél, áthelyezéskor a régi fájl törlődik), új a `DELETE .../quizzes/{difficulty}` (204 / 404). Az API-tesztek lefedik. A megerősítő dialógusok (Foglalt szint, Kvíz törlése) a böngészőben még nincsenek kézzel kipróbálva.
