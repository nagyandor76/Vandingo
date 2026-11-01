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
- [x] Practice engine-teszt: egy típus csak teljes Blocknyi Questionnel (3 igaz–hamis, 5 szópár) használható; ha egyik sem, a Start inaktív, az üzenet „Ebben a tartományban nincs elég kitölthető kérdés.”

## Comments

- 2026-11-01: Szabályváltozás: egy kitölthető típus csak akkor kerül a Practice-be, ha a tartományban legalább egy teljes Blocknyi van belőle (3 igaz–hamis, 5 szópár); különben abból semmi. Ha így egyik típus sem marad, a Start inaktív. A szabály a Practice engine `usableTypes` függvényében van.
