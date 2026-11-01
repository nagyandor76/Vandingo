# 07: Szerkesztő – Quiz megnyitása, létrehozása és mentése

Spec: [../spec.md](../spec.md) – User Stories 41–45, 47–50, 54

**What to build:** A Szerkesztő módban a felhasználó kiválasztja a Subjectet, majd megnyit egy meglévő Quizt, vagy újat hoz létre névvel és Difficultyvel (alapidő 10 másodperc). A Quiz összes Questionje egyetlen AG Gridben szerkeszthető; a típus soronként választható; sorok hozzáadhatók és törölhetők. Az `options` és `answer` listák egy cellában `;` jellel elválasztva szerepelnek, igaz–hamisnál Igaz/Hamis legördülő listával. Mentéskor a szerver típusonként ellenőriz; hibánál semmi nem íródik, a hibás sorok kiemelve, a hiba okával jelennek meg. Mind a négy típus menthető.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] API-teszt: érvényes Quiz mentése után visszatölthető, és a fájl formátuma a specifikáció szerinti
- [ ] API-teszt: típusonként legalább egy szabálysértés 400-at ad soronkénti hibalistával, és nem ír fájlt
- [ ] API-teszt: `default_time` hiánya hiba
- [ ] A `;` elválasztású cellák listává alakulnak, a szóközök levágódnak, visszatöltéskor ugyanígy jelennek meg
- [ ] A hibás sorok kiemelve, a hiba okával látszanak
- [ ] Új Quiz alapideje 10 másodperc
- [ ] Számítógépen kényelmesen használható
