---
status: done
blocked_by: []
---

# 01: Practice modul – a Practice életciklusa egy helyen

Forrás: architektúra-áttekintés (2026-11-12), 1. jelölt, és az utána következő grilling. A lenti döntések le vannak zárva, ne nyisd újra őket.

**What to build:** A `Practice.tsx` jelenleg hat effektben és két ref-ben kezeli a Practice-szabályok felét, teszt nélkül. Ide tartozik a betöltés, a visszaszámlálás, az auto_advance, a hang, az egyszeri mentés és a Result összeállítása. Mindez egy React-mentes **Practice** modulba (`web/src/practice/practice.ts`) kerül, amely az engine köré épül. A képernyő ezután csak renderel és továbbítja a koppintásokat.

## Döntések

- **Név (Q1):** a modul neve **Practice**: ez a futó Practice. Az `engine.ts` marad a Practice engine, vagyis a szabályok. A „session” szót nem használjuk (GLOSSARY: kerülendő).
- **Hatókör (Q2):** a modul a betöltéstől a mentésig mindent birtokol.
- **Alak (Q3):** React-mentes objektum. Interface: `subscribe`, `getSnapshot`, valamint az akciók: `tap`, `answer`, `readAloud`, `close`, `next`, `retrySave`, `dispose`. A képernyő `useSyncExternalStore`-ral köt rá.
- **Engine (Q4):** önálló modul marad, belső seamként; a meglévő tesztjei megmaradnak. A képernyő csak a Practice modult importálja, az engine-t nem.
- **Szópárosítás (Q5, Q13):** a kijelölés egy engine-átmenet lesz, `tap(side, index)`, és a kijelölés a `PracticeState` része. A szabály: párosított elemre koppintva a pár szétválik; azonos oldalon újra kijelöl; a másik oldalon párt képez. A `pair` és az `unpair` belső lesz. Az `engine.test.ts` szópárosítás-tesztjeit `tap`-sorozatokra kell átírni.
- **Portok (Q6, Q9):**
  - Az **adat-port** az `api.ts` négy függvényét tükrözi: `fetchSubjects`, `fetchQuestions`, `fetchQuizzes`, `saveResult`. Az `api.ts` maga az adapter. A szabályok a modulban vannak:
    - a Quiz-nevek legjobb igyekezettel jönnek (`quizNamesOf`);
    - ismeretlen Subject esetén load-failed.
  - A **hang-port** az `audio.ts` interface-e: `speak`, `stop`, `playBlockSound`. Tesztben felvevő adapter kerül a helyére.
  - A **random** opcionális bemenet; alapértéke `Math.random`.
  - Az időnek nincs portja; a tesztek `vi.useFakeTimers()`-t használnak.
- **Felolvasás (Q7.1):** egyetlen csatorna van. Minden felolvasásról az engine dönt, az automatikusról, a `tap`-ről és a `readAloud(questionIndex)`-ről is. A modul az átmenet után összeveti a régi és az új állapotot, és új felolvasásnál hívja a hang-portot.
- **Lezárt Block (Q7.2):** a mostani viselkedés marad. Az állításra koppintva felolvas; az angol szóra koppintva nem; a magyar jelentés mindig néma.
- **Block-hang (Q7.4):** amikor a jelenlegi Block lezárul, a modul egyszer leállítja a felolvasást és lejátssza a Block-hangot. Ha az auto_advance be van kapcsolva, 2 s után továbblép, **kivéve, ha már van Result**. Lejárt időnél a „Lejárt az idő” üzenet az „Eredmény” gomb megnyomásáig kint marad.
- **Leállás (Q7.5):** a `dispose()` és a Practice vége (Summary) is leállítja a felolvasást és az időzítőket.
- **Hang-feloldás (Q7.6):** az `audio.ts` maga regisztrál egy egyszeri `pointerdown`-figyelőt az első használatkor. Az `unlockAudio` hívása ezért kikerül a `PracticeStart.tsx`-ből és a `Practice.tsx`-ből.
- **Megjelenítési tények (Q8):** a `progress`, a `correctInBlock`, a `timedOut` és a `passed` a pillanatképből jön. A színek és a feliratok a képernyőben maradnak.
- **URL (Q10):** a paraméterek olvasása és a hiányos cím ellenőrzése a képernyőben marad. A modul típusos bemenetet kap: `{ participant, subject, from, to }`.
- **Pillanatkép (Q11):**
  ```text
  loading
  load-failed
  empty
  running   { subjectName, block, blockIndex, blockCount, remainingSeconds,
              progress, correctInBlock, timedOut, selection }
  finished  { result, passed, saveStatus: saving | saved | failed }
  ```
  A `block` az engine `Block` típusa.
- **Mentés (Q12):** a Result az első előálláskor mentődik, pontosan egyszer. A `retrySave()` ugyanazt a Resultot küldi. Ha a gyerek mentés közben kilép, nem jelenik meg hiba.

## Sorrend

`refactor/practice-module` ágon, `/tdd`-vel:

1. engine: `tap` és `readAloud` átmenet, a szópárosítás-tesztek átírása
2. `audio.ts` önfeloldás
3. Practice modul a tesztlistával
4. `Practice.tsx` és `PracticeStart.tsx` átkötése
5. `/code-review`

## Tesztek (a Practice modul interface-én)

- [x] betöltés: ismeretlen Subject → load-failed; fetch-hiba → load-failed
- [x] betöltés: nincs kitölthető kérdés → empty
- [x] betöltés: a Quiz-nevek hibája után is running, a Result nevek nélkül
- [x] idő: lejár → a Block pontozva, timedOut, pontosan egy mentés
- [x] idő: a Result után az óra áll
- [x] auto_advance: pontozott Block → 2 s múlva a következő
- [x] auto_advance: kikapcsolva marad; a Result után marad
- [x] hang: pontozott Block → stop és egy Block-hang, egyszer
- [x] hang: új legfelső állítás → egy felolvasás
- [x] hang: angol szóra koppintva felolvas, magyarra csend
- [x] hang: lezárt Blockban az állításra koppintva felolvas, a szóra koppintva nem
- [x] hang: dispose és finished → stop
- [x] mentés: a Result tartalmazza a Participantet, a Subjectet, a tartományt és a Quiz-neveket
- [x] mentés: hiba → failed; retrySave → ugyanaz a Result, saved
- [x] mentés: dispose mentés közben → nincs hiba
- [x] pillanatkép: progress, correctInBlock, passed
- [x] engine: a szópárosítás-tesztek `tap`-sorozatokon át
- [x] a `Practice.tsx` nem importálja az engine-t, és nincs benne `useEffect` időzítésre, hangra vagy mentésre

## Comments

- 2026-11-12: Elkészült a `refactor/practice-module` ágon (`web/src/practice/practice.ts`, 23 modulteszt; engine: `tap`, `readAloud`). Eltérések a döntésektől:
  - A `running` pillanatkép egy `resultReady` mezőt is kapott. Ebből tudja a képernyő, hogy „Eredmény” vagy „Következő” legyen a gomb felirata.
  - Az `audio.ts` a figyelőt a modul betöltésekor regisztrálja, nem az első használatkor. Így már a Kezdőképernyőn tett első koppintás feloldja a hangot.
  - Review-javítás: ha auto_advance mellett a pontozott Blockon jár le az idő, a függő továbblépés törlődik. A mainen ilyenkor a Summary a gomb megnyomása nélkül megjelent.
  - Böngészőben még nincs kipróbálva.
