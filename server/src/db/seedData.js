const lines = [
  {
    name: "Red Line",
    color: "#d84a4a",
    stations: ["Centrale", "Porta Velaria", "Crocevia del Falco", "Piazza delle Lanterne"],
  },
  {
    name: "Blue Line",
    color: "#3274b8",
    stations: ["Centrale", "Fontana Oscura", "Borgo Sereno", "Viale dei Mosaici", "Arco del Sale"],
  },
  {
    name: "Green Line",
    color: "#3c9b62",
    stations: ["Porta Velaria", "Fontana Oscura", "Torre Cinerea", "Campo dell'Eco", "Giardini Nord"],
  },
  {
    name: "Yellow Line",
    color: "#d9a529",
    stations: ["Piazza delle Lanterne", "Torre Cinerea", "Viale dei Mosaici", "Campo dell'Eco", "Mercato Vecchio"],
  },
  {
    name: "Violet Line",
    color: "#7b58a6",
    stations: ["Borgo Sereno", "Darsena Chiara", "Mercato Vecchio", "Archivio Sud"],
  },
];

const stationPositions = {
  Centrale: [80, 80],
  "Porta Velaria": [250, 80],
  "Crocevia del Falco": [430, 80],
  "Piazza delle Lanterne": [610, 80],
  "Fontana Oscura": [250, 230],
  "Borgo Sereno": [430, 230],
  "Viale dei Mosaici": [610, 230],
  "Torre Cinerea": [430, 370],
  "Campo dell'Eco": [610, 370],
  "Giardini Nord": [250, 370],
  "Arco del Sale": [780, 230],
  "Mercato Vecchio": [780, 370],
  "Darsena Chiara": [610, 520],
  "Archivio Sud": [950, 520],
};

const events = [
  ["Quiet journey", "Nothing unusual happens.", 0],
  ["Wrong platform", "You lose time correcting your direction.", -2],
  ["Kind passenger", "A passenger shares a useful shortcut.", 1],
  ["Ticket inspector", "Your ticket is checked and a fee applies.", -3],
  ["Found coin pouch", "You find a small pouch under the seat.", 3],
  ["Crowded carriage", "You miss a chance to board quickly.", -1],
  ["Express transfer", "A fast connection saves resources.", 2],
  ["Signal failure", "A delay costs extra coins.", -4],
  ["Street musician", "A cheerful song improves your luck.", 1],
  ["Maintenance refund", "The operator refunds part of the trip.", 4],
];

const users = [
  ["alice@example.com", "Alice", "password"],
  ["bruno@example.com", "Bruno", "password"],
  ["carla@example.com", "Carla", "password"],
];

export { events, lines, stationPositions, users };
