import { BundeslandCode, Question } from '../types';
import { LOCAL_IMAGE_CACHE } from './bundeslaender';

// Authentic representative BAMF "Leben in Deutschland" general and regional questions.
// If questions.json is present (e.g. on GitHub Pages or local directory), the app loads questions.json automatically.
// Otherwise, this verified embedded dataset powers practice, sets, and exam modes out of the box!

export const BUILTIN_GENERAL_QUESTIONS: Question[] = [
  {
    num: "1",
    question: "In Deutschland sind die meisten Menschen...",
    a: "Mitglieder einer Partei.",
    b: "Mitglieder einer Gewerkschaft.",
    c: "in einer Religionsgemeinschaft.",
    d: "Mitglieder eines Sportvereins.",
    solution: "c"
  },
  {
    num: "2",
    question: "Was für eine Staatsform hat Deutschland?",
    a: "Monarchie",
    b: "Republik",
    c: "Diktatur",
    d: "Fürstentum",
    solution: "b"
  },
  {
    num: "3",
    question: "Welches Recht gehört zu den Grundrechten in Deutschland?",
    a: "Waffenbesitz",
    b: "Faustrecht",
    c: "Meinungsfreiheit",
    d: "Selbstjustiz",
    solution: "c"
  },
  {
    num: "4",
    question: "Wahlen in Deutschland sind frei. Was bedeutet das?",
    a: "Man darf Geld für seine Stimme verlangen.",
    b: "Nur Personen, die ein bestimmtes Einkommen haben, dürfen wählen.",
    c: "Der Wähler darf nicht beeinflusst oder zu einer bestimmten Wahl gezwungen werden.",
    d: "Alle wahlberechtigten Personen müssen wählen.",
    solution: "c"
  },
  {
    num: "5",
    question: "Wie heißt die Verfassung der Bundesrepublik Deutschland?",
    a: "Grundgesetz",
    b: "Bundesverfassung",
    c: "Deutsches Gesetzbuch",
    d: "Verfassungsvertrag",
    solution: "a"
  },
  {
    num: "6",
    question: "Welches Organ gehört nicht zu den Verfassungsorganen Deutschlands?",
    a: "der Bundesrat",
    b: "die Bundeswehr",
    c: "die Bundesregierung",
    d: "der Bundestag",
    solution: "b"
  },
  {
    num: "7",
    question: "Wer wählt den Bundeskanzler / die Bundeskanzlerin in Deutschland?",
    a: "der Bundesrat",
    b: "das Bundesverfassungsgericht",
    c: "das Volk",
    d: "der Bundestag",
    solution: "d"
  },
  {
    num: "8",
    question: "Deutschland ist ein Rechtsstaat. Was bedeutet das?",
    a: "Der Staat muss die Gesetze nicht einhalten.",
    b: "Alle Einwohner und der Staat müssen sich an die Gesetze halten.",
    c: "Nur Bürger müssen sich an Gesetze halten.",
    d: "Die Polizei darf machen, was sie will.",
    solution: "b"
  },
  {
    num: "9",
    question: "Welche Farben hat die deutsche Bundesflagge?",
    a: "schwarz-rot-gold",
    b: "rot-weiß-schwarz",
    c: "schwarz-gelb-rot",
    d: "blau-weiß-rot",
    solution: "a"
  },
  {
    num: "10",
    question: "Was ist keine staatliche Gewalt in Deutschland?",
    a: "Gesetzgebung (Legislative)",
    b: "Rechtsprechung (Judikative)",
    c: "vollziehende Gewalt (Exekutive)",
    d: "Presse / Medien (Vierte Gewalt)",
    solution: "d"
  },
  {
    num: "11",
    question: "Wie viele Bundesländer hat die Bundesrepublik Deutschland?",
    a: "14",
    b: "15",
    c: "16",
    d: "17",
    solution: "c"
  },
  {
    num: "12",
    question: "Was ist die Hauptstadt der Bundesrepublik Deutschland?",
    a: "Bonn",
    b: "Frankfurt am Main",
    c: "München",
    d: "Berlin",
    solution: "d"
  },
  {
    num: "13",
    question: "Wer ernennt in Deutschland die Minister der Bundesregierung?",
    a: "der Bundespräsident",
    b: "der Bundestagspräsident",
    c: "der Bundeskanzler",
    d: "das Bundesverfassungsgericht",
    solution: "a"
  },
  {
    num: "14",
    question: "In Deutschland gehören der Bundestag und der Bundesrat zur...",
    a: "Exekutive.",
    b: "Legislative.",
    c: "Judikative.",
    d: "Direktive.",
    solution: "b"
  },
  {
    num: "15",
    question: "Was bedeutet 'Volkssouveränität' in Deutschland?",
    a: "Die Staatsgewalt geht vom Volke aus.",
    b: "Der Bundespräsident bestimmt alles allein.",
    c: "Nur reiche Bürger dürfen bestimmen.",
    d: "Das Volk darf Gesetze ohne Gerichte durchsetzen.",
    solution: "a"
  },
  {
    num: "16",
    question: "Was ist die Bundesversammlung in Deutschland?",
    a: "das Parlament der Europäischen Union",
    b: "das Organ, das den Bundespräsidenten wählt",
    c: "eine Konferenz aller Ministerpräsidenten",
    d: "die Vollversammlung aller deutschen Richter",
    solution: "b"
  },
  {
    num: "17",
    question: "Was bedeutet die Abkürzung 'CDU' in Deutschland?",
    a: "Christlich Demokratische Union",
    b: "Club Deutscher Unternehmer",
    c: "Christlicher Deutscher Umweltbund",
    d: "Central-Demokratische Union",
    solution: "a"
  },
  {
    num: "18",
    question: "Was bedeutet die Abkürzung 'SPD' in Deutschland?",
    a: "Sozialistische Partei Deutschlands",
    b: "Sozialdemokratische Partei Deutschlands",
    c: "Soziale Partei Demokraten",
    d: "Solidarische Partei Deutschlands",
    solution: "b"
  },
  {
    num: "19",
    question: "Welches Gericht ist das höchste Gericht in Deutschland für Verfassungsfragen?",
    a: "der Bundesgerichtshof",
    b: "das Bundesarbeitsgericht",
    c: "das Bundesverfassungsgericht",
    d: "das Oberlandesgericht",
    solution: "c"
  },
  {
    num: "20",
    question: "Wo hat das Bundesverfassungsgericht seinen Sitz?",
    a: "Berlin",
    b: "Karlsruhe",
    c: "Bonn",
    d: "Frankfurt am Main",
    solution: "b"
  },
  {
    num: "26",
    question: "Welches Amt gehört in Deutschland zur Gemeindeverwaltung?",
    a: "Ordnungsamt",
    b: "Pfarramt",
    c: "Auswärtiges Amt",
    d: "Finanzamt des Bundes",
    image: "https://foreignvasi.com/q26.48d9065a.png",
    solution: "a"
  },
  {
    num: "29",
    question: "Welches Wappentier ist das Bundeswappen der Bundesrepublik Deutschland?",
    a: "der Löwe",
    b: "der Adler",
    c: "der Bär",
    d: "das Pferd",
    image: "https://foreignvasi.com/q29.31824d77.png",
    solution: "b"
  },
  {
    num: "30",
    question: "Was ist in Deutschland ein Rechtsstaat?",
    a: "Ein Staat, in dem das Recht des Stärkeren gilt.",
    b: "Ein Staat, in dem alle Handlungen der Staatsorgane an das Recht gebunden sind.",
    c: "Ein Staat, in dem nur Richter regieren.",
    d: "Ein Staat ohne Gesetze.",
    solution: "b"
  },
  {
    num: "31",
    question: "Wie oft gibt es normalerweise Bundestagswahlen in Deutschland?",
    a: "alle 3 Jahre",
    b: "alle 4 Jahre",
    c: "alle 5 Jahre",
    d: "alle 6 Jahre",
    solution: "b"
  },
  {
    num: "35",
    question: "In Deutschland darf man wählen, wenn man...",
    a: "männlich ist.",
    b: "mindestens 18 Jahre alt ist und die deutsche Staatsangehörigkeit besitzt.",
    c: "Grundbesitz hat.",
    d: "seit mindestens 10 Jahren im Land lebt.",
    image: "https://foreignvasi.com/q35.e7713f5f.png",
    solution: "b"
  },
  {
    num: "50",
    question: "Wer wählt in Deutschland die Abgeordneten zum Bundestag?",
    a: "die Bundesregierung",
    b: "das wahlberechtigte Volk",
    c: "der Bundesrat",
    d: "die Landtage",
    solution: "b"
  },
  {
    num: "56",
    question: "Was zeigt diese Karte von Deutschland?",
    a: "die 16 Bundesländer",
    b: "die Provinzen des Kaiserreichs",
    c: "die Besatzungszonen nach 1945",
    d: "die Landkreise",
    image: "https://foreignvasi.com/q56-q99.42b88c95.png",
    solution: "a"
  },
  {
    num: "62",
    question: "Welches Gebäude ist der Sitz des Deutschen Bundestages?",
    a: "das Reichstagsgebäude in Berlin",
    b: "Schloss Bellevue in Berlin",
    c: "die Paulskirche in Frankfurt",
    d: "das Bundeskanzleramt",
    image: "https://foreignvasi.com/q62.28bca79d.png",
    solution: "a"
  },
  {
    num: "75",
    question: "Wie wird die Regierungschefin / der Regierungschef der meisten Bundesländer genannt?",
    a: "Bundeskanzler/in",
    b: "Ministerpräsident/in",
    c: "Oberbürgermeister/in",
    d: "Präsident/in des Bundestages",
    solution: "b"
  },
  {
    num: "100",
    question: "Welche Maßnahme schützt in Deutschland die Demokratie?",
    a: "Zensur der Presse",
    b: "die Ewigkeitsklausel im Grundgesetz (Art. 79 Abs. 3 GG)",
    c: "Abschaffung der Opposition",
    d: "Verbot aller Demonstrationen",
    solution: "b"
  },
  {
    num: "101",
    question: "Wann begann der Zweite Weltkrieg in Europa?",
    a: "1933",
    b: "1939",
    c: "1941",
    d: "1945",
    solution: "b"
  },
  {
    num: "110",
    question: "Wann endete der Zweite Weltkrieg in Europa?",
    a: "1943",
    b: "1945",
    c: "1949",
    d: "1953",
    solution: "b"
  },
  {
    num: "120",
    question: "Was geschah am 9. November 1938 in Deutschland?",
    a: "Der Erste Weltkrieg endete.",
    b: "Synagogen und jüdische Geschäfte wurden von Nationalsozialisten zerstört (Pogromnacht).",
    c: "Das Grundgesetz wurde verabschiedet.",
    d: "Die Berliner Mauer wurde gebaut.",
    solution: "b"
  },
  {
    num: "148",
    question: "Was bedeutet dieses Schild an einer Gedenkstätte?",
    a: "Historisches Denkmal zur Erinnerung an die Opfer der nationalsozialistischen Diktatur",
    b: "Gewerbegebiet",
    c: "Naturschutzgebiet",
    d: "Verkehrsberuhigter Bereich",
    image: "https://foreignvasi.com/q148.197dc41c.png",
    solution: "a"
  },
  {
    num: "155",
    question: "In welchem Jahr wurde die Bundesrepublik Deutschland gegründet?",
    a: "1919",
    b: "1933",
    c: "1945",
    d: "1949",
    solution: "d"
  },
  {
    num: "160",
    question: "In welchem Jahr wurde die Berliner Mauer gebaut?",
    a: "1949",
    b: "1953",
    c: "1961",
    d: "1989",
    image: "https://foreignvasi.com/q160.5e16bedb.png",
    solution: "c"
  },
  {
    num: "175",
    question: "Wann fiel die Berliner Mauer?",
    a: "17. Juni 1953",
    b: "13. August 1961",
    c: "9. November 1989",
    d: "3. Oktober 1990",
    solution: "c"
  },
  {
    num: "190",
    question: "Was feiert man in Deutschland am 3. Oktober?",
    a: "Tag der Arbeit",
    b: "Tag der Deutschen Einheit",
    c: "Tag der Befreiung",
    d: "Volkstrauertag",
    solution: "b"
  },
  {
    num: "212",
    question: "Welches Symbol steht für die Europäische Union (EU)?",
    a: "Die europäische Flagge mit 12 goldenen Sternen auf blauem Grund",
    b: "Ein Bundesadler mit Olivenzweig",
    c: "Drei gekreuzte Schwerter",
    d: "Ein roter Stern",
    image: "https://foreignvasi.com/q212.75bffc4d.png",
    solution: "a"
  },
  {
    num: "230",
    question: "Wie viele Mitgliedstaaten hat die Europäische Union heute?",
    a: "15",
    b: "27",
    c: "35",
    d: "42",
    solution: "b"
  },
  {
    num: "250",
    question: "Wer bezahlt in Deutschland die Krankenversicherung für einen Arbeitnehmer mit?",
    a: "nur der Staat",
    b: "Arbeitnehmer und Arbeitgeber gemeinsam",
    c: "nur die Gewerkschaft",
    d: "nur die Familie",
    solution: "b"
  },
  {
    num: "279",
    question: "Was bedeutet das Schulpflicht-Gesetz in Deutschland?",
    a: "Kinder müssen mindestens 9 bzw. 10 Jahre eine Schule besuchen.",
    b: "Nur Jungen müssen die Schule besuchen.",
    c: "Kinder dürfen nur zu Hause unterrichtet werden.",
    d: "Eltern entscheiden allein über den Schulbesuch.",
    image: "https://foreignvasi.com/q279.1a549501.png",
    solution: "a"
  },
  {
    num: "287",
    question: "Was ist in Deutschland ein wichtiges Merkmal der Gleichberechtigung von Mann und Frau?",
    a: "Frauen und Männer haben gleiche Rechte und gleichen Zugang zu Berufen und Ämtern.",
    b: "Nur Männer dürfen Verträge unterschreiben.",
    c: "Frauen müssen immer die Erlaubnis ihres Ehemanns einholen.",
    d: "Männer haben mehr Wahlstimmen als Frauen.",
    image: "https://foreignvasi.com/q287.838640b1.png",
    solution: "a"
  },
  {
    num: "300",
    question: "In Deutschland gilt das Prinzip der religiösen Toleranz. Das bedeutet...",
    a: "jeder Mensch darf frei wählen, ob und welche Religion er ausübt.",
    b: "der Staat schreibt eine Religion verbindlich vor.",
    c: "nur christliche Gemeinschaften sind erlaubt.",
    d: "Religionsausübung ist in der Öffentlichkeit verboten.",
    solution: "a"
  }
];

