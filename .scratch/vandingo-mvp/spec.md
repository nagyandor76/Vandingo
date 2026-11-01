# Vandingo MVP

**Status:** ready-for-agent

Forrás: [Specification/specification-1.md](../../Specification/specification-1.md) (részletes követelmények), [GLOSSARY.md](../../GLOSSARY.md) (fogalmak), [ADR 0001](../../docs/adr/0001-csharp-backend-json-fajlok-railway-on.md) (architektúra). Ahol ez a dokumentum és a specifikáció eltér, a specifikáció a mérvadó.

## Problem Statement

Egy család négy gyereke (Janka, Vanda, Gréta, János) iskolai tananyagot gyakorolna telefonon: történelmi igaz–hamis állításokat és angol szavakat. A szülő Excelben vagy fejben gyűjti a kérdéseket, de nincs olyan eszköz, amelybe ezeket gyorsan be lehetne vinni, tantárgyanként és nehézségi szintenként rendezni, majd a gyerekek telefonjáról, időre, játékosan kikérdezni. Arról sincs áttekintés, ki mit gyakorolt és milyen eredménnyel.

## Solution

Egy mobilbarát webalkalmazás négy belépési ponttal:

- **Kitöltés:** a Participant kiválaszt egy Subjectet és egy Difficulty-tartományt, és egy Practice-t tölt ki. A Practice Blockokból áll (3 igaz–hamis állítás vagy 5 szópár), egy közös visszaszámlálóval, Blockonkénti kiértékeléssel és hangjelzéssel, angol szavak és állítások felolvasásával.
- **Szerkesztő mód:** számítógépen, egyetlen gridben szerkeszthető egy Quiz összes Questionje, Excelből beilleszthetően, típusonkénti ellenőrzéssel.
- **Eredmény böngésző:** egy Participant 10 legutóbbi Resultja, részletekkel.
- **Beállítások:** Subject létrehozása, Subjectenkénti beállítások, az összes adat letöltése ZIP-ben.

Minden adat JSON-fájlként tárolódik a szerveren, így minden eszköz ugyanazokat a Quizeket és Resultokat látja.

## User Stories

### Belépés

1. Mint felhasználó, a kezdőképernyőn választani akarok a Kitöltés, Szerkesztő mód, Eredmény böngésző és Beállítások közül, hogy egyből a kívánt funkcióhoz jussak.
2. Mint felhasználó, a kezdőképernyőt telefonon is kényelmesen akarom használni, hogy a gyerekek egyedül is elindíthassák a gyakorlást.

### Kitöltés: indítás

3. Mint Participant, a Kitöltés elején ki akarom választani a nevemet a négy közül, hogy a Result hozzám kerüljön.
4. Mint Participant, ki akarom választani a Subjectet a megjelenített neve alapján (pl. *Történelem*), hogy azt gyakoroljam, amit kell.
5. Mint Participant, ki akarom választani a kezdő és záró Difficultyt, hogy a tananyag megfelelő részét gyakoroljam.
6. Mint Participant, a szintválasztóban a szám mellett a Quiz nevét is látni akarom, hogy tudjam, melyik szint mit takar.
7. Mint Participant, a szintválasztóban csak a ténylegesen létező szinteket akarom látni, hogy ne válasszak üres szintet.
8. Mint Participant, azt akarom, hogy a választott tartomány mindkét végpontja beletartozzon a Practice-be.
9. Mint Participant, ha a tartományban nincs kitölthető Question, inaktív Start gombot és magyarázó üzenetet akarok látni, hogy értsem, miért nem indul.

### Kitöltés: a Practice összeállítása

