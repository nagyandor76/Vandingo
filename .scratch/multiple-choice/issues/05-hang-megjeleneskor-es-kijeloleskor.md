---
status: done
blocked_by: []
---

# 05: Többválasztásos: a kérdés megjelenéskor, a válasz kijelöléskor hangzik el

Forrás: [spec](../spec.md), „Felolvasás” (módosítva 2026-11-23). Ez felülírja a [03](03-felolvasas-kiertekeles-utan.md) felolvasási rendjét a többválasztásos típusnál. A betűzésé változatlan marad. Rétegek és szabályok: [docs/practice-modul.md](../../../docs/practice-modul.md).

**What to build:** Egy többválasztásos Block megjelenésekor a kérdésszöveg egyszer felolvasódik, ha a Questionnek van `speak_text`-je. Egy opció kijelölésekor (`toggle`, ha a kijelölés bekapcsol) az opció szövege felolvasódik a `speak_answer` nyelvén, ha van ilyen. Feloldáskor nem szól semmi. A `readAloud` kiértékelés előtt is újraolvassa a kérdést. Kiértékeléskor `stop`, majd a Block hangja szól, és felolvasás nem követi. Az `auto_advance` 2 s-a a pontozástól számít. Minden felolvasásról továbbra is az engine dönt (`speech` az állapotban), ezért az egyetlen felolvasási csatorna megmarad.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Megjelenéskor: a kérdés felolvasása `speak_text` nyelvén, egyszer; `speak_text` nélkül csend
- [x] Kijelöléskor: az opció szövege `speak_answer` nyelvén; feloldáskor és `speak_answer` nélkül csend; lezárt Blocknál semmi
- [x] A `readAloud` kiértékelés előtt is működik; a pillanatkép `hearable` jelzése ehhez igazodik
- [x] Kiértékelés után csak a Block hangja; nincs „hang, majd felolvasás”; az `auto_advance` 2 s-a a pontozástól
- [x] A betűzés viselkedése változatlan (a meglévő tesztjei zöldek)
- [x] Tesztek a Practice modulon (`web/src/practice/practice.test.ts`) a rögzítő hang-porttal és hamis időzítővel; a 03-hoz tartozó, most ellentmondó tesztek átírva
- [x] A `docs/practice-modul.md` „Block-hang” szabálya és az `engine.ts` doc kommentjei (`speechOf`: „Its answer is never read”, `readOnlyOnceScored`) az új rendet írják le

## Comments

**2026-11-23:** Kész. A `readOnlyOnceScored` már csak a betűzés; az `announce` a többválasztásos kérdést a Block megjelenésekor olvassa fel; a `toggle` kijelöléskor `optionSpeechOf`-fal a `speak_answer` nyelvén olvas; a `hearable` kiértékelés előtt is igaz, ha van `speak_text`.
