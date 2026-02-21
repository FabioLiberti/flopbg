# Use Case Federated Learning – Ospedali di Montagna (Chest X-ray)

## 1) Contesto (descrittivo fittizio)

Una rete di piccoli ospedali di montagna (ospedali di comunità, 20–50 posti letto) serve aree rurali con popolazione ridotta, molto anziana, ma con anche un flusso di famiglie giovani che vivono lontano dai grandi centri urbani.  
Ogni ospedale dispone di un reparto pediatrico minimo o solo di guardia pediatrica, con poche decine di casi pediatrici respiratori l’anno e pochissime radiografie toraciche pediatriche etichettate da specialisti.  
I pediatri locali lamentano difficoltà nel discriminare rapidamente, soprattutto in pronto soccorso, fra polmoniti virali, batteriche e quadri non infettivi, con rischio di sovra–ospedalizzazione o ricoveri tardivi.  
La condivisione centralizzata dei dati radiologici non è permessa dalle policy regionali, ma esiste una rete di collaborazione clinica che permette la creazione di una federazione FL tra ospedali, mantenendo i dati in loco.

---

## 2) Obiettivo / scopo del progetto

- Addestrare un modello di classificazione di radiografie del torace pediatrico per rilevare polmonite (vs. non polmonite), sfruttando un dataset clinico pubblico come base e simulando i vari ospedali come nodi federati.  
- Valutare se il training federato, con dati frammentati e non IID, consente di raggiungere prestazioni paragonabili a un modello centralizzato, mantenendo la privacy dei dati e gestendo l’eterogeneità dei nodi (ospedali con poche immagini, hardware modesto, connessioni lente).  
- Fornire una configurazione automatica del framework che includa parametri di base e avanzati (eterogeneità/dinamismo), così da poter lanciare rapidamente esperimenti comparativi (es. FedAvg con diverse participation rate).

---

## 3) Dataset scelto

**Dataset clinico:** `Chest X-ray (chest_xray)`

Uso previsto: classificazione binaria “pneumonia vs. normal” su radiografie pediatriche, distribuendo artificialmente il dataset tra i vari ospedali (nodi) con distribuzione non bilanciata per simulare l’ambiente reale.

Alternative possibili (per altri use case, stessa struttura di configurazione):

- `retinopathy` (Retinopatia diabetica)  
- `skin_cancer` (Tumori cutanei / melanoma)  
- `brain_tumor_mri` (Tumori cerebrali)

---

## 4) Basic Configuration (pronta per il framework)

**Use case:** Federated Pediatric Pneumonia Detection  
**Dataset:** `chest_xray`

