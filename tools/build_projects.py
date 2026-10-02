#!/usr/bin/env python3
"""Genera le pagine di approfondimento dei progetti (projects/<slug>.html).

Il contenuto (EN + IT) sta in PROJECTS qui sotto: modificalo e rilancia
    python3 tools/build_projects.py
Le pagine generate sono HTML statico, versionato nel repo come il resto del sito.
"""
import html
import pathlib
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "projects"
VERSION = time.strftime("%Y%m%d%H%M")

GC = "https://www.linkedin.com/in/gabriele-carta/"
FS = "https://www.linkedin.com/in/filippo-saccomano-3503342ba/"
TEAM_GF = [("Gabriele Carta", GC), ("Filippo Saccomano", FS)]

# Ogni sezione: (titolo_en, titolo_it, html_en, html_it)
PROJECTS = [
    dict(
        slug="thesis", wave="gnn", ch="CH-01", label=("MSC THESIS", "TESI MAGISTRALE"),
        title=("Imagined speech decoding with graph & hypergraph neural networks",
               "Decodifica dell’imagined speech con graph & hypergraph neural network"),
        meta=("Master’s thesis · Politecnico di Milano · Nov 2025 – Oct 2026",
              "Tesi magistrale · Politecnico di Milano · nov 2025 – ott 2026"),
        stack="Python · PyTorch · PyTorch Geometric · MNE · Weights & Biases",
        team=[], links=[],
        lead=("Can we tell which word someone is silently thinking from their brain activity alone?",
              "Si può capire quale parola una persona sta pensando in silenzio, solo dalla sua attività cerebrale?"),
        sections=[
            ("The question", "La domanda",
             "<p><em>Imagined speech</em> is the act of saying a word in your head without moving or making a sound. Decoding it from EEG would open a direct communication channel for people who cannot speak. It is also one of the hardest problems in brain–computer interfaces: the signal is weak, noisy and very different from one person to another.</p>",
             "<p>L’<em>imagined speech</em> è pronunciare una parola nella propria testa, senza muoversi né emettere suoni. Decodificarla dall’EEG aprirebbe un canale di comunicazione diretto per chi non può parlare. È anche uno dei problemi più difficili nelle interfacce cervello–computer: il segnale è debole, rumoroso e molto diverso da persona a persona.</p>"),
            ("The approach", "L’approccio",
             "<p>Instead of hand-crafting features, I treat each EEG recording as a <strong>graph</strong>: electrodes are nodes, and the connections between them are computed from the signal of that specific trial. Graph neural networks, and <strong>hypergraph</strong> networks where a single connection can link many electrodes at once, then learn directly from the raw signal, end to end.</p><p>A large part of the work is methodological: evaluating models fairly across subjects and sessions, and understanding <em>why</em> a model works or fails, not only <em>whether</em> it does.</p>",
             "<p>Invece di progettare feature a mano, tratto ogni registrazione EEG come un <strong>grafo</strong>: gli elettrodi sono i nodi e le connessioni tra loro sono calcolate dal segnale di quel singolo trial. Reti neurali su grafi, e su <strong>ipergrafi</strong> in cui una connessione può unire più elettrodi insieme, imparano poi direttamente dal segnale grezzo, end to end.</p><p>Una parte importante del lavoro è metodologica: valutare i modelli in modo corretto tra soggetti e sessioni, e capire <em>perché</em> un modello funziona o fallisce, non solo <em>se</em> funziona.</p>"),
            ("Status", "Stato",
             "<p>Work in progress. Details and results will be shared after the defence.</p>",
             "<p>Lavoro in corso. Dettagli e risultati saranno condivisi dopo la discussione.</p>"),
        ],
    ),
    dict(
        slug="icu", wave="icu", ch="CH-02", label=("CLINICAL ML", "ML CLINICO"),
        title=("ICU mortality prediction", "Predizione della mortalità in terapia intensiva"),
        meta=("Smart Hospital course · Politecnico di Milano · Mar – Jun 2026",
              "Corso Smart Hospital · Politecnico di Milano · mar – giu 2026"),
        stack="Python · XGBoost · TensorFlow (1D-CNN) · SMOTE · SHAP · LIME",
        team=TEAM_GF,
        links=[("View code", "Vedi il codice", "https://github.com/daniele22-u/smart_hospital_polimi", "code-icu"),
               ("Live dashboard", "Dashboard live", "https://daniele22-u.github.io/smart_hospital_polimi/dashboard/", "demo-icu"),
               ("Task report", "Report", "https://daniele22-u.github.io/smart_hospital_polimi/reports/task_report.html", "report-icu")],
        lead=("An end-to-end pipeline that estimates in-hospital mortality from intensive-care vital signs, explains its predictions and turns them into a bedside dashboard.",
              "Una pipeline completa che stima la mortalità intra-ospedaliera dai parametri vitali in terapia intensiva, spiega le sue predizioni e le trasforma in una dashboard da reparto."),
        sections=[
            ('My role', 'Il mio ruolo',
             '<p>Code implementation, together with Gabriele Carta and Filippo Saccomano: the three of us wrote and tested the code side of the project.</p>',
             '<p>Implementazione del codice, insieme a Gabriele Carta e Filippo Saccomano: abbiamo scritto e testato in tre la parte di codice del progetto.</p>'),
            ("Data", "Dati",
             "<p>A synthetic cohort inspired by MIMIC-III: <strong>500 ICU patients</strong>, 1,717 observations, 2–5 measurements per patient, 10 diagnoses. Mortality is <strong>12.6%</strong>, about one death for every seven survivors. With that imbalance, a model that predicts “survives” for everyone is 87% accurate and completely useless, so accuracy is the wrong metric from the start.</p>",
             "<p>Una coorte sintetica ispirata a MIMIC-III: <strong>500 pazienti</strong>, 1.717 osservazioni, 2–5 misure per paziente, 10 diagnosi. La mortalità è del <strong>12,6%</strong>, circa un decesso ogni sette sopravvissuti. Con questo sbilanciamento un modello che predice “sopravvive” per tutti è accurato all’87% e del tutto inutile: l’accuracy è la metrica sbagliata fin dall’inizio.</p>"),
            ("Approach", "Approccio",
             "<ol><li><strong>Features:</strong> for every vital sign and lab value, mean, last value, change, minimum, maximum and slope over the stay, plus the NEWS2 early-warning score and a few clinical interactions.</li><li><strong>Models:</strong> XGBoost with SMOTE applied <em>only inside the training folds</em> (no leakage), a small 1D-CNN on the raw sequences, and a weighted ensemble, all on the same stratified 5-fold splits.</li><li><strong>Decision:</strong> the alert threshold is chosen from the cost of a missed death versus a false alarm, not left at 0.5.</li><li><strong>Explanation:</strong> SHAP and LIME, translated into plain-language reasons for clinicians.</li></ol>",
             "<ol><li><strong>Feature:</strong> per ogni parametro vitale ed esame di laboratorio, media, ultimo valore, variazione, minimo, massimo e pendenza nel ricovero, più lo score di allerta NEWS2 e alcune interazioni cliniche.</li><li><strong>Modelli:</strong> XGBoost con SMOTE applicato <em>solo dentro i fold di training</em> (nessun data leakage), una piccola CNN 1D sulle sequenze e un ensemble pesato, tutti sugli stessi 5 fold stratificati.</li><li><strong>Decisione:</strong> la soglia di allerta viene scelta in base al costo di un decesso non segnalato rispetto a un falso allarme, invece di lasciarla a 0,5.</li><li><strong>Spiegazione:</strong> SHAP e LIME, tradotti in motivazioni comprensibili per i clinici.</li></ol>"),
            ("What we found", "Cosa abbiamo trovato",
             "<table class='pj-table'><thead><tr><th>Model</th><th>AUROC (out-of-fold)</th></tr></thead><tbody><tr><td>XGBoost</td><td>0.865</td></tr><tr><td>1D-CNN</td><td>0.792</td></tr><tr><td>Ensemble</td><td>0.838</td></tr></tbody></table><ul><li><strong>Deeper is not better:</strong> a 3-layer CNN with more filters did worse than the small one (0.778 → 0.766). With 2–5 time steps there is little temporal structure to learn.</li><li><strong>One number hides a lot:</strong> broken down by diagnosis, AUROC goes from 0.957 (trauma) to 0.758 (diabetes). Checking subgroups is a fairness step before any clinical use.</li><li><strong>The threshold is a clinical choice:</strong> raising the cost of a missed death trades specificity for sensitivity, and that trade-off belongs to clinicians.</li></ul><p class='pj-note'>The data is synthetic: these numbers compare methods within the project, not clinical performance.</p>",
             "<table class='pj-table'><thead><tr><th>Modello</th><th>AUROC (out-of-fold)</th></tr></thead><tbody><tr><td>XGBoost</td><td>0,865</td></tr><tr><td>CNN 1D</td><td>0,792</td></tr><tr><td>Ensemble</td><td>0,838</td></tr></tbody></table><ul><li><strong>Più profondo non vuol dire migliore:</strong> una CNN a 3 layer con più filtri è andata peggio di quella piccola (0,778 → 0,766). Con 2–5 istanti temporali c’è poca struttura da imparare.</li><li><strong>Un numero solo nasconde molto:</strong> diviso per diagnosi, l’AUROC va da 0,957 (trauma) a 0,758 (diabete). Controllare i sottogruppi è un passo di equità prima di qualsiasi uso clinico.</li><li><strong>La soglia è una scelta clinica:</strong> aumentare il costo di un decesso non segnalato scambia specificità con sensibilità, e quella scelta spetta ai clinici.</li></ul><p class='pj-note'>I dati sono sintetici: questi numeri confrontano metodi all’interno del progetto, non indicano prestazioni cliniche.</p>"),
            ("The dashboard", "La dashboard",
             "<p>The last task was a clinician-facing mock-up of a bedside risk monitor: a risk gauge against the alert threshold, live vital-sign trends and a “Why this alert” panel that turns SHAP values into short sentences (“oxygen saturation critically low”, “lactate climbing”). It runs in the browser; try the live version.</p>",
             "<p>L’ultimo task era un prototipo pensato per i clinici: un monitor del rischio da letto con un indicatore rispetto alla soglia di allerta, l’andamento dei parametri vitali e un pannello “Perché questo allarme” che trasforma i valori SHAP in frasi brevi (“saturazione criticamente bassa”, “lattato in aumento”). Funziona nel browser: prova la versione live.</p>"),
            ("Context", "Contesto",
             "<p>The project starts from the course’s reference pipeline. The instructor set five tasks as starting points for our own reasoning (threshold calibration, a new variability feature, CNN architecture changes, subgroup analysis and the dashboard); the choices, analyses and interpretations are ours.</p>",
             "<p>Il progetto parte dalla pipeline di riferimento del corso. Il docente ha assegnato cinque task come punto di partenza per il nostro ragionamento (calibrazione della soglia, una nuova feature di variabilità, modifiche all’architettura della CNN, analisi per sottogruppi e la dashboard); scelte, analisi e interpretazioni sono nostre.</p>"),
        ],
    ),
    dict(
        slug="marine-litter", wave="sea", ch="CH-04", label=("ENVIRONMENT", "AMBIENTE"),
        title=("Marine litter hazard assessment — Sardinia", "Rischio da rifiuti marini — Sardegna"),
        meta=("Human Health & Environment · Data Science Laboratory · Politecnico di Milano · Apr – Jun 2026",
              "Human Health & Environment · Data Science Laboratory · Politecnico di Milano · apr – giu 2026"),
        stack="Python · pandas · GeoPandas · SciPy · React · Leaflet · Recharts",
        team=[("Filippo Saccomano", FS)],
        links=[("View code", "Vedi il codice", "https://github.com/daniele22-u/hhe-labsardinia", "code-hhe"),
               ("Live dashboard", "Dashboard live", "https://daniele22-u.github.io/hhe-labsardinia/", "demo-hhe")],
        lead=("Six years of official monitoring data on marine litter, turned into a single spatial hazard index for the Sardinian coast and an interactive map anyone can explore.",
              "Sei anni di dati ufficiali di monitoraggio sui rifiuti marini, trasformati in un unico indice spaziale di rischio per la costa sarda e in una mappa interattiva che chiunque può esplorare."),
        sections=[
            ("Data", "Dati",
             "<p>ISPRA monitoring under the EU Marine Strategy Framework Directive (Descriptor 10), 2018–2023: beach litter surveys, floating litter transects, microplastics, seafloor sediments, and ingestion and entanglement in marine animals. The modules come as separate spreadsheets with different schemas, and the litter category codes changed in 2022 (G-codes became J-codes for the same items).</p>",
             "<p>Monitoraggi ISPRA nell’ambito della Direttiva quadro sulla strategia marina (Descrittore 10), 2018–2023: rifiuti spiaggiati, rifiuti galleggianti, microplastiche, sedimenti dei fondali, ingestione e intrappolamento negli animali marini. I moduli arrivano come fogli di calcolo separati con schemi diversi, e nel 2022 sono cambiati i codici delle categorie (i codici G sono diventati J per gli stessi oggetti).</p>"),
            ("Approach", "Approccio",
             "<ol><li><strong>Cleaning and harmonisation</strong> of all modules into one consistent dataset, mapping old and new category codes.</li><li><strong>Spatial hazard index:</strong> beach, plastic, current and biological signals interpolated on a coastal grid and combined with weights the user can change, then aggregated to the 126 coastal municipalities.</li><li><strong>Statistics:</strong> Global Moran’s I and LISA to test whether hotspots are real clusters, plus the role of tourism, sea currents and the 2020 COVID drop.</li><li><strong>One source of truth:</strong> the pipeline writes a single JSON file that feeds figures, dashboard and report, so nothing drifts between team members.</li></ol>",
             "<ol><li><strong>Pulizia e armonizzazione</strong> di tutti i moduli in un unico dataset coerente, con la mappatura tra vecchi e nuovi codici.</li><li><strong>Indice spaziale di rischio:</strong> segnali di spiaggia, plastica, correnti e biologici interpolati su una griglia costiera e combinati con pesi modificabili dall’utente, poi aggregati sui 126 comuni costieri.</li><li><strong>Statistica:</strong> Moran’s I globale e LISA per verificare se i punti critici sono cluster reali, più il ruolo di turismo, correnti e del calo del 2020 dovuto al COVID.</li><li><strong>Un’unica fonte di verità:</strong> la pipeline scrive un solo file JSON che alimenta grafici, dashboard e report, così niente diverge tra i membri del team.</li></ol>"),
            ("What we found", "Cosa abbiamo trovato",
             "<ul><li>A persistent <strong>west-coast hazard corridor</strong> (Alghero–Oristano), in every compartment and every year; the east coast stays low.</li><li>The clustering is statistically significant every year (Global Moran’s I ≈ 0.95, p &lt; 0.001).</li><li>In 2020 beach litter fell by about <strong>68%</strong> with tourism while currents stayed the same, but it never returned to pre-2020 levels: part of the problem is accumulated litter, not just visitors.</li><li>The link between tourism and litter was weak or negative, a useful “negative” result: measures aimed only at visitors would not be enough.</li></ul>",
             "<ul><li>Un <strong>corridoio di rischio sulla costa ovest</strong> (Alghero–Oristano) stabile in ogni comparto e in ogni anno; la costa est resta bassa.</li><li>Il clustering è statisticamente significativo ogni anno (Moran’s I globale ≈ 0,95, p &lt; 0,001).</li><li>Nel 2020 i rifiuti spiaggiati sono calati di circa il <strong>68%</strong> insieme al turismo mentre le correnti restavano uguali, ma non sono più tornati ai livelli pre-2020: parte del problema è il rifiuto accumulato, non solo i visitatori.</li><li>Il legame tra turismo e rifiuti è risultato debole o negativo, un risultato “negativo” utile: misure rivolte solo ai visitatori non basterebbero.</li></ul>"),
            ("The dashboard", "La dashboard",
             "<p>A React + Leaflet map with a year slider, compartment tabs, sea-current arrows, coastal segments, the LISA overlay, adjustable weights, a guided tour and an Italian/English switch. Filippo Saccomano and I led its development.</p>",
             "<p>Una mappa React + Leaflet con slider degli anni, schede per comparto, frecce delle correnti, segmenti costieri, overlay LISA, pesi regolabili, un tour guidato e il cambio italiano/inglese. Filippo Saccomano e io ne abbiamo guidato lo sviluppo.</p>"),
            ("Team", "Team",
             "<p>Five-person lab project: Daniele Uras, Filippo Saccomano, Tommaso Nesa, Tommaso Del Vecchio, Viola Guazzoni.</p>",
             "<p>Progetto di laboratorio in cinque: Daniele Uras, Filippo Saccomano, Tommaso Nesa, Tommaso Del Vecchio, Viola Guazzoni.</p>"),
        ],
    ),
    dict(
        slug="telemedicine", wave="nda", ch="CH-03", label=("INDUSTRY", "AZIENDA"),
        title=("Telemedicine algorithm", "Algoritmo per la telemedicina"),
        meta=("Capstone project · SXT S.r.l. – Telemedicine Systems · Milan · Sept 2025 – Feb 2026",
              "Progetto capstone · SXT S.r.l. – Telemedicine Systems · Milano · set 2025 – feb 2026"),
        stack="",
        team=TEAM_GF, links=[],
        lead=("A capstone project with a company that builds telemedicine systems: I designed and developed an algorithm for their platform.",
              "Un progetto capstone con un’azienda che sviluppa sistemi di telemedicina: ho progettato e sviluppato un algoritmo per la loro piattaforma."),
        sections=[
            ('My role', 'Il mio ruolo',
             '<p>Code implementation, together with Gabriele Carta and Filippo Saccomano: the three of us wrote and tested the code side of the project.</p>',
             '<p>Implementazione del codice, insieme a Gabriele Carta e Filippo Saccomano: abbiamo scritto e testato in tre la parte di codice del progetto.</p>'),
            ("Under NDA", "Coperto da NDA",
             "<p>The project is covered by a non-disclosure agreement, so I can’t share the problem, the data or the method. Happy to talk about the way of working in an interview, within what the agreement allows.</p>",
             "<p>Il progetto è coperto da un accordo di riservatezza, quindi non posso descrivere il problema, i dati o il metodo. Posso parlare del modo di lavorare durante un colloquio, nei limiti di quanto l’accordo consente.</p>"),
        ],
    ),
    dict(
        slug="narcolepsy", wave="sleep", ch="CH-06", label=("CLINICAL SW", "SOFTWARE CLINICO"),
        title=("Narcolepsy event monitoring", "Monitoraggio degli eventi di narcolessia"),
        meta=("Course project · Politecnico di Milano · Apr – Jun 2025",
              "Progetto di corso · Politecnico di Milano · apr – giu 2025"),
        stack="Python · SQL · XML",
        team=TEAM_GF, links=[],
        lead=("A desktop application that monitors respiration, heart rate and RR signals to predict narcolepsy events, with the data workflows behind it.",
              "Un’applicazione desktop che monitora respiro, frequenza cardiaca e segnali RR per predire gli eventi di narcolessia, con i flussi di dati che la sostengono."),
        sections=[
            ('My role', 'Il mio ruolo',
             '<p>Code implementation, together with Gabriele Carta and Filippo Saccomano: the three of us wrote and tested the code side of the project.</p>',
             '<p>Implementazione del codice, insieme a Gabriele Carta e Filippo Saccomano: abbiamo scritto e testato in tre la parte di codice del progetto.</p>'),
            ("What we built", "Cosa abbiamo realizzato",
             "<ul><li>A Python application with a graphical interface to record, monitor and predict narcolepsy events from physiological signals: respiration, heart rate (HR) and RR.</li><li>Structured data workflows, with XML for data exchange and an SQL database for storage, plus visualisations of the recorded events.</li><li>A competitive analysis of existing devices and clinical data-management solutions.</li></ul>",
             "<ul><li>Un’applicazione Python con interfaccia grafica per registrare, monitorare e predire gli eventi di narcolessia a partire da segnali fisiologici: respiro, frequenza cardiaca (HR) e RR.</li><li>Flussi di dati strutturati, con XML per lo scambio e un database SQL per l’archiviazione, più visualizzazioni degli eventi registrati.</li><li>Un’analisi competitiva dei dispositivi e delle soluzioni di gestione dei dati clinici esistenti.</li></ul>"),
        ],
    ),
    dict(
        slug="sleep-staging", wave="eeg", ch="CH-05", label=("EEG", "EEG"),
        title=("EEG sleep stage analysis", "Analisi delle fasi del sonno da EEG"),
        meta=("Signal Processing and Medical Images course · Politecnico di Milano · Oct 2024 – Jan 2025",
              "Corso Signal Processing and Medical Images · Politecnico di Milano · ott 2024 – gen 2025"),
        stack="MATLAB · Signal Processing Toolbox",
        team=TEAM_GF,
        links=[("View code", "Vedi il codice", "https://github.com/FilippoSaccomano/EEG-Sleep-Stage-Analysis", "code-sleep")],
        lead=("An automated pipeline that reads an overnight EEG and produces a hypnogram: the sequence of wake, REM and non-REM sleep across the night.",
              "Una pipeline automatica che legge un EEG notturno e produce un ipnogramma: la sequenza di veglia, sonno REM e non-REM durante la notte."),
        sections=[
            ('My role', 'Il mio ruolo',
             '<p>Code implementation, together with Gabriele Carta and Filippo Saccomano: the three of us wrote and tested the code side of the project.</p>',
             '<p>Implementazione del codice, insieme a Gabriele Carta e Filippo Saccomano: abbiamo scritto e testato in tre la parte di codice del progetto.</p>'),
            ("Pipeline", "Pipeline",
             "<ol><li><strong>Cleaning:</strong> a double notch filter removes narrow-band noise at 1 and 2 Hz.</li><li><strong>Epochs:</strong> the signal is split into the standard 30-second scoring windows.</li><li><strong>Spectra:</strong> power spectral density with Welch’s method, then absolute and relative power in the delta, theta, alpha, beta and gamma bands.</li><li><strong>Complexity:</strong> sample entropy and approximate entropy for every epoch.</li><li><strong>Staging:</strong> rule-based classification into wake, REM and NREM from the band-power ratios, with smoothing that removes implausibly short stage changes.</li><li><strong>Output:</strong> the hypnogram, overlaid with entropy, plus the intermediate spectra and filter responses.</li></ol>",
             "<ol><li><strong>Pulizia:</strong> un doppio filtro notch elimina il rumore a banda stretta a 1 e 2 Hz.</li><li><strong>Epoche:</strong> il segnale viene diviso nelle finestre standard di 30 secondi.</li><li><strong>Spettri:</strong> densità spettrale di potenza con il metodo di Welch, poi potenza assoluta e relativa nelle bande delta, theta, alfa, beta e gamma.</li><li><strong>Complessità:</strong> sample entropy e approximate entropy per ogni epoca.</li><li><strong>Stadiazione:</strong> classificazione a regole in veglia, REM e NREM a partire dai rapporti di potenza, con uno smoothing che elimina cambi di fase troppo brevi per essere plausibili.</li><li><strong>Risultato:</strong> l’ipnogramma con l’entropia sovrapposta, più spettri intermedi e risposte dei filtri.</li></ol>"),
            ("Why rules and not a classifier", "Perché regole e non un classificatore",
             "<p>The approach follows established, interpretable sleep-scoring criteria (Rechtschaffen &amp; Kales; Huang et al., 2014): every decision can be traced back to a band-power ratio a clinician recognises.</p>",
             "<p>L’approccio segue criteri di stadiazione consolidati e interpretabili (Rechtschaffen &amp; Kales; Huang et al., 2014): ogni decisione si può ricondurre a un rapporto di potenza che un clinico riconosce.</p>"),
        ],
    ),
    dict(
        slug="brain-lesion-segmentation", wave="mri", ch="CH-07", label=("IMAGING", "IMAGING"),
        title=("Brain lesion segmentation (MRI)", "Segmentazione di lesioni cerebrali (MRI)"),
        meta=("Course project · Politecnico di Milano · Dec 2024 – Feb 2025",
              "Progetto di corso · Politecnico di Milano · dic 2024 – feb 2025"),
        stack="MATLAB · Image Processing Toolbox",
        team=TEAM_GF,
        links=[("View code", "Vedi il codice", "https://github.com/FilippoSaccomano/Brain-Lesion-Segmentation", "code-mri")],
        lead=("Finding and measuring a brain lesion in a T1-weighted MRI volume, slice by slice, and checking how much to trust the result.",
              "Trovare e misurare una lesione cerebrale in un volume di risonanza T1, sezione per sezione, e verificare quanto fidarsi del risultato."),
        sections=[
            ('My role', 'Il mio ruolo',
             '<p>Code implementation, together with Gabriele Carta and Filippo Saccomano: the three of us wrote and tested the code side of the project.</p>',
             '<p>Implementazione del codice, insieme a Gabriele Carta e Filippo Saccomano: abbiamo scritto e testato in tre la parte di codice del progetto.</p>'),
            ("Pipeline", "Pipeline",
             "<ol><li><strong>Segmentation</strong> in both the axial and the sagittal plane: intensity thresholds inside a region of interest, morphological opening and closing, and selection of the largest connected component.</li><li><strong>Volume:</strong> lesion area per slice, summed into a volume in voxels, mm³ and cm³.</li><li><strong>Missing slices:</strong> polynomial regression estimates the lesion area in slices where it was not detected.</li><li><strong>Validation:</strong> Dice coefficient against a manual segmentation.</li><li><strong>Robustness:</strong> the same pipeline re-run with Gaussian, salt-and-pepper and speckle noise.</li><li><strong>Visualisation:</strong> interactive 3D rendering of the segmented lesion.</li></ol>",
             "<ol><li><strong>Segmentazione</strong> sia sul piano assiale sia su quello sagittale: soglie di intensità dentro una regione di interesse, apertura e chiusura morfologica e scelta della componente connessa più grande.</li><li><strong>Volume:</strong> area della lesione per sezione, sommata in un volume in voxel, mm³ e cm³.</li><li><strong>Sezioni mancanti:</strong> una regressione polinomiale stima l’area della lesione dove non era stata rilevata.</li><li><strong>Validazione:</strong> coefficiente di Dice rispetto a una segmentazione manuale.</li><li><strong>Robustezza:</strong> la stessa pipeline ripetuta con rumore gaussiano, sale e pepe e speckle.</li><li><strong>Visualizzazione:</strong> rendering 3D interattivo della lesione segmentata.</li></ol>"),
        ],
    ),
    dict(
        slug="vr-balance", wave="cop", ch="CH-08", label=("BIOMECHANICS", "BIOMECCANICA"),
        title=("Virtual reality & human balance", "Realtà virtuale & equilibrio"),
        meta=("Bachelor’s thesis · Erasmus at Łódź University of Technology · Feb – Jul 2024",
              "Tesi triennale · Erasmus alla Łódź University of Technology · feb – lug 2024"),
        stack="MATLAB · Python · Unity",
        team=[], links=[],
        lead=("How much does what we see in virtual reality shake how we stand? A balance study with a pressure platform, run during an Erasmus research period in Poland.",
              "Quanto ciò che vediamo in realtà virtuale disturba il modo in cui stiamo in piedi? Uno studio sull’equilibrio con una pedana di pressione, svolto durante un periodo di ricerca in Erasmus in Polonia."),
        sections=[
            ("The study", "Lo studio",
             "<p>Participants stood on a pressure (pedobarometric) platform while virtual-reality scenes introduced different visual perturbations. The platform records where body weight falls on the feet over time, the <em>centre of pressure</em>, which is a standard window on postural control.</p>",
             "<p>I partecipanti stavano in piedi su una pedana di pressione (pedobarometrica) mentre scene in realtà virtuale introducevano diverse perturbazioni visive. La pedana registra nel tempo dove cade il peso del corpo sui piedi, il <em>centro di pressione</em>, una finestra standard sul controllo posturale.</p>"),
            ("My work", "Il mio lavoro",
             "<ul><li>Designed the experimental protocol.</li><li>Built the analysis pipeline in MATLAB and Python, extracting triaxial acceleration, velocity and skewness parameters from the pressure-platform recordings for each scenario.</li><li>Worked in the mechanical engineering laboratory of an international university, in English.</li></ul>",
             "<ul><li>Ho progettato il protocollo sperimentale.</li><li>Ho costruito la pipeline di analisi in MATLAB e Python, estraendo per ogni scenario parametri triassiali di accelerazione, velocità e skewness dalle registrazioni della pedana di pressione.</li><li>Ho lavorato nel laboratorio di ingegneria meccanica di un’università internazionale, in inglese.</li></ul>"),
        ],
    ),
]


