---
status: done
blocked_by: [1, 3]
---

# 05: Felolvasás kiértékelés után, és auto-advance a felolvasás végétől

Forrás: [spec](../spec.md), „Felolvasás”, „Auto-advance”.

**What to build:** Egy betűzős Questiont kiértékelés előtt semmi nem olvas fel, sem magától, sem kérésre, és a 🔊 gomb sem látszik. Kiértékelés után előbb a Block hangja szól, majd, ha van `speak_text`, elhangzik a `text`, rossz válasznál is. Ezután a 🔊 újra felolvassa. Bekapcsolt `auto_advance` mellett a kiértékelt betűzős Block a felolvasás vége után 2 másodpercig marad, `speak_text` nélkül a pontozás után 2 másodpercig. A kézi továbblépés ezt félbeszakítja.

**Blocked by:** 01, 03

**Status:** done

- [x] A Practice modul tesztjeinek rögzítő audio portja vezérelhető befejezést kap (a hang és a felolvasás a teszt jelzéséig tart; a 01-es ticketből ide került, mert csak itt van fogyasztója)
- [x] Kiértékelés előtt nincs felolvasás, a `readAloud` sem olvas fel
- [x] Kiértékelés után: hang, majd a hang végén a `text` felolvasása (jó és rossz válasznál is)
- [x] `speak_text` nélkül csak a hang szól
- [x] A 🔊 csak kiértékelt betűzős Blocknál látszik, és felolvas
- [x] Auto-advance: 2 s a felolvasás végétől; `speak_text` nélkül 2 s a pontozástól
- [x] Kézi továbblépés vagy kilépés után nem jön késleltetett felolvasás vagy továbblépés
- [x] A többi típus viselkedése változatlan
- [x] Tesztek a Practice modulon

## Comments

- 2026-11-15: Elkészült. Engine: a betűzős szó kiértékeléskor (időlejáratnál is) felolvasást kér, kiértékelés előtt a `readAloud` nem olvas fel; a `spelling` nézet `hearable` mezője mondja meg, mikor látszik a 🔊. Practice modul: betűzős Blocknál a Block hangja után jön a felolvasás (ha a hang alatt 🔊-t kértek, az is csak a hang után, egyszer), az auto-advance 2 s-a mindig a legutóbbi felolvasás végétől indul (egy újabb 🔊 újraindítja), `speak_text` nélkül a pontozástól; Result után nincs automatikus továbblépés. A többi típus útja változatlan (szópárosításnál az utolsó pár angol szavát továbbra is a Block hangja vágja el). A rögzítő audio port a tesztben vezérelt befejezést kapott (`endSound`, `endReading`). Böngészőben még nincs kipróbálva.
