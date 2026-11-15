---
status: done
blocked_by: []
---

# 02: A betűzős Quiz menthető a szerkesztőben

Forrás: [spec](../spec.md), „Backend-ellenőrzés”, „Quiz-összesítők”, „Szerkesztő”, „Adattisztítás”.

**What to build:** A szülő a szerkesztőben „Betűzés” típust választhat egy Questionhöz, és a betűzős Quiz menthető. Mentéskor a backend a `spelling` Questiont a saját szabályai szerint ellenőrzi; a Quiz-összesítők típusonkénti kérdésszámai a `spelling`-et is tartalmazzák. A szállított `english` 9-es Quizből törlődik az a hat Question, amelyik 22-nél több betűből áll, így az kézi javítás nélkül menthető.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] A szerkesztő típusválasztójában szerepel a „Betűzés” (`spelling`), ugyanazokkal a mezőkkel, mint a szópárosító
- [x] Egy érvényes betűzős Quiz mentődik
- [x] Elutasítás, ha az `answer` nem pontosan egy, nem üres jelentés
- [x] Elutasítás, ha a `text`-ben nincs a–z betű
- [x] Elutasítás, ha a `text`-ben 22-nél több a–z betű van (szóköz, írásjel nem számít); az üzenet megmondja a tényleges számot
- [x] Elutasítás, ha a `text`-ben a–z-n kívüli betű van (pl. `café`); nem betű karakterek megengedettek
- [x] A Quiz-összesítők számolják a `spelling`-et
- [x] A szállított 9-es Quizből törlődik: `send text/voice messages emails`, `receive text/voice messages emails`, `make sth exciting/better etc.`, `find sth interesting/boring etc.`, `Give me a call later/sometime.`, `It was great chatting with you.`; a 9-es Quiz átmegy az ellenőrzésen
- [x] API tesztek a meglévő Quiz API tesztek mintájára

## Comments

- 2026-11-15: Elkészült. Backend: `spelling` típusszabály (1–22 a–z betű, NFC-normalizálás után más betű vagy kombináló ékezet nem lehet benne, pontosan egy jelentés). A szerkesztőben „Betűzés”. Új teszt: a repóban szállított minden Quiz menthető. A 9.json-ból törölve a 6 hosszú sor (161 kérdés maradt). A szerkesztő típusválasztója böngészőben még nincs kipróbálva.
