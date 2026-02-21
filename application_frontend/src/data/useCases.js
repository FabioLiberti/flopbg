// src/data/useCases.js

const USE_CASES = [
  {
    id: 'pediatric_rural_chestxray',
    name: 'Ospedali di Montagna',
    subtitle: 'Federated Pediatric Pneumonia Detection',
    dataset: 'chest_xray',
    nodeDistView: 'national',
    description: `Una rete di piccoli ospedali di montagna (ospedali di comunità, 20–50 posti letto) serve aree rurali con popolazione ridotta, molto anziana, ma con anche un flusso di famiglie giovani che vivono lontano dai grandi centri urbani. Ogni ospedale dispone di un reparto pediatrico minimo o solo di guardia pediatrica, con poche decine di casi pediatrici respiratori l'anno e pochissime radiografie toraciche pediatriche etichettate da specialisti.`,
    problem: `I pediatri locali lamentano difficoltà nel discriminare rapidamente, soprattutto in pronto soccorso, fra polmoniti virali, batteriche e quadri non infettivi, con rischio di sovra-ospedalizzazione o ricoveri tardivi. La condivisione centralizzata dei dati radiologici non è permessa dalle policy regionali.`,
    objective: `Addestrare un modello di classificazione di radiografie del torace pediatrico per rilevare polmonite (vs. non polmonite), sfruttando un dataset clinico pubblico come base e simulando i vari ospedali come nodi federati. Valutare se il training federato, con dati frammentati e non IID, consente di raggiungere prestazioni paragonabili a un modello centralizzato, mantenendo la privacy dei dati e gestendo l'eterogeneità dei nodi.`,
    basicConfig: {
      numRounds: 100,
      numClients: 10,
      localEpochs: 2,
      batchSize: 32,
      learningRate: 0.01,
      mu: 0.001,
      quantizationBits: 8,
      globalParticipationRate: 0.5,
    },
    clientTypeConfig: {
      strong: { computational_power: 1.0, network_speed: 1.0, proportion: 0.2 },
      medium: { computational_power: 0.7, network_speed: 0.7, proportion: 0.4 },
      weak: { computational_power: 0.4, network_speed: 0.5, proportion: 0.4 },
    },
    clientDynamismConfig: {
      fast: { participation_rate: 0.9, proportion: 0.3 },
      normal: { participation_rate: 0.6, proportion: 0.5 },
      slow: { participation_rate: 0.3, proportion: 0.2 },
    },
    nodes: [
      { id: 1, name: 'Centro Pediatrico Regionale', city: 'Rome', latitude: 41.9028, longitude: 12.4964, client_type: 'strong', dynamism_type: 'fast' },
      { id: 2, name: 'Ospedale Montano Nord', city: 'Turin', latitude: 45.0705, longitude: 7.6868, client_type: 'medium', dynamism_type: 'normal' },
      { id: 3, name: 'Ospedale Montano Sud', city: 'Naples', latitude: 40.8518, longitude: 14.2681, client_type: 'medium', dynamism_type: 'normal' },
      { id: 4, name: 'Ospedale di Valle A', city: 'Brescia', latitude: 45.5419, longitude: 10.2118, client_type: 'weak', dynamism_type: 'slow' },
      { id: 5, name: 'Ospedale di Valle B', city: 'Verona', latitude: 45.4386, longitude: 10.9945, client_type: 'weak', dynamism_type: 'normal' },
      { id: 6, name: 'Ospedale di Valle C', city: 'Cagliari', latitude: 39.2238, longitude: 9.1217, client_type: 'weak', dynamism_type: 'slow' },
      { id: 7, name: 'Ospedale di Comunità D', city: 'Bologna', latitude: 44.4949, longitude: 11.3426, client_type: 'medium', dynamism_type: 'fast' },
      { id: 8, name: 'Ospedale di Comunità E', city: 'Palermo', latitude: 38.1157, longitude: 13.3615, client_type: 'weak', dynamism_type: 'normal' },
      { id: 9, name: 'Casa della Salute F', city: 'Florence', latitude: 43.7696, longitude: 11.2558, client_type: 'strong', dynamism_type: 'fast' },
      { id: 10, name: 'Casa della Salute G', city: 'Padua', latitude: 45.4060, longitude: 11.8776, client_type: 'medium', dynamism_type: 'normal' },
    ],
  },
];

export default USE_CASES;
