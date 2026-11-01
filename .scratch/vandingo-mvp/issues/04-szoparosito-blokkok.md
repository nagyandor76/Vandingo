---
status: done
blocked_by: [3]
---

# 04: Szópárosító Blockok, vegyes Practice

Spec: [../spec.md](../spec.md) – User Stories 14–16, 28–29, 32–34

**What to build:** A Practice már szópárosítós Questionöket is tartalmaz. Egy szópárosító Block legfeljebb 5 angol szót és a magyar jelentéseiket mutatja két oszlopban, összekevert sorrendben. A Participant két koppintással párosít, bármelyik oszlopból kezdve. Az összes pár összeállítása után a Block páronként kiértékelődik. Időlejáratkor a kész párok értékelődnek, a párosítatlanok hibásak. A kiválasztás kiszűri az ismétlődő angol és magyar szavakat; egy szópárosító Blockban legalább 2 pár van (egy magányos szópárosítós Question másik kitölthető Questionre cserélődik). A következő Block típusa véletlenszerű, a hátralévő Questionök típusonkénti számával súlyozva.

- [x] Practice engine-teszt: egy angol vagy magyar szó egy Practice-ben csak egyszer szerepel
- [x] Practice engine-teszt: nincs 1 páros szópárosító Block
- [x] Practice engine-teszt: a Block-típus választása súlyozott (rögzített véletlenforrással ellenőrizve)
- [x] Practice engine-teszt: páronkénti kiértékelés helyes és hibás párosításra
- [x] Practice engine-teszt: időlejáratkor a félkész Block kész párjai értékelődnek, a többi hibás
- [x] A Block csak az összes pár összeállítása után értékelődik ki (időlejárat kivételével)
- [x] Egy már összeállított pár elemére koppintva a párosítás feloldható, amíg a Block nincs kiértékelve
- [ ] Telefonon kényelmesen párosítható

## Comments

- 2026-11-01: Elkészült. A kiválasztás összekeveri a kitölthető Questionöket, kiszűri az ismétlődő angol és magyar szavakat (kis- és nagybetűtől, szélső szóközöktől függetlenül; a `usableTypes` továbbra is a tartomány nyers darabszámaival dolgozik), majd a maximumig vág. Egy magányos szópárosítós Question a tartomány következő, nem szópárosítós Questionjére cserélődik; ha ilyen nincs, kimarad (a Practice eggyel rövidebb). Ha egy típus végén 1 pár maradna, az utolsó Block egyet átvesz az előzőtől (6 → 4 + 2, 11 → 5 + 4 + 2). A Blockok sorrendje már induláskor eldől: minden következő Block típusát a hátralévő Questionök típusonkénti száma súlyozza. Engine-műveletek: `pair(word, meaning)` és `unpair(word)`; az utolsó pár összeállításakor a Block azonnal kiértékelődik (nincs Kész gomb), a `closeBlock` hiányos szópárosító Blockot nem zár le. A magyar oszlop sorrendje (`meaningOrder`) sosem egyezik a szavakéval. A felületen a párokat szám és szín jelöli; párosított elemre koppintva a pár feloldódik. Az angol szó felolvasása a 05-ös ticketben jön. Telefonon kézzel még ki kell próbálni.
