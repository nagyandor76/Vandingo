from pathlib import Path
p=Path('/mnt/data/kvizalkalmazas_specifikacio.md')
p.write_text("""# Oktatási kvízalkalmazás – specifikáció

**Verzió:** 0.1 · **Dátum:** 2026-10-20 · **Státusz:** MVP-követelmények

## 1. Cél és hatókör

Reszponzív, mobilböngészőből használható oktatási webalkalmazás kvízek szerkesztésére, kitöltésére és az eredmények központi tárolására. Első körben két kvíztípus készül: **igaz–hamis** és **angol–magyar szópárosítás**. Az alkalmazásban nincs regisztráció, bejelentkezés vagy adatbázis.

## 2. Közös fogalmak és működés

- **Kvíztípus:** a válaszadás módja, nem a tantárgy.
- **Tantárgy:** a tananyag kategóriája.
- **Kvíz:** önálló névvel, tantárggyal, típussal, 1–20 közötti nehézségi szinttel és feladatkészlettel rendelkező egység.
- **Nehézségi szint:** a tananyag sorrendjét is jelző egész szám; tantárgyon belül egyedi. A kvíz neve ettől független szöveges attribútum.
- **Gyakorlás:** a kiválasztott kvíztípus, tantárgy és zárt nehézségi tartomány feladataiból összeállított kitöltés.

Indításkor a kitöltő kiválasztja a **kvíztípust**, a **tantárgyat**, majd a **kezdő és záró nehézséget**. Mindkét szintválasztóban a szám és a kvíz neve együtt jelenik meg. A tartomány mindkét végpontja beletartozik a feladatválasztásba.

Minden gyakorlás indításakor kötelező újra kiválasztani a kitöltő személyét: **Janka, Vanda, Gréta vagy János**. Az előző választást a rendszer nem jegyzi meg.

## 3. Szerkesztői felület

### 3.1. Közös szerkesztési folyamat

1. Kvíztípus és tantárgy kiválasztása.
2. Meglévő kvíz megnyitása vagy új kvíz létrehozása névvel és 1–20 közötti nehézségi szinttel.
3. Az adott kvíz valamennyi feladatának megjelenítése **egyetlen szerkeszthető gridben**.
4. Sorok módosítása és hozzáadása; többcellás **Ctrl+C / Ctrl+V**, Excelből történő beillesztéssel.
5. Mentés a kvíz saját JSON-fájljába.

A legördülő listák törzsadatai az MVP-ben lehetnek hardkódoltak. A gridhez **AG Grid** javasolt.

### 3.2. Igaz–hamis szerkesztő

| Mező | Leírás |
|---|---|
| Állítás | A kérdés szövege |
| Helyes válasz | Igaz / Hamis |
| Idő (másodperc) | Kérdésenként szerkeszthető; alapérték 10 |
| Felolvasás | Igen / Nem |
| Felolvasás nyelve | Nyelvkód, például `hu-HU`, `en-US` |

### 3.3. Angol–magyar szópárosító szerkesztő

| Mező | Leírás |
|---|---|
| Angol szó | A pár angol eleme |
| Magyar jelentés | A pár magyar eleme |

Az egyes kvíztípusok **saját feladat-JSON-sémát** használhatnak, közös kvíz-metaadatokkal.

## 4. Kitöltői felület

### 4.1. Igaz–hamis

- Alapértelmezés szerint **20 kérdés**, indításkor módosítható.
- A kérdések a kijelölt nehézségi tartományból **véletlenszerűen, ismétlés nélkül** kerülnek kiválasztásra.
- Egyszerre **3 állítás** látható (az utolsó blokk rövidebb lehet).
- A **Kész** gomb lezárja a blokkot. Nem kötelező mindháromra válaszolni; a hiányzó válasz hibás.
- Lezáráskor azonnal látható, mely válasz helyes, mely hibás, és mi lett volna a helyes válasz.
- Blokkonként **egy összesített hangjelzés** szól.
- Alapértelmezés szerint külön **Következő** gombbal lép tovább; konfigurálható automatikus továbblépés is.
- Visszalépés és lezárt válasz módosítása nincs.
- A gyakorlás **teljes időkerete** a kiválasztott kérdésekhez rendelt másodpercek összege. **Egy közös visszaszámláló** fut, nem kérdésenkénti időzítő.
- A felolvasás a kérdések saját beállításai alapján történik; az adott blokk felolvasandó kérdései automatikusan, egymás után hangzanak el.

### 4.2. Angol–magyar szópárosítás

- Egyszerre **5 angol szó** és a hozzájuk tartozó **5 magyar jelentés** látható két oszlopban.
- Az oszlopok elemei összekevert sorrendben jelennek meg.
- A kitöltő két kattintással/érintéssel párosít; **bármelyik nyelvi oldalról indulhat**.
- A rendszer **csak mind az öt pár összeállítása után értékel**.
- Az értékelés **páronként** jelzi a helyes és hibás összerendeléseket.
- **Angol szóra kattintva** a szó angol nyelven felolvasandó.
- **Magyar elemre kattintva nincs felolvasás**.
- A szópárosító nem szövegbeviteles feladat: a korábban felmerült fordításbeírási módot a párosítás váltotta fel.

## 5. Eredmények és összesítés

- **Minden gyakorlás eredménye külön JSON-fájl**.
- **Az eredmény-JSON sémája minden kvíztípusnál azonos**.
- Az eredmény csak **összesítő adatokat** tartalmaz; kérdésenkénti válasznapló nem szükséges.
- Az eredményben szerepel a kitöltő neve, az időpont, a kvíztípus, a tantárgy, a nehézségi tartomány, a helyes/hibás válaszok száma és a teljesítési százalék. A rendelkezésre álló és ténylegesen felhasznált idő tárolása is javasolt.

**Javasolt közös eredményséma:**

```json
{
  "id": "egyedi-kitöltes-azonosito",
  "completedAt": "2026-10-20T08:38:00+02:00",
  "participant": "Janka",
  "quizType": "true-false",
  "subject": "history",
  "difficultyFrom": 1,
  "difficultyTo": 5,
  "total": 20,
  "correct": 17,
  "incorrect": 3,
  "scorePercent": 85,
  "timeLimitSeconds": 200,
  "elapsedSeconds": 156
}
```

Az időmezők ott lehetnek `null` értékűek, ahol a feladattípus időszabályai még nem meghatározottak.

## 6. Technikai architektúra

| Terület | Technológia / döntés |
|---|---|
| Frontend | **React + Material UI** |
| Szerkeszthető grid | **AG Grid** (javaslat) |
| Fejlesztési környezet | Windows |
| Célkliens | Android/iPhone mobilböngésző, reszponzív webalkalmazás |
| Backend | Minimális **Node.js + Express** API |
| Tárolás | **JSON-fájlok**, adatbázis nélkül |
| Éles futtatás | **Railway** |
| Tartós tárhely | **Railway Volume** |
| Verziókezelés | Git/GitHub |
| Felolvasás | Böngészős SpeechSynthesis API (javaslat) |

### 6.1. Adattárolás és telepítés

A React nem írhat közvetlenül a Railway Volume-ra: a fájlműveleteket a minimális backend végzi. A frontend és a backend egy Railway-szolgáltatásként is üzemeltethető. A Git-re a **forráskód**, a Railway Volume-ra a **futás közben szerkesztett kvízek és eredmények** kerülnek.

**Javasolt könyvtárstruktúra:**

```text
/data/
  quizzes/
    true-false/
      <quiz-id>.json
    word-matching/
      <quiz-id>.json
  results/
    <result-id>.json
```

### 6.2. Javasolt API

| Módszer | Végpont | Funkció |
|---|---|---|
| GET | `/api/quizzes` | Kvízek listázása és szűrése |
| GET | `/api/quizzes/:id` | Kvíz betöltése |
| PUT | `/api/quizzes/:id` | Kvíz mentése |
| POST | `/api/results` | Eredmény külön fájlba mentése |
| GET | `/api/results` | Összesített eredmények lekérése |

A backend ellenőrzi az adatokat és biztonságos, ütközésmentes fájlmentést végez.

### 6.3. Biztonság és üzemeltetés

Az MVP-ben **nincs bejelentkezés és adminvédelem**. A szerkesztő nyilvános elérhetősége miatt bárki módosíthatja a kvízeket; ez tudatosan vállalt kezdeti korlátozás. A Railway Volume tartóssága nem helyettesíti a külön biztonsági mentést. A Railway aktuális csomagkorlátait üzembe helyezéskor ellenőrizni kell.

## 7. Nyitott döntések

1. **Szópárosítás időkerete**, lejárati viselkedése és a gyakorlásonkénti ötös blokkok száma.
2. **Igaz–hamis időlejárat:** aktuális blokk lezárása és kiértékelése.
3. **Elvárt teljesítési százalék:** hol állítható be, és mi számít sikeres teljesítésnek.
4. **Szópárosítás többértelműsége:** több azonos szó vagy több helyes jelentés kezelése.
5. **Hangjelzések** konkrét hangjai és az automatikus továbblépés késleltetése.
6. **Eredménystatisztikák felülete:** személyenkénti, időszaki vagy tantárgyi kimutatások.
7. **Kvízek törlése**, szintütközés kezelése és a szerkesztő mentési folyamata.

## 8. MVP elfogadási kritériumok

- A szerkesztő mindkét kvíztípust kezeli, és támogatja az Excelből történő tömeges beillesztést.
- A kvízek JSON-fájlokba menthetők és újratölthetők.
- A kitöltő minden indításkor kötelezően személyt választ.
- Az igaz–hamis feladatok hármas blokkokban, közös időkerettel, blokkértékeléssel működnek.
- A szópárosítás ötös blokkokban, mindkét irányból indítható párosítással és a blokk végén tételes értékeléssel működik.
- Az angol szavak kattintásra felolvasódnak, a magyarok nem.
- Minden kitöltés külön, azonos szerkezetű összesítő eredmény-JSON-ba kerül a Railway tartós tárhelyén.
""", encoding="utf-8")
print(f"Elkészült: {p} ({p.stat().st_size} bájt)")
