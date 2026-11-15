---
status: ready-for-agent
---

# Betűzés (Spelling) kérdéstípus

Forrás: a `/grill-with-docs` beszélgetés (2026-11-15), [GLOSSARY.md](../../GLOSSARY.md) (fogalmak, köztük az új **Spelling** szócikk), [ADR 0001](../../docs/adr/0001-csharp-backend-json-fajlok-railway-on.md) (architektúra).

## Problem Statement

A gyerekek a szópárosítással (word-matching) már gyakorolják az angol szavak jelentését, de a párosítás csak felismerést kér: a helyes angol alak ott van a képernyőn, elég rábökni. Arra, hogy le is tudják-e írni a szót betűről betűre, nincs gyakorlási lehetőség. A szülő már elkészítette a betűzős Quizt (`english`, 9-es Difficulty, 167 Question `spelling` típussal), de az alkalmazás ezt a típust nem ismeri: a Practice nem tudja lejátszani, a szerkesztő nem tudja elmenteni.

## Solution

Új, játszható Question type: a **Spelling** (*Betűzés*). A Participant a magyar jelentést látja, és az angol alakot rakja ki betűgombokból. Annyi gomb van, ahány betűből a szó áll, plusz két véletlen betű. A szóközök és írásjelek előre ki vannak írva a válaszsorban. A gombok egy telefon képernyőjén legfeljebb három sorban férnek el, és a betűszámhoz képest a lehető legnagyobbak. Amint minden hely betelt, a válasz kiértékelődik: szól a jó vagy rossz hang, utána, ha a Questionnek van `speak_text`-je, elhangzik a helyes angol alak. Rossz válasznál a hibás betűk pirosak, alattuk a helyes alak látszik. A szerkesztőben a típus „Betűzés” néven választható, és mentéskor a rendszer ellenőrzi.

## User Stories