10. Mint Participant, véletlenszerűen, ismétlés nélkül kiválasztott Questionöket akarok kapni, hogy minden Practice más legyen.
11. Mint szülő, azt akarom, hogy egy Practice legfeljebb a Subjecthez beállított számú Questiont tartalmazza, hogy a gyakorlás ne legyen túl hosszú.
12. Mint Participant, ha a tartományban kevesebb Question van a maximumnál, az összeset meg akarom kapni.
13. Mint Participant, csak igaz–hamis és szópárosítós Questionöket akarok kapni, mert a többi típus még nem kitölthető.
14. Mint Participant, egy angol vagy magyar szót egy Practice-ben csak egyszer akarok látni, hogy a párosítás egyértelmű legyen.
15. Mint Participant, legalább 2 párt akarok látni egy szópárosító Blockban, hogy ne kapjak triviális feladatot.
16. Mint Participant, a Blockok típusát vegyesen, véletlenszerűen akarom kapni, hogy változatos legyen a gyakorlás.

### Kitöltés: időkeret

17. Mint Participant, egyetlen közös visszaszámlálót akarok látni, amely a kiválasztott Questionök idejének összege, hogy magam osszam be az időmet.
18. Mint szülő, azt akarom, hogy egy Question ideje a saját `time` értéke legyen, ha meg van adva, különben a Quiz alapértelmezett ideje.
19. Mint Participant, ha lejár az idő, azt akarom, hogy az aktuális Block kiértékelődjön, a megválaszolatlan és meg nem jelent Questionök hibásnak számítsanak, és a Result azonnal elmentődjön.

### Kitöltés: igaz–hamis Block

20. Mint Participant, egyszerre legfeljebb 3 állítást akarok látni, mindegyiknél Igaz és Hamis választással.
21. Mint Participant, a Kész gombbal le akarom zárni a Blockot akkor is, ha nem válaszoltam mindenre; a hiányzó válasz hibásnak számít.
22. Mint Participant, lezáráskor látni akarom, mely válaszom helyes és mely hibás. Hibás vagy hiányzó válasznál az állítás piros keretet és hátteret kap, és a helyes gomb pirosan jelölve látszik, szöveges magyarázat nélkül.
23. Mint Participant, azt akarom, hogy a legfelső még megválaszolatlan állítás automatikusan felolvasódjon, ha van felolvasási nyelve.
24. Mint Participant, egy állítást legfeljebb egyszer akarok automatikusan hallani, akkor is, ha össze-vissza válaszolok.
25. Mint Participant, ha a legfelső megválaszolatlan állításnak nincs felolvasási nyelve, csendet akarok, nem az alatta lévő felolvasását.
26. Mint Participant, az állítás szövegére koppintva újra meg akarom hallgatni.
27. Mint Participant, a helyes választ nem akarom hallani.

### Kitöltés: szópárosító Block

28. Mint Participant, két oszlopban, összekevert sorrendben akarom látni az angol szavakat és a magyar jelentéseket (legfeljebb 5 párt).
29. Mint Participant, két koppintással akarok párosítani, bármelyik oszlopból kezdve.
30. Mint Participant, egy angol szóra koppintva hallani akarom a kiejtését.
31. Mint Participant, magyar szóra koppintva nem akarok felolvasást.
32. Mint Participant, azt akarom, hogy a Block csak az összes pár összeállítása után értékelődjön ki.
33. Mint Participant, az értékelésnél páronként látni akarom, mely párosítás helyes és melyik hibás.
34. Mint Participant, ha az idő lejár félkész párosításnál, a már összeállított párok értékelődjenek, a többi hibásnak számítson.

### Kitöltés: Blockok között

35. Mint Participant, minden Block után egy hangot akarok hallani: egyet, ha minden helyes, és egy másikat, ha nem.
36. Mint Participant, alapértelmezés szerint a Következő gombbal akarok továbblépni.
37. Mint szülő, Subjectenként be akarom kapcsolni az automatikus továbblépést, amely 2 másodperc után lép tovább.
38. Mint Participant, nem akarok visszalépni, és nem akarom módosítani a lezárt válaszokat.
39. Mint Participant, a Practice végén látni akarom az eredményemet: helyes és hibás válaszok száma, százalék, és hogy Passed-e.
40. Mint szülő, azt akarom, hogy egy félbehagyott Practice ne hozzon létre Resultot.

