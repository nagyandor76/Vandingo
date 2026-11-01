---
status: done
blocked_by: [3]
---

# 06: Eredmény böngésző

Spec: [../spec.md](../spec.md) – User Stories 55–57

**What to build:** Az Eredmény böngészőben a felhasználó kiválaszt egy Participantot, és látja a 10 legutóbbi Resultját, tantárgytól függetlenül, a legújabbal kezdve: Subject (megjelenített névvel), kitöltési időpont, százalék, Passed. Egy sorra koppintva a Result összes adata megjelenik.

- [x] API-teszt: a lista csak a kért Participant Resultjait adja, legfeljebb a kért darabszámot, a legújabbal kezdve
- [x] API-teszt: egy Result azonosító alapján lekérhető
- [x] A lista jelöli a Passed (100%) Resultokat
- [x] A részletező nézet mutatja a tartományt, a helyes/hibás számot, az időkeretet és a felhasznált időt
- [x] Ha a Participantnak nincs Resultja, ezt üzenet jelzi

## Comments

- 2026-11-01: Elkészült. `GET /api/results?participant=&limit=` (alapból 10, a legújabb elöl) és `GET /api/results/{id}`. Az Eredmény böngésző a Participantot az URL-ben tartja (`?kitolto=`), így a részletezőből visszalépve megmarad. A Subject megjelenített neve a Subject-listából jön; ha nincs meg, a kulcs látszik. A Passed (100%) zöld pipával jelölt. A Result-fájlok mostantól behúzva, ékezetekkel íródnak (a kulcsok nem változtak). Telefonon még kézzel ki kell próbálni.