1. Mint Participant, látni akarom a szó magyar jelentését, hogy tudjam, melyik angol szót kell kiraknom.
2. Mint Participant, az angol szó minden betűjéhez egy betűgombot akarok, hogy billentyűzet nélkül rakhassam ki a szót.
3. Mint Participant, két plusz véletlen betűt akarok a gombok között, hogy ne lehessen gondolkodás nélkül, az összes gomb felhasználásával megoldani.
4. Mint Participant, a gombokat ábécérendben akarom látni (az azonos betűk egymás mellett), hogy gyorsan megtaláljam a következő betűt.
4a. Mint Participant, azt akarom, hogy legalább az egyik plusz betű a szó betűi közé essen (pl. `hit` → `h i j t x`, nem `a h i t x`), hogy az ábécérendbe rakott gombok ne adják ki egyben a szót.
5. Mint Participant, egy ismétlődő betűs szónál (pl. `stuff`) annyi gombot akarok az adott betűből, amennyi kell, hogy minden szó kirakható legyen.
6. Mint Participant, kisbetűs gombokat akarok, és ne számítson a kis- és nagybetű, hogy a `Just kidding!`-hez hasonló kifejezéseknél ne kelljen a nagybetűkre figyelnem.
7. Mint Participant, a szóközöket és írásjeleket (`' - / . ? ! ( )`, számjegyek) előre kiírva akarom látni a helyükön a válaszsorban, hogy lássam az egyes szavak hosszát, és csak betűket kelljen kiraknom.
8. Mint Participant, egy gombra koppintva a betűt a következő üres helyre akarom tenni, hogy gyorsan kirakhassam a szót.
9. Mint Participant, azt akarom, hogy a felhasznált gomb elhalványuljon és ne reagáljon, hogy lássam, mely betűk maradtak.
10. Mint Participant, egy ⌫ gombot akarok, amely visszaadja az utoljára lerakott betűt, hogy javíthassak.
11. Mint Participant, a válaszsorban egy lerakott betűre koppintva vissza akarom adni azt a gombok közé, hogy a szó közepén is javíthassak.
12. Mint Participant, azt akarom, hogy a válasz abban a pillanatban kiértékelődjön, amikor minden hely betelt, hogy ne kelljen külön gombot nyomnom.
13. Mint Participant, szavanként egy próbálkozást akarok, ahogy a többi típusnál, hogy a pontszám mindenhol ugyanazt jelentse.
14. Mint Participant, helyes válasz után a jó hangot akarom hallani, hogy tudjam, sikerült.
15. Mint Participant, rossz válasz után a rossz hangot akarom hallani, hogy tudjam, nem sikerült.
16. Mint Participant, a hang után hallani akarom az angol szót, ha a Questionnek van kiejtése, hogy halljam, hogyan mondják a szót, amit épp kiraktam.
17. Mint Participant, rossz válasz után is hallani akarom a helyes szót, hogy megtanuljam a helyes alakot.
18. Mint Participant, azt akarom, hogy a válaszom előtt semmi ne hangozzék el, hogy a kiejtés ne árulja el a betűzést.
19. Mint Participant, azt akarom, hogy a 🔊 gomb csak a szó kiértékelése után jelenjen meg, hogy újra meghallgathassam, de ne lehessen vele csalni.
20. Mint Participant, a válaszom hibás betűit pirossal akarom látni, alatta a helyes alakot, hogy pontosan lássam, hol hibáztam.
21. Mint Participant, Blockonként egy szót akarok, hogy minden szó külön kiértékelődjön és külön elhangozzék.
22. Mint Participant, azt akarom, hogy minden gomb elférjen a telefonom képernyőjén legfeljebb három sorban, hogy betűzés közben soha ne kelljen görgetnem.
23. Mint Participant, a lehető legnagyobb gombokat akarom (rövid szónál nagyobbakat), hogy telefonon könnyen eltaláljam őket.
24. Mint Participant, azt akarom, hogy ha lejár a visszaszámlálás, a félig kirakott vagy üres szó hibásnak számítson, mint bármely meg nem válaszolt Question.
25. Mint Participant bekapcsolt auto-advance mellett, azt akarom, hogy a következő Block 2 másodperccel a felolvasás vége után jöjjön (vagy a pontozás után, ha nincs felolvasás), hogy a felolvasás ne szakadjon félbe.
26. Mint Participant, azt akarom, hogy ha a Difficulty-tartományban több típus is van, a betűzős Blockok vegyesen jöjjenek az igaz–hamis és szópárosító Blockokkal, hogy a tartomány mindent gyakoroltasson, ami benne van.
27. Mint Participant, azt akarom, hogy egy Practice-ben minden betűzős Question csak egyszer jöjjön, hogy egy ülésben ne kelljen kétszer ugyanazt a szót kiraknom.
28. Mint szülő, a szerkesztőben „Betűzés” típust akarok választani egy Questionhöz, hogy betűzős Quizeket írhassak.
29. Mint szülő, azt akarom, hogy a betűzős Question ugyanazokat a mezőket használja, mint a szópárosító (angol szó a szövegben, magyar jelentés egyetlen válaszként, opcionális kiejtés), hogy egy szópárosító Quizt átmásolva elég legyen a típust átírnom.
30. Mint szülő, azt akarom, hogy a mentés érthető üzenettel hibát adjon, ha egy betűzős Questionnek nem pontosan egy, nem üres magyar jelentése van, hogy minden szó megjeleníthető legyen.
31. Mint szülő, azt akarom, hogy a mentés hibát adjon, ha az angol szóban nincs betű, hogy mindig legyen mit kirakni.
32. Mint szülő, azt akarom, hogy a mentés hibát adjon, ha az angol szó 22-nél több betűből áll (szóközök és írásjelek nélkül), és az üzenet mondja meg a tényleges számot, hogy a gombok (legfeljebb 24) mindig elférjenek három sorban.
33. Mint szülő, azt akarom, hogy a mentés hibát adjon, ha az angol szóban a–z-n kívüli betű van (pl. `café`), hogy minden betűnek legyen gombja.
34. Mint szülő, azt akarom, hogy a Quiz-lista típusonkénti kérdésszámai a betűzést is tartalmazzák, hogy a Practice indítóképernyő tudja, egy tartomány gyakorolható-e.
35. Mint szülő, azt akarom, hogy a szállított `english` 9-es betűzős Quiz kézi javítás nélkül menthető legyen, hogy ne kelljen első használat előtt javítgatnom.

## Implementation Decisions

