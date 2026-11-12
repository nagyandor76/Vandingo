---
status: done
blocked_by: []
---

# 01: Az `api.ts` adja vissza a foglaló Quizeket a Quiz mentésénél

Forrás: architektúra-áttekintés (2026-11-12), 2. jelölt, adapter-rész.

**What to build:** A backend a 409-es válaszban visszaküldi a foglaló Quizeket: `{ occupied: QuizRef[] }`. Az `api.ts` `send()` függvénye (kb. a 89. sor) ezt `{ status: 'conflict' }`-re fordítja, és a törzset eldobja. A `QuizEditor.tsx` és az `Editor.tsx` ezért egy külön lekért, akár elavult Quiz-listából találgatja, ki foglalja a Difficultyt.

- A `saveQuiz` kimenetele kövesse a backend egyféle kimenetelét: `saved`, `invalid` (a hibákkal), `occupied` (`QuizRef[]`-vel), `notFound`. Ugyanígy, ahogy az `importZip` már most teszi.
- A két képernyő a foglaló nevét a válaszból vegye, ne a listából.
- A közös „mentés felülírás-megerősítéssel” folyamat és a hibalista-megjelenítő külön döntés, ez a ticket nem foglalkozik vele.

- [x] Teszt stubolt `fetch`-csel: 409 → `occupied` a QuizRef-ekkel
- [x] A `QuizEditor` és az `Editor` nem keresi a foglalót a Quiz-listában

## Comments

- 2026-11-12: Elkészült. Az `api.ts` `SaveOutcome` típusa most `saved | invalid | occupied (QuizRef[]) | notFound`. Foglalt Subject-kulcsnál a szerver nem küld törzset, ilyenkor a kimenetel `occupied`, üres listával. A `QuizEditor` és az `Editor` a foglalót a szerver válaszából veszi, a `Settings` a `notFound`-ot hibaként mutatja. Teszt: `web/src/api.test.ts`. Böngészőben még nincs kipróbálva.
