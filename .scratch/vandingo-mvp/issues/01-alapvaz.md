---
status: done
blocked_by: []
---

# 01: Alapváz – üres alkalmazás, amely elindul

Spec: [../spec.md](../spec.md)

**What to build:** Az ASP.NET Core alkalmazás elindul, és kiszolgálja a React + Material UI felületet. A kezdőképernyőn a négy belépési pont látható (Kitöltés, Szerkesztő mód, Eredmény böngésző, Beállítások); a Kitöltés listázza a Subjecteket a megjelenített nevükkel. Első induláskor, ha az adatkönyvtár Quiz-része üres, a repó Quiz-mappája egyszer átmásolódik; később soha nem íródik felül. Az adatkönyvtár helye konfigurálható. Mindkét tesztelési pont (backend HTTP API, Practice engine) tesztkészletének váza elkészül.

- [x] Egy paranccsal elindul helyben, és a böngészőben megjelenik a kezdőképernyő a négy gombbal
- [x] A felület magyar, telefonon is használható
- [x] A Subjectek listája a Subject-fájlokból jön, a megjelenített nevükkel
- [x] API-teszt: üres adatkönyvtárnál induláskor átmásolódnak a kezdeti Quizek és Subjectek
- [x] API-teszt: nem üres adatkönyvtárnál semmi nem íródik felül
- [x] A Practice engine tesztkészlete fut, legalább egy teszttel
- [x] Az összes teszt egy-egy paranccsal futtatható, és a parancsok le vannak írva az AGENTS.md-ben