- **Question type:** az új típuskulcs `spelling`, megjelenített neve *Betűzés*. Bekerül a Practice engine játszható típusai közé, egy teljes Block mérete 1 Question. Egy Difficulty-tartomány már egyetlen betűzős Question esetén is használható betűzésre.
- **Adatszerkezet:** nincs sémaváltozás. A betűzős Question mezői: `text` (az angol szó vagy kifejezés), `answer` (pontosan egy elem, a magyar jelentés), `speak_text` (opcionális, ezen a nyelven olvasható fel a `text`), `time` (opcionális, alapértéke a Quiz alapideje). Ugyanaz, mint a szópárosítónál.
- **Mit kell kirakni:** a `text` a–z betűit. Minden más karakter (szóköz, írásjel, számjegy) előre kitöltött, rögzített hely. Az összevetés nem érzékeny a kis- és nagybetűre; a gombokon kisbetű áll; a kiértékelt válaszsor az eredeti alakot mutatja.
- **Gombok:** betűelőfordulásonként egy gomb, plusz két véletlen betű. Az egyik plusz betű a szó ábécében első és utolsó betűje közé esik (attól szigorúan nagyobb, illetve kisebb, így ábécérendben a szó betűi közé kerül); a másik bármelyik betű lehet az a–z közül. Ha a szó első és utolsó betűje között nincs betű (pl. `a`, `ab`, `aaa`), mindkét plusz betű bármelyik lehet. Ismétlődés megengedett. A gombok ábécérendben állnak (a plusz betűk is a helyükre kerülnek), az azonos betűk egymás mellett. A plusz betűk a Practice-nek átadott véletlenforrásból jönnek. Legfeljebb 22 + 2 = 24 gomb. (Módosítva 2026-11-15: korábban véletlen sorrend volt, amely sosem adta ki a szót; most ábécérend, és legalább egy plusz betű a szó betűi közé esik.)
- **A válasz kirakása:** a lerakás a következő üres betűhelyet tölti ki; a ⌫ az utoljára lerakott betűt adja vissza; egy lerakott betűre koppintás azt az egyet adja vissza, a helye üres marad (a következő gomb ezután az első üres helyet tölti ki). Egy lerakott gombot nem lehet újra lerakni. Kiértékelt Blockban egyik művelet sem hat.
- **Pontozás:** a Block azonnal lezárul és kiértékelődik, amint minden betűhely betelt; egy próbálkozás van. Ha lejár a visszaszámlálás, a ki nem töltött szó hibás. Rossz válasznál a Practice állapota helyenként megmondja a képernyőnek, hogy a lerakott betű jó volt-e, és megadja a helyes alakot.
- **Practice modul (az állapot, amit a képernyők megjelenítenek):** a Practice kiadja az aktuális betűzős Block helyeit (előre kiírt karakterek és lerakott betűk), gombjait (betű, és hogy fel van-e használva), valamint a *gomb lerakása*, *utolsó visszavétele*, *hely visszavétele* műveleteket. Az engine továbbra is független a felülettől.
- **Felolvasás:** a betűzős Questiont kiértékelés előtt soha nem olvassa fel, sem magától, sem kérésre. Kiértékelés után előbb a Block hangja szól, majd (ha van `speak_text`) felolvassa a `text`-et. A 🔊 művelet csak kiértékelt betűzős Blocknál érhető el, és újra felolvassa a `text`-et.
- **Az audio port változása:** a Practice audio portja jelzi, ha a Block hangja vagy egy felolvasás véget ért (pl. promise-t ad vissza, vagy befejezési callbacket kap), hogy a Practice a hang után indíthassa a felolvasást, és a felolvasás végétől számíthassa az auto-advance várakozást. A böngészős adapter a befejezést a Web Audio hangjegyek ütemezett hosszából és a beszédszintézis utterance `end` eseményéből veszi (hibánál és megszakításnál is, hogy semmi ne akadjon el). A meglévő típusok viselkedése nem változik.
- **Auto-advance:** ha a Subject `auto_advance` beállítása be van kapcsolva, a kiértékelt betűzős Block a felolvasás vége után 2 másodpercig marad a képernyőn, `speak_text` nélkül a pontozás után 2 másodpercig. A kézi továbblépés ezt továbbra is félbeszakítja.
- **Kiválasztás:** a betűzős Questionök ugyanúgy kerülnek kiválasztásra, mint bármely más játszható típus. A típusok között nincs ismétlésszűrés: ugyanaz az angol szó egy Practice-en belül szópárosítóként és betűzősként is előfordulhat.
- **Backend-ellenőrzés (mentéskor):** egy `spelling` Questionnek pontosan egy, nem üres jelentés kell az `answer`-ben; a `text`-ben legalább 1 és legfeljebb 22 a–z betű lehet (kis- és nagybetű nem számít), más betű nem lehet benne (az a–z-n kívüli Unicode-betűket elutasítja); a nem betű karakterek megengedettek. A hibaüzenetek magyarok, és megnevezik a mezőt, mint a meglévő típusszabályok (pl. „Legfeljebb 22 betű lehet, most 27 van.”).
- **Quiz-összesítők:** a típusonkénti kérdésszámok a `spelling`-et is tartalmazzák.
- **Szerkesztő:** a típusválasztóban szerepel a „Betűzés”; a sorban ugyanazok a mezők szerkeszthetők, mint a szópárosítónál. A szerveroldali ellenőrzési hibák a soron jelennek meg, mint a többi típusnál.
- **Képernyő-elrendezés:** a betűzős Block egy telefonképernyőn, görgetés nélkül mutatja a magyar jelentést, a válaszsort, a gombokat és a ⌫ gombot. A gombok kitöltik a szélességet a lehető legkevesebb, legfeljebb három sorban, és kevesebb betűnél nagyobbak, kb. 64 px-ig.
- **Adattisztítás:** a szállított `english` 9-es Quizből törlődik az a hat Question, amelyik 22-nél több betűből áll: `send text/voice messages emails`, `receive text/voice messages emails`, `make sth exciting/better etc.`, `find sth interesting/boring etc.`, `Give me a call later/sometime.`, `It was great chatting with you.` A fájlban más nem változik.

