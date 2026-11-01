# 04: Szópárosító Blockok, vegyes Practice

Spec: [../spec.md](../spec.md) – User Stories 14–16, 28–29, 32–34

**What to build:** A Practice már szópárosítós Questionöket is tartalmaz. Egy szópárosító Block legfeljebb 5 angol szót és a magyar jelentéseiket mutatja két oszlopban, összekevert sorrendben. A Participant két koppintással párosít, bármelyik oszlopból kezdve. Az összes pár összeállítása után a Block páronként kiértékelődik. Időlejáratkor a kész párok értékelődnek, a párosítatlanok hibásak. A kiválasztás kiszűri az ismétlődő angol és magyar szavakat; egy szópárosító Blockban legalább 2 pár van (egy magányos szópárosítós Question másik kitölthető Questionre cserélődik). A következő Block típusa véletlenszerű, a hátralévő Questionök típusonkénti számával súlyozva.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Practice engine-teszt: egy angol vagy magyar szó egy Practice-ben csak egyszer szerepel
- [ ] Practice engine-teszt: nincs 1 páros szópárosító Block
- [ ] Practice engine-teszt: a Block-típus választása súlyozott (rögzített véletlenforrással ellenőrizve)
- [ ] Practice engine-teszt: páronkénti kiértékelés helyes és hibás párosításra
- [ ] Practice engine-teszt: időlejáratkor a félkész Block kész párjai értékelődnek, a többi hibás
- [ ] A Block csak az összes pár összeállítása után értékelődik ki (időlejárat kivételével)
- [ ] Egy már összeállított pár elemére koppintva a párosítás feloldható, amíg a Block nincs kiértékelve
- [ ] Telefonon kényelmesen párosítható