def esc(s):
    return html.escape(s, quote=True)


def bi(en, it, tag="span", cls=""):
    c = f' class="{cls}"' if cls else ""
    return f'<{tag}{c} lang="en">{en}</{tag}><{tag}{c} lang="it">{it}</{tag}>'


def page(p, prev_p, next_p):
    team = ""
    if p["team"]:
        names = " · ".join(f'<a href="{u}" target="_blank" rel="noopener">{esc(n)}</a>' for n, u in p["team"])
        team = f'<p class="pj-team mono">{bi("with", "con")} {names}</p>'
    links = ""
    if p["links"]:
        items = "".join(
            f'<a class="pj-btn mono" href="{u}" target="_blank" rel="noopener" data-goatcounter-click="pj-{gc}">{bi(esc(en), esc(it))} ↗</a>'
            for en, it, u, gc in p["links"])
        links = f'<div class="pj-links">{items}</div>'
    stack = f'<p class="pj-meta mono">{esc(p["stack"])}</p>' if p["stack"] else ""
    secs = "".join(
        f'<section class="pj-sec"><h2 class="mono">// {bi(esc(hen), esc(hit))}</h2>'
        f'<div lang="en">{ben}</div><div lang="it">{bit}</div></section>'
        for hen, hit, ben, bit in p["sections"])
    nav = (f'<a class="pj-nav-prev" href="{prev_p["slug"]}.html"><span class="mono">← {prev_p["ch"]}</span>'
           f'{bi(esc(prev_p["title"][0]), esc(prev_p["title"][1]))}</a>'
           f'<a class="pj-nav-next" href="{next_p["slug"]}.html"><span class="mono">{next_p["ch"]} →</span>'
           f'{bi(esc(next_p["title"][0]), esc(next_p["title"][1]))}</a>')
    title_en, title_it = p["title"]
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title_en)} — Daniele Uras</title>
  <meta name="description" content="{esc(p["lead"][0])}">
  <link rel="canonical" href="https://daniele22-u.github.io/projects/{p["slug"]}.html">
  <meta property="og:type" content="article">
  <meta property="og:title" content="{esc(title_en)} — Daniele Uras">
  <meta property="og:description" content="{esc(p["lead"][0])}">
  <meta property="og:image" content="https://daniele22-u.github.io/assets/og.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#0a0a0a">
  <link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="../assets/fonts/anton-normal-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="../assets/fonts/instrument-serif-normal-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="../style.css?v={VERSION}">
  <script>
    (function () {{
      var d = document.documentElement, l = 'en';
      try {{ var t = localStorage.getItem('theme'); if (t) d.dataset.theme = t; var s = localStorage.getItem('lang'); if (s === 'it' || s === 'en') l = s; else if ((navigator.language || '').toLowerCase().indexOf('it') === 0) l = 'it'; }} catch (e) {{}}
      var q = new URLSearchParams(location.search).get('lang'); if (q === 'it' || q === 'en') l = q;
      d.lang = l; d.dataset.lang = l;
    }})();
  </script>
