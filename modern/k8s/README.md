# Demo Kubernetes / OpenShift

Creare prima un database Oracle con i due utenti e le migrazioni presenti in ogni servizio (il compose locale esegue oracle/01_users.sh). Modificare DB_URL con l'host raggiungibile dal cluster e impostare i tre nomi immagine in stack.yaml su immagini pubblicate nel proprio registry.

    kubectl create secret generic nelis-db --from-literal=project-password='PASSWORD_PROGETTO' --from-literal=resource-password='PASSWORD_RISORSE'
    kubectl apply -f k8s/stack.yaml
    # Solo OpenShift:
    oc apply -f k8s/openshift-route.yaml

I valori mostrati sono segnaposto. Il secret si crea nel cluster e non viene salvato nel repository. Prima di portare i servizi in produzione servono autorizzazione, gestione delle migrazioni per rollout multipli e recupero automatico della saga.