### Szerkesztő mód

41. Mint szülő, ki akarom választani a Subjectet, majd megnyitni egy meglévő Quizt, vagy újat létrehozni névvel és Difficultyvel.
42. Mint szülő, új Quiznél 10 másodperces alapértelmezett időt akarok kapni, amit módosíthatok.
43. Mint szülő, egy Quiz összes Questionjét egyetlen gridben akarom látni és szerkeszteni.
44. Mint szülő, soronként ki akarom választani a Question típusát.
45. Mint szülő, sorokat akarok hozzáadni és törölni.
46. Mint szülő, több cellát Excelből akarok bemásolni Ctrl+C / Ctrl+V-vel, hogy gyorsan felvihessem a kérdéseket.
47. Mint szülő, a listákat (`options`, `answer`) egy cellában `;` jellel elválasztva akarom megadni.
48. Mint szülő, igaz–hamis Questionnél Igaz/Hamis legördülő listából akarom kiválasztani a választ.
49. Mint szülő, Questionönként meg akarom adni az időt és a felolvasás nyelvét.
50. Mint szülő, ha valamelyik sor hibás, vagy a Quiz 5-nél kevesebb Questiont tartalmaz, nem akarom, hogy a mentés megtörténjen; a hibás sorokat kiemelve, a hiba okával akarom látni.
51. Mint szülő, a Quiz Difficultyjét meg akarom változtatni, és ha az új szint foglalt, a rendszer kérdezzen rá a felülírásra.
52. Mint szülő, új Quiz mentésekor foglalt szint esetén felülírási kérdést akarok kapni.
53. Mint szülő, egy teljes Quizt törölni akarok, megerősítés után.
54. Mint szülő, mind a négy kérdéstípust szerkeszteni és menteni akarom, akkor is, ha a Practice még csak kettőt használ.

### Eredmény böngésző

55. Mint szülő, ki akarom választani egy Participantot, és látni akarom a 10 legutóbbi Resultját, a legújabbal kezdve, tantárgytól függetlenül.
56. Mint szülő, a listában látni akarom a Subjectet, az időpontot, a százalékot, és hogy Passed-e.
57. Mint szülő, egy sorra koppintva látni akarom a Result összes adatát (tartomány, helyes/hibás, időkeret, felhasznált idő).

### Beállítások

58. Mint szülő, új Subjectet akarok létrehozni megjelenített névvel és kulccsal.
59. Mint szülő, azt akarom, hogy a rendszer elutasítsa a szabálytalan (nem a–z, 0–9, `-`) vagy már létező kulcsot.
60. Mint szülő, Subjectenként be akarom állítani a Practice maximális kérdésszámát (alapértelmezés: 20).
61. Mint szülő, Subjectenként be akarom kapcsolni az automatikus továbblépést.
62. Mint szülő, az összes adatot egy ZIP-fájlban le akarom tölteni biztonsági mentésként.

### Üzemeltetés

63. Mint szülő, azt akarom, hogy az első indításkor a repóban lévő Quizek bekerüljenek a tárhelyre, hogy rögtön legyen mit gyakorolni.
64. Mint szülő, azt akarom, hogy a későbbi indítások ne írják felül a szerkesztett Quizeket.
65. Mint szülő, azt akarom, hogy minden eszköz ugyanazokat a Quizeket és Resultokat lássa.

## Implementation Decisions

### Architektúra