```yaml
basic_config:
  number_of_rounds: 100          # Federated training rounds
  number_of_clients: 10          # 10 ospedali / nodi
  synced_with_node_configuration: true

  local_epochs: 2                # Epoch locali per round
  batch_size: 32                 # Batch size locale
  learning_rate: 0.01            # LR iniziale (SGD/Adam)

  mu: 0.001                      # Term. prossimità tipo FedProx
  quantization_bits: 8           # Compressione per comunicazione

  global_participation_rate: 0.5 # 50% dei client per round
5) Advanced Configuration
5.1 Client Heterogeneity Configuration
Tre classi di capacità:

Strong clients

Computational Power: alto (GPU o buona CPU)

Network Speed: alta

Proportion: 0.2 (20%, es. 2/10 ospedali)

Medium clients

Computational Power: medio

Network Speed: media

Proportion: 0.4 (40%, es. 4/10 ospedali)

Weak clients

Computational Power: basso

Network Speed: bassa

Proportion: 0.4 (40%, es. 4/10 ospedali)

Esempio in YAML:

text
client_heterogeneity:
  strong:
    computational_power: high
    network_speed: high
    proportion: 0.2
  medium:
    computational_power: medium
    network_speed: medium
    proportion: 0.4
  weak:
    computational_power: low
    network_speed: low
    proportion: 0.4
5.2 Client Dynamism Configuration
Tre classi di dinamismo / affidabilità:

Fast clients

Participation Rate: 0.9 (quasi sempre disponibili)

Proportion: 0.3 (30%, es. 3/10 ospedali)

Normal clients

Participation Rate: 0.6

Proportion: 0.5 (50%, es. 5/10 ospedali)

Slow clients

Participation Rate: 0.3 (spesso offline)

Proportion: 0.2 (20%, es. 2/10 ospedali)

Esempio YAML:

text
client_dynamism:
  fast:
    participation_rate: 0.9
    proportion: 0.3
  normal:
    participation_rate: 0.6
    proportion: 0.5
  slow:
    participation_rate: 0.3
    proportion: 0.2
6) Node Distribution and Configuration
6.1 Tabella nodi
Città / Nodo	Heterogeneity	Dynamism	Note cliniche fittizie
Centro Pediatrico Regionale	strong	fast	Molte RX pediatriche, centro di riferimento regionale.
Ospedale Montano Nord	medium	normal	Volume moderato, radiologo dedicato alcuni giorni al mese.
Ospedale Montano Sud	medium	normal	Casistica simile al Nord, rete meno stabile.
Ospedale di Valle A	weak	slow	Pochi casi/anno, connettività scarsa.
Ospedale di Valle B	weak	normal	Buona continuità, pochi dati.
Ospedale di Valle C	weak	slow	Nodo tipicamente “straggler”.
Ospedale di Comunità D	medium	fast	Buon hardware donato, pochi dati.
Ospedale di Comunità E	weak	normal	Partecipazione regolare, hardware limitato.
Casa della Salute F	strong	fast	Collegata a infrastruttura universitaria.
Casa della Salute G	medium	normal	Nodo “medio” di backup.
6.2 Configurazione nodi per il framework
Esempio YAML (mappando tabella → configurazione):

text
nodes:
  - id: 1
    city: "Centro Pediatrico Regionale"
    heterogeneity: strong
    dynamism: fast
    data_fraction: 0.20      # quota del dataset assegnata

  - id: 2
    city: "Ospedale Montano Nord"
    heterogeneity: medium
    dynamism: normal
    data_fraction: 0.12

  - id: 3
    city: "Ospedale Montano Sud"
    heterogeneity: medium
    dynamism: normal
    data_fraction: 0.12

  - id: 4
    city: "Ospedale di Valle A"
    heterogeneity: weak
    dynamism: slow
    data_fraction: 0.06

  - id: 5
    city: "Ospedale di Valle B"
    heterogeneity: weak
    dynamism: normal
    data_fraction: 0.08

  - id: 6
    city: "Ospedale di Valle C"
    heterogeneity: weak
    dynamism: slow
    data_fraction: 0.06

  - id: 7
    city: "Ospedale di Comunità D"
    heterogeneity: medium
    dynamism: fast
    data_fraction: 0.10

  - id: 8
    city: "Ospedale di Comunità E"
    heterogeneity: weak
    dynamism: normal
    data_fraction: 0.08

  - id: 9
    city: "Casa della Salute F"
    heterogeneity: strong
    dynamism: fast
    data_fraction: 0.10

  - id: 10
    city: "Casa della Salute G"
    heterogeneity: medium
    dynamism: normal
    data_fraction: 0.08
7) Preset completo di scenario
Puoi impacchettare tutto in un singolo preset (es. pediatric_rural_chestxray.yaml):

text
scenario_name: "pediatric_rural_chestxray"
description: >
  Federated learning per rilevazione di polmonite pediatrica
  in rete di piccoli ospedali di montagna, usando il dataset
  clinico chest_xray distribuito in modo non IID.

dataset: "chest_xray"

basic_config:
  number_of_rounds: 100
  number_of_clients: 10
  synced_with_node_configuration: true
  local_epochs: 2
  batch_size: 32
  learning_rate: 0.01
  mu: 0.001
  quantization_bits: 8
  global_participation_rate: 0.5

client_heterogeneity:
  strong:
    computational_power: high
    network_speed: high
    proportion: 0.2
  medium:
    computational_power: medium
    network_speed: medium
    proportion: 0.4
  weak:
    computational_power: low
    network_speed: low
    proportion: 0.4

client_dynamism:
  fast:
    participation_rate: 0.9
    proportion: 0.3
  normal:
    participation_rate: 0.6
    proportion: 0.5
  slow:
    participation_rate: 0.3
    proportion: 0.2

nodes:
  - id: 1
    city: "Centro Pediatrico Regionale"
    heterogeneity: strong
    dynamism: fast
    data_fraction: 0.20
  - id: 2
    city: "Ospedale Montano Nord"
    heterogeneity: medium
    dynamism: normal
    data_fraction: 0.12
  - id: 3
    city: "Ospedale Montano Sud"
    heterogeneity: medium
    dynamism: normal
    data_fraction: 0.12
  - id: 4
    city: "Ospedale di Valle A"
    heterogeneity: weak
    dynamism: slow
    data_fraction: 0.06
  - id: 5
    city: "Ospedale di Valle B"
    heterogeneity: weak
    dynamism: normal
    data_fraction: 0.08
  - id: 6
    city: "Ospedale di Valle C"
    heterogeneity: weak
    dynamism: slow
    data_fraction: 0.06
  - id: 7
    city: "Ospedale di Comunità D"
    heterogeneity: medium
    dynamism: fast
    data_fraction: 0.10
  - id: 8
    city: "Ospedale di Comunità E"
    heterogeneity: weak
    dynamism: normal
    data_fraction: 0.08
  - id: 9
    city: "Casa della Salute F"
    heterogeneity: strong
    dynamism: fast
    data_fraction: 0.10
  - id: 10
    city: "Casa della Salute G"
    heterogeneity: medium
    dynamism: normal
    data_fraction: 0.08