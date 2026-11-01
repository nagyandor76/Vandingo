# 12: Telepítés Railway-re

Spec: [../spec.md](../spec.md) – User Stories 63–65; [ADR 0001](../../../docs/adr/0001-csharp-backend-json-fajlok-railway-on.md)

**What to build:** Az alkalmazás fut a Railway-en, egy szolgáltatásként, és az adatkönyvtár egy Railway Volume-on van, így újraindítás és újratelepítés után is megmaradnak az adatok. Első induláskor a kezdeti Quizek átmásolódnak. Emberi lépések kellenek hozzá (Railway-fiók, projekt, Volume létrehozása); ezekhez egy `/wizard` szkript vezethet végig.

**Blocked by:** 01

**Status:** ready-for-human

- [ ] Az alkalmazás nyilvános URL-en elérhető telefonról
- [ ] Az adatkönyvtár a Volume-ra mutat
- [ ] Újratelepítés után a szerkesztett Quizek és a Resultok megmaradnak
- [x] A Railway aktuális ára és csomagkorlátai ellenőrizve
- [x] A telepítés lépései le vannak írva a repóban ([docs/deployment.md](../../../docs/deployment.md))
