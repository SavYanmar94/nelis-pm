# Nelis PM — laboratorio Spring/Angular/Oracle

Ricostruzione progressiva del cronoprogramma in `../` (Next.js/Supabase). Il codice originale resta disponibile e non condivide il database con questa versione.

## Avvio locale

Prerequisiti: Docker Compose, almeno 6 GB di RAM disponibili e accesso all'immagine Oracle Database Free dal [registry Oracle](https://container-registry.oracle.com/).

```bash
git clone https://github.com/SavYanmar94/nelis-pm.git
cd nelis-pm
git switch feature/spring-angular-oracle
cd modern
cp .env.example .env
# impostare password personali in .env
docker compose up --build
```

Aprire http://localhost:4200. L'avvio iniziale di Oracle può richiedere alcuni minuti. `project-service` espone http://localhost:8080; `resource-service` http://localhost:8081. Gli endpoint `/actuator/health/{liveness,readiness}` servono alle probe.

Per sviluppare Angular senza ricostruire il container, eseguire `npm ci && npm start` dentro `modern/frontend`; il server di sviluppo inoltra le API ai due servizi Spring in esecuzione. Per esercitare la saga: creare una risorsa, due task con date sovrapposte e la stessa risorsa, poi schedulare il primo e il secondo. Il secondo produce un conflitto e mostra lo stato di prenotazione fallita.

## Funzioni implementate in questo laboratorio

- Creazione di cantieri con committente, luogo e date; creazione, modifica ed eliminazione di task raggruppati per fase e microfase.
- Predecessore vincolato allo stesso cantiere, rifiuto dei cicli, date coerenti, completamento consentito solo dopo la schedulazione.
- Angular mostra l'elenco dei cantieri, task, stati e una vista temporale delle date pianificate; il frontend chiama le API Spring tramite proxy.
- Un secondo servizio gestisce risorse e prenotazioni. La schedulazione è una saga sincrona: stato `PENDING`, prenotazione idempotente della risorsa, conferma `SCHEDULED`; in caso di errore viene eseguita la compensazione. Ripetere `POST /api/tasks/{id}/schedule` dopo un'interruzione e almeno un minuto consente di riprendere uno stato `PENDING`.
- Due utenti Oracle distinti, migrati con Flyway, impediscono l'accesso diretto alle tabelle dell'altro servizio.

## Limiti dichiarati

Questa è una prima fetta funzionante, non una migrazione dei dati Supabase né una replica completa di login, stakeholder, template, PDF, email e dashboard. La saga usa REST sincrono e un comando ripetibile; manca ancora un worker che recuperi automaticamente le operazioni pendenti dopo un crash e un outbox per notifiche affidabili. Le API demo non hanno autenticazione: eseguire solo in locale; introdurre JWT e autorizzazioni prima di esporle in rete. I manifest `k8s/` descrivono i servizi applicativi con un database Oracle esterno già pronto: sostituire immagini e segreti, poi verificarli su un cluster. Non affermano che sia stato eseguito un deploy su OpenShift.

## Percorso per il colloquio

1. Spiegare modello `Project → Task → predecessor`, transazioni locali e migrazioni Oracle.
2. Mostrare CRUD Angular, vincoli del dominio e prenotazioni idempotenti.
3. Indurre una prenotazione in conflitto: il task non diventa `SCHEDULED`; spiegare la compensazione e la finestra di crash.
4. Illustrare Docker Compose, probe, ConfigMap/Secret/Deployment/Service/Route e differenza tra test locale e cluster.
5. Prossime iterazioni: import/export dati Supabase, ruoli, template, Gantt completo, PDF, notifiche e recupero automatico saga.
