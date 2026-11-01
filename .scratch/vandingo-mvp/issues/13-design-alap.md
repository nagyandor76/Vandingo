# 13: Design-alap – téma és közös képernyőkeret

Spec: [../spec.md](../spec.md) – User Stories 1–2

**What to build:** Az alkalmazás egységes, gyerekbarát, telefonra tervezett kinézetet kap, mielőtt a Practice képernyői (02–05) elkészülnek. A MUI témában rögzítjük a színpalettát (elsődleges szín, helyes/hibás visszajelzés színei), a betűtípust és a betűméreteket, a lekerekítéseket és a gombok alapstílusát. A közös képernyőkeret ([Screen.tsx](../../../web/src/screens/Screen.tsx)) fejlécet, margókat, maximális szélességet és visszalépést ad, és telefonon kényelmes. A kezdőképernyő a választott stílusban jelenik meg. A stílusirány eldőlt, lásd a Comments alatt: az F („Vidám”) változat. A prototípus a `prototype/design` ágon van; a nyertes változat kódja: `web/src/screens/prototype-design/VariantPlayful.tsx` (megtekintés az ágon: `cd web && npm run prototype`, majd `?variant=F`). Ez eldobható kód: a stílust vegyük át belőle, de a témát és a komponenseket rendesen, újra kell megírni.

Az animációk, a hangos/vizuális visszajelzés finomítása, az ikonok és az üres állapotok nem ennek a ticketnek a részei; ezek egy későbbi, a 12-es előtti „UI polish” ticketbe kerülnek.

**Blocked by:** 01. A 02–05 előtt érdemes elkészíteni.

**Status:** ready-for-agent

- [x] Stílusirány kiválasztva a prototípus változatai közül, a döntés indoka a Comments alatt
- [ ] MUI téma: paletta (köztük a helyes/hibás szín), tipográfia, lekerekítés, gombstílus egy helyen definiálva
- [ ] A közös képernyőkeret fejlécet és visszalépést ad, 360 px szélességen sincs vízszintes görgetés
- [ ] A kezdőképernyő a választott stílusban, nagy, hüvelykujjal könnyen nyomható gombokkal
- [x] A prototípus kódja egy eldobható ágon van megőrizve (`prototype/design`), a main ágon nem marad belőle semmi

## Comments

**2026-11-01 – stílusirány:** A prototípus változatai közül az **F („Vidám”)** a kiindulópont. A felhasználó az A (Duolingo-szerű) változatból indult, de nem akart Duolingo-hangulatot. A D/E (elegáns, lapos) változatok közül a böngésző saját betűtípusát választotta (Google-betű nélkül). Ebből lett az F:
- böngésző saját betűtípusa (`system-ui`), nincs külső font;
- vidám mentazöld fő szín (`#12b76a`), olvasható sötétebb zöld szöveghez (`#0b7a47`); helyes zöld, hibás piros (`#c2413b`);
- 12 px lekerekítés, helytakarékos térközök;
- gombok: kemény alsó árnyék helyett puha színes fény, hoverre enyhe emelkedés, lenyomásra rugalmas összemenés;
- a felső sáv (✕, vékony haladásjelző, idő) marad;
- kiértékelés: a helyes választ szöveg nem írja ki. Hibás vagy hiányzó válasznál az állítás kerete és háttere piros, és a helyes gomb pirosan jelölve látszik (a specifikáció is így módosult).
