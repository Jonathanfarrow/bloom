// Stylised layout of Hitchin town centre.
// Units are metres. x runs east, z runs south (so north is -z), origin is the
// middle of Market Place. Positions are approximate — this is an illustrative
// model, not a survey. See README for how to swap in OpenStreetMap footprints.

export const ROADS = [
  { name: 'High Street', w: 11, pts: [[0, -35], [4, -100], [10, -160]] },
  { name: 'Bancroft', w: 14, pave: 10, verge: true, pts: [[10, -160], [0, -260], [-12, -380], [-22, -520], [-30, -640]] },
  { name: 'Hermitage Road', w: 12, pts: [[10, -160], [120, -168], [210, -172], [300, -190]] },
  { name: 'Walsworth Road', w: 12, pts: [[300, -190], [420, -230], [560, -270], [700, -300]] },
  { name: 'Brand Street', w: 10, pts: [[-28, -30], [-60, -110], [-75, -200], [-60, -300], [-12, -380]] },
  { name: 'Sun Street', w: 10, pts: [[-5, 35], [-8, 100], [-12, 160]] },
  { name: 'Bucklersbury', w: 9, pts: [[-28, 22], [-70, 30], [-115, 40]] },
  { name: 'Tilehouse Street', w: 10, pts: [[-115, 40], [-200, 62], [-320, 95], [-460, 125]] },
  { name: 'Bridge Street', w: 11, pts: [[-12, 160], [80, 168], [150, 172], [205, 178]] },
  { name: 'Queen Street', w: 12, pts: [[205, 178], [215, 60], [222, -60], [232, -176]] },
  { name: 'Park Street', w: 12, pts: [[-12, 160], [-30, 260], [-45, 400], [-55, 560]] },
  { name: 'Hitchin Hill', w: 12, pts: [[205, 178], [240, 300], [270, 440]] },
  { name: 'Portmill Lane', w: 8, pts: [[4, -100], [80, -95], [160, -92]] },
  { name: 'Churchyard', w: 6, pave: 1.5, pts: [[25, 5], [62, 5]] },
  { name: 'Nightingale Road', w: 10, pts: [[300, -190], [320, -360], [345, -560]] },
  // Unnamed residential streets for context
  { w: 8, res: true, pts: [[-115, 40], [-130, -80], [-150, -200], [-160, -320], [-60, -300]] },
  { w: 8, res: true, pts: [[-320, 95], [-330, -100], [-345, -300]] },
  { w: 8, res: true, pts: [[420, -230], [450, 0], [470, 250]] },
  { w: 8, res: true, pts: [[205, 178], [330, 215], [470, 250]] },
  { w: 8, res: true, pts: [[240, 300], [400, 330], [560, 360]] },
  { w: 8, res: true, pts: [[-12, -380], [-110, -415]] },
  { w: 8, res: true, pts: [[270, 440], [420, 470], [600, 500]] },
  { w: 8, res: true, pts: [[270, 440], [150, 520], [40, 600]] },
  { w: 8, res: true, pts: [[270, 440], [290, 620]] },
  { w: 8, res: true, pts: [[-160, -320], [-190, -560]] },
  { w: 8, res: true, pts: [[320, -360], [480, -380], [600, -420]] },
  { w: 8, res: true, pts: [[-30, 260], [-110, 140], [-115, 40]] },
];

// Market Place: pedestrian square
export const PLAZA = { x0: -25, x1: 25, z0: -35, z1: 35 };

export const RIVER = {
  name: 'River Hiz',
  w: 8,
  pts: [[110, 560], [120, 420], [150, 300], [160, 200], [150, 172], [165, 90], [175, 20], [178, -60], [190, -130], [205, -172], [230, -260], [250, -380], [280, -520], [300, -660]],
};

export const GREENS = [
  { name: "St Mary's Churchyard", pts: [[62, -35], [158, -40], [160, 60], [150, 145], [70, 140], [40, 40]] },
  { name: 'Bancroft Gardens', pts: [[45, -440], [160, -440], [165, -250], [45, -250]] },
  { name: 'Butts Close', pts: [[-340, -570], [-120, -560], [-110, -430], [-330, -410]] },
  { name: 'Hitchin Priory', pts: [[-360, 175], [-120, 165], [-110, 400], [-380, 420]] },
];

export const HILL = { name: 'Windmill Hill', x: 345, z: 80, h: 14, sigma: 65, keepOut: 110 };

export const ROUNDABOUT = { x: 270, z: 440, r: 20, island: 12 };

export const BRIDGES = [
  { road: 'Bridge Street', at: [150, 172] },
  { road: 'Hermitage Road', at: [205, -172] },
  { road: 'Portmill Lane', at: [160, -92], skip: true },
];

// Landmarks are built explicitly in buildings.js; footprints here keep other
// buildings out of the way. [cx, cz, width(x), depth(z)]
export const LANDMARKS = {
  church: { name: "St Mary's Church", c: [110, 20], size: [70, 34] },
  cornExchange: { name: 'Corn Exchange', c: [-36, 0], size: [18, 28] },
  townHall: { name: 'Town Hall', c: [-96, -160], size: [22, 32] },
  britishSchools: { name: 'British Schools Museum', c: [250, -10], size: [14, 32] },
  priory: { name: 'Hitchin Priory', c: [-230, 270], size: [46, 20] },
};

export const PLACE_LABELS = [
  { text: 'Market Place', at: [0, -8] },
  { text: "St Mary's", at: [110, -10] },
  { text: 'Windmill Hill', at: [345, 60] },
  { text: 'Bancroft Gardens', at: [105, -410] },
  { text: 'Butts Close', at: [-230, -520] },
  { text: 'Hitchin Priory', at: [-230, 330] },
  { text: 'River Hiz', at: [184, -100] },
  { text: 'To the station →', at: [640, -290] },
];
