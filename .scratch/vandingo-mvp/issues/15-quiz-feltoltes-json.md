---
status: ready-for-agent
blocked_by: [9]
---

# 15: Szerkesztő – Quiz feltöltése JSON-ből

Spec: [../spec.md](../spec.md) – User Stories 67–68

**What to build:** A Szerkesztőben, a kiválasztott Subject Quiz-listájánál egy „Feltöltés JSON-ből” gomb egy Quiz-JSON fájlt (specifikáció 4.2) tölt fel. A Quiz a fájl `difficulty` mezője szerinti szintre kerül, a kiválasztott Subjecthez, a fájl `subject` mezőjétől függetlenül. Nincs új végpont: a felület beolvassa a fájlt, és a meglévő Quiz-mentés végpontot hívja (`PUT /api/subjects/{key}/quizzes/{difficulty}`). Ha a szint foglalt (409), ugyanaz a „Foglalt szint” megerősítés jelenik meg, mint a szerkesztőben, és megerősítés után felülírási jelzővel ment újra. Ellenőrzési hibánál (400) a hibák a sorszámukkal megjelennek, és semmi nem mentődik. Ha a fájl nem olvasható JSON, vagy hiányzik belőle a `difficulty`, a felület kérés küldése nélkül jelzi a hibát. Sikeres feltöltés után a Quiz megjelenik a listában.

- [x] Érvényes fájl feltöltése után a Quiz a fájlban megadott szinten, a kiválasztott Subjectnél jelenik meg
- [x] Foglalt szintnél megerősítést kér; elvetéskor semmi nem változik, megerősítéskor felülíródik
- [x] Ellenőrzési hibánál megjelennek a hibák, és a Quiz nem mentődik
- [x] Nem JSON vagy `difficulty` nélküli fájlnál érthető hibaüzenet jelenik meg
- [ ] Kézzel kipróbálva a repó egyik `Quizzes/` fájljával
