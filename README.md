# GeoLab 3D

Interaktive Browserdemo für einen geologischen Untergrund mit Gelände, regionalen Schichten, lokalen Ablagerungskörpern, Granitintrusion, Bohrungen und Seismikprofilen. Die Beispieldaten sind synthetisch.

![Vorschau](dist/VORSCHAU.jpg)

## Benutzen

Die veröffentlichte Website funktioniert ohne Installation. Alternativ die Datei `dist/index.html` herunterladen und in einem aktuellen Browser mit WebGL öffnen.

- Modell mit der Maus oder per Touch drehen, verschieben und zoomen.
- Gelände, einzelne Schichten, Fazieskörper, Intrusion, Bohrungen und Geolayer getrennt schalten.
- Deckkraft, Schnittposition und Höhenüberhöhung verändern.
- Bohrprofile, Höhen und Tiefen untersuchen.
- Eigene tiefenkonvertierte Seismikbilder als PNG/JPG georeferenzieren.

Die Demo enthält eine Fläche von 10 × 8 km, Bergketten und eine Talstadt, sieben regionale Rahmenschichten, sechs lokale Ablagerungskörper, eine Granitintrusion, vierzehn Bohrungen, zwei Profilflächen und eine Störungsinterpretation.

## Eigene Daten

1. **Daten verwalten → Alle Modelldaten löschen** leert das aktive Projekt.
2. Die passende Vorlage herunterladen, bearbeiten und wieder importieren.
3. **Projekt speichern** sichert Daten und Ansicht in einer JSON-Datei.

Importierte Dateien werden im Browser verarbeitet und nach Möglichkeit dort gespeichert. Die Website lädt diese Daten nicht auf GitHub hoch und synchronisiert sie nicht zwischen Personen oder Geräten. Für eine dauerhafte Sicherung die Projektdatei exportieren.

Unterstützt werden GeoLab-JSON, die dokumentierten CSV-Formate und georeferenzierte Profilbilder. Gewöhnliches WGS84-GeoJSON, GeoTIFF, Shapefile, LAS und SEG-Y werden nicht direkt gelesen. Zeitseismik benötigt eine fachliche Zeit-Tiefen-Konvertierung, bevor sie mit metrischen Z-Werten dargestellt wird.

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

Die laufende Website benötigt keine externen Bibliotheken und keinen Anwendungsserver. Zum Neuerstellen werden Python 3 und Node.js 24 verwendet; zusätzliche Pakete sind nicht erforderlich.

```sh
node --test core.test.cjs sedimentary.test.cjs integration.test.cjs
python3 build.py
node examples.cjs
```

`build.py` verbindet die Quelldateien zu einer eigenständig nutzbaren HTML-Datei. `examples.cjs` erstellt die austauschbaren Datenvorlagen.

## Fachlicher Umfang

Diese Anwendung stellt ein geologisches Strukturmodell dar. Konkrete Körpergrenzen, Ablagerungsumgebungen, Intrusionskontakte und Paläorelief der Demo sind vorgegebene Annahmen. Die Literatur belegt allgemeine Prozesse und Methoden, keine reale Demo-Lokalität.

Die Anwendung rekonstruiert keine Körper automatisch aus Bohrungen, bestimmt keine Störungen automatisch aus Seismik und berechnet keine Versenkungshistorie. Grundwasser-, Wärme- und geomechanische Prozesssimulationen sind nicht enthalten.

## GitHub-Dokumentation

- [GitHub Pages und unterstützte Konten](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Veröffentlichung mit GitHub Actions einrichten](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
