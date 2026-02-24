# LCD Jednotného Informačního Systému (JIS)
HTML, CSS a vanilla JS dle standardů kvality PID a návrhu týmu (ne)Čitelná Praha.

## Aktuálně podporované datové zdroje:
### 1) GTFS (protokol ws://)
- Pro aktivaci stačí nastavit hodnotu proměnné `inputType` na `0`
- K tomuto jsou vyžadovány ostatní součásti tohoto repozitáře
- Novější varianta komunikace se serverem
### 2) KonekTel (ARBOR PP)
- Pro aktivaci stačí nastavit hodnotu proměnné `inputType` na `1`
- Zdrojem těchto dat je reverseengineernutý soubor `options.cfg` který byl stažen dávno z uložta (RIP)
- Čte každou sekundu soubor `options.cfg` který očekává v rootu HTTP serveru `127.0.0.1:6969/options.cfg`


Osobně se stavím proti návrhu nového vizuálu z důvodu zmenšení veškerých textů a piktogramů a také protože tým který za tímto projektem stojí evidentně nemá žádné zkušenosti v tvorbě vizuálů pro IS.