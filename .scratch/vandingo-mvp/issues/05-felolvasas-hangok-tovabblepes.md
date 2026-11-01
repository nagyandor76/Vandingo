---
status: done
blocked_by: [4]
---

# 05: Felolvasás, hangjelzések, automatikus továbblépés

Spec: [../spec.md](../spec.md) – User Stories 23–27, 30–31, 35, 37

**What to build:** Igaz–hamis Blockban a legfelső még megválaszolatlan állítás automatikusan felolvasódik a `speak_text` nyelvén; minden állítás legfeljebb egyszer, akkor, amikor először lesz a legfelső megválaszolatlan. Ha nincs `speak_text`-je, csend van, és nem ugrik tovább. Az állítás szövegére koppintva újra felolvasódik. Szópárosításnál az angol szóra koppintva felolvasódik, a magyarra nem. Válasz soha nem hangzik el. Minden Block kiértékelésekor egy hang szól: egy, ha minden helyes, és egy másik, ha nem. Ha a Subject `auto_advance` beállítása be van kapcsolva, 2 másodperc után automatikusan továbblép.

- [x] Practice engine-teszt: a felolvasandó állítás mindig a legfelső megválaszolatlan, legfeljebb egyszer
- [x] Practice engine-teszt: `speak_text` nélküli legfelső állításnál nincs felolvasás, és nem ugrik az alatta lévőre
- [x] Practice engine-teszt: a Block-kiértékelés jelzi, hogy minden helyes volt-e (ebből választódik a hang)
- [x] A felolvasás a böngésző beszédszintézisével, egy vékony adapter mögött történik
- [x] Koppintásra újrafelolvasás igaz–hamisnál, kiejtés angol szónál, magyar szónál csend
- [x] Automatikus továbblépés 2 másodperc után, ha a Subjectnél be van kapcsolva; különben Következő gomb
- [ ] Kézzel kipróbálva Android és iPhone böngészőben

## Comments

- 2026-11-01: Elkészült. Az engine `speech` mezője a legutóbb automatikusan felolvasandó állítás (`{ text, lang }`); új felolvasásnál új objektum, így a felület mindegyiket pontosan egyszer mondja el. Egy állítás akkor kerül sorra, amikor először lesz a legfelső megválaszolatlan (induláskor, válasz után, új Blockra lépéskor); `speak_text` nélkül a `speech` üres, és nem ugrik az alatta lévőre. A lezárt Block `allCorrect` mezője választja a hangot. Az adapter: `web/src/audio.ts` (SpeechSynthesis, a nyelvhez illő hang kiválasztásával Androidra; a két hang Web Audio-val generált, fájl nélkül). Mobilon a hangot egy koppintás oldja fel: a Start gomb, illetve újratöltés után az első koppintás a Practice képernyőn. A Block lezárása elhallgattatja a folyamatban lévő felolvasást. Automatikus továbblépésnél a Következő gomb is látszik, a 2 másodperc kivárása nélkül is lehet lépni; időlejáratkor is továbblép 2 mp után az összesítésre. Szópárosításnál az angol szó a saját `speak_text`-je nyelvén szól (ha nincs, csend), és csak a kiértékelés előtt koppintható. Android és iPhone böngészőben kézzel még ki kell próbálni.
