# dark_policing

**Softwareprojekt für das Modul "Predictive Policing / Dunkelfeldforschung" – Sommersemester 2025**

## Offizielle Prüfungsanforderungen

### Mündliche Prüfung (Gruppenprüfung, ca. 45 Minuten pro Gruppe)

Die folgenden Anforderungen sind zu erfüllen:

- Erläuterung zentraler Begriffe aus beiden Themenbereichen (Predictive Policing und Dunkelfeldforschung)
- Erklärung der Einflussfaktoren im Bereich Predictive Policing und ihrer mathematischen Modellierung
- Veranschaulichung anhand eines selbst entwickelten Beispiels, einschließlich funktionsfähigem Programm
- Beschreibung besonderer Parameter und Situationen im Kontext des Programms
- Diskussion des Zusammenhangs zwischen Predictive Policing und Dunkelfeldforschung

### Präsentation des Projekts

1. Vorstellung des funktionsfähigen Programms (Programmiersprache frei wählbar)
2. Beschreibung der im Projekt berücksichtigten Parameter (Einflussfaktoren)
3. Diskussion der im Modul behandelten Inhalte anhand des Programms

## Inoffizielle Anforderungen an das Programm

Die offizielle Vorgabe lautet lediglich, ein funktionsfähiges Programm zu präsentieren. Die konkrete Ausgestaltung liegt weitgehend in unserer Hand. Daraus ergibt sich folgende, praxisnahe Zielsetzung:

### Technische und konzeptionelle Anforderungen

- **Zellulärer Automat**  
  - Gitterstruktur, bestehend aus Zellen mit veränderbaren Zuständen (z. B. Risiko, Kriminalitätsintensität)  
  - Zustandsänderung erfolgt regelbasiert in Abhängigkeit von Nachbarzellen

- **Multi-Agenten-System (MAS)**  
  - Mehrere autonome Agenten (z. B. Täter, Polizei) mit individuellen Verhaltensregeln  
  - Wechselwirkungen zwischen Agenten und Umgebung erzeugen emergente Muster

- **Deliktbereich (frei wählbar)**  
  - Fokus auf eine konkrete Kriminalitätsform (z. B. Wohnungseinbruch, Vandalismus)

### Ziel der Umsetzung (Python-basiert)

- Entwicklung eines Simulationsprogramms mit:
  - einem zellulären Automaten zur Raumdarstellung in der Größe 100x100
  - Die Agententypen:
    - Täter
    - Polizist
    - Feuerwehrmann
    - evtl. Zivilist
- Simulation typischer Dynamiken im Deliktbereich - Brandstiftung 
- Integration relevanter Einflussfaktoren (z. B. risikofördernde und risikosenkende Faktoren, Polizeipräsenz, Feuerwehrpräsenz, Zivilistenpräsenz, Tageszeit)
- Parametervariation zur Analyse von Wirkzusammenhängen
- Unterschiedliche Mobilität der einzelnen Agenten (Täter spawnt zufällig, Feuerwehr ist schneller als die Polizei etc.)

### Aufbau des Projekts
- main.py               # Einstiegspunkt: Animation, Start der Simulation
- environment.py        # Generierung und Verwaltung der Umgebung
- agents.py             # Definition der Agentenklassen (Täter, Polizei, Feuerwehr usw.)
- simulation.py         # Steuerlogik pro Zeitschritt (update-Funktion)
- config.py             # Globale Parameter & Einstellungen

