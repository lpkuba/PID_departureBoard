# Vnitřní informační panel PID
HTML, CSS a vanilla JS dle standardů kvality PID.

## Aktuálně podporované datové zdroje:
### 1) GTFS (protokol ws://)
- Pro aktivaci stačí nastavit hodnotu proměnné `inputType` na `0`
- K tomuto jsou vyžadovány ostatní součásti tohoto repozitáře
- Novější varianta komunikace se serverem
### 2) KonekTel (ARBOR PP)
- Pro aktivaci stačí nastavit hodnotu proměnné `inputType` na `1`
- Zdrojem těchto dat je reverseengineernutý soubor `options.cfg` který byl stažen dávno z uložta (RIP)
- Čte každou sekundu soubor `options.cfg` který očekává v rootu HTTP serveru `127.0.0.1:6969/options.cfg`
### 3) GTFS (protokol HTTP://) <code style="color : red">*zastaralé!*</code>
- Pro aktivaci stačí odkomentovat webSocket inicializaci a nastavit `inputType` na `0`
- K tomuto jsou taktéž vyžadované ostatní součásti tohoto repozitáře
- Starší varianta, manuální GET requesty častokrát bloudící data atd.
- Nedoporučuji využívat, zastaralé a pravděpodobně nefunkční!!!
