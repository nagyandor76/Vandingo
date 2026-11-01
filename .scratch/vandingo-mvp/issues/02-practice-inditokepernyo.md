# 02: A Practice indítóképernyője

Spec: [../spec.md](../spec.md) – User Stories 3–9

**What to build:** A Kitöltésben a felhasználó kiválasztja a Participantot (Janka, Vanda, Gréta, János), a Subjectet, majd a kezdő és záró Difficultyt. A szintválasztókban csak a létező szintek szerepelnek, a szám mellett a Quiz nevével. Ha a tartományban nincs kitölthető (igaz–hamis vagy szópárosítós) Question, a Start gomb inaktív, és ez látható: „Ebben a tartományban nincs kitölthető kérdés.”

**Blocked by:** 01

**Status:** done

- [x] A Participant kiválasztása kötelező, a lista hardkódolt
- [x] A szintválasztók csak létező szinteket mutatnak, „szám – név” formában
- [x] A záró szint nem lehet kisebb a kezdőnél
- [x] API-teszt: a Quizek listája Difficultyt, nevet és típusonkénti kérdésszámot ad vissza
- [x] API-teszt: a tartomány Questionjei lekérhetők, mindkét végpont benne van, az idő a Quiz alapértelmezett idejével feloldva
- [x] Kitölthető kérdés nélküli tartománynál inaktív Start gomb és magyarázó üzenet