</head>
<body class="pj-page">
  <header class="pj-bar">
    <a class="pj-back mono" href="../#work">← {bi("All projects", "Tutti i progetti")}</a>
    <span class="pj-ch mono">{p["ch"]} // {bi(esc(p["label"][0]), esc(p["label"][1]))}</span>
    <span class="pj-tools">
      <button class="pj-lang mono" type="button"><span class="l-en">EN</span> <span class="l-it">IT</span><span class="sr-only"> — switch language / cambia lingua</span></button>
      <button class="theme-toggle pj-theme" type="button" aria-label="Toggle light / dark theme"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor"/></svg></button>
    </span>
  </header>

  <main class="pj">
    <canvas class="wave-hero" data-wave="{p["wave"]}" aria-hidden="true"></canvas>
    <div class="pj-head">
      <p class="pj-meta mono">{bi(esc(p["meta"][0]), esc(p["meta"][1]))}</p>
      <h1>{bi(esc(title_en), esc(title_it))}</h1>
      <p class="pj-lead">{bi(esc(p["lead"][0]), esc(p["lead"][1]))}</p>
      {stack}
      {team}
      {links}
    </div>
    {secs}
    <nav class="pj-nav" aria-label="More projects">{nav}</nav>
  </main>

  <footer class="legal mono pj-foot"><span>© 2026 Daniele Uras · <a href="../privacy.html">Privacy &amp; legal</a></span><a href="../">daniele22-u.github.io</a></footer>

  <script>
    document.querySelector('.pj-lang').addEventListener('click', function () {{
      var d = document.documentElement, l = d.dataset.lang === 'it' ? 'en' : 'it';
      d.lang = l; d.dataset.lang = l;
      try {{ localStorage.setItem('lang', l); }} catch (e) {{}}
    }});
  </script>
  <script defer src="../main.js?v={VERSION}"></script>
  <script data-goatcounter="https://daniele-u22.goatcounter.com/count" async src="../assets/js/count.js"></script>
</body>
</html>
'''


ORDER = ['thesis', 'icu', 'telemedicine', 'marine-litter', 'sleep-staging', 'narcolepsy', 'brain-lesion-segmentation', 'vr-balance']


def main():
    PROJECTS.sort(key=lambda p: ORDER.index(p['slug']))
    OUT.mkdir(exist_ok=True)
    n = len(PROJECTS)
    for i, p in enumerate(PROJECTS):
        (OUT / f'{p["slug"]}.html').write_text(page(p, PROJECTS[i - 1], PROJECTS[(i + 1) % n]), encoding="utf-8")
    print(f"{n} pagine in {OUT.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
