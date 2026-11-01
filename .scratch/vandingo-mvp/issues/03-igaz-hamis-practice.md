# 03: Igaz–hamis Practice az elejétől a Resultig

Spec: [../spec.md](../spec.md) – User Stories 10–13, 17–22, 36, 38–40

**What to build:** A Start után igaz–hamis Practice indul. A Practice engine első változata kiválasztja a Questionöket (véletlenszerűen, ismétlés nélkül, legfeljebb a Subject `max_questions` értékéig, csak kitölthető típusokból), 3 állításos Blockokat képez, és egy közös visszaszámlálót futtat (a kiválasztott Questionök idejének összege). A Kész gomb lezárja a Blockot; a hiányzó válasz hibás; lezáráskor látszik, mi helyes és mi hibás: hibás vagy hiányzó válasznál az állítás kerete és háttere piros, és a helyes gomb pirosan jelölve látszik (a helyes választ szövegesen nem írja ki). A Következő gombbal lép tovább. Ha lejár az idő, az aktuális Block kiértékelődik, minden más hibás. A végén összesítő képernyő (helyes, hibás, százalék, Passed), és a Result elmentődik. Félbehagyott Practice nem hoz létre Resultot. Ebben a ticketben a szópárosítós Questionöket a Practice még kihagyja.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Practice engine-teszt: a kiválasztás tiszteletben tartja a maximumot, és kevesebb Question esetén az összeset adja
- [ ] Practice engine-teszt: csak kitölthető típusok kerülnek be, és csak azok, amelyekből a tartományban legalább egy teljes Blocknyi van (a `usableTypes` szabálya)
- [ ] Practice engine-teszt: 3 állításos Blockok, az utolsó lehet rövidebb
- [ ] Practice engine-teszt: megválaszolatlan állítás hibásnak számít
- [ ] Practice engine-teszt: időlejáratkor az aktuális Block kiértékelődik, a meg nem jelent Questionök hibásak, `total` a kiválasztott Questionök száma, `elapsedSeconds` = `timeLimitSeconds`
- [ ] Practice engine-teszt: normál befejezésnél `elapsedSeconds` a ténylegesen eltelt idő
- [ ] API-teszt: a Result elmentődik külön fájlba, és visszaolvasható
- [ ] Nincs visszalépés, lezárt válasz nem módosítható
- [ ] Az összesítő képernyő mutatja a Passed állapotot (100%)
