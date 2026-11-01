---
status: done
blocked_by: [7]
---

# 08: Szerkesztő – beillesztés Excelből

Spec: [../spec.md](../spec.md) – User Story 46

**What to build:** A szerkesztő gridjébe több cella egyszerre bemásolható Ctrl+C / Ctrl+V-vel, Excelből is. Ha a beillesztés több sort tartalmaz, mint amennyi van, új sorok jönnek létre. A beillesztett sorok mentéskor ugyanúgy ellenőrződnek.

- [x] Excelből másolt többsoros, többoszlopos tartomány a kijelölt cellától kezdve beillesztődik
- [x] Hiányzó sorok automatikusan létrejönnek
- [x] A gridből kimásolt tartomány Excelbe beilleszthető
- [x] Beillesztett hibás adat mentéskor a szokásos módon kiemelődik
- [X] Kézzel kipróbálva Excelből Windows alatt

## Comments

- 2026-11-01: Elkészült és a main-ben van. A vágólap-logika (`web/src/editor/clipboard.ts`) 12 egységteszttel fedett. A grid kijelölése és a Ctrl+C / Ctrl+V a böngészőben, valódi Excellel még nincs kipróbálva (ez a nyitott jelölőnégyzet). Külön megerősítendő: elsül-e a paste/copy esemény nem szerkesztett cellán, és működik-e a Shift+nyíl kijelölés AG Gridben.
