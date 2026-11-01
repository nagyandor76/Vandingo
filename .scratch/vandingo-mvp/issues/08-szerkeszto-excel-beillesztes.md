# 08: Szerkesztő – beillesztés Excelből

Spec: [../spec.md](../spec.md) – User Story 46

**What to build:** A szerkesztő gridjébe több cella egyszerre bemásolható Ctrl+C / Ctrl+V-vel, Excelből is. Ha a beillesztés több sort tartalmaz, mint amennyi van, új sorok jönnek létre. A beillesztett sorok mentéskor ugyanúgy ellenőrződnek.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] Excelből másolt többsoros, többoszlopos tartomány a kijelölt cellától kezdve beillesztődik
- [ ] Hiányzó sorok automatikusan létrejönnek
- [ ] A gridből kimásolt tartomány Excelbe beilleszthető
- [ ] Beillesztett hibás adat mentéskor a szokásos módon kiemelődik
- [ ] Kézzel kipróbálva Excelből Windows alatt
