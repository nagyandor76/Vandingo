# 07: Szerkesztő – Quiz megnyitása, létrehozása és mentése

Spec: [../spec.md](../spec.md) – User Stories 41–45, 47–50, 54

**What to build:** A Szerkesztő módban a felhasználó kiválasztja a Subjectet, majd megnyit egy meglévő Quizt, vagy újat hoz létre névvel és Difficultyvel (alapidő 10 másodperc). A Quiz összes Questionje egyetlen AG Gridben szerkeszthető; a típus soronként választható; sorok hozzáadhatók és törölhetők. Az `options` és `answer` listák egy cellában `;` jellel elválasztva szerepelnek, igaz–hamisnál Igaz/Hamis legördülő listával. Mentéskor a szerver ellenőrzi, hogy a Quiz legalább 5 Questiont tartalmaz, és típusonként ellenőriz; hibánál semmi nem íródik, a hibás sorok kiemelve, a hiba okával jelennek meg. Mind a négy típus menthető.

**Blocked by:** 01

**Status:** done

- [x] API-teszt: érvényes Quiz mentése után visszatölthető, és a fájl formátuma a specifikáció szerinti
- [x] API-teszt: típusonként legalább egy szabálysértés 400-at ad soronkénti hibalistával, és nem ír fájlt
- [x] API-teszt: `default_time` hiánya hiba
- [x] API-teszt: 5-nél kevesebb Questiont tartalmazó Quiz mentése 400-at ad, és nem ír fájlt; pontosan 5 Question menthető
- [x] A `;` elválasztású cellák listává alakulnak, a szóközök levágódnak, visszatöltéskor ugyanígy jelennek meg
- [x] A hibás sorok kiemelve, a hiba okával látszanak
- [x] Új Quiz alapideje 10 másodperc
- [x] Számítógépen kényelmesen használható

## Comments

- 2026-11-01: Elkészült. `GET`/`PUT /api/subjects/{key}/quizzes/{difficulty}`; a Subject és a Difficulty az URL-ből jön. Ellenőrzés (`QuizRules`): név, `default_time` ≥ 1, Difficulty 1–20, legalább 5 Question, soronként típus, szöveg, `time` ≥ 1, igaz–hamis `true`/`false`, szópárosítás pontosan egy jelentés, feleletválasztós és sorrendező legalább 2 lehetőség, és minden helyes válasz a lehetőségek közül. Soronként csak az első hiba jelenik meg. A hiba 400 `{ errors: [{ row?, field, message }] }`. Az üres `options` és felolvasási nyelv kimarad a fájlból. A Szerkesztő AG Gridje lustán töltődik be, így a telefonos Kitöltés nem tölti le. A hibás sor piros, a hibás cella keretes, az ok a Hiba oszlopban látszik. Új Quiz csak szabad szintre hozható létre. A szerver egyelőre felülírja a szintet; a 409 és a felülírási kérdés a 09-es ticket feladata. Egy még nem mentett új Quiz újratöltéskor elveszik. Headless Edge-ben kipróbálva: a hibakiemelés működik, és a felületről mentett minta-Quiz megegyezik az eredetivel.
