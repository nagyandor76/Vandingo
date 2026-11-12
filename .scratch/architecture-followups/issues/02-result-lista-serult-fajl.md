---
status: done
blocked_by: []
---

# 02: Egy sérült Result-fájl ne vigye el a teljes Result-listát

Forrás: architektúra-áttekintés (2026-11-12), 5. jelölt, mellékes megállapítás.

**What to build:** A `ResultStore.List` (`src/Vandingo.Api/Results/ResultStore.cs:22`) minden fájlon `JsonFile.Read<Result>`-ot hív, ami sérült JSON-nál kivételt dob. Így egyetlen hibás fájl miatt egy Participant összes Resultja elérhetetlenné válik. A `ResultStore.Find` ugyanígy jár el. A `QuizLibrary.TryRead` ezt már hibatűrően kezeli: kihagyja a hibás fájlt, és naplózza.

- A sérült Result-fájlt a lista hagyja ki és naplózza. A `GET /api/results/{id}` sérült fájlnál 404-et adjon.

- [x] API-teszt: egy sérült fájl mellett a többi Result listázható
- [x] API-teszt: a sérült fájl id-jére 404 jön

## Comments

- 2026-11-12: Elkészült. A hibatűrő olvasás `JsonFile.TryRead` néven közös lett, ezt használja a `QuizLibrary` és a `ResultStore` is. A sérült fájlt naplózza és kihagyja, a JSON `null`-t is beleértve.
