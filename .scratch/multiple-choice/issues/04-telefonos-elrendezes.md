---
status: ready-for-agent
blocked_by: [2]
---

# 04: A többválasztásos Block telefonra méretezett elrendezése

Forrás: [spec](../spec.md), „Képernyő-elrendezése”, „Kész gomb”. Párhuzam: [spelling 06](../../spelling/issues/06-telefonra-meretezett-gombok.md).

**What to build:** A többválasztásos Block egy telefonképernyőn, szükség esetén görgetéssel mutatja a kérdésszöveget (1–3 sor), a válaszgombokat függőleges listában, és a „Kész” gombot a láblécben, ahogy az igaz–hamis és a szópárosító. A gombok stílusa a szópárosítóé (kattintható gombok, nem jelölőnégyzetek): kijelölve zöld, kiértékelés után helyes zöld, hibás piros. Hosszú válasz sortöréssel, magasabb gombban jelenik meg. Csak a képernyő (`web/src/screens/Practice.tsx`) változik; a színek és feliratok a képernyőben maradnak.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Függőleges gomblista, a teljes szélességben, hosszú szövegnél sortörés
- [ ] Görgethető tartalom 2–6 (és több) opcióval telefonméreten
- [ ] „Kész” gomb a láblécben, kiértékelés után eltűnik vagy a továbblépés veszi át (mint a többi típusnál)
- [ ] Zöld–piros állapotok a szópárosító színeivel (`web/src/theme.ts`)
- [ ] Typecheck és lint zöld; a kinézet kézi ellenőrzés (megjegyzésben jelezve, ha böngészőben nem volt kipróbálva)

## Comments
