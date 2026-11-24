---
status: done
blocked_by: [2]
---

# 04: A többválasztásos Block telefonra méretezett elrendezése

Forrás: [spec](../spec.md), „Képernyő-elrendezése”, „Kész gomb”. Párhuzam: [spelling 06](../../spelling/issues/06-telefonra-meretezett-gombok.md).

**What to build:** A többválasztásos Block egy telefonképernyőn, szükség esetén görgetéssel mutatja a kérdésszöveget (1–3 sor), a válaszgombokat függőleges listában, és a „Kész” gombot a láblécben, ahogy az igaz–hamis és a szópárosító. A gombok stílusa a szópárosítóé (kattintható gombok, nem jelölőnégyzetek): kijelölve zöld, kiértékelés után helyes zöld, hibás piros. Hosszú válasz sortöréssel, magasabb gombban jelenik meg. Csak a képernyő (`web/src/screens/Practice.tsx`) változik; a színek és feliratok a képernyőben maradnak.

**Blocked by:** 02

**Status:** done

- [x] Függőleges gomblista, a teljes szélességben, hosszú szövegnél sortörés
- [x] Görgethető tartalom 2–6 (és több) opcióval telefonméreten
- [x] „Kész” gomb a láblécben, kiértékelés után eltűnik vagy a továbblépés veszi át (mint a többi típusnál)
- [x] Zöld–piros állapotok a szópárosító színeivel (`web/src/theme.ts`)
- [x] Typecheck és lint zöld; a kinézet kézi ellenőrzés (megjegyzésben jelezve, ha böngészőben nem volt kipróbálva)

## Comments

**2026-11-23:** Kész (c89ea98; review-javítás 246fc1f). Böngészőben (Playwright, 360×740 és 412×915) kipróbálva a 03-as beolvasztása előtt; a 🔊 gomb helye és a review utáni ✓ jelvény böngészőben nincs megnézve. Nem kért, de bent maradt: kiértékelés után a nem érintett opciók halványulnak, cím: „Válaszd ki a helyeseket!”.
