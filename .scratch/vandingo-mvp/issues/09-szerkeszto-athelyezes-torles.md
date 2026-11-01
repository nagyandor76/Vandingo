# 09: Szerkesztő – szint módosítása, felülírás, Quiz törlése

Spec: [../spec.md](../spec.md) – User Stories 51–53

**What to build:** Egy Quiz Difficultyje megváltoztatható; mentéskor a Quiz az új szintre kerül, a régi szint felszabadul. Ha az új szint foglalt, vagy új Quiz mentésekor a megadott szint foglalt, a rendszer rákérdez a felülírásra, és csak megerősítés után ír. Egy teljes Quiz törölhető, megerősítés után.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] API-teszt: áthelyezés után a Quiz az új szinten van, a régin nincs
- [ ] API-teszt: foglalt célszintre felülírási jelző nélkül 409, és semmi nem változik
- [ ] API-teszt: felülírási jelzővel a cél felülíródik
- [ ] API-teszt: törlés után a Quiz nem tölthető be, és nem szerepel a listában
- [ ] A felület mindkét esetben megerősítést kér
