## 1. Cél és hatókör

Reszponzív, mobilböngészőből használható oktatási webalkalmazás kvízek szerkesztésére, kitöltésére és az eredmények központi tárolására. Első körben két kvíztípus készül: **igaz–hamis** és **angol–magyar szópárosítás**. Az alkalmazásban nincs regisztráció, bejelentkezés vagy adatbázis. A fogalmak pontos meghatározása: [GLOSSARY.md](../GLOSSARY.md).

## 2. Közös fogalmak és működés

- **Kvíztípus:** a kérdés válaszadási módja (kérdésenként megadva), nem a tantárgy.
- **Tantárgy:** a tananyag kategóriája. Van egy nem változtatható **kulcsa** (pl. `history`) és egy **megjelenített neve** (pl. *Történelem*).
- **Kvíz:** önálló névvel, tantárggyal, 1–20 közötti nehézségi szinttel és feladatkészlettel rendelkező egység. Egy kvízt a **tantárgy és a nehézségi szint** azonosít; a név csak megjelenített felirat.
- **Nehézségi szint:** a tananyag sorrendjét is jelző egész szám; tantárgyon belül egyedi. A kvíz neve ettől független szöveges attribútum.
- **Gyakorlás:** tantárgy és zárt nehézségi tartomány feladataiból összeállított kitöltés.
- **Blokk:** a gyakorlás egyszerre megjelenő és együtt kiértékelt egysége; egy blokkban csak egyféle kérdéstípus van (3 igaz–hamis állítás vagy 5 szópár).
- **Kitöltő:** a négy rögzített személy egyike: **Janka, Vanda, Gréta, János**. A lista az MVP-ben hardkódolt.
- **Sikeres gyakorlás:** 100%-os teljesítés.

## 3. Belépés

A weboldal indításakor kötelező választani az alábbiak közül:

- **Kitöltés**
- **Szerkesztő mód**
- **Eredmény böngésző**
- **Beállítások**

A kitöltés esetén a személy kiválasztása után **tantárgyat**, majd a **kezdő és záró nehézséget** adja meg. Mindkét szintválasztóban a szám és a kvíz neve együtt jelenik meg, és csak azok a szintek szerepelnek, amelyekhez létezik kvíz. A tartomány mindkét végpontja beletartozik a feladatválasztásba (pl. 1, 2, 5, 9 létező szint esetén a 2–9 tartomány a 2., 5. és 9. szintet jelenti).

Ha a tartományban egyik kitölthető típusból sincs legalább egy teljes blokknyi kérdés (lásd 5.1), a Start gomb inaktív, és ez az üzenet látható: „Ebben a tartományban nincs elég kitölthető kérdés.”

## 4. Szerkesztői felület

A szerkesztő számítógépre készül; telefonon működik, de nincs rá optimalizálva.

### 4.1. Közös szerkesztési folyamat

1. Tantárgy kiválasztása.
2. Meglévő kvíz megnyitása vagy új kvíz létrehozása névvel és 1–20 közötti nehézségi szinttel. Új kvíznél a `default_time` értéke 10 másodperc.
3. Az adott kvíz valamennyi feladatának megjelenítése **egyetlen szerkeszthető gridben**; a kérdés típusa soronként választható.
4. Sorok módosítása, hozzáadása és törlése; többcellás **Ctrl+C / Ctrl+V**, Excelből történő beillesztéssel.
5. Mentés a kvíz saját JSON-fájljába.

A legördülő listák törzsadatai az MVP-ben lehetnek hardkódoltak. A gridhez **AG Grid** javasolt.

**Listák a gridben:** az `options` és az `answer` elemei egy cellában `;` jellel elválasztva szerepelnek (pl. `Théba; Memphisz`); az elemek körüli szóközök levágódnak. Igaz–hamis kérdésnél a válasz cellája Igaz/Hamis legördülő lista.

**Ellenőrzés:** ha bármely sor megsérti a típusa szabályait, vagy a kvíz 5-nél kevesebb kérdést tartalmaz, a mentés nem történik meg; a hibás sorok kiemelve, a hiba okával jelennek meg, a kérdések számára vonatkozó hiba pedig a kvíz egészére.

**Szint módosítása:** egy kvíz szintje megváltoztatható, ekkor a kvíz az új szintre kerül. Ha az új szinten (vagy új kvíz mentésekor a megadott szinten) már van kvíz, a rendszer rákérdez a felülírásra.

**Kvíz törlése:** teljes kvíz törölhető; a törlés előtt a rendszer rákérdez.

**Kvíz feltöltése JSON-ből:** a kiválasztott tantárgyhoz egy kvíz-JSON fájl (4.2) feltölthető. A kvíz a fájlban megadott szintre kerül, a kiválasztott tantárgyhoz (a fájl `subject` mezőjétől függetlenül). Ugyanaz az ellenőrzés fut, mint mentéskor; hibás vagy nem kvíz-JSON fájlnál semmi nem íródik, és a hiba oka megjelenik. Ha a szint foglalt, a rendszer rákérdez a felülírásra.

