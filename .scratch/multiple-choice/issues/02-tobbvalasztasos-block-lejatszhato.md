---
status: done
blocked_by: []
---

# 02: Egy többválasztásos Block lejátszható

Forrás: [spec](../spec.md), „Question type”, „Mit kell választani”, „Válaszok kijelölése”, „Kész gomb”, „Pontozás”, „Practice modul”, „Kiválasztás”, „Válaszok sorrendje”. Rétegek és szabályok: [docs/practice-modul.md](../../../docs/practice-modul.md). Párhuzam: [spelling 03](../../spelling/issues/03-betuzos-block-lejatszhato.md).

**What to build:** A Practice a `multiple-choice` Questionöket is kiválasztja, Blockonként egyet, a többi játszható típussal vegyesen, egy Practice-ben mindegyiket legfeljebb egyszer. A Participant látja a kérdésszöveget és a válaszlehetőségeket a Practice véletlenforrásával keverve. Koppintásra egy válasz kijelölődik, újra koppintva a kijelölés feloldódik (ki-be kapcsol); akárhány kijelölhető. A „Kész” gomb lezárja és kiértékeli a Blockot: helyes, ha pontosan a helyes válaszok vannak kijelölve, egyébként hibás (0%); egy próbálkozás. Kiértékelés után a helyes válaszok zöldek, a hibásak (rosszul kijelölt, és a ki nem jelölt helyes) pirosak; lezárás után a koppintás hatástalan. Lejárt időnél a Block hibás. Szól a Block hangja. A felolvasás rendje a 03-as, a telefonos elrendezés a 04-es ticket; itt elég egy egyszerű képernyő.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] A `multiple-choice` játszható típus, egy teljes Block 1 Question; a tartomány egy többválasztásos Questionnel már használható (`usableTypes`)
- [x] A válaszlehetőségek sorrendje a véletlenforrással kevert
- [x] `toggle`-szerű művelet a Practice modulon (ki-be kapcsolja a kijelölést), és `done`/„Kész” művelet; lezárás után mindkettő hatástalan
- [x] Pontozás: 100% csak ha minden helyes ki van jelölve és semmi helytelen; részleges vagy helytelen kijelölés 0%
- [x] A pillanatképben `multipleChoice` nézet: kérdésszöveg, opciók (szöveg, kijelölve-e, kiértékelés után helyes/hibás)
- [x] Időlejáratnál a Block hibás
- [x] Más típusokkal vegyesen is működik; egy Practice-ben egy Question egyszer
- [x] Egyszerű képernyő: kérdés, opciógombok, „Kész” gomb, zöld–piros visszajelzés; a képernyő csak a Practice modult importálja
- [x] Tesztek a Practice modulon (`web/src/practice/practice.test.ts`)
- [x] A GLOSSARY **Playable type** szócikkében a multiple-choice is szerepel; a `docs/practice-modul.md` a új műveleteket és nézetet is említi

## Comments

**2026-11-23:** Kész (798cc69; review-javítás 2fba7fa, 246fc1f). „Kész” = a meglévő `close()`, kijelölés: `toggle(option)`, nézet: `multipleChoice`. Lejárt időnél minden helyes opció piros; az opciók sosem a megírt sorrendben (`shuffledApart`).
