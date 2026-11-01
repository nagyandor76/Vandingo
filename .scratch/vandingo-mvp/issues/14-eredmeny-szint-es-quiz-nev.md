---
status: done
blocked_by: [6]
---

# 14: Eredmény böngésző – szinttartomány és Quiz-nevek

Spec: [../spec.md](../spec.md) – User Stories 56, 66

**What to build:** Az Eredmény böngésző listájában a Subject mellett a kitöltött Difficulty-tartomány áll (pl. *Történelem · 3–5. szint*, egyetlen szintnél *3. szint*), alatta a kezdő és a záró szint Quizének neve (pl. *Ókor – Középkor*, egyetlen szintnél egy név). A nevek a kitöltéskori állapotot mutatják: a Practice végén a Result új `quizNameFrom` és `quizNameTo` mezőjébe kerülnek, a szintválasztóban már betöltött Quiz-listából. A régebbi, nevek nélküli Resultoknál csak a tartomány látszik. A részletező nézet is mutatja a neveket.

- [x] API-teszt: a `quizNameFrom` és `quizNameTo` mezős Result mentés után visszaolvasva ugyanezeket a neveket adja, a listában és a részletekben is
- [x] API-teszt: a nevek nélküli Result továbbra is menthető és listázható
- [x] A Practice végén mentett Result tartalmazza a kezdő és a záró szint Quizének nevét
- [x] A lista sora: Subject és tartomány egy sorban, alatta a Quiz-nevek; egyetlen szintnél egy szám és egy név
- [x] A régi Resultoknál a nevek helye üresen marad, hibaüzenet nélkül
- [ ] Telefonon kézzel kipróbálva: a sor nem törik szét, a hosszú név levágódik vagy tördelődik, de olvasható

## Comments

- 2026-11-01: Elkészült és a main-ben van. A Result új `quizNameFrom`/`quizNameTo` mezője a Practice végén mentődik; a lista és a részletező mutatja. A telefonos megjelenés még nincs kézzel kipróbálva (ez a nyitott jelölőnégyzet).
