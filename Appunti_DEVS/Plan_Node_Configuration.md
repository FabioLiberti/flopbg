Fix Global Node Distribution - Piano di implementazione
Contesto
La sezione "Global Node Distribution" esiste già nel frontend con:

GlobeVisualization.js - usa react-simple-maps per mostrare una mappa del mondo con nodi geolocalizzati
NodeConfiguration.js - form per aggiungere/modificare/rimuovere nodi
nodes.json (50 nodi con coordinate reali) - letto dal GET /nodes
Backend endpoints GET/POST /nodes in app.py
Tuttavia il sistema ha diversi bug critici che lo rendono non funzionante.

Bug identificati
Bug 1: Backend POST /nodes non aggiorna nodes.json
GET legge da application/nodes.json
POST scrive solo su config.yaml (non su nodes.json)
Risultato: le modifiche ai nodi non vengono mai persistite per le letture successive
Bug 2: handleNodesUpdate posizionamento ambiguo
Definito subito dopo function App() ma prima delle dichiarazioni useState
Usa setNodes e saveNodes che funzionano solo grazie al closure JS, ma è fragile e confuso
Bug 3: react-simple-maps v1.0.0 - problema TopoJSON
Il file world-110m.json ha oggetti land e countries
react-simple-maps v1.0.0 di default cerca un oggetto countries nel TopoJSON - questo dovrebbe funzionare
Verificare che la mappa si carichi correttamente
Bug 4: Mappa non ben visibile / troppo piccola
projectionConfig.scale: 150 potrebbe essere troppo piccolo
La mappa manca di colori oceano/sfondo visibili
I label delle città si sovrappongono con 50 nodi
Piano di correzione
File da modificare
application/app.py (linee 572-592)
application_frontend/src/components/GlobeVisualization.js
application_frontend/src/components/NodeConfiguration.js
application_frontend/src/App.js (linee 68-75)
Step 1: Fix backend POST /nodes - salva su nodes.json
File: application/app.py

Nel metodo save_nodes():

Aggiungere scrittura su nodes.json oltre a config.yaml
Così GET e POST lavorano sullo stesso file

@app.route('/nodes', methods=['POST'])
def save_nodes():
    try:
        data = request.get_json()
        nodes = data.get('nodes')
        if not nodes:
            return jsonify({"message": "Nodes data is required."}), 400

        # Salva su nodes.json (usato da GET)
        nodes_file_path = os.path.join(os.path.dirname(__file__), 'nodes.json')
        with open(nodes_file_path, 'w') as f:
            json.dump(nodes, f, indent=2)

        # Aggiorna anche config.yaml
        config['nodes'] = nodes
        with open(config_path, 'w') as f:
            yaml.dump(config, f)

        return jsonify({"message": "Nodes saved successfully."}), 200
    except Exception as e:
        ...
Step 2: Fix handleNodesUpdate posizionamento in App.js
File: application_frontend/src/App.js

Spostare handleNodesUpdate dopo le dichiarazioni useState (dopo linea ~128) per chiarezza e sicurezza.

Step 3: Migliorare GlobeVisualization
File: application_frontend/src/components/GlobeVisualization.js

Miglioramenti:

Aggiungere sfondo oceano (colore azzurro chiaro)
Migliorare la proiezione (scala leggermente più grande)
Tooltip al hover sui nodi invece di label statici (troppi con 50 nodi si sovrappongono)
Migliorare i colori delle nazioni (più professionale)
Aggiungere bordi più visibili tra le nazioni
Step 4: Migliorare NodeConfiguration
File: application_frontend/src/components/NodeConfiguration.js

Fix URL POST da http://localhost:3000/nodes a http://localhost:5001/nodes (anche se il proxy funziona, meglio essere espliciti e consistenti con fetchNodes in App.js)
Migliorare lo stile della lista nodi (troppo basilare)
Verifica
Avviare backend: cd application && python app.py
Avviare frontend: cd application_frontend && npm start
Verificare che la mappa del mondo appaia con tutti i 50 nodi geolocalizzati
Verificare che i colori dei nodi corrispondano al tipo (strong=rosso, medium=verde, weak=blu)
Verificare che le dimensioni dei nodi corrispondano al dynamism (fast=grande, normal=medio, slow=piccolo)
Verificare che aggiungendo/modificando/rimuovendo un nodo dal NodeConfiguration, le modifiche vengano salvate e persistano dopo refresh
Verificare zoom e pan sulla mappa