---
status: done
---

# Multiple-choice kérdéstípus

Forrás: a `/grill-with-docs` és `/to-spec` beszélgetés (2026-11-22), [GLOSSARY.md](../../GLOSSARY.md) (fogalmak), [Spelling spec](../spelling/spec.md) (architekturális párhuzamok).

## Problem Statement

Az alkalmazás jelenleg három kérdéstípust támogat: igaz–hamis, szópárosító és betűzés. Az igaz–hamis és a szópárosító csak egyetlen helyes válaszra építenek (mindhárom feltételét teljesíteni kell). Hiányzik a **több helyes választ** igénylő típus, amely olyan szituációkat modellez, ahol több válasz is elfogadható egy kérdésre — például „Melyik ezek közül a város?" több város is lehetséges válasz.

## Solution

Új, játszható Question type: a **Multiple-choice** (*Többválasztásos*). A Participant a kérdést és több válaszlehetőséget lát. Rákattintásra a válaszok zöldek lesznek (kijelölve). A "Kész" gombra kattintva a hibás válaszok pirosak lesznek, és a Blokk kiértékelődik: helyes = mind a helyes válaszok kijelölve és semmi helytelen, egyébként 0%. Zöld–piros visszajelzés és felolvasás után automatikus továbblépés — ugyanúgy, mint az igaz–hamis és szópárosító.

## User Stories

1. Mint Participant, egy kérdésszöveget akarok látni (1–3 sor), hogy tudjam, mit kell válaszolnom.
2. Mint Participant, több válaszlehetőséget akarok látni (2–6 között, ahogy a szerzett meghatározta), hogy választhassak.
3. Mint Participant, minden válaszlehetőség szövege lehet 1–2 szó vagy hosszabb, scrollozható, hogy bármekkora szöveget is támogasson.
4. Mint Participant, egy válaszlehetőségre koppintva azt zöldre akarom festve, hogy lássam a kijelölésemet.
5. Mint Participant, már kijelölt választ újra rákoppintva meg akarom szüntetni, hogy javíthassak.
6. Mint Participant, több helyes válasz közül akárhányat akarok kijelölni, hogy az összes helyes feltételt teljesíteni tudjam.
7. Mint Participant, egy "Kész" gombot akarok a lábléc-ben (mint az igaz–hamis és szópárosító esetén), amelyre kattintva lezárul a Blokk és kiértékelődik, hogy tudjam, mikor vagyok kész.
8. Mint Participant, a "Kész" gombra kattintás után a hibás (nem helyes, vagy hiányzó helyes) válaszok pirosak lesznek, hogy lássam, hol hibáztam.
9. Mint Participant, a helyes válaszok zöldek maradnak, hogy lássam, mit találtam el.
10. Mint Participant, mind a helyes válaszokat kijelölnöm kell és semmi helytelent, hogy egyetlen próbálkozásból teljes pontszám legyen.
11. Mint Participant, ha nem jelöltem ki mind a helyeset vagy kijelöltem egy helytelent, 0% a pontszám, hogy a pontozás következetes legyen az igaz–hamis és szópárosítóval.
12. Mint Participant, a válaszok véletlen sorrendben jöjjenek (az eredeti sorrendtől eltérően), hogy ne lehessen gondolkodás nélkül válaszolni.
13. Mint Participant, egy Blocknál egy Multiple-choice kérdés jöjjön (mint a betűzés), hogy egy kérdés egy kiértékelésnek feleljen meg.
14. Mint Participant, helyes válasz után a jó hangot akarom hallani, hogy tudjam, sikerült.
15. Mint Participant, helytelen válasz után a rossz hangot akarom hallani, hogy tudjam, nem sikerült.
16. Mint Participant, a hang után hallani akarom a kérdést (ha van `speak_text`), hogy megtanuljam az eredményt.
17. Mint Participant, a válaszom kiértékelése előtt semmi ne hangozzék el, hogy a felolvasás ne árulja el a választ.
18. Mint Participant, bekapcsolt auto-advance mellett a következő Block 2 másodperccel a felolvasás vége után jöjjön (vagy a pontozás után, ha nincs felolvasás), hogy a felolvasás ne szakadjon félbe.
19. Mint Participant, a kérdések a másik típusokkal (igaz–hamis, szópárosító, betűzés) vegyesen jöjjenek az ugyanazon Difficulty-tartományban, hogy a tartomány mindent gyakoroltasson, ami benne van.
20. Mint Participant, egy Practice-ben minden Multiple-choice kérdés csak egyszer jöjjön, hogy egy alkalommal ne kelljen kétszer ugyanazt a kérdést megválaszolnom.
21. Mint szülő, a szerkesztőben "Többválasztásos" típust akarok választani egy Questionhöz, hogy ilyen Quizeket írhassak.
22. Mint szülő, a Multiple-choice Question mezői ugyan azok, mint a feleletválasztásnál: a kérdésszöveg (`text`), a válaszlehetőségek (`options` tömb), a helyes válaszok (`answer` tömb — több elem), és opcionális kiejtés (`speak_text`).
23. Mint szülő, a Multiple-choice esetén az `options` tömb és a helyes válaszok `answer` tömb esetén ;-vel választom el a szerkesztőben és tömbként jelenik meg a JSON-ben.
24. Mint szülő, a válaszlehetőségek száma tetszőleges lehet a JSON-ben (2–6 és tovább), hogy rugalmas Quizeket írhassak.
25. Mint szülő, legalább egy helyes válasz (`answer`) szükséges a Question-ben, hogy a kérdés válaszolható legyen.
26. Mint szülő, a mentés hibát adjon, ha az `answer` üres vagy hiányzik, hogy minden kérdésnek legyen helyes válasza.
27. Mint szülő, a mentés hibát adjon, ha egy `answer`-beli helyes válasz nincs az `options` felsorolásában (vagyis a szerző elírta), hogy az összes helyes válasz a lehetőségek között legyen.
28. Mint szülő, a Quiz-lista típusonkénti kérdésszámai a Multiple-choice-t is tartalmazzák, hogy a Practice indítóképernyő tudja, egy tartomány gyakorolható-e.

