---
status: ready-for-agent
blocked_by: [10, 11]
---

# 16: Beállítások – Quizek feltöltése ZIP-ben

Spec: [../spec.md](../spec.md) – User Stories 69–70

**What to build:** A Beállításokban az „Adatok letöltése” mellett egy „Quizek feltöltése ZIP-ben” gomb több Quizt tölt fel egyszerre (`POST /api/import`). A ZIP a `Quizzes/` szerkezetét követi (`<subject>/<difficulty>.json`, opcionálisan `<subject>/subject.json`), a gyökérben vagy egy `Quizzes/` mappában. Így az „Adatok letöltése” ZIP-je is visszatölthető; a `results/` mappát és az egyéb fájlokat a feltöltés figyelmen kívül hagyja.

- Még nem létező Subject a ZIP-ben lévő `subject.json` alapján jön létre, ugyanazokkal a kulcsszabályokkal, mint a Beállításokban. Ha az hiányzik vagy hibás, az hiba. Létező Subject beállításai nem változnak.
- Minden Quiz ugyanazon az ellenőrzésen megy át, mint mentéskor. A Quiz a mappája szerinti Subjecthez és a fájlneve szerinti szintre kerül.
- Hibás fájlnál 400 jön, fájlonként a hiba okával (fájl útvonala, sor, mező, üzenet), és semmi nem íródik.
- Foglalt szintnél felülírási jelző nélkül 409 jön, a foglalt szintek listájával (Subject, Difficulty, meglévő név), és semmi nem íródik. A felület felsorolja ezeket, és megerősítés után felülírási jelzővel küldi újra.
- Siker esetén a felület kiírja, mely Quizek és új Subjectek kerültek be.

- [ ] API-teszt: érvényes ZIP után az összes Quiz betölthető, és megjelenik a listában
- [ ] API-teszt: ismeretlen Subject `subject.json`-nel létrejön; `subject.json` nélkül 400, és semmi nem íródik
- [ ] API-teszt: egyetlen hibás Quiz-fájl miatt 400 fájlonkénti hibalistával, és egyik Quiz sem íródik
- [ ] API-teszt: foglalt szint felülírási jelző nélkül 409 a foglalt szintek listájával, és semmi nem változik; jelzővel felülíródik
- [ ] API-teszt: az `GET /api/export` ZIP-je visszatölthető, és a Resultokat nem érinti
- [ ] API-teszt: létező Subject beállításai a ZIP `subject.json`-je ellenére sem változnak
- [ ] A felület mutatja a hibákat, rákérdez a felülírásra, és a végén összesít