**Párhuzamos szerkesztés:** nincs zárolás; ha ketten mentik ugyanazt a kvízt, az utolsó mentés marad meg.

### 4.2. Egységes kvíz-JSON

**Minden kvíz ugyanazt a JSON-formátumot használja, és ugyanaz a szerkesztő kezeli.** Mintafájl: [Quizzes/history/3.json](../Quizzes/history/3.json).

A **kvíztípus kérdésenként** adható meg (`type`), így egy kvízben különböző típusú kérdések is lehetnek. A formátum minden típusnál ugyanaz; a típus dönti el, hogy a mezők közül melyiket használja fel, a többit figyelmen kívül hagyja. A szerkesztő és a backend a típus szabályai szerint ellenőriz.

**Kvíz:** `name`, `subject` (a tantárgy kulcsa), `difficulty` (1–20, tantárgyon belül egyedi), `default_time` (kötelező; egy kérdésre rendelkezésre álló alapértelmezett idő másodpercben), `questions` (legalább 5 kérdés, típustól függetlenül).

**Kérdés:**

| Mező | Leírás |
| --- | --- |
| `type` | A kérdés típusa, lásd lent |
| `text` | A kérdés / állítás / angol szó |
| `options` | Válaszlehetőségek (szöveglista), nem minden típus használja |
| `answer` | A helyes válasz(ok), szöveglista |
| `time` | Idő másodpercben (opcionális, felülírja a `default_time`-ot) |
| `speak_text` | A kérdés vagy állítás felolvasásának nyelvkódja, pl. `en-GB`, `hu-HU`; hiányzik, ha nincs felolvasás (opcionális) |
| `speak_answer` | A helyes válasz felolvasásának nyelvkódja (opcionális). Az egységes formátum része, de az igaz–hamis és a szópárosítás nem használja. |

**Kvíztípusok és a felhasznált mezők:**

| `type` | Kötelező mezők | Az `answer` jelentése | Kitölthető az MVP-ben |
| --- | --- | --- | --- |
| `true-false` | `text`, `answer` | `["true"]` vagy `["false"]` | igen |
| `word-matching` | `text` (angol szó), `answer` | Egy elem: a magyar jelentés | igen |
| `multiple-choice` | `text`, `options`, `answer` | Több helyes opció, a sorrend nem számít | nem |
| `ordered` | `text`, `options`, `answer` | Több helyes opció, a sorrend is számít | nem |

Mind a négy típus szerkeszthető és menthető; a gyakorlás azonban csak a kitölthető típusokból választ, a többit kihagyja. Új típus felvétele csak a táblázat bővítését jelenti, a formátum és a szerkesztő nem változik.

### 4.3. Tantárgy-JSON

Minden tantárgy mappájában van egy `subject.json`, amely a tantárgy adatait és beállításait tartalmazza:

```json
{
  "key": "history",
  "name": "Történelem",
  "max_questions": 20,
  "auto_advance": false
}
```

## 5. Kitöltői felület

### 5.1. Gyakorlás általános működés

- A kérdések a kijelölt nehézségi tartomány kitölthető kérdései közül **véletlenszerűen, ismétlés nélkül**, a gyakorlás indításakor előre kerülnek kiválasztásra.
- Egy kitölthető típus csak akkor kerül a gyakorlásba, ha a tartományban legalább egy teljes blokknyi kérdés van belőle: igaz–hamisból legalább 3, szópárosításból legalább 5. Ha kevesebb van, abból a típusból a rendszer egyetlen kérdést sem választ. Ha így egyik típus sem marad, a gyakorlás nem indítható.
- A kiválasztott kérdések száma: a tantárgy `max_questions` értéke, vagy kevesebb, ha a tartományban nincs ennyi kérdés.
- Egy angol vagy magyar szó egy gyakorlás kiválasztott kérdései között **csak egyszer** szerepelhet; az ismétlődőket a kiválasztás kiszűri.
- Egy szópárosító blokkhoz legalább 2 pár kell. Ha a kiválasztás egyetlen szópárosítós kérdést hagyna egyedül, azt a rendszer a tartomány egy másik kitölthető kérdésére cseréli.
- A gyakorlás **blokkokból** áll. A következő blokk típusát a rendszer véletlenszerűen választja, a még hátralévő kérdések típusonkénti számával súlyozva.
- Minden kérdés **1 pontot** ér (egy igaz–hamis állítás vagy egy szópár).
- A gyakorlás **teljes időkerete** a kiválasztott kérdésekhez rendelt másodpercek összege. **Egy közös visszaszámláló** fut, nem kérdésenkénti időzítő.
- **Lejár az idő:** az aktuális blokk lezárul és kiértékelődik; a benne megválaszolatlan kérdések, valamint a még meg nem jelent kérdések hibásnak számítanak. Az eredmény azonnal mentődik.
- Visszalépés és lezárt válasz módosítása nincs.
- **Félbehagyott gyakorlás** (böngésző bezárása, visszalépés a kezdőképernyőre) után nem keletkezik eredmény.
- Blokkonként **egy összesített hangjelzés** szól: egy hang, ha a blokk minden válasza helyes, és egy másik, ha nem.
- Alapértelmezés szerint külön **Következő** gombbal lép tovább. Ha a tantárgy `auto_advance` beállítása be van kapcsolva, 2 másodperc után automatikusan továbblép.

