---
status: ready-for-agent
blocked_by: [2]
---

# 03: Felolvasás kiértékelés után, auto-advance a felolvasás végétől

Forrás: [spec](../spec.md), „Felolvasás”. Párhuzam: [spelling 05](../../spelling/issues/05-felolvasas-kiertekeles-utan.md) — a betűzésnél ez a rend már működik (`web/src/practice/practice.ts`, engine `speech`), ezt kell a `multiple-choice`-ra is kiterjeszteni, lehetőleg közös szabályként, nem másolással.

**What to build:** A többválasztásos Questiont kiértékelés előtt semmi nem olvassa fel, sem magától, sem `readAloud` kérésre. Kiértékelés után előbb a Block hangja szól, majd, ha van `speak_text`, a felolvasás. Bekapcsolt `auto_advance` mellett a következő Block a (legutóbbi) felolvasás vége után 2 s-mal jön; `speak_text` nélkül a pontozástól 2 s-mal. Lejárt időnél, mint eddig, nincs automatikus továbblépés.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Kiértékelés előtt nincs felolvasás (magától sem, `readAloud`-ra sem)
- [ ] Kiértékelés után: `stop`, Block hang, majd a `speak_text` felolvasása
- [ ] Kiértékelés után a `readAloud` újraolvas, és a hang végét megvárja
- [ ] `auto_advance`: 2 s a felolvasás végétől; `speak_text` nélkül a pontozástól
- [ ] A pillanatkép jelzi, hogy a kérdés meghallgatható-e (mint a betűzésnél a `hearable`), és a képernyő ennek megfelelően mutatja a felolvasás gombot
- [ ] Tesztek a Practice modulon a rögzítő hang-porttal (`endSound`, `endReading`) és hamis időzítővel
- [ ] A `docs/practice-modul.md` „Block-hang” szabálya a többválasztásosat is említi

## Comments