## Testing Decisions

- Jó teszt a nyilvános interfészen keresztül hajtja a rendszert, és azt ellenőrzi, amit egy Participant vagy a szülő észrevenne (a megjelenített állapot, a hangok és felolvasások sorrendje, mi mentődik és mi utasítódik el), soha nem a belső működést.
- **Practice modul (`createPractice`)** a fő tesztelési pont, memóriabeli data porttal, a rögzítő audio porttal, vezérelt órával és véletlenforrással. A rögzítő audio port a hangokhoz és felolvasásokhoz vezérelhető „véget ért” jelzést kap. Lefedi: a gombkészletet és az ábécérendet, hogy egy plusz betű a szó betűi közé esik, a lerakást, a ⌫-t, egy hely visszavételét, a kiértékelést a betelés pillanatában, a helyenkénti helyességet rossz válasznál, az előre kiírt karaktereket és a kis- és nagybetű figyelmen kívül hagyását, a ki nem töltött szó hibásságát időlejáratnál, a hang-utána-felolvasás sorrendet, hogy kiértékelés előtt nincs felolvasás, a 🔊-t csak kiértékelés után, az auto-advance időzítését a felolvasás végétől (és `speak_text` nélkül a pontozástól), a Blockonként egy szót, és a más típusokkal való keveredést. Előzmény: a Practice modul meglévő tesztjei az igaz–hamis és szópárosító típusra.
- **Backend HTTP API**, a meglévő Quiz API tesztek mintájára: egy érvényes betűzős Quiz mentődik; minden elutasítás (jelentések száma, 0 betű, 23 betű, a–z-n kívüli betű) a saját mezőjét és üzenetét adja vissza; a Quiz-összesítők számolják a `spelling`-et.
- **Kézi ellenőrzés** (megállapodás szerint nincs hozzá automatikus teszt): a gombok mérete és tördelése telefonon (rövid szó egy sorban nagy gombokkal, 22 betűs kifejezés három sorban), és a szerkesztő típusválasztója.
- A meglévő engine unit tesztek maradnak; az új viselkedés a Practice modulon keresztül tesztelődik, nem új engine-szintű tesztekkel.

## Out of Scope

- A feleletválasztós (multiple-choice) és sorrendezős (ordered) típus játszhatóvá tétele.
- Betűzés a másik irányba (angol látszik, magyart kell beírni), vagy gépelés a telefon saját billentyűzetén.
- Több próbálkozás, segítség, vagy betűnkénti részpontszám.
- Ismétlésszűrés típusok között egy Practice-en belül.
- Szerkesztőoldali (kliens) ellenőrzés a 22 betűs korlátra, azon túl, hogy a szerver hibája megjelenik.
- a–z-n kívüli betűk (ékezetes betűk, más ábécék).

## Further Notes

- A 22 betűs korlát az elrendezésből adódik: legfeljebb 24 gombnak kell elférnie három sorban egy telefonon.
- A szállított 9-es Quiz már a `spelling` kulcsot és a szópárosítóval azonos mezőkiosztást használja, így a tisztításon kívül nem kell rajta változtatni.
