---
status: ready-for-agent
blocked_by: [7]
---

# 08: Szerkesztő – beillesztés Excelből

Spec: [../spec.md](../spec.md) – User Story 46

**What to build:** A szerkesztő gridjébe több cella egyszerre bemásolható Ctrl+C / Ctrl+V-vel, Excelből is. Ha a beillesztés több sort tartalmaz, mint amennyi van, új sorok jönnek létre. A beillesztett sorok mentéskor ugyanúgy ellenőrződnek.

- [x] Excelből másolt többsoros, többoszlopos tartomány a kijelölt cellától kezdve beillesztődik
- [x] Hiányzó sorok automatikusan létrejönnek
- [x] A gridből kimásolt tartomány Excelbe beilleszthető
- [x] Beillesztett hibás adat mentéskor a szokásos módon kiemelődik
- [ ] Kézzel kipróbálva Excelből Windows alatt
