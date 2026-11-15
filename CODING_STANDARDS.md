# Kódolási szabványok

Review-hoz. A gépileg ellenőrizhető szabályokat a lint, a typecheck és a tesztek kényszerítik ki (lásd [AGENTS.md](AGENTS.md)); ide csak a mérlegelést igénylők tartoznak.

## Practice

A rétegek és a portok leírása: [docs/practice-modul.md](docs/practice-modul.md).

- **Megjelenítési tény a pillanatképből jön.** Ha a képernyő a nyers `Block`/`Question` adatból számol ki valamit, amit a felhasználó lát (láthatóság, helyes alak, kis- és nagybetű, helyesség), az a Practice modul pillanatképébe (vagy az engine nézetébe) tartozik.
- **A típusfüggő viselkedés a saját típusánál marad.** Egy kérdéstípusnak szóló változás a többi típus útját nem módosítja; a review nézze meg a többi típus ágát is az érintett függvényben, és legyen teszt arra, hogy azok változatlanok.
- **A doc-komment a mostani viselkedést írja le.** Ha egy függvény viselkedése változik, a saját doc-kommentje és annak az interfésznek a kommentje is, amelyen át elérhető (pl. a `Practice` interfész).
- **Új viselkedés a megbeszélt tesztelési ponton át tesztelődik:** a frontendben a Practice modul, a backendben a HTTP API. A tesztnév a viselkedést mondja ki egy mondatban, a meglévők stílusában.

## Mindenhol

- A fogalmak a [GLOSSARY.md](GLOSSARY.md) szerintiek, a kerülendő szavak nélkül.
- A felhasználónak szóló szöveg (az `aria-label` is) magyar, a kód és a kommentek angolok.