## Implementation Decisions

- **Question type:** az új típuskulcs `multiple-choice`, megjelenített neve *Többválasztásos*. Bekerül a Practice engine játszható típusai közé, egy teljes Block mérete 1 Question (mint a betűzés). Egy Difficulty-tartomány már egyetlen Multiple-choice kérdés esetén is használható.
- **Adatszerkezet:** nincs sémaváltozás. A Multiple-choice Question mezői: `text` (a kérdésszöveg), `options` (a válaszlehetőségek tömbje), `answer` (a helyes válaszok tömbje — egy vagy több elem), `speak_text` (opcionális, ezen a nyelven olvasható fel a `text` vagy valami más kiértékelés után), `time` (opcionális, alapértéke a Quiz alapideje).
- **Mit kell választani:** a `answer` tömb minden elemét ki kell jelölni, és semmi egyéb `options` elemet. Az `options` tömbben szereplő, `answer`-ben nem szereplő elemek helytelenek.
- **Válaszok kijelölése:** egy válaszra koppintva az zöld lesz (kijelölve). Egy már zöld válaszra újra koppintva leszürkül (kijelölés feloldva). A kijelölés tehát ki-be kapcsol, amíg a Blokk nincs lezárva; lezárás után a koppintás hatástalan.
- **"Kész" gomb:** a lábléc-ben (mint az igaz–hamis és szópárosító mellett). Rákattintás után azonnal lezárul a Blokk. Az addig helytelenek pirosak lesznek, a helyesek zöldek maradnak.
- **Pontozás:** csak az számít, ha az összes helyes válasz ki van jelölve és semmi helytelen nincs kijelölve. Ha igen: 100%, egyébként 0%. Ez követi az igaz–hamis és szópárosító logikáját. Egy próbálkozás van. Ha lejár a visszaszámlálás, a ki nem töltött kérdés hibás.
- **Practice modul (az állapot, amit a képernyők megjelenítenek):** a Practice kiadja az aktuális Multiple-choice Block válaszlehetőségeit (szöveg, és hogy kijelölve van-e), valamint az *érinti a választ*, *Kész* műveleteket. Az engine továbbra is független a felülettől.
- **Felolvasás:** a Multiple-choice Questiont kiértékelés előtt soha nem olvassa fel, sem magától, sem kérésre. Kiértékelés után előbb a Block hangja szól, majd (ha van `speak_text`) felolvassa azt. A felolvasás után az auto-advance 2 másodpercig vár (vagy a pontozástól, ha nincs `speak_text`).
- **Kiválasztás:** a Multiple-choice Questionök ugyanúgy kerülnek kiválasztásra, mint bármely más játszható típus (véletlen sorrend az igaz–hamis, szópárosító és betűzés között).
- **Backend-ellenőrzés (mentéskor):** egy `multiple-choice` Questionnek legalább egy elem szükséges az `answer`-ben, és minden `answer` elem benne kell, hogy legyen az `options`-ben. Az `options` tömbnek legalább 2 eleme kell legyen. A hibaüzenetek magyarok (pl. „A „Hamis" válasz nincs az opciók között.").
- **Quiz-összesítők:** a típusonkénti kérdésszámok a `multiple-choice`-t is tartalmazzák.
- **Szerkesztő:** a típusválasztóban szerepel a "Többválasztásos"; a sorban a mezők: kérdésszöveg, opciók (felsorolás), helyes válaszok (felsorolás az opciók közül), opcionális kiejtés. A szerveroldali ellenőrzési hibák a soron jelennek meg, mint a többi típusnál.
- **Képernyő-elrendezése:** a Multiple-choice Block egy telefonképernyőn, görgetéssel mutatja a kérdésszöveget, a válaszgombokat (függőleges lista) és a "Kész" gombot. A gombok gombos stílusa mint a word-matching (kattintható elemek, nem jelölőnégyzetek). Ha hosszú egy válasz, nagyobb gomb kell sortöréssel.
- **Válaszok sorrendje:** véletlen (az engine random() által).

