# GeoLab 3D

**[Website öffnen](https://frederikurbancy29.github.io/3D-geological-Model-/)** · [Quellcode und Änderungen](https://github.com/frederikurbancy29/3D-geological-Model-)

Lokale GIS-Arbeitsoberfläche mit 2D-/3D-Ansichten, mehreren Projekten, bearbeitbaren Informationslayern und nachvollziehbaren Modellberechnungen. Die geologische Demo enthält Gelände, regionale Schichten, lokale Ablagerungskörper, Granitintrusion, Bohrungen und Seismikprofile. Die Beispieldaten sind synthetisch.

![Vorschau](dist/VORSCHAU.jpg)

## Benutzen

Die veröffentlichte Website funktioniert ohne Installation. Alternativ die Datei `dist/index.html` herunterladen und in einem aktuellen Browser mit WebGL öffnen.

- Modell mit der Maus oder per Touch drehen, verschieben und zoomen.
- Gelände, einzelne Schichten, Fazieskörper, Intrusion, Bohrungen und Geolayer getrennt schalten.
- Deckkraft, Schnittposition und Höhenüberhöhung verändern.
- Bohrprofile, Höhen und Tiefen untersuchen.
- Eigene tiefenkonvertierte Seismikbilder als PNG/JPG georeferenzieren.
- Projekte neu erstellen, kopieren, archivieren und als Datei sichern; getrennte Speicherung in IndexedDB.
- Eigene Gruppen direkt im Layerbereich erstellen, umbenennen und verwalten; auch leere Gruppen bleiben im Projekt erhalten.
- Layer über den Pfeil am Eintrag, die Gruppenauswahl rechts oder die Gruppenauswahl mit Häkchen zuordnen. Gruppen lassen sich einklappen und entfernen; ihre Layer bleiben erhalten.
- Layer sperren, einfärben und entfernen; entfernte Layer aus der Datenablage wieder einladen.
- GeoJSON mit Originaldatei und Herkunft importieren; getrennte Layer- und Objektattribute bearbeiten.
- Attributtabelle filtern, sortieren, Auswahl bearbeiten und als CSV exportieren; Objekte per Rechteck auswählen.
- GIS-Stützpunkte numerisch bearbeiten, Geometrien um ein angegebenes Zentrum drehen und verschieben; in 2D mit Fangtoleranz zeichnen.
- Strecken, Winkel, Flächen und Gitterkörpervolumen mit Raumbezug, Methode und Datenrevision protokollieren.
- Geologische Schnittprofile berechnen und die abgetasteten Werte exportieren.

Die Demo enthält eine Fläche von 10 × 8 km, Bergketten und eine Talstadt, sieben regionale Rahmenschichten, sechs lokale Ablagerungskörper, eine Granitintrusion, vierzehn Bohrungen, zwei Profilflächen und eine Störungsinterpretation.

## Eigene Daten

1. **Projekte → Leeres Projekt** erstellt einen eigenen Arbeitsstand. **Daten verwalten → Alle Modelldaten löschen** leert das aktive Projekt einschließlich seiner projektbezogenen Datenablage.
2. Die passende Vorlage herunterladen, bearbeiten und wieder importieren.
3. **Projekt speichern** sichert Daten und Ansicht in einer JSON-Datei.

Importierte Dateien werden im Browser verarbeitet und nach Möglichkeit dort gespeichert. Die Website lädt diese Daten nicht auf GitHub hoch und synchronisiert sie nicht zwischen Personen oder Geräten. Für eine dauerhafte Sicherung die Projektdatei exportieren.

Unterstützt werden GeoLab-JSON, die dokumentierten CSV-Formate, GeoJSON-FeatureCollections (Point, LineString, Polygon ohne Löcher) und georeferenzierte Profilbilder. GeoTIFF, Shapefile, LAS und SEG-Y werden nicht direkt gelesen. Zeitseismik benötigt eine fachliche Zeit-Tiefen-Konvertierung, bevor sie mit metrischen Z-Werten dargestellt wird.

### Raumbezug und Rechentreue

Als metrische Projektbezüge stehen lokale Meterkoordinaten, ETRS89/UTM 32N und 33N sowie WGS84/UTM 32N und 33N bereit. GeoJSON kann aus EPSG:4258 bzw. EPSG:4326 oder der jeweils anderen unterstützten UTM-Zone innerhalb **derselben Datumsfamilie** projiziert werden. Die Anwendung setzt WGS84 und ETRS89 nicht gleich. Die reguläre UTM-Zone und Nordhalbkugel werden geprüft. Koordinaten mit vorangestellter Zonenkennziffer werden nicht als gewöhnliche UTM-Rechtswerte umgedeutet.

Lage- und Höhenbezug müssen bestätigt werden. Die Zuweisung eines Projektbezugs ändert keine vorhandenen Zahlen. CSV und regelmäßige Gitter müssen bereits im Projektbezug vorliegen. Es gibt keine Datums-, Epochen-, Quasigeoid- oder NHN-Umrechnung. Für Bayern ist DHHN2016 als Höhenreferenz auswählbar; dies validiert die Höhe einer Quelldatei nicht automatisch.

Berechnungen verwenden die gespeicherten Zahlen in doppelter Genauigkeit, unabhängig von GPU-Darstellung, Kamera, Schnitt und Höhenüberhöhung. Gitterstrecke, ellipsoidische Geodäte und örtliche Bodenstrecke sind unterschiedliche Größen. Die 3D-Strecke ist eine Strecke im metrischen Projektkoordinatenraum. Flächen sind wahlweise horizontal projiziert oder aus angegebenen 3D-Polygonstützpunkten trianguliert. Volumen beziehen sich auf das vollständige Ober-/Unterkanten-Gitter, trianguliert entlang SW–NE; überlappende Körper werden nicht gegenseitig abgezogen. Unsicherheiten der Eingabedaten und geologischen Interpretation bleiben bestehen.

Numerische Bearbeitung verändert derzeit GIS-Punkte, Linien und einfache Flächen. Geologische Körper bleiben Ober-/Unterkanten-Gitter; beliebige überhängende Volumennetze, automatische Störungsversätze oder ein geologischer Interpolationssolver sind nicht enthalten. Bohrintervalle und geologische Gitter werden über validierte Datendateien bearbeitet.

Alte Einzelprojekte werden beim ersten Öffnen übernommen. Die frühere Browserablage wird nicht gelöscht. Die letzten acht Änderungen lassen sich in der aktuellen Sitzung rückgängig machen; das dauerhafte Änderungsprotokoll enthält Beschreibungen, keine vollständige Versionshistorie. Projektkopien sichern alternative Szenarien.

- [Anleitung und Datenformate](dist/ANLEITUNG.txt)
- [Geologische Grundlagen, Quellen und Modellannahmen](dist/GEOLOGISCHES_KONZEPT.txt)
- [Zusammenpassende Beispieldateien](dist/vorlagen)

## Auf GitHub Pages veröffentlichen

Dieses Repository enthält den Workflow `.github/workflows/pages.yml`:

1. Das Projekt in ein GitHub-Repository mit dem Standardbranch `main` übertragen.
2. Im Repository **Settings → Pages → Build and deployment → Source → GitHub Actions** auswählen.
3. Unter **Actions** den Workflow **GeoLab 3D prüfen und veröffentlichen** starten oder eine Änderung nach `main` übertragen.
4. Die veröffentlichte Website wird unter **Settings → Pages** und beim abgeschlossenen Deployment verlinkt.

Änderungen an `main` werden erst nach erfolgreichen Daten- und Geometrieprüfungen veröffentlicht. Pull Requests werden geprüft und veröffentlichen keine Website. Es werden ausschließlich die Dateien aus `dist/` als Website bereitgestellt.

Die Website und die im Repository abgelegten Beispieldateien sind je nach Pages-Konfiguration öffentlich erreichbar. Eigene vertrauliche Dateien gehören nicht in das veröffentlichte Repository. Lokale Arbeitsdateien können außerhalb des Projekts oder in den ignorierten Ordnern `local-data/`, `private-data/` und `exports/` liegen.

## Lokal weiterentwickeln

Die Website benötigt keinen Anwendungsserver. Proj4js 2.23.0 und GeographicLib-Geodesic 2.2.0 sind mit Lizenztexten lokal eingebunden; zur Laufzeit werden keine Bibliotheken aus dem Internet nachgeladen. Zum Neuerstellen werden Python 3 und Node.js 24 verwendet; eine Paketinstallation ist nicht erforderlich.

```sh
node --test core.test.cjs sedimentary.test.cjs integration.test.cjs workspace.test.cjs
python3 build.py
node examples.cjs
```

`build.py` verbindet die Quelldateien zu einer eigenständig nutzbaren HTML-Datei. `examples.cjs` erstellt die austauschbaren Datenvorlagen.

Die 48 automatisierten Prüfungen umfassen unabhängige PROJ-/GeographicLib-Referenzwerte, analytisch bekannte Strecken, Flächen, Winkel und Volumen, verbotene Datums-/Höhenwechsel, Polygonfehler, Fangtoleranzen, Projekttrennung, Originaldaten und die vorhandene geologische Demo. Browserprüfungen ergänzen Projektwechsel, Speichern/Wiederöffnen, Attributbearbeitung, numerische Drehung, Rückgängig und Wiederherstellung entfernter Layer.

### Grundlagen der Koordinatenberechnungen

- [Proj4js: Definitionen und Achsreihenfolge](https://proj4js.org/)
- [GeographicLib: Geodäten und Referenzbeispiel](https://geographiclib.sourceforge.io/html/js/)
- [PROJ: unabhängiger UTM-Referenzwert](https://proj.org/en/stable/usage/quickstart.html)
- [Bayerische Vermessungsverwaltung: Referenzsysteme und Höhen](https://www.ldbv.bayern.de/vermessung/satellitenpositionierung/grundlagen.html)
- [BKG: Übergang zwischen ellipsoidischer Höhe und DHHN2016](https://gibs.bkg.bund.de/geoid/gserlaeuter_g.php)

## Fachlicher Umfang

Diese Anwendung stellt ein geologisches Strukturmodell dar. Konkrete Körpergrenzen, Ablagerungsumgebungen, Intrusionskontakte und Paläorelief der Demo sind vorgegebene Annahmen. Die Literatur belegt allgemeine Prozesse und Methoden, keine reale Demo-Lokalität.

Die Anwendung rekonstruiert keine Körper automatisch aus Bohrungen, bestimmt keine Störungen automatisch aus Seismik und berechnet keine Versenkungshistorie. Grundwasser-, Wärme- und geomechanische Prozesssimulationen sind nicht enthalten.

## GitHub-Dokumentation

- [GitHub Pages und unterstützte Konten](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Veröffentlichung mit GitHub Actions einrichten](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
