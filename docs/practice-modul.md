# A Practice felépítése

Egy Practice három rétegből áll a `web/src/practice/` és a `web/src/screens/` alatt. A döntések eredete: [.scratch/practice-module/issues/01-practice-modul.md](../.scratch/practice-module/issues/01-practice-modul.md) és [.scratch/spelling/spec.md](../.scratch/spelling/spec.md).

## Rétegek

- **Engine** (`practice/engine.ts`): a Practice szabályai, tiszta függvények, felület, időzítő és hang nélkül. Kiválasztás, Blockképzés, a betűgombok kiosztása, válaszok, pontozás, időlejárat, és hogy mit kell felolvasni. Minden művelet a teljes új `PracticeState`-et adja vissza.
- **Practice modul** (`practice/practice.ts`): egy futó Practice a betöltéstől a mentésig. Az engine köré épül, és birtokolja a visszaszámlálást, a hangot, az `auto_advance`-ot és a Result egyszeri mentését. Interfésze: `subscribe`, `getSnapshot`, valamint a műveletek (`answer`, `tap`, `toggle`, `place`, `takeBack`, `takeBackLast`, `readAloud`, `close`, `next`, `retrySave`, `dispose`). A `close` a „Kész”: az igaz–hamis és a többválasztásos Blockot zárja le; a `toggle` egy többválasztásos opciót jelöl ki vagy old fel (a megjelenített sorrend szerinti indexszel).
- **Képernyő** (`screens/Practice.tsx`): csak a pillanatképet rajzolja ki (`useSyncExternalStore`), és továbbítja a koppintásokat. Csak a Practice modult importálja, az engine-t nem (ezt az oxlint ellenőrzi).

## Portok

- **Adat:** `fetchSubjects`, `fetchQuestions`, `fetchQuizzes`, `saveResult`; az `api.ts` az adapter.
- **Hang:** `speak`, `stop`, `playBlockSound`. A `speak` és a `playBlockSound` Promise-t ad vissza, amely a hang vagy felolvasás végén teljesül (vége, megszakítás, hiba, mentőidőzítő), és sosem utasít el. Az `audio.ts` a böngészős adapter.
- **Véletlen:** opcionális bemenet, alapértéke `Math.random`. Időnek nincs portja; a tesztek hamis időzítőt használnak.

## Szabályok, amelyekre a rétegek épülnek

- **Egyetlen felolvasási csatorna:** minden felolvasásról az engine dönt (`speech` az állapotban, minden új kérés új objektum). A modul a régi és az új állapotot összevetve hívja a hang-portot.
- **Block-hang:** pontozott Blockonként egyszer, előtte `stop`. Betűzős Blocknál a felolvasás a hang után jön, az `auto_advance` 2 s-a a legutóbbi felolvasás végétől indul; a többi típusnál a hang elvágja a felolvasást, és a 2 s a pontozástól számít. Result után nincs automatikus továbblépés.
- **Megjelenítési tények a pillanatképből:** a `running` pillanatkép adja a `progress`, `correctInBlock`, `timedOut`, `resultReady`, a betűzős `spelling` nézet (helyek, gombok, `correctWord`, `hearable`) és a többválasztásos `multipleChoice` nézet (kérdésszöveg, opciók a kevert sorrendben: szöveg, `chosen`, kiértékelés után `mark`: `right`/`wrong`) értékét. A színek és feliratok a képernyőben maradnak.

## Tesztelés

A tesztelési pont a Practice modul (`practice/practice.test.ts`): memóriabeli adat-port, rögzítő hang-port vezérelt befejezéssel (`endSound`, `endReading`), `vi.useFakeTimers()` és beadott véletlenforrás. Az `engine.test.ts` régebbi unit tesztjei megmaradnak, de új viselkedés a modulon át tesztelődik. A képernyő elrendezése kézi ellenőrzés.
