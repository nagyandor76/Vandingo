# 06: Eredmény böngésző

Spec: [../spec.md](../spec.md) – User Stories 55–57

**What to build:** Az Eredmény böngészőben a felhasználó kiválaszt egy Participantot, és látja a 10 legutóbbi Resultját, tantárgytól függetlenül, a legújabbal kezdve: Subject (megjelenített névvel), kitöltési időpont, százalék, Passed. Egy sorra koppintva a Result összes adata megjelenik.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] API-teszt: a lista csak a kért Participant Resultjait adja, legfeljebb a kért darabszámot, a legújabbal kezdve
- [ ] API-teszt: egy Result azonosító alapján lekérhető
- [ ] A lista jelöli a Passed (100%) Resultokat
- [ ] A részletező nézet mutatja a tartományt, a helyes/hibás számot, az időkeretet és a felhasznált időt
- [ ] Ha a Participantnak nincs Resultja, ezt üzenet jelzi
