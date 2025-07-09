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

# InfernoSim - App Blueprint

## Übersicht

Ziel:
Eine computergestützte Simulation eines Stadtsystems, die sich auf die Dynamik von Feuer, Agenten (Feuerwehrleute, Polizei, Zivilisten, Brandstifter) und deren Interaktionen innerhalb einer simulierten städtischen Umgebung konzentriert.

## Kernkomponenten

*   **Stadtraster (Grid):** Das Fundament der Simulation. Ein zweidimensionales Gitter repräsentiert das Stadtgebiet mit verschiedenen Zelltypen (LAND, ROAD, PARK, WATER, BUILDING, STREET). Gebäude haben spezifische Eigenschaften (Brandrisiko, Entflammbarkeit, Kontrollen). Zellen speichern dynamische Zustände (Feuerlevel, Ausgebranntsein, dynamische Überwachung). Wegefindung (A\*) für Agenten basiert auf der Begehbarkeit des Gitters.

*   **Agenten:** Autonome Einheiten, die sich im Gitter bewegen und interagieren. Typen: Firefighter, Police, Civilian, Arsonist. Jeder Agent hat einen Zustand und einen Weg. Agentenverhalten wird durch endliche Zustandsautomaten und Routinen gesteuert und interagieren mit ihrer Umgebung und anderen Agenten.

*   **Feuer:** Wird durch den `fireLevel` auf Zellen dargestellt. Breitet sich basierend auf Entflammbarkeit aus und kann Gebäude zerstören.

*   **Konfiguration und Szenarien:** Globale Einstellungen, die das Simulationsverhalten beeinflussen. Vordefinierte `Scenario`s (NORMAL, RIOT, LARGE\_EVENT, CRISIS) setzen den übergeordneten Kontext. `BUILDING_PROPERTIES` und `CONTROL_IMPACTS` definieren statische und globale Eigenschaften von Gebäuden und Kontrollen. Globale Parameter im `config`-Objekt steuern Gittergröße, Agentenzahl, Wahrscheinlichkeiten und Geschwindigkeiten.

*   **Benutzeroberfläche (UI):** Visualisierung des Stadtrasters und der Agenten. Dashboards für Statistiken und ein Protokoll für Simulationsereignisse. Steuerungen für den Simulationsablauf (Pause/Wiedergabe, Geschwindigkeit). UI-Elemente zur möglichen Konfiguration und Platzierung von Elementen (z.B. Stationen).

## Wechselwirkungen

*   **Agenten <-> Gitter/Umgebung:** Agenten bewegen sich auf dem Gitter. Feuerwehrleute löschen Feuer. Zivilisten fliehen vor Feuer. Polizei erhöht Überwachung. Brandstifter legen Feuer basierend auf Gebäude-Eigenschaften und Überwachung.
*   **Feuer <-> Gitter/Gebäude:** Feuer breitet sich aus und kann Zellen/Gebäude zerstören.
*   **Agenten <-> Agenten:** Polizei nimmt Brandstifter fest. Zivilisten können sich in Brandstifter verwandeln (unter bestimmten Szenarien).
*   **Szenarien <-> Agenten/System:** Szenarien beeinflussen Agentenverhalten und globale Systemparameter (z.B. Überlastung).
*   **Kontrollen <-> Feuer/Agenten:** Kontrollmaßnahmen an Gebäuden beeinflussen Brandrisiko, Entflammbarkeit und die Reaktionsgeschwindigkeit (z.B. Feuermelder).

## Datenflüsse

*   Die Simulation läuft in diskreten Schritten (Ticks).
*   In jedem Tick werden das Gitter (Feuer), die Zustände und Positionen der Agenten, Statistiken und das Ereignisprotokoll aktualisiert.
*   Die UI liest den aktuellen Zustand des Systems zur Darstellung.
*   Benutzeraktionen über die UI beeinflussen den Simulationsablauf (Start, Pause, Geschwindigkeit, Konfiguration).