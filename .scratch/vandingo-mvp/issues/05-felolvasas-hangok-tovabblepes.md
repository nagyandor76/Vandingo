# 05: Felolvasás, hangjelzések, automatikus továbblépés

Spec: [../spec.md](../spec.md) – User Stories 23–27, 30–31, 35, 37

**What to build:** Igaz–hamis Blockban a legfelső még megválaszolatlan állítás automatikusan felolvasódik a `speak_text` nyelvén; minden állítás legfeljebb egyszer, akkor, amikor először lesz a legfelső megválaszolatlan. Ha nincs `speak_text`-je, csend van, és nem ugrik tovább. Az állítás szövegére koppintva újra felolvasódik. Szópárosításnál az angol szóra koppintva felolvasódik, a magyarra nem. Válasz soha nem hangzik el. Minden Block kiértékelésekor egy hang szól: egy, ha minden helyes, és egy másik, ha nem. Ha a Subject `auto_advance` beállítása be van kapcsolva, 2 másodperc után automatikusan továbblép.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Practice engine-teszt: a felolvasandó állítás mindig a legfelső megválaszolatlan, legfeljebb egyszer
- [ ] Practice engine-teszt: `speak_text` nélküli legfelső állításnál nincs felolvasás, és nem ugrik az alatta lévőre
- [ ] Practice engine-teszt: a Block-kiértékelés jelzi, hogy minden helyes volt-e (ebből választódik a hang)
- [ ] A felolvasás a böngésző beszédszintézisével, egy vékony adapter mögött történik
- [ ] Koppintásra újrafelolvasás igaz–hamisnál, kiejtés angol szónál, magyar szónál csend
- [ ] Automatikus továbblépés 2 másodperc után, ha a Subjectnél be van kapcsolva; különben Következő gomb
- [ ] Kézzel kipróbálva Android és iPhone böngészőben
