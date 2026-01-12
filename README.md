# PID odjezdová tabule
Toto je projekt pro všemožné i nemožné OIS programy přetvořené do HTML (+JS a CSS) a následně zprovozněné dohromady

## Stručné popisy složek
### /bustec
Tato složka obsahuje vnitřní IS tvořené co nejblíže ke standardům Pražské Integrované Dopravy z r. 2025.

### /GTFS
Do této složky přijdou zdrojová data používaná ve zbytku programů. Také se zde nachází nástroj pro převedení GTFS (CSV) na JSON + pár zkrácených JSONů

### /html_PP
V této složce se nachází klon rozhraní palubního počítače "Arbor" který lze nalézt v autobusech Dopravního podniku hl.m. Prahy

### /turnusCreator
V této složce se nachází tvůrce pořadí pro html_PP, vygenerované JSONy je pak potřeba vložit do /services odkud si je PP sám vezme

### /
V kořenové složce tohoto repozitáře můžeme najít webovou stránku na které jsem zkoušel práci s objekty, fetchování a loopy. Také se zde nachází server.js který slouží jako back-end pro veškeré prvky informačního systému. Komunikuje přes WS a Express