### 5.2. Igaz–hamis

- Egyszerre **3 állítás** látható (ha nincs elég kérdés, kevesebb lehet).
- A **Kész** gomb lezárja a blokkot. Nem kötelező mindháromra válaszolni; a hiányzó válasz hibás.
- Lezáráskor azonnal látható, mely válasz helyes és mely hibás. A helyes választ a rendszer szövegesen nem írja ki. Hibás vagy hiányzó válasznál az állítás kerete és háttere piros, és a helyes gomb (Igaz vagy Hamis) jelölve látszik, szintén pirosan. Helyes válasznál a megjelölt gomb és az állítás zöld.
- **Felolvasás:** mindig a **legfelső még megválaszolatlan** állítás hangzik el, ha van `speak_text`-je. Minden állítás legfeljebb egyszer olvasódik fel automatikusan, akkor, amikor először lesz a legfelső megválaszolatlan. Ha nincs `speak_text`-je, nincs felolvasás, és a rendszer nem ugrik az alatta lévőre.
- Az állítás szövegére koppintva az újra felolvasható (ha van `speak_text`).
- A válasz nem hangzik el.

### 5.3. Szópárosítás

- Egyszerre **5 angol szó** és a hozzájuk tartozó **5 magyar jelentés** látható két oszlopban (ha nincs elég kérdés, kevesebb lehet, de legalább 2).
- Egy oszlopban nem lehet két azonos szó (lásd 5.1, ismétlődés kiszűrése).
- Többértelműséggel nem kell foglalkozni.
- Az oszlopok elemei összekevert sorrendben jelennek meg.
- A kitöltő két kattintással/érintéssel párosít; **bármelyik nyelvi oldalról indulhat**.
- Kötelező párosítani. A rendszer **csak az összes pár összeállítása után értékel**, kivéve, ha lejár az idő: ekkor a már összeállított párok kiértékelődnek, a párosítatlanok hibásnak számítanak.
- Az értékelés **páronként** jelzi a helyes és hibás összerendeléseket.
- **Angol szóra kattintva** a szó angol nyelven felolvasandó.
- **Magyar elemre kattintva nincs felolvasás**.
- A szópárosítás nem szövegbeviteles feladat.

## 6. Egyéb funkciók

### 6.1. Beállítások

- Tantárgyankénti beállítások (`subject.json`):
  - Max kérdések száma (alapértelmezés: 20)
  - Automatikus továbblépés igen/nem
- Tantárgy létrehozása: megjelenített név és kulcs megadásával. A kulcs csak kisbetűt (a–z), számjegyet (0–9) és `-` jelet tartalmazhat, egyedi, és később nem változtatható. Tantárgy átnevezése és törlése nincs az MVP-ben.
- **Adatok letöltése:** a teljes `/data` mappa letölthető ZIP-fájlként (kézi biztonsági mentés).
- **Kvízek feltöltése ZIP-ben:** egy ZIP-fájllal több kvíz tölthető fel egyszerre. A ZIP a `Quizzes/` szerkezetét követi (`<subject>/<difficulty>.json`, opcionálisan `<subject>/subject.json`), a gyökérben vagy egy `Quizzes/` mappában; így az „Adatok letöltése” ZIP-je is visszatölthető (az eredményeket a feltöltés figyelmen kívül hagyja).
  - Még nem létező tantárgy a ZIP-ben lévő `subject.json` alapján jön létre; ha az hiányzik vagy hibás, a feltöltés hibát jelez. Létező tantárgy beállításai nem változnak.
  - Minden kvíz ugyanazon az ellenőrzésen megy át, mint mentéskor. Ha bármelyik fájl hibás, semmi nem íródik, és fájlonként megjelenik a hiba oka.
  - Ha egy vagy több szint foglalt, a rendszer felsorolja őket (tantárgy, szint, a meglévő kvíz neve), és megerősítés után felülírja.