- Egyetlen ASP.NET Core alkalmazás (minimal API) szolgálja ki a lefordított React + Material UI felületet és az `/api/*` végpontokat; egy Railway-szolgáltatás, tartós tárhely a Railway Volume (ADR 0001).
- Nincs adatbázis és nincs bejelentkezés. Minden adat JSON-fájl az adatkönyvtárban, amely konfigurálható (élesben a Volume, tesztben ideiglenes mappa).
- A Practice szabályai a böngészőben futnak; a szerver csak tárol és ellenőriz. A szerver a beküldött Resultot elfogadja (bejelentkezés nélkül nincs mit ellenőrizni).

### Adatformátumok

- **Quiz-fájl** Subjectenként és Difficultyként egy, a Difficulty a fájlnév. Mezők: `name`, `subject`, `difficulty`, `default_time`, `questions` (legalább 5 Question). Question mezők: `type`, `text`, `options`, `answer`, `time`, `speak_text`, `speak_answer` – részletek a specifikáció 4.2 pontjában.
- **Subject-fájl** Subjectenként egy, a Subject mappájában: `key`, `name`, `max_questions`, `auto_advance`.
- **Result-fájl** Practice-enként egy: `id`, `completedAt`, `participant`, `subject`, `difficultyFrom`, `difficultyTo`, `total`, `correct`, `incorrect`, `scorePercent`, `timeLimitSeconds`, `elapsedSeconds`.
- A Quiz- és Subject-fájlok snake_case, a Result-fájl camelCase kulcsokat használ; ez a meglévő mintafájlokból örökölt eltérés, amelyet a szerver szerializációja típusonként kezel.

### Backend modulok

- **Adattár:** Subjectek, Quizek és Resultok olvasása és írása az adatkönyvtárban. Az írás atomikus (ideiglenes fájlba írás, majd átnevezés), hogy félbeszakadt írás ne rontson el fájlt. Párhuzamos mentésnél az utolsó nyer, zárolás nincs.
- **Ellenőrzés:** a Quiz mentése előtt ellenőrzi, hogy legalább 5 Questiont tartalmaz, és minden Questiont a típusa szabályai szerint ellenőriz; hibánál soronkénti hibalistát ad vissza (sor indexe, mező, üzenet; a Questionök számára vonatkozó hibánál sor index nélkül), és nem ír semmit. A Subject kulcsát a szabály szerint ellenőrzi.
- **Kezdeti adatok:** induláskor, ha az adatkönyvtár Quiz-része üres, egyszer átmásolja a repó Quiz-mappáját.
- **Export:** a teljes adatkönyvtár ZIP-ként.

### API-szerződés

| Művelet | Végpont | Megjegyzés |
| --- | --- | --- |
| Subjectek listája | `GET /api/subjects` | kulcs, név, beállítások |
| Subject létrehozása | `POST /api/subjects` | hibás vagy foglalt kulcs: 400 / 409 |
| Subject beállításai | `PUT /api/subjects/{key}` | `max_questions`, `auto_advance`; a kulcs nem változik |
| Quizek listája | `GET /api/subjects/{key}/quizzes` | Difficulty, név, kérdésszám típusonként |
| Quiz betöltése | `GET /api/subjects/{key}/quizzes/{difficulty}` | |
| Quiz mentése | `PUT /api/subjects/{key}/quizzes/{difficulty}` | opcionális eredeti Difficulty (áthelyezéshez) és felülírási jelző; ha a cél foglalt és nincs felülírási jelző: 409; ellenőrzési hiba: 400 soronkénti hibalistával; áthelyezéskor az eredeti szint fájlja törlődik |
| Quiz törlése | `DELETE /api/subjects/{key}/quizzes/{difficulty}` | |
| Practice-hez Questionök | `GET /api/subjects/{key}/questions?from=&to=` | a tartomány összes Questionje, a Quiz alapértelmezett idejével feloldott idővel |
| Result mentése | `POST /api/results` | |
| Resultok listája | `GET /api/results?participant=&limit=` | a legújabb elöl |
| Result részletei | `GET /api/results/{id}` | |
| Export | `GET /api/export` | ZIP |

### Frontend modulok

