# 01: Alapváz – üres alkalmazás, amely elindul

Spec: [../spec.md](../spec.md)

**What to build:** Az ASP.NET Core alkalmazás elindul, és kiszolgálja a React + Material UI felületet. A kezdőképernyőn a négy belépési pont látható (Kitöltés, Szerkesztő mód, Eredmény böngésző, Beállítások); a Kitöltés listázza a Subjecteket a megjelenített nevükkel. Első induláskor, ha az adatkönyvtár Quiz-része üres, a repó Quiz-mappája egyszer átmásolódik; később soha nem íródik felül. Az adatkönyvtár helye konfigurálható. Mindkét tesztelési pont (backend HTTP API, Practice engine) tesztkészletének váza elkészül.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Egy paranccsal elindul helyben, és a böngészőben megjelenik a kezdőképernyő a négy gombbal
- [ ] A felület magyar, telefonon is használható
- [ ] A Subjectek listája a Subject-fájlokból jön, a megjelenített nevükkel
- [ ] API-teszt: üres adatkönyvtárnál induláskor átmásolódnak a kezdeti Quizek és Subjectek
- [ ] API-teszt: nem üres adatkönyvtárnál semmi nem íródik felül
- [ ] A Practice engine tesztkészlete fut, legalább egy teszttel
- [ ] Az összes teszt egy-egy paranccsal futtatható, és a parancsok le vannak írva az AGENTS.md-ben