## Testing Decisions

- Jó teszt a nyilvános interfészen keresztül hajtja a rendszert, és azt ellenőrzi, amit egy Participant vagy a szülő észrevenne (a megjelenített állapot, a pontszám, a hangok és felolvasások sorrendje, mi mentődik és mi utasítódik el), soha nem a belső működést.
- **Practice modul (`createPractice`)** a fő tesztelési pont, memóriabeli data porttal, a rögzítő audio porttal, vezérelt órával és véletlenforrással. Lefedi: több helyes válasz kijelölése, kijelölés feloldása, mind kijelölése, részleges kijelölés (0%), hibás válasz kijelölése (0%), a "Kész" gomb rákattintása után az értékelés, zöld–piros visszajelzés, hogy kiértékelés előtt nincs felolvasás, a hang-utána-felolvasás sorrendje, az auto-advance időzítését a felolvasás végétől (és `speak_text` nélkül a pontozástól), a Blockonként egy kérdést, és a más típusokkal való keveredést.
- **Backend HTTP API**, a meglévő Quiz API tesztek mintájára: egy érvényes Multiple-choice Quiz mentődik; minden elutasítás (üres `answer`, `answer` nem az `options`-ben, 2-nél kevesebb `options`) a saját mezőjét és üzenetét adja vissza; a Quiz-összesítők számolják a `multiple-choice`-t.
- **Kézi ellenőrzés** (megállapodás szerint nincs hozzá automatikus teszt): a gombok mérete és tödelése telefonon, a szerkesztő típusválasztója.

## Out of Scope

- A megjelenítés részletei (gombok pontos mérete, szín, font) — megállapodás szerint kézi ellenőrzés.
- Képes vagy multimédia válaszlehetőségek — csak szöveg.
- Kategória-alapú vagy feltételes kérdések — lineáris szerkezetű kérdések maradnak.

## Further Notes

- A Multiple-choice szerkezetileg és logikailag nagyon hasonlít az igaz–hamishoz (3 kérdés, mindegyikre döntés, automatikus lezárás → "Kész" gomb) és a szópárosítóhoz (5 pár, mindegyikre döntés, automatikus lezárás → "Kész" gomb). Az **egyetlen különbség**: előre nem tudjuk, hány helyes válasz van, ezért a "Kész" gomb nélkülözhetetlen.
- A UI stílusát (zöld–piros gombok, felolvasás, auto-advance) az igaz–hamis és szópárosító alapján kell építeni, hogy az alkalmazás koherens maradjon.
- Ha a szülő több szerzővel dolgozik, az érvényesítési üzenetek segítségével gyorsan rá lehet jönni, mi hiányzik egy kérdésből.
