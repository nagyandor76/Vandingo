---
status: ready-for-agent
blocked_by: [1, 3]
---

# 05: Felolvasás kiértékelés után, és auto-advance a felolvasás végétől

Forrás: [spec](../spec.md), „Felolvasás”, „Auto-advance”.

**What to build:** Egy betűzős Questiont kiértékelés előtt semmi nem olvas fel, sem magától, sem kérésre, és a 🔊 gomb sem látszik. Kiértékelés után előbb a Block hangja szól, majd, ha van `speak_text`, elhangzik a `text`, rossz válasznál is. Ezután a 🔊 újra felolvassa. Bekapcsolt `auto_advance` mellett a kiértékelt betűzős Block a felolvasás vége után 2 másodpercig marad, `speak_text` nélkül a pontozás után 2 másodpercig. A kézi továbblépés ezt félbeszakítja.

**Blocked by:** 01, 03

**Status:** ready-for-agent

- [ ] A Practice modul tesztjeinek rögzítő audio portja vezérelhető befejezést kap (a hang és a felolvasás a teszt jelzéséig tart; a 01-es ticketből ide került, mert csak itt van fogyasztója)
- [ ] Kiértékelés előtt nincs felolvasás, a `readAloud` sem olvas fel
- [ ] Kiértékelés után: hang, majd a hang végén a `text` felolvasása (jó és rossz válasznál is)
- [ ] `speak_text` nélkül csak a hang szól
- [ ] A 🔊 csak kiértékelt betűzős Blocknál látszik, és felolvas
- [ ] Auto-advance: 2 s a felolvasás végétől; `speak_text` nélkül 2 s a pontozástól
- [ ] Kézi továbblépés vagy kilépés után nem jön késleltetett felolvasás vagy továbblépés
- [ ] A többi típus viselkedése változatlan
- [ ] Tesztek a Practice modulon