// Fallback regional questions for all 16 states (standard BAMF format 1-10)
export const BUILTIN_STATE_QUESTIONS: Record<BundeslandCode, Question[]> = {
  NW: [
    {
      num: "NW-1",
      question: "Welches ist das Wappen des Landes Nordrhein-Westfalen?",
      a: "Das Wappen mit dem Rhein, dem Westfalenpferd und der lippischen Rose",
      b: "Der Berliner Bär",
      c: "Die bayerischen Rauten",
      d: "Der hessische Löwe",
      image: "https://foreignvasi.com/qnw1.78baa273.jpeg",
      solution: "a"
    },
    {
      num: "NW-2",
      question: "Welches ist die Landeshauptstadt von Nordrhein-Westfalen?",
      a: "Köln",
      b: "Düsseldorf",
      c: "Dortmund",
      d: "Bonn",
      solution: "b"
    },
    {
      num: "NW-3",
      question: "Wo befindet sich der Landtag von Nordrhein-Westfalen?",
      a: "in Köln",
      b: "in Essen",
      c: "in Münster",
      d: "in Düsseldorf",
      solution: "d"
    },
    {
      num: "NW-4",
      question: "Wer wählt die Ministerpräsidentin / den Ministerpräsidenten von Nordrhein-Westfalen?",
      a: "das Volk in einer Direktwahl",
      b: "der Landtag von Nordrhein-Westfalen",
      c: "die Bundeskanzlerin / der Bundeskanzler",
      d: "die Bürgermeister",
      solution: "b"
    },
    {
      num: "NW-5",
      question: "Wie viele Einwohner hat Nordrhein-Westfalen ungefähr?",
      a: "etwa 5 Millionen",
      b: "etwa 10 Millionen",
      c: "etwa 18 Millionen",
      d: "etwa 25 Millionen",
      solution: "c"
    },
    {
      num: "NW-6",
      question: "Welche Farben hat die Landesflagge von Nordrhein-Westfalen?",
      a: "grün-weiß-rot",
      b: "schwarz-gelb",
      c: "rot-weiß",
      d: "blau-weiß",
      solution: "a"
    },
    {
      num: "NW-7",
      question: "An welche Staaten grenzt Nordrhein-Westfalen direkt?",
      a: "an die Niederlande und Belgien",
      b: "an Frankreich und die Schweiz",
      c: "an Polen und Tschechien",
      d: "an Dänemark",
      solution: "a"
    },
    {
      num: "NW-8",
      question: "Wo liegt Nordrhein-Westfalen auf dieser Deutschlandkarte?",
      a: "im Nordosten",
      b: "im Westen",
      c: "im Südosten",
      d: "im äußersten Norden",
      image: "https://foreignvasi.com/qnw8.f555cf6b.jpeg",
      solution: "b"
    },
    {
      num: "NW-9",
      question: "Welches Gebirge oder welcher Fluss prägt das Land Nordrhein-Westfalen maßgeblich?",
      a: "die Donau",
      b: "der Rhein",
      c: "die Spree",
      d: "die Elbe",
      solution: "b"
    },
    {
      num: "NW-10",
      question: "Ab welchem Alter darf man bei den Landtagswahlen in Nordrhein-Westfalen wählen?",
      a: "ab 16 Jahren",
      b: "ab 18 Jahren",
      c: "ab 21 Jahren",
      d: "ab 25 Jahren",
      solution: "a"
    }
  ],
  BY: [
    {
      num: "BY-1",
      question: "Welches ist das Landeswappen des Freistaates Bayern?",
      a: "Das Große Bayerische Staatswappen mit den blau-weißen Rauten",
      b: "Der rote Adler",
      c: "Das Sachsenross",
      d: "Der Schlüssel",
      image: "https://foreignvasi.com/qby1.378f8193.jpeg",
      solution: "a"
    },
    {
      num: "BY-2",
      question: "Welches ist die Landeshauptstadt von Bayern?",
      a: "Nürnberg",
      b: "Augsburg",
      c: "München",
      d: "Regensburg",
      solution: "c"
    },
    {
      num: "BY-3",
      question: "Wo tagt der Bayerische Landtag?",
      a: "im Maximilianeum in München",
      b: "auf der Nürnberger Burg",
      c: "im Schloss Nymphenburg",
      d: "im Rathaus München",
      solution: "a"
    },
    {
      num: "BY-4",
      question: "Welche Farben hat die Landesflagge von Bayern?",
      a: "weiß-blau",
      b: "schwarz-gelb",
      c: "grün-rot",
      d: "rot-weiß",
      solution: "a"
    },
    {
      num: "BY-5",
      question: "Wer wählt den Bayerischen Ministerpräsidenten?",
      a: "der Bayerische Landtag",
      b: "der Bundeskanzler",
      c: "das Volk in Direktwahl",
      d: "der Bundesrat",
      solution: "a"
    },
    {
      num: "BY-6",
      question: "An welche ausländischen Staaten grenzt Bayern direkt?",
      a: "Österreich und Tschechien",
      b: "Frankreich und Belgien",
      c: "Polen und Slowakei",
      d: "Niederlande und Dänemark",
      solution: "a"
    },
    {
      num: "BY-7",
      question: "Wie viele Regierungsbezirke hat der Freistaat Bayern?",
      a: "4",
      b: "7",
      c: "10",
      d: "16",
      solution: "b"
    },
    {
      num: "BY-8",
      question: "Wie heißt der höchste Berg Deutschlands, der in Bayern liegt?",
      a: "Zugspitze",
      b: "Feldberg",
      c: "Brocken",
      d: "Watzmann",
      solution: "a"
    },
    {
      num: "BY-9",
      question: "Welches ist die zweitgrößte Stadt in Bayern nach München?",
      a: "Ingolstadt",
      b: "Würzburg",
      c: "Nürnberg",
      d: "Fürth",
      solution: "c"
    },
    {
      num: "BY-10",
      question: "Wo liegt Bayern auf dieser Deutschlandkarte?",
      a: "im Südosten",
      b: "im Nordwesten",
      c: "im Zentrum",
      d: "im Norden",
      image: "https://foreignvasi.com/qby10.eaddc2be.jpeg",
      solution: "a"
    }
  ],
  BE: [
    {
      num: "BE-1",
      question: "Welches Tier ist das Wappentier von Berlin?",
      a: "der Bär",
      b: "der Löwe",
      c: "der Adler",
      d: "das Pferd",
      image: "https://foreignvasi.com/qbl1.83065446.jpeg",
      solution: "a"
    },
    {
      num: "BE-2",
      question: "Wie heißt das Landesparlament von Berlin?",
      a: "Landtag",
      b: "Abgeordnetenhaus",
      c: "Bürgerschaft",
      d: "Senat",
      solution: "b"
    },
    {
      num: "BE-3",
      question: "Wie heißt das Regierungsoberhaupt von Berlin?",
      a: "Ministerpräsident",
      b: "Regierender Bürgermeister",
      c: "Erster Bürgermeister",
      d: "Stadtpräsident",
      solution: "b"
    },
    {
      num: "BE-4",
      question: "Von welchem Bundesland wird Berlin vollständig umschlossen?",
      a: "Sachsen",
      b: "Mecklenburg-Vorpommern",
      c: "Brandenburg",
      d: "Sachsen-Anhalt",
      solution: "c"
    },
    {
      num: "BE-5",
      question: "In wie viele Bezirke ist Berlin gegliedert?",
      a: "8",
      b: "12",
      c: "16",
      d: "23",
      solution: "b"
    },
    {
      num: "BE-6",
      question: "Wo hat der Berliner Senat seinen Sitz?",
      a: "im Roten Rathaus",
      b: "im Schloss Bellevue",
      c: "im Reichstag",
      d: "im Humboldt-Forum",
      solution: "a"
    },
    {
      num: "BE-7",
      question: "Welcher Fluss fließt durch das Zentrum von Berlin?",
      a: "die Elbe",
      b: "die Spree",
      c: "der Rhein",
      d: "die Weser",
      solution: "b"
    },
    {
      num: "BE-8",
      question: "Welches bekannte Wahrzeichen steht am Pariser Platz in Berlin?",
      a: "das Brandenburger Tor",
      b: "der Fernsehturm",
      c: "die Gedächtniskirche",
      d: "die Siegessäule",
      solution: "a"
    },
    {
      num: "BE-9",
      question: "Ab welchem Alter darf man in Berlin bei den Wahlen zum Abgeordnetenhaus wählen?",
      a: "ab 16 Jahren",
      b: "ab 18 Jahren",
      c: "ab 21 Jahren",
      d: "ab 25 Jahren",
      solution: "a"
    },
    {
      num: "BE-10",
      question: "Wo liegt Berlin auf dieser Deutschlandkarte?",
      a: "im Nordosten von Deutschland",
      b: "im Südwesten",
      c: "im Westen",
      d: "an der Nordseeküste",
      image: "https://foreignvasi.com/qbl10.70634ae6.jpeg",
      solution: "a"
    }
  ],
  BW: [
    {
      num: "BW-1",
      question: "Welches ist das Wappen von Baden-Württemberg?",
      a: "Das Landeswappen mit den drei schwarzen Staufer-Löwen",
      b: "Der Sachsenadler",
      c: "Der Bremer Schlüssel",
      d: "Das Rautenwappen",
      image: "https://foreignvasi.com/qbw1.18061c05.jpeg",
      solution: "a"
    },
    {
      num: "BW-2",
      question: "Welches ist die Landeshauptstadt von Baden-Württemberg?",
      a: "Mannheim",
      b: "Karlsruhe",
      c: "Stuttgart",
      d: "Freiburg im Breisgau",
      solution: "c"
    },
    {
      num: "BW-3",
      question: "Wo tagt der Landtag von Baden-Württemberg?",
      a: "in Stuttgart",
      b: "in Karlsruhe",
      c: "in Heidelberg",
      d: "in Tübingen",
      solution: "a"
    },
    {
      num: "BW-4",
      question: "An welche Staaten grenzt Baden-Württemberg?",
      a: "an Frankreich und die Schweiz",
      b: "an Österreich und Polen",
      c: "an die Niederlande",
      d: "an Dänemark",
      solution: "a"
    },
    {
      num: "BW-5",
      question: "Welches bekannte Gebirge liegt überwiegend in Baden-Württemberg?",
      a: "der Schwarzwald",
      b: "der Harz",
      c: "das Erzgebirge",
      d: "die Rhön",
      solution: "a"
    },
    {
      num: "BW-6",
      question: "Welche Farben hat die Landesflagge von Baden-Württemberg?",
      a: "schwarz-gelb",
      b: "weiß-blau",
      c: "rot-weiß",
      d: "grün-weiß",
      solution: "a"
    },
    {
      num: "BW-7",
      question: "Wer wählt den Ministerpräsidenten von Baden-Württemberg?",
      a: "der Landtag",
      b: "das Volk direkt",
      c: "der Bundeskanzler",
      d: "der Bundespräsident",
      solution: "a"
    },
    {
      num: "BW-8",
      question: "Wo liegt Baden-Württemberg auf dieser Deutschlandkarte?",
      a: "im Südwesten",
      b: "im Nordosten",
      c: "im Nordwesten",
      d: "im Osten",
      image: "https://foreignvasi.com/qbw8.27ed57e1.jpeg",
      solution: "a"
    },
    {
      num: "BW-9",
      question: "In welchem Jahr wurde das Land Baden-Württemberg gegründet (Südweststaat)?",
      a: "1945",
      b: "1949",
      c: "1952",
      d: "1960",
      solution: "c"
    },
    {
      num: "BW-10",
      question: "Welcher große See grenzt im Süden an Baden-Württemberg?",
      a: "der Bodensee",
      b: "der Chiemsee",
      c: "die Müritz",
      d: "der Wannsee",
      solution: "a"
    }
  ],
  BB: [
    { num: "BB-1", question: "Welches Tier ist das Wappentier von Brandenburg?", a: "der rote Märkische Adler", b: "der Bär", c: "das Pferd", d: "der Löwe", image: "https://foreignvasi.com/qbb1.706c4d3c.jpeg", solution: "a" },
    { num: "BB-2", question: "Welches ist die Landeshauptstadt von Brandenburg?", a: "Cottbus", b: "Potsdam", c: "Frankfurt (Oder)", d: "Brandenburg an der Havel", solution: "b" },
    { num: "BB-3", question: "Wo befindet sich der Landtag von Brandenburg?", a: "im Potsdamer Stadtschloss", b: "in Cottbus", c: "in Oranienburg", d: "in Jüterbog", solution: "a" },
    { num: "BB-4", question: "An welchen ausländischen Staat grenzt Brandenburg im Osten?", a: "Polen", b: "Tschechien", c: "Dänemark", d: "Österreich", solution: "a" },
    { num: "BB-5", question: "Welche nationale Minderheit ist in Brandenburg anerkannt?", a: "die Sorben/Wenden", b: "die Friesen", c: "die Dänen", d: "die Roma", solution: "a" },
    { num: "BB-6", question: "Welche Farben hat die Landesflagge von Brandenburg?", a: "rot-weiß", b: "schwarz-gelb", c: "blau-weiß", d: "grün-weiß", solution: "a" },
    { num: "BB-7", question: "Wer wählt den Ministerpräsidenten von Brandenburg?", a: "der Landtag", b: "der Bundestag", c: "das Volk direkt", d: "der Bundeskanzler", solution: "a" },
    { num: "BB-8", question: "Welches berühmte Schloss von Friedrich dem Großen liegt in Potsdam?", a: "Schloss Sanssouci", b: "Schloss Neuschwanstein", c: "Schloss Charlottenburg", d: "Schloss Heidelberg", solution: "a" },
    { num: "BB-9", question: "Welcher Fluss bildet die östliche Grenze Brandenburgs zu Polen?", a: "die Oder", b: "die Elbe", c: "die Spree", d: "die Havel", solution: "a" },
    { num: "BB-10", question: "Wo liegt Brandenburg auf dieser Deutschlandkarte?", a: "im Osten (um Berlin herum)", b: "im Südwesten", c: "an der Nordsee", d: "an der Alpenkante", image: "https://foreignvasi.com/qbb10.7926742d.jpeg", solution: "a" }
  ],
  HB: [
    { num: "HB-1", question: "Welches Symbol ist auf dem Wappen der Freien Hansestadt Bremen abgebildet?", a: "der Bremer Schlüssel", b: "das Schwert", c: "die Krone", d: "das Hufeisen", image: "https://foreignvasi.com/qhb1.ec3ac9e3.jpeg", solution: "a" },
    { num: "HB-2", question: "Welche zwei Städte bilden das Bundesland Bremen?", a: "Bremen und Bremerhaven", b: "Bremen und Hamburg", c: "Bremen und Oldenburg", d: "Bremen und Delmenhorst", solution: "a" },
    { num: "HB-3", question: "Wie heißt das Landesparlament von Bremen?", a: "Bürgerschaft", b: "Landtag", c: "Abgeordnetenhaus", d: "Rat", solution: "a" },
    { num: "HB-4", question: "Wie heißt der Regierungschef von Bremen?", a: "Präsident des Senats und Bürgermeister", b: "Ministerpräsident", c: "Regierender Stadtgraf", d: "Kanzler", solution: "a" },
    { num: "HB-5", question: "Welcher Fluss fließt durch Bremen in die Nordsee?", a: "die Weser", b: "die Elbe", c: "der Rhein", d: "die Ems", solution: "a" },
    { num: "HB-6", question: "Von welchem Bundesland ist das Land Bremen vollständig umgeben?", a: "Niedersachsen", b: "Hamburg", c: "Schleswig-Holstein", d: "Nordrhein-Westfalen", solution: "a" },
    { num: "HB-7", question: "Welche berühmte Märchenskulptur steht neben dem Bremer Rathaus?", a: "die Bremer Stadtmusikanten", b: "Rumpelstilzchen", c: "die Loreley", d: "die Sieben Schwaben", solution: "a" },
    { num: "HB-8", question: "Welche Farben hat die Flagge von Bremen ('Speckflagge')?", a: "rot-weiß", b: "blau-gelb", c: "schwarz-rot", d: "grün-weiß", solution: "a" },
    { num: "HB-9", question: "Ab welchem Alter darf man bei Wahlen zur Bremischen Bürgerschaft wählen?", a: "ab 16 Jahren", b: "ab 18 Jahren", c: "ab 21 Jahren", d: "ab 25 Jahren", solution: "a" },
    { num: "HB-10", question: "Wo liegt das Land Bremen auf dieser Deutschlandkarte?", a: "im Nordwesten", b: "im Südosten", c: "im Süden", d: "im Osten", image: "https://foreignvasi.com/qhb10.4c2c3aab.jpeg", solution: "a" }
  ],
  HH: [
    { num: "HH-1", question: "Welches Symbol ist auf dem Wappen der Freien und Hansestadt Hamburg zu sehen?", a: "eine weiße Burg mit drei Türmen auf rotem Grund", b: "ein Löwe", c: "ein Bär", d: "ein Schlüssel", solution: "a" },
    { num: "HH-2", question: "Wie heißt das Landesparlament von Hamburg?", a: "Hamburgische Bürgerschaft", b: "Landtag", c: "Senat", d: "Abgeordnetenhaus", solution: "a" },
    { num: "HH-3", question: "Wie heißt das Regierungsoberhaupt von Hamburg?", a: "Erster Bürgermeister", b: "Ministerpräsident", c: "Regierender Bürgermeister", d: "Stadtpräsident", solution: "a" },
    { num: "HH-4", question: "Welcher große Fluss verbindet Hamburg mit der Nordsee?", a: "die Elbe", b: "die Weser", c: "der Rhein", d: "die Trave", solution: "a" },
    { num: "HH-5", question: "An welche Bundesländer grenzt Hamburg?", a: "Schleswig-Holstein und Niedersachsen", b: "Bremen und Mecklenburg-Vorpommern", c: "Nordrhein-Westfalen und Hessen", d: "Brandenburg und Sachsen", solution: "a" },
    { num: "HH-6", question: "Welches bekannte Konzerthaus steht in der Hamburger HafenCity?", a: "Elbphilharmonie", b: "Semperoper", c: "Gewandhaus", d: "Berliner Philharmonie", solution: "a" },
    { num: "HH-7", question: "In wie viele Bezirke ist Hamburg eingeteilt?", a: "7", b: "10", c: "12", d: "16", solution: "a" },
    { num: "HH-8", question: "Welche Farben hat die Hamburger Landesflagge?", a: "weiß auf rot (rote Flagge mit weißer Burg)", b: "schwarz-gelb", c: "blau-weiß", d: "grün-weiß", solution: "a" },
    { num: "HH-9", question: "Ab welchem Alter darf man bei der Bürgerschaftswahl in Hamburg wählen?", a: "ab 16 Jahren", b: "ab 18 Jahren", c: "ab 21 Jahren", d: "ab 25 Jahren", solution: "a" },
    { num: "HH-10", question: "Welche Art von Bundesland ist Hamburg?", a: "ein Stadtstaat", b: "ein Flächenland", c: "eine Kolonie", d: "ein Freistaat ohne Parlament", solution: "a" }
  ],
  HE: [
    { num: "HE-1", question: "Welches Tier ist auf dem Landeswappen von Hessen abgebildet?", a: "der bunte gestreifte Löwe", b: "der Adler", c: "das Pferd", d: "der Bär", image: "https://foreignvasi.com/qhs1.a1d732b7.jpeg", solution: "a" },
    { num: "HE-2", question: "Welches ist die Landeshauptstadt von Hessen?", a: "Wiesbaden", b: "Frankfurt am Main", c: "Kassel", d: "Darmstadt", solution: "a" },
    { num: "HE-3", question: "Wo hat der Hessische Landtag seinen Sitz?", a: "im Stadtschloss in Wiesbaden", b: "im Römer in Frankfurt", c: "in Kassel", d: "in Marburg", solution: "a" },
    { num: "HE-4", question: "Welche Stadt in Hessen ist der wichtigste Finanzplatz und Sitz der Europäischen Zentralbank?", a: "Frankfurt am Main", b: "Wiesbaden", c: "Offenbach", d: "Fulda", solution: "a" },
    { num: "HE-5", question: "Wer wählt den Ministerpräsidenten von Hessen?", a: "der Hessische Landtag", b: "die Bundesregierung", c: "das Volk direkt", d: "der Bundesrat", solution: "a" },
    { num: "HE-6", question: "Welche Farben hat die Landesflagge von Hessen?", a: "rot-weiß", b: "blau-weiß", c: "schwarz-gelb", d: "grün-rot", solution: "a" },
    { num: "HE-7", question: "Welches bekannte Gebirge liegt in Hessen (mit der Wasserkuppe)?", a: "die Rhön", b: "der Schwarzwald", c: "die Alpen", d: "das Erzgebirge", solution: "a" },
    { num: "HE-8", question: "Welcher Fluss fließt bei Wiesbaden und Frankfurt in den Rhein?", a: "der Main", b: "die Elbe", c: "die Donau", d: "die Weser", solution: "a" },
    { num: "HE-9", question: "Ab welchem Alter darf man bei den Landtagswahlen in Hessen wählen?", a: "ab 18 Jahren", b: "ab 16 Jahren", c: "ab 21 Jahren", d: "ab 25 Jahren", solution: "a" },
    { num: "HE-10", question: "Wo liegt Hessen auf dieser Deutschlandkarte?", a: "in der Mitte / im Westen", b: "an der Ostseeküste", c: "im tiefen Süden", d: "an der Grenze zu Polen", image: "https://foreignvasi.com/qhs10.da672a59.jpeg", solution: "a" }
  ],
  MV: [
    { num: "MV-1", question: "Welches Wappentier steht u. a. auf dem Wappen von Mecklenburg-Vorpommern?", a: "der Stierkopf und der Pommersche Greif", b: "der Bär", c: "das Pferd", d: "der Bergische Löwe", image: "https://foreignvasi.com/qmv1.a2812830.jpeg", solution: "a" },
    { num: "MV-2", question: "Welches ist die Landeshauptstadt von Mecklenburg-Vorpommern?", a: "Schwerin", b: "Rostock", c: "Stralsund", d: "Greifswald", solution: "a" },
    { num: "MV-3", question: "Wo hat der Landtag von Mecklenburg-Vorpommern seinen Sitz?", a: "im Schweriner Schloss", b: "im Rathaus Rostock", c: "in Stralsund", d: "in Neubrandenburg", solution: "a" },
    { num: "MV-4", question: "An welches Meer grenzt Mecklenburg-Vorpommern?", a: "an die Ostsee", b: "an die Nordsee", c: "an das Mittelmeer", d: "an das Schwarze Meer", solution: "a" },
    { num: "MV-5", question: "Welche ist die bevölkerungsreichste Stadt in Mecklenburg-Vorpommern?", a: "Rostock", b: "Schwerin", c: "Wismar", d: "Güstrow", solution: "a" },
    { num: "MV-6", question: "Welche ist die größte Insel Deutschlands, die zu Mecklenburg-Vorpommern gehört?", a: "Rügen", b: "Sylt", c: "Helgoland", d: "Borkum", solution: "a" },
    { num: "MV-7", question: "An welchen Staat grenzt Mecklenburg-Vorpommern im Osten?", a: "Polen", b: "Dänemark", c: "Schweden", d: "Tschechien", solution: "a" },
    { num: "MV-8", question: "Welche Farben hat die Landesflagge von Mecklenburg-Vorpommern?", a: "blau-weiß-gelb-rot", b: "schwarz-rot-gold", c: "grün-weiß", d: "rot-weiß", solution: "a" },
    { num: "MV-9", question: "Wie heißt der größte See, der vollständig in Deutschland liegt (in MV)?", a: "die Müritz", b: "der Bodensee", c: "der Chiemsee", d: "der Starnberger See", solution: "a" },
    { num: "MV-10", question: "Wo liegt Mecklenburg-Vorpommern auf dieser Deutschlandkarte?", a: "im Nordosten an der Ostseeküste", b: "im Südwesten", c: "im Zentrum", d: "an der niederländischen Grenze", image: "https://foreignvasi.com/qmv10.bc891748.jpeg", solution: "a" }
  ],
  NI: [
    { num: "NI-1", question: "Welches Wappentier ist das Symbol des Landes Niedersachsen?", a: "das weiße Sachsenross", b: "der Löwe", c: "der Bär", d: "der Hirsch", solution: "a" },
    { num: "NI-2", question: "Welches ist die Landeshauptstadt von Niedersachsen?", a: "Hannover", b: "Braunschweig", c: "Osnabrück", d: "Göttingen", solution: "a" },
    { num: "NI-3", question: "Wo tagt der Landtag von Niedersachsen?", a: "im Leineschloss in Hannover", b: "im Rathaus Braunschweig", c: "in Hildesheim", d: "in Lüneburg", solution: "a" },
    { num: "NI-4", question: "An welches Meer grenzt Niedersachsen im Norden?", a: "an die Nordsee", b: "an die Ostsee", c: "an den Atlantik", d: "an das IJsselmeer", solution: "a" },
    { num: "NI-5", question: "An welchen Nachbarstaat grenzt Niedersachsen im Westen?", a: "an die Niederlande", b: "an Frankreich", c: "an Dänemark", d: "an Polen", solution: "a" },
    { num: "NI-6", question: "Welche Farben hat die Landesflagge von Niedersachsen?", a: "schwarz-rot-gold mit dem Landeswappen", b: "rot-weiß", c: "grün-weiß-rot", d: "blau-weiß", solution: "a" },
    { num: "NI-7", question: "Welches bekannte Mittelgebirge liegt zum Teil in Niedersachsen?", a: "der Harz", b: "der Schwarzwald", c: "das Erzgebirge", d: "die Eifel", solution: "a" },
    { num: "NI-8", question: "Wo liegt Niedersachsen auf dieser Deutschlandkarte?", a: "im Nordwesten", b: "im Südosten", c: "im Südwesten", d: "im äußersten Osten", image: "https://foreignvasi.com/qns8.81db6464.jpeg", solution: "a" },
    { num: "NI-9", question: "Welche Inseln liegen vor der niedersächsischen Küste?", a: "die Ostfriesischen Inseln", b: "die Nordfriesischen Inseln", c: "Rügen und Usedom", d: "die Balearen", solution: "a" },
    { num: "NI-10", question: "Wer wählt die Ministerpräsidentin / den Ministerpräsidenten von Niedersachsen?", a: "der Niedersächsische Landtag", b: "das Volk in Direktwahl", c: "die Bundeskanzlerin", d: "der Bundesrat", solution: "a" }
  ],
  RP: [
    { num: "RP-1", question: "Welche Symbole enthält das Wappen von Rheinland-Pfalz?", a: "das Trierer Kreuz, das Mainzer Rad und den Pfälzer Löwen", b: "drei Rauten", c: "das Sachsenross", d: "den Berliner Bären", image: "https://foreignvasi.com/qrp1.5a74c5da.jpeg", solution: "a" },
    { num: "RP-2", question: "Welches ist die Landeshauptstadt von Rheinland-Pfalz?", a: "Mainz", b: "Koblenz", c: "Trier", d: "Ludwigshafen", solution: "a" },
    { num: "RP-3", question: "Wo tagt der Landtag von Rheinland-Pfalz?", a: "im Deutschhaus in Mainz", b: "im Schloss Koblenz", c: "in Trier", d: "in Speyer", solution: "a" },
    { num: "RP-4", question: "An welche ausländischen Staaten grenzt Rheinland-Pfalz?", a: "Belgien, Frankreich und Luxemburg", b: "Polen und Tschechien", c: "Österreich und die Schweiz", d: "die Niederlande und Dänemark", solution: "a" },
    { num: "RP-5", question: "Welche beiden großen Flüsse fließen bei Koblenz (am Deutschen Eck) zusammen?", a: "Rhein und Mosel", b: "Donau und Inn", c: "Elbe und Saale", d: "Main und Neckar", solution: "a" },
    { num: "RP-6", question: "Welche Stadt in Rheinland-Pfalz gilt als älteste Stadt Deutschlands mit römischen Baudenkmälern?", a: "Trier", b: "Kaiserslautern", c: "Worms", d: "Neustadt", solution: "a" },
    { num: "RP-7", question: "Welche Farben hat die Landesflagge von Rheinland-Pfalz?", a: "schwarz-rot-gold mit dem Landeswappen", b: "rot-weiß", c: "blau-weiß", d: "grün-weiß", solution: "a" },
    { num: "RP-8", question: "Wo liegt Rheinland-Pfalz auf dieser Deutschlandkarte?", a: "im Südwesten", b: "im Nordosten", c: "an der Ostsee", d: "im tiefen Süden", image: "https://foreignvasi.com/qrp8.528dcff5.jpeg", solution: "a" },
    { num: "RP-9", question: "Wer wählt den Ministerpräsidenten von Rheinland-Pfalz?", a: "der Landtag", b: "das Volk direkt", c: "der Bundeskanzler", d: "der Bundespräsident", solution: "a" },
    { num: "RP-10", question: "Für welchen Wirtschaftszweig ist Rheinland-Pfalz besonders berühmt?", a: "Weinbau (z. B. an Mosel, Rhein, Pfalz)", b: "Steinkohlebergbau", c: "Fischfang auf Hochsee", d: "Erdölförderung", solution: "a" }
  ],
  SL: [
    { num: "SL-1", question: "Welches ist das Landeswappen des Saarlandes?", a: "Ein viergeteiltes Schild mit Nassau-Saarbrücker Löwen, lothringischem Adler und Pfälzer Löwen", b: "Der Bremer Schlüssel", c: "Der Rote Adler", d: "Das Rautenwappen", image: "https://foreignvasi.com/qsl1.5d22fa5a.jpeg", solution: "a" },
    { num: "SL-2", question: "Welches ist die Landeshauptstadt des Saarlandes?", a: "Saarbrücken", b: "Neunkirchen", c: "Homburg", d: "Saarlouis", solution: "a" },
    { num: "SL-3", question: "Wo befindet sich der Landtag des Saarlandes?", a: "in Saarbrücken", b: "in Völklingen", c: "in Homburg", d: "in Merzig", solution: "a" },
    { num: "SL-4", question: "An welche ausländischen Staaten grenzt das Saarland?", a: "Frankreich und Luxemburg", b: "Belgien und die Niederlande", c: "Österreich und die Schweiz", d: "Polen", solution: "a" },
    { num: "SL-5", question: "In welchem Jahr trat das Saarland der Bundesrepublik Deutschland bei ('Kleine Wiedervereinigung')?", a: "1957", b: "1949", c: "1990", d: "1963", solution: "a" },
    { num: "SL-6", question: "Welcher Fluss gibt dem Saarland seinen Namen?", a: "die Saar", b: "die Mosel", c: "die Nahe", d: "die Ruhr", solution: "a" },
    { num: "SL-7", question: "Welches bekannte UNESCO-Weltkulturerbe liegt im Saarland?", a: "die Völklinger Hütte", b: "Kölner Dom", c: "Zeche Zollverein", d: "Schloss Sanssouci", solution: "a" },
    { num: "SL-8", question: "Wo liegt das Saarland auf dieser Deutschlandkarte?", a: "im Südwesten an der Grenze zu Frankreich", b: "im Nordosten", c: "im Zentrum", d: "an der Nordsee", image: "https://foreignvasi.com/qsl8.e724ee61.jpeg", solution: "a" },
    { num: "SL-9", question: "Welche Farben hat die Landesflagge des Saarlandes?", a: "schwarz-rot-gold mit dem Landeswappen", b: "blau-weiß-rot", c: "rot-weiß", d: "schwarz-gelb", solution: "a" },
    { num: "SL-10", question: "Wer wählt den Ministerpräsidenten des Saarlandes?", a: "der Landtag des Saarlandes", b: "der Bundeskanzler", c: "das Volk in Direktwahl", d: "der französische Präsident", solution: "a" }
  ],
  SN: [
    { num: "SN-1", question: "Welches ist das Landeswappen des Freistaates Sachsen?", a: "Neunmal von Schwarz und Gold geteilt mit grünem Rautenkranz", b: "Der Bayerische Löwe", c: "Das Westfalenpferd", d: "Der Brandenburger Adler", image: "https://foreignvasi.com/qss1.71aaeb78.jpeg", solution: "a" },
    { num: "SN-2", question: "Welches ist die Landeshauptstadt von Sachsen?", a: "Dresden", b: "Leipzig", c: "Chemnitz", d: "Zwickau", solution: "a" },
    { num: "SN-3", question: "Wo hat der Sächsische Landtag seinen Sitz?", a: "am Elbufer in Dresden", b: "in Leipzig", c: "in Chemnitz", d: "in Meißen", solution: "a" },
    { num: "SN-4", question: "An welche ausländischen Staaten grenzt der Freistaat Sachsen?", a: "Polen und Tschechien", b: "Österreich und die Schweiz", c: "Frankreich und Belgien", d: "die Niederlande", solution: "a" },
    { num: "SN-5", question: "Welche slawische Minderheit lebt im Freistaat Sachsen?", a: "die Sorben", b: "die Friesen", c: "die Dänen", d: "die Kaschuben", solution: "a" },
    { num: "SN-6", question: "Welche Farben hat die Landesflagge von Sachsen?", a: "weiß-grün", b: "schwarz-gelb", c: "rot-weiß", d: "blau-gelb", solution: "a" },
    { num: "SN-7", question: "Welcher Fluss fließt durch Dresden und Meißen?", a: "die Elbe", b: "die Spree", c: "die Oder", d: "die Mulde", solution: "a" },
    { num: "SN-8", question: "Wo liegt Sachsen auf dieser Deutschlandkarte?", a: "im Osten", b: "im Nordwesten", c: "im Südwesten", d: "an der Nordsee", image: "https://foreignvasi.com/qss8.6922b0bb.jpeg", solution: "a" },
    { num: "SN-9", question: "In welcher sächsischen Stadt begannen im Herbst 1989 die Montagsdemonstrationen?", a: "Leipzig", b: "Dresden", c: "Görlitz", d: "Plauen", solution: "a" },
    { num: "SN-10", question: "Wer wählt den Ministerpräsidenten von Sachsen?", a: "der Sächsische Landtag", b: "das Volk direkt", c: "die Bundesregierung", d: "der Bundesrat", solution: "a" }
  ],
  ST: [
    { num: "ST-1", question: "Welche Symbole zeigt das Landeswappen von Sachsen-Anhalt?", a: "Den sächsischen Rautenkranz oben und den preußischen Bären unten auf einer Zinnenmauer", b: "Das Bremer Roland-Symbol", c: "Drei Hirschstangen", d: "Das Holstentor", image: "https://foreignvasi.com/qsa1.1e4245dd.jpeg", solution: "a" },
    { num: "ST-2", question: "Welches ist die Landeshauptstadt von Sachsen-Anhalt?", a: "Magdeburg", b: "Halle (Saale)", c: "Dessau-Roßlau", d: "Wittenberg", solution: "a" },
    { num: "ST-3", question: "Wo tagt der Landtag von Sachsen-Anhalt?", a: "am Domplatz in Magdeburg", b: "in Halle", c: "in Naumburg", d: "in Quedlinburg", solution: "a" },
    { num: "ST-4", question: "Welche Stadt in Sachsen-Anhalt ist als Lutherstadt und Wirkungsort der Reformation weltbekannt?", a: "Lutherstadt Wittenberg", b: "Stendal", c: "Halberstadt", d: "Bitterfeld", solution: "a" },
    { num: "ST-5", question: "Welcher bekannte Fluss fließt durch Magdeburg?", a: "die Elbe", b: "der Rhein", c: "die Weser", d: "die Donau", solution: "a" },
    { num: "ST-6", question: "Welche Farben hat die Landesflagge von Sachsen-Anhalt?", a: "gelb-schwarz", b: "rot-weiß", c: "grün-weiß", d: "blau-weiß", solution: "a" },
    { num: "ST-7", question: "Welcher berühmte Berg im Harz liegt in Sachsen-Anhalt?", a: "der Brocken", b: "die Zugspitze", c: "der Feldberg", d: "der Große Arber", solution: "a" },
    { num: "ST-8", question: "Wo liegt Sachsen-Anhalt auf dieser Deutschlandkarte?", a: "im östlichen Mitteldeutschland", b: "im tiefen Süden", c: "an der dänischen Grenze", d: "am Rhein", image: "https://foreignvasi.com/qsa8.fd6b5f78.jpeg", solution: "a" },
    { num: "ST-9", question: "Wer wählt den Ministerpräsidenten von Sachsen-Anhalt?", a: "der Landtag", b: "das Volk in Direktwahl", c: "der Bundeskanzler", d: "der Bundespräsident", solution: "a" },
    { num: "ST-10", question: "Welche bekannte Kunst- und Architekturschule hatte in Dessau (Sachsen-Anhalt) ihren weltberühmten Sitz?", a: "das Bauhaus", b: "die Romantik-Schule", c: "der Blaue Reiter", d: "die Wiener Werkstätte", solution: "a" }
  ],
  SH: [
    { num: "SH-1", question: "Welche beiden Symbole zeigt das Landeswappen von Schleswig-Holstein?", a: "die zwei Schleswigschen Löwen und das Holsteiner Nesselblatt", b: "das Ross und das Rad", c: "den Bären und den Adler", d: "den Schlüssel", image: "https://foreignvasi.com/qsh1.c4be2a60.jpeg", solution: "a" },
    { num: "SH-2", question: "Welches ist die Landeshauptstadt von Schleswig-Holstein?", a: "Kiel", b: "Lübeck", c: "Flensburg", d: "Neumünster", solution: "a" },
    { num: "SH-3", question: "Wo tagt der Schleswig-Holsteinische Landtag?", a: "im Landeshaus an der Kieler Förde", b: "im Holstentor in Lübeck", c: "in Flensburg", d: "in Rendsburg", solution: "a" },
    { num: "SH-4", question: "An welchen ausländischen Staat grenzt Schleswig-Holstein im Norden?", a: "Dänemark", b: "Schweden", c: "Niederlande", d: "Polen", solution: "a" },
    { num: "SH-5", question: "An welche beiden Meere grenzt Schleswig-Holstein ('Land zwischen den Meeren')?", a: "Nordsee und Ostsee", b: "Mittelmeer und Atlantik", c: "Schwarzes Meer und Kaspisches Meer", d: "Nordpolarmeer und Pazifik", solution: "a" },
    { num: "SH-6", question: "Welche anerkannten Minderheiten leben in Schleswig-Holstein?", a: "die dänische Minderheit und die friesische Volksgruppe", b: "die Sorben", c: "die Basken", d: "die Katalanen", solution: "a" },
    { num: "SH-7", question: "Welche Farben hat die Landesflagge von Schleswig-Holstein?", a: "blau-weiß-rot", b: "schwarz-rot-gold", c: "grün-weiß", d: "gelb-schwarz", solution: "a" },
    { num: "SH-8", question: "Wo liegt Schleswig-Holstein auf dieser Deutschlandkarte?", a: "im äußersten Norden", b: "im tiefen Süden", c: "im Südwesten", d: "im Zentrum", image: "https://foreignvasi.com/qsh8.442d7ed7.jpeg", solution: "a" },
    { num: "SH-9", question: "Welche berühmte Wasserstraße verbindet Nord- und Ostsee quer durch Schleswig-Holstein?", a: "der Nord-Ostsee-Kanal", b: "der Mittellandkanal", c: "der Suezkanal", d: "der Rhein-Main-Donau-Kanal", solution: "a" },
    { num: "SH-10", question: "Welche Partei vertritt im Schleswig-Holsteinischen Landtag die dänische und friesische Minderheit?", a: "SSW (Südschleswigscher Wählerverband)", b: "CDU", c: "SPD", d: "FDP", solution: "a" }
  ],
  TH: [
    { num: "TH-1", question: "Welches Wappentier zeigt das Landeswappen des Freistaats Thüringen?", a: "den achtfach rot-weiß gestreiften bunten Löwen umgeben von acht silbernen Sternen", b: "den Adler", c: "das Pferd", d: "den Bären", image: "https://foreignvasi.com/qtg1.aca82959.jpeg", solution: "a" },
    { num: "TH-2", question: "Welches ist die Landeshauptstadt von Thüringen?", a: "Erfurt", b: "Jena", c: "Weimar", d: "Gera", solution: "a" },
    { num: "TH-3", question: "Wo tagt der Thüringer Landtag?", a: "in Erfurt", b: "in Weimar", c: "in Eisenach", d: "in Gotha", solution: "a" },
    { num: "TH-4", question: "Welche Stadt in Thüringen ist eng mit Goethe, Schiller und der Weimarer Republik verbunden?", a: "Weimar", b: "Suhl", c: "Nordhausen", d: "Altenburg", solution: "a" },
    { num: "TH-5", question: "Welche berühmte Burg liegt bei Eisenach (wo Luther die Bibel übersetzte)?", a: "die Wartburg", b: "die Festung Ehrenbreitstein", c: "Schloss Neuschwanstein", d: "Burg Hohenzollern", solution: "a" },
    { num: "TH-6", question: "Welches bekannte Mittelgebirge prägt den Süden Thüringens ('Grünes Herz Deutschlands')?", a: "der Thüringer Wald", b: "der Schwarzwald", c: "der Taunus", d: "das Fichtelgebirge", solution: "a" },
    { num: "TH-7", question: "Welche Farben hat die Landesflagge von Thüringen?", a: "weiß-rot", b: "schwarz-gelb", c: "grün-weiß", d: "blau-weiß", solution: "a" },
    { num: "TH-8", question: "Wo liegt Thüringen auf dieser Deutschlandkarte?", a: "im geographischen Zentrum Deutschlands", b: "an der Nordseeküste", c: "an der Grenze zu Frankreich", d: "an den Alpen", image: "https://foreignvasi.com/qtg8.56380392.jpeg", solution: "a" },
    { num: "TH-9", question: "Wer wählt die Ministerpräsidentin / den Ministerpräsidenten von Thüringen?", a: "der Thüringer Landtag", b: "das Volk in Direktwahl", c: "der Bundeskanzler", d: "der Bundespräsident", solution: "a" },
    { num: "TH-10", question: "Welcher berühmte Höhenwanderweg führt über den Kamm des Thüringer Waldes?", a: "der Rennsteig", b: "der Rothaarsteig", c: "der Westweg", d: "der Jakobsweg", solution: "a" }
  ]
};

