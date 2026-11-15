---
status: done
blocked_by: [2]
---

# 03: Egy betűzős Block lejátszható

Forrás: [spec](../spec.md). Tracer bullet: a betűzés első, végigjátszható útja.

**What to build:** A Practice a betűzős Questionöket is kiválasztja, Blockonként egy szót. A Participant látja a magyar jelentést, a válaszsort (a szóközök, írásjelek, számjegyek előre kiírva), és a betűgombokat: betűelőfordulásonként egy, plusz két véletlen a–z betű, a Practice véletlenforrásával keverve, de sosem a helyes sorrendben. Koppintásra a betű a következő üres helyre kerül, a gomb elhalványul. Amint minden hely betelt, a Block kiértékelődik (kis- és nagybetű nem számít), és szól a Block hangja. Rossz válasznál a hibás betűk pirosak, alattuk a helyes alak. Lejárt időnél a ki nem töltött szó hibás. Az elrendezés egyelőre egyszerű; a méretezés a 06-os ticket.

**Blocked by:** 02

**Status:** done

- [x] A `spelling` játszható típus, egy teljes Block 1 Question; a tartomány egy betűzős Questionnel már használható
- [x] Gombkészlet: betűnként egy gomb + 2 véletlen a–z betű, kisbetűvel
- [x] A keverés sosem adja ki a helyes sorrendet
- [x] Lerakás: a következő üres betűhely, a felhasznált gomb nem rakható le újra
- [x] Előre kiírt nem betű karakterek a válaszsorban
- [x] Kiértékelés a betelés pillanatában, egy próbálkozás, kis- és nagybetű nem számít
- [x] Rossz válasznál helyenkénti helyesség és a helyes alak a pillanatképben, a képernyőn piros betűk és a helyes alak
- [x] Időlejáratnál a ki nem töltött szó hibás
- [x] Más típusokkal vegyesen is működik
- [x] Tesztek a Practice modulon
- [x] A GLOSSARY **Playable type** szócikkében a spelling is szerepel (a 01–02-es review óta szándékosan még nem)

## Comments

- 2026-11-15: Elkészült. Engine: `spelling` játszható (Block mérete 1), a gombok kiosztása (`dealTiles`: néhány keverés, ha mind kiadja a szót, ábécérend vagy fordítottja; egybetűs vagy egyetlen ismétlődő betűből álló szónál ez nem lehetséges, ilyenkor a húzott sorrend marad), `place` művelet, kiértékelés a betelés pillanatában. A Practice pillanatképében `spelling` nézet: magyar jelentés, helyek (előre kiírt karakterek, lerakott betűk, kiértékelés után a helyesség és a helyes betű eredeti kis- vagy nagybetűvel), gombok, kiértékelés után `correctWord`. Képernyő: egyszerű elrendezés („Rakd ki angolul!”, 48 px-es gombok), a méretezés a 06-os ticket. Review után javítva: a kiosztás determinisztikusan elkerüli a helyes sorrendet, a képernyőn kívüli gombindexet figyelmen kívül hagyja, a helyes alak és az eredeti kis- és nagybetű a pillanatképből jön. A 05-ös ticketre maradt: a `readAloud` most még felolvasná a kiértékeletlen betűzős szót, ha kérnék (a képernyő nem kéri). Böngészőben még nincs kipróbálva.
