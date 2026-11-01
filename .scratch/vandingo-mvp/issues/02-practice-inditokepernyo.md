# 02: A Practice indítóképernyője

Spec: [../spec.md](../spec.md) – User Stories 3–9

**What to build:** A Kitöltésben a felhasználó kiválasztja a Participantot (Janka, Vanda, Gréta, János), a Subjectet, majd a kezdő és záró Difficultyt. A szintválasztókban csak a létező szintek szerepelnek, a szám mellett a Quiz nevével. Ha a tartományban nincs kitölthető (igaz–hamis vagy szópárosítós) Question, a Start gomb inaktív, és ez látható: „Ebben a tartományban nincs kitölthető kérdés.”

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A Participant kiválasztása kötelező, a lista hardkódolt
- [ ] A szintválasztók csak létező szinteket mutatnak, „szám – név” formában
- [ ] A záró szint nem lehet kisebb a kezdőnél
- [ ] API-teszt: a Quizek listája Difficultyt, nevet és típusonkénti kérdésszámot ad vissza
- [ ] API-teszt: a tartomány Questionjei lekérhetők, mindkét végpont benne van, az idő a Quiz alapértelmezett idejével feloldva
- [ ] Kitölthető kérdés nélküli tartománynál inaktív Start gomb és magyarázó üzenet
