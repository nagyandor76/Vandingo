---
status: ready-for-human
blocked_by: []
---

# 06: Felolvasás kapcsoló eszközönként a Beállításokban

Forrás: [spec](../spec.md), „Felolvasás kapcsoló” (2026-11-23), 29–31. user story.

**What to build:** A Beállítások képernyőn egy „Felolvasás ezen az eszközön” kapcsoló, alapértéke bekapcsolva. Az értéket a böngésző tárolja (`localStorage`, minden olvasás és írás `try/catch`-ben); ha a tárolás nem elérhető, a kapcsoló bekapcsoltnak számít. A szerverre nem kerül, és nem tantárgyankénti. Kikapcsolva a böngészős hang-adapter (`web/src/audio.ts`) `speak`-je nem szól, és azonnal teljesül. A `playBlockSound` továbbra is szól. Az engine és a Practice modul nem változik, mert nem tud a kapcsolóról. A kapcsoló minden kérdéstípus felolvasására vonatkozik.

**Blocked by:** None (can start immediately)

**Status:** ready-for-human

- [x] Kis modul a kapcsoló tárolására (olvasás és írás, alapérték bekapcsolva, elérhetetlen tárolásnál bekapcsolva), tesztekkel
- [x] Kapcsoló a Beállítások képernyőn, a tantárgy-beállításoktól külön, „ezen az eszközön” megjelöléssel; azonnal érvényes, nincs Mentés gomb
- [x] `audio.ts`: kikapcsolva a `speak` nem szól, és azonnal teljesül; a `playBlockSound` változatlan
- [ ] Kézi ellenőrzés telefonon: kikapcsolva nincs felolvasás, a jelzőhang szól, és az auto-advance működik
- [x] A `docs/practice-modul.md` „Hang” része említi, hogy a böngészős adapter tiszteletben tartja a kapcsolót

## Comments

**2026-11-23:** A kód kész (`web/src/readings.ts` tesztekkel, `audio.ts`, Beállítások: „Ezen az eszközön” szakasz). Hátra van a telefonos kézi ellenőrzés; utána `done`. Nyitott termékkérdés a review-ból: kikapcsolt felolvasásnál a 🔊 gombok látszanak, de nem szólnak.