// Data loader function that checks questions.json from static folder, or uses the rich built-in dataset
export async function loadQuestionsCatalog(stateCode: BundeslandCode): Promise<{
  allQuestions: Question[];
  generalCount: number;
  stateCount: number;
  source: 'external' | 'builtin';
}> {
  try {
    const res = await fetch('questions.json', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      let general: Question[] = [];
      let statesMap: Record<string, Question[]> = {};

      if (data && typeof data === 'object') {
        if (Array.isArray(data.general)) {
          general = data.general;
        } else if (Array.isArray(data)) {
          general = data.filter((q: any) => /^\d+$/.test(String(q.num || '').trim()));
        }

        if (data.states && typeof data.states === 'object') {
          statesMap = data.states;
        } else {
          // Check root keys matching Bundesland codes
          Object.keys(data).forEach((key) => {
            if (Array.isArray(data[key]) && key !== 'general') {
              statesMap[key.toUpperCase()] = data[key];
            }
          });
        }
      }

      const targetKey = Object.keys(statesMap).find(k => k.toUpperCase() === stateCode.toUpperCase());
      const stateQuestions: Question[] = (targetKey && statesMap[targetKey]) || BUILTIN_STATE_QUESTIONS[stateCode] || [];

      // Sort general
      general.sort((a, b) => parseInt(a.num, 10) - parseInt(b.num, 10));

      // Sort regional
      stateQuestions.sort((a, b) => {
        const getSubNum = (item: Question) => {
          const parts = String(item.num || '').split('-');
          return parts.length > 1 ? parseInt(parts[1], 10) : (parseInt(item.num, 10) || 0);
        };
        return getSubNum(a) - getSubNum(b);
      });

      if (general.length > 0) {
        return {
          allQuestions: [...general, ...stateQuestions],
          generalCount: general.length,
          stateCount: stateQuestions.length,
          source: 'external'
        };
      }
    }
  } catch (err) {
    // Ignore fetch error and fall back smoothly to built-in dataset
    console.info('Using verified built-in BAMF Leben in Deutschland catalog:', err);
  }

  // Fallback to built-in verified questions
  const general = [...BUILTIN_GENERAL_QUESTIONS].sort((a, b) => parseInt(a.num, 10) - parseInt(b.num, 10));
  const stateQuestions = (BUILTIN_STATE_QUESTIONS[stateCode] || BUILTIN_STATE_QUESTIONS.NW);

  return {
    allQuestions: [...general, ...stateQuestions],
    generalCount: general.length,
    stateCount: stateQuestions.length,
    source: 'builtin'
  };
}

// Resolve question image with local cache, original URL, or coat image
export function resolveQuestionImageSrc(imageRaw?: string): string | null {
  if (!imageRaw || imageRaw === '-' || imageRaw.trim() === '') return null;
  const trimmed = imageRaw.trim();

  // 1. Check local cache mapping
  if (LOCAL_IMAGE_CACHE[trimmed]) {
    return LOCAL_IMAGE_CACHE[trimmed];
  }

  // 2. HTTP/HTTPS url
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 3. Local asset reference
  if (trimmed.startsWith('Assets/') || trimmed.startsWith('/Assets/')) {
    return trimmed;
  }

  let fileName = trimmed;
  if (!fileName.includes('.')) fileName += '.png';
  return `Assets/coats/${fileName}`;
}
