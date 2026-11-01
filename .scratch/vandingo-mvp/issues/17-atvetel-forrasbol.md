---
status: ready-for-agent
blocked_by: [10]
---

# 17: Beállítások – új Quizek átvétele a forrásból

Spec: [../spec.md](../spec.md) – User Story 71

**What to build:** A Beállításokban egy „Átvétel a forrásból” gomb (`POST /api/seed`) a kezdeti adatok forrásmappájából (`Vandingo:SeedDirectory`: a repó `Quizzes/` mappája, élesben az alkalmazással együtt telepített példánya) átmásolja azokat a Quiz- és Subject-fájlokat, amelyek az adatkönyvtár `Quizzes/` mappájában még nincsenek. Meglévő Quizt és `subject.json`-t nem ír felül, akkor sem, ha a forrásban eltér. A válasz és a felület felsorolja, mi került át (Subject, Difficulty, név, illetve új Subject), vagy kiírja, hogy nem volt új. A meglévő indításkori átmásolás (csak üres adatkönyvtárnál) változatlan marad.

- [ ] API-teszt: a forrásba utólag tett új Quiz a hívás után betölthető, és a válasz listájában szerepel
- [ ] API-teszt: a forrásban lévő új Subject a `subject.json`-jével együtt létrejön
- [ ] API-teszt: a szerkesztett (a forrástól eltérő) Quiz és a módosított Subject-beállítás nem íródik felül
- [ ] API-teszt: ha nincs új, a válasz üres lista, és semmi nem változik
- [ ] A felület kiírja az átvett Quizeket, vagy hogy nem volt új