- **Practice engine:** önálló, felülettől független modul. Bemenete a tartomány Questionjei, a Subject beállításai, egy véletlenszám-forrás és egy óra. Műveletei: indítás, igaz–hamis válasz megadása, szópár összeállítása, Block lezárása, idő múlása, továbblépés. Minden művelet után a teljes állapotot adja vissza: aktuális Block és elemei, válaszok, kiértékelés, hátralévő idő, felolvasandó állítás, a Practice vége esetén a Result. Ez a modul tartalmazza a kiválasztás, ismétlésszűrés, Blockképzés, súlyozott típusválasztás, pontozás, időlejárat és felolvasási sorrend szabályait.
- **Képernyők:** kezdőképernyő, Kitöltés (indítás, igaz–hamis Block, szópárosító Block, összesítés), Szerkesztő (AG Grid), Eredmény böngésző, Beállítások. A képernyők csak megjelenítik a Practice engine állapotát és továbbítják a műveleteket.
- **Felolvasás és hang:** a böngésző SpeechSynthesis API-ja, vékony adapter mögött; a Practice engine csak azt mondja meg, mit kell felolvasni.
- A Participantok listája (Janka, Vanda, Gréta, János) hardkódolt.

## Testing Decisions

- **Jó teszt:** csak külső viselkedést ellenőriz a tesztelési ponton keresztül (kérés → válasz és létrejött fájlok; művelet → állapot), belső függvényeket és implementációs részleteket nem. Egy refaktorálás ne törjön el tesztet, ha a viselkedés nem változott.
- **1. tesztelési pont – backend HTTP API:** a teljes alkalmazás memóriában fut egy ideiglenes adatkönyvtárral; a tesztek HTTP-kéréseket küldenek, és a válaszokat, valamint az adatkönyvtár tartalmát ellenőrzik. Lefedi: Quiz mentés/betöltés/törlés/áthelyezés és felülírási ütközés, típusonkénti ellenőrzés, Subject létrehozás és kulcsszabályok, Result mentés és listázás, kezdeti adatok átmásolása és nem felülírása, export.
- **2. tesztelési pont – Practice engine:** rögzített véletlenszám-forrással és vezérelt órával, determinisztikusan. Lefedi: kiválasztás és maximum, csak kitölthető típusok, ismétlődő szavak szűrése, legalább 2 pár Blockonként, Blockméretek, súlyozott típusválasztás, pontozás, félkész Block és időlejárat, `total` és `elapsedSeconds` számítása, a felolvasandó állítás kiválasztása.
- **Nem tesztelünk automatikusan:** React-képernyők, hangok, felolvasás, AG Grid beillesztés. Ezeket kézzel ellenőrizzük telefonon és számítógépen.
- **Előzmény:** a repóban még nincs kód és nincs teszt; ez a projekt első tesztkészlete.

## Out of Scope

- Bejelentkezés, jogosultságkezelés, adminvédelem.
- A `multiple-choice` és `ordered` típusok kitöltő felülete (szerkeszthetők és menthetők, de a Practice kihagyja őket).
- Participantok szerkesztése, Subject átnevezése vagy törlése.
- Kérdésenkénti válasznapló a Resultban.
- Statisztikák a 10 legutóbbi Resulton túl (időszaki, tantárgyi kimutatások).
- Automatikus biztonsági mentés (helyette kézi ZIP-letöltés).
- Zárolás vagy ütközéskezelés párhuzamos szerkesztésnél.
- A szerkesztő telefonos optimalizálása.
- Szópárok többértelműségének kezelése.

## Further Notes

- A felület nyelve magyar.
- A Railway aktuális árait és csomagkorlátait üzembe helyezéskor ellenőrizni kell.
- A gyakorlás menetét (Practice engine) érdemes lehet a fejlesztés előtt `/prototype`-pal kipróbálni, ha a szabályok papíron nem elég világosak.
