---
status: ready-for-agent
blocked_by: [2]
---

# 03: Egy betűzős Block lejátszható

Forrás: [spec](../spec.md). Tracer bullet: a betűzés első, végigjátszható útja.

**What to build:** A Practice a betűzős Questionöket is kiválasztja, Blockonként egy szót. A Participant látja a magyar jelentést, a válaszsort (a szóközök, írásjelek, számjegyek előre kiírva), és a betűgombokat: betűelőfordulásonként egy, plusz két véletlen a–z betű, a Practice véletlenforrásával keverve, de sosem a helyes sorrendben. Koppintásra a betű a következő üres helyre kerül, a gomb elhalványul. Amint minden hely betelt, a Block kiértékelődik (kis- és nagybetű nem számít), és szól a Block hangja. Rossz válasznál a hibás betűk pirosak, alattuk a helyes alak. Lejárt időnél a ki nem töltött szó hibás. Az elrendezés egyelőre egyszerű; a méretezés a 06-os ticket.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] A `spelling` játszható típus, egy teljes Block 1 Question; a tartomány egy betűzős Questionnel már használható
- [ ] Gombkészlet: betűnként egy gomb + 2 véletlen a–z betű, kisbetűvel
- [ ] A keverés sosem adja ki a helyes sorrendet
- [ ] Lerakás: a következő üres betűhely, a felhasznált gomb nem rakható le újra
- [ ] Előre kiírt nem betű karakterek a válaszsorban
- [ ] Kiértékelés a betelés pillanatában, egy próbálkozás, kis- és nagybetű nem számít
- [ ] Rossz válasznál helyenkénti helyesség és a helyes alak a pillanatképben, a képernyőn piros betűk és a helyes alak
- [ ] Időlejáratnál a ki nem töltött szó hibás
- [ ] Más típusokkal vegyesen is működik
- [ ] Tesztek a Practice modulon
- [ ] A GLOSSARY **Playable type** szócikkében a spelling is szerepel (a 01–02-es review óta szándékosan még nem)
