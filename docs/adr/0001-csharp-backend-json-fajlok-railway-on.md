# C# backend JSON-fájlokkal, Railway-en

Jobb lett volna backend nélkül, de a kvízeket és az eredményeket több eszköz között kell megosztani, és a böngésző nem írhat közös tárhelyre úgy, hogy a hozzáférési kulcs ne kerüljön a kliens kódjába. Ezért egyetlen ASP.NET Core alkalmazás szolgálja ki a lefordított React felületet és az `/api/*` végpontokat, és a kvízeket, a tantárgy-beállításokat és az eredményeket JSON-fájlokként, adatbázis nélkül tárolja a `/data` könyvtárban, ami élesben egy Railway Volume.

## Considered Options

- **Azure Static Web Apps + Azure Functions (C#) + Blob Storage**: valószínűleg ingyenes, de több részből áll, a JSON-ok blobok, nem fájlok, és a helyi fejlesztéshez emulátor kell.
- **Backend nélkül, a GitHub repó mint tárhely**: írási token kellene a kliensbe, amivel bárki írhatna a repóba. Elvetve.