- **Átvétel a forrásból:** egy gombnyomással a repó `Quizzes/` mappájából (élesben: az alkalmazással együtt telepített példányából) átmásolódnak azok a kvízek és tantárgyak, amelyek még nincsenek a `/data/Quizzes`-ben. Meglévő kvízt és tantárgy-beállítást nem ír felül. A végén megjelenik, mi került át (vagy hogy nem volt új).

### 6.2. Eredmények és összesítés

- Személyt kell választani.
- Eredménylista: a kiválasztott személy **10 legutóbbi** eredménye, tantárgytól függetlenül, a legújabb elöl. Oszlopok: tantárgy, kitöltési időpont, teljesítési %, sikeres-e (100%). A tantárgy mellett a kitöltött szinttartomány áll (pl. *Történelem · 3–5. szint*, egyetlen szintnél *3. szint*), alatta a kezdő és a záró szint kvízének neve (pl. *Ókor – Középkor*, egyetlen szintnél egy név). A nevek a kitöltéskori állapotot mutatják, akkor is, ha a kvízt azóta átnevezték vagy törölték; a nevek nélküli régi eredményeknél csak a tartomány látszik.
- Egy sorra kattintva az eredmény összes adata megjelenik.

#### 6.2.1. Eredmény tárolási formátum

- **Minden gyakorlás eredménye külön JSON-fájl**.
- **Az eredmény-JSON sémája minden kvíztípusnál azonos**.
- Az eredmény csak **összesítő adatokat** tartalmaz; kérdésenkénti válasznapló nem szükséges.
- A `total` a kiválasztott kérdések száma, akkor is, ha lejárt az idő.
- Az `elapsedSeconds` a kezdéstől az utolsó blokk kiértékeléséig eltelt idő; ha lejárt az idő, megegyezik a `timeLimitSeconds` értékével.
- A `quizNameFrom` és a `quizNameTo` a `difficultyFrom`, illetve a `difficultyTo` szint kvízének neve a kitöltés pillanatában. Régebbi eredményekből hiányozhatnak.

**Közös eredményséma:**

```json
{
  "id": "egyedi-kitöltes-azonosito",
  "completedAt": "2026-10-20T08:38:00+02:00",
  "participant": "Janka",
  "subject": "history",
  "difficultyFrom": 1,
  "difficultyTo": 5,
  "quizNameFrom": "Ókor",
  "quizNameTo": "Középkor",
  "total": 20,
  "correct": 17,
  "incorrect": 3,
  "scorePercent": 85,
  "timeLimitSeconds": 200,
  "elapsedSeconds": 156
}
```

## 7. Technikai architektúra

| Terület | Technológia / döntés |
| --- | --- |
| Frontend | **React + Material UI** |
| Szerkeszthető grid | **AG Grid** |
| Fejlesztési környezet | Windows, VS Code |
| Célkliens | Android/iPhone mobilböngésző, reszponzív webalkalmazás |
| Backend | **C#, ASP.NET Core** (minimal API) |
| Tárolás | **JSON-fájlok**, adatbázis nélkül |
| Éles futtatás | **Railway** |
| Tartós tárhely | **Railway Volume** |
| Verziókezelés | Git/GitHub |
| Felolvasás | Böngészős SpeechSynthesis API (javaslat) |

A döntés indoklása: [ADR 0001](../docs/adr/0001-csharp-backend-json-fajlok-railway-on.md).

### 7.1. Adattárolás és telepítés

A React nem írhat közvetlenül a Railway Volume-ra: a fájlműveleteket a backend végzi. Egyetlen ASP.NET Core alkalmazás szolgálja ki a lefordított React felületet és az `/api/*` végpontokat, egy Railway-szolgáltatásként. A Git-re a **forráskód** és a **kezdeti kvízek** (`Quizzes/`), a Railway Volume-ra a **futás közben szerkesztett kvízek, tantárgyak és eredmények** kerülnek.

**Könyvtárstruktúra:**

```text
/data/
  Quizzes/
    <subject>/
      subject.json
      <difficulty>.json
  results/
    <result-id>.json
```

**Kezdeti adatok:** induláskor, ha a `/data/Quizzes` üres, az alkalmazás egyszer átmásolja a repó `Quizzes/` mappáját. Később soha nem írja felül. A repóba később került új kvízek a Beállítások „Átvétel a forrásból” gombjával vehetők át (6.1); ez is csak a hiányzókat másolja.

### 7.2. Biztonság és üzemeltetés

Az MVP-ben **nincs bejelentkezés és adminvédelem**. A szerkesztő nyilvános elérhetősége miatt bárki módosíthatja a kvízeket; ez tudatosan vállalt kezdeti korlátozás. A Railway Volume tartóssága nem helyettesíti a külön biztonsági mentést; erre az MVP-ben a Beállítások ZIP-letöltése szolgál. A Railway aktuális csomagkorlátait és árát üzembe helyezéskor ellenőrizni kell.
