// Planting schemes and proposed sites for Hitchin in Bloom.
//
// A scheme is a palette of plants. `form` controls how each plant is drawn in
// the model; `share` is its proportion of the planting; `h` is height in metres.
// `perM2` is a rough real-world planting density used for the plant estimate.

export const SCHEMES = {
  summer: {
    name: 'Summer bedding',
    season: 'June – September',
    perM2: 20,
    note: 'Classic, high-colour municipal bedding. Replanted each May.',
    plants: [
      { name: 'Zonal geranium', latin: 'Pelargonium × hortorum', color: '#d3243a', form: 'ball', h: 0.35, share: 0.28 },
      { name: 'Petunia', latin: 'Petunia × atkinsiana', color: '#e2659f', form: 'cup', h: 0.25, share: 0.2 },
      { name: 'Trailing lobelia', latin: 'Lobelia erinus', color: '#3552c4', form: 'tiny', h: 0.15, share: 0.2 },
      { name: 'French marigold', latin: 'Tagetes patula', color: '#f09a1a', form: 'daisy', h: 0.25, share: 0.16 },
      { name: 'Sweet alyssum', latin: 'Lobularia maritima', color: '#f6f3ea', form: 'tiny', h: 0.12, share: 0.16 },
    ],
  },
  lavender: {
    name: 'Hitchin lavender',
    season: 'June – August',
    perM2: 4,
    note: 'A nod to the lavender fields Hitchin has been known for since the 1500s. Drought-tolerant, loved by bees.',
    plants: [
      { name: "English lavender 'Hidcote'", latin: 'Lavandula angustifolia', color: '#5b3f94', form: 'spike', h: 0.5, share: 0.38 },
      { name: "English lavender 'Munstead'", latin: 'Lavandula angustifolia', color: '#8b73c4', form: 'spike', h: 0.45, share: 0.27 },
      { name: 'Catmint', latin: 'Nepeta × faassenii', color: '#9aa6e2', form: 'spike', h: 0.4, share: 0.15 },
      { name: 'Cotton lavender', latin: 'Santolina chamaecyparissus', color: '#e6cf3f', form: 'ball', h: 0.3, share: 0.1 },
      { name: "Lamb's ear", latin: 'Stachys byzantina', color: '#c4ccbd', form: 'foliage', h: 0.25, share: 0.1 },
    ],
  },
  pollinator: {
    name: 'Pollinator meadow',
    season: 'May – September',
    perM2: 9,
    note: 'Native wildflowers and nectar-rich perennials. Cut once in late summer.',
    plants: [
      { name: 'Cornflower', latin: 'Centaurea cyanus', color: '#3a6ed8', form: 'daisy', h: 0.5, share: 0.22 },
      { name: 'Common poppy', latin: 'Papaver rhoeas', color: '#dd3325', form: 'cup', h: 0.5, share: 0.22 },
      { name: 'Ox-eye daisy', latin: 'Leucanthemum vulgare', color: '#fbfaf3', form: 'daisy', h: 0.55, share: 0.2 },
      { name: 'Corn marigold', latin: 'Glebionis segetum', color: '#f2c21c', form: 'daisy', h: 0.4, share: 0.14 },
      { name: 'Common knapweed', latin: 'Centaurea nigra', color: '#a3479f', form: 'ball', h: 0.6, share: 0.1 },
      { name: 'Meadow grasses', latin: 'Festuca / Agrostis', color: '#b5bf72', form: 'foliage', h: 0.6, share: 0.12 },
    ],
  },
  spring: {
    name: 'Spring bulbs',
    season: 'March – May',
    perM2: 50,
    note: 'Planted in autumn, first colour of the year. Can sit under summer bedding.',
    plants: [
      { name: "Tulip 'Apeldoorn'", latin: 'Tulipa', color: '#d42a2a', form: 'cup', h: 0.45, share: 0.25 },
      { name: "Tulip 'Golden Parade'", latin: 'Tulipa', color: '#f5b914', form: 'cup', h: 0.45, share: 0.18 },
      { name: "Daffodil 'Tête-à-tête'", latin: 'Narcissus', color: '#f7d51d', form: 'cup', h: 0.2, share: 0.2 },
      { name: 'Grape hyacinth', latin: 'Muscari armeniacum', color: '#4052c8', form: 'spike', h: 0.18, share: 0.15 },
      { name: "Narcissus 'Thalia'", latin: 'Narcissus', color: '#f8f7ee', form: 'daisy', h: 0.35, share: 0.12 },
      { name: 'Forget-me-not', latin: 'Myosotis sylvatica', color: '#7ea5ea', form: 'tiny', h: 0.18, share: 0.1 },
    ],
  },
  autumn: {
    name: 'Late summer glow',
    season: 'August – October',
    perM2: 7,
    note: 'Perennials and grasses that peak as bedding fades and hold structure into winter.',
    plants: [
      { name: 'Black-eyed Susan', latin: 'Rudbeckia fulgida', color: '#e8a115', form: 'daisy', h: 0.6, share: 0.24 },
      { name: 'Ice plant', latin: 'Hylotelephium spectabile', color: '#c44f7c', form: 'ball', h: 0.45, share: 0.18 },
      { name: 'Michaelmas daisy', latin: 'Symphyotrichum', color: '#8667c9', form: 'daisy', h: 0.7, share: 0.18 },
      { name: "Sneezeweed 'Moerheim Beauty'", latin: 'Helenium', color: '#c4481c', form: 'daisy', h: 0.8, share: 0.14 },
      { name: 'Fountain grass', latin: 'Pennisetum alopecuroides', color: '#c9a468', form: 'foliage', h: 0.7, share: 0.14 },
      { name: 'Chrysanthemum', latin: 'Chrysanthemum', color: '#e1703a', form: 'ball', h: 0.5, share: 0.12 },
    ],
  },
  wildflower: {
    name: 'Native wildflower meadow',
    season: 'May – August',
    perM2: 0,
    note: 'Perennial native meadow sown from local-provenance seed. Cut and cleared once a year in late summer.',
    plants: [
      { name: 'Ox-eye daisy', latin: 'Leucanthemum vulgare', color: '#fbfaf3', form: 'daisy', h: 0.5, share: 0.24 },
      { name: "Bird's-foot trefoil", latin: 'Lotus corniculatus', color: '#f2c417', form: 'tiny', h: 0.2, share: 0.16 },
      { name: 'Common knapweed', latin: 'Centaurea nigra', color: '#a3479f', form: 'ball', h: 0.6, share: 0.14 },
      { name: 'Field scabious', latin: 'Knautia arvensis', color: '#b7a3dc', form: 'daisy', h: 0.6, share: 0.12 },
      { name: 'Wild carrot', latin: 'Daucus carota', color: '#f3f1e6', form: 'tiny', h: 0.6, share: 0.1 },
      { name: 'Meadow grasses', latin: 'Festuca / Cynosurus', color: '#b5bf72', form: 'foliage', h: 0.55, share: 0.24 },
    ],
  },
  bulbs: {
    name: 'Naturalised bulbs',
    season: 'February – April',
    perM2: 25,
    note: 'Early bulbs planted in drifts into the grass. They spread year after year and need no upkeep beyond a delayed first mow.',
    plants: [
      { name: 'Crocus', latin: 'Crocus tommasinianus', color: '#9a7fd1', form: 'cup', h: 0.1, share: 0.4 },
      { name: "Daffodil 'February Gold'", latin: 'Narcissus', color: '#f6d21e', form: 'cup', h: 0.3, share: 0.3 },
      { name: 'Snowdrop', latin: 'Galanthus nivalis', color: '#f7f7f2', form: 'cup', h: 0.12, share: 0.15 },
      { name: 'Winter windflower', latin: 'Anemone blanda', color: '#5b73cf', form: 'daisy', h: 0.12, share: 0.15 },
    ],
  },
  perennial: {
    name: 'Long-flowering perennials',
    season: 'May – October',
    perM2: 6,
    note: 'Tough, drought-tolerant perennials that flower for months and come back every year. Far cheaper to run than bedding.',
    plants: [
      { name: "Salvia 'Caradonna'", latin: 'Salvia nemorosa', color: '#5d3f9e', form: 'spike', h: 0.5, share: 0.22 },
      { name: "Cranesbill 'Rozanne'", latin: 'Geranium', color: '#6d7fd6', form: 'daisy', h: 0.4, share: 0.2 },
      { name: "Yarrow 'Terracotta'", latin: 'Achillea millefolium', color: '#d98a4a', form: 'ball', h: 0.6, share: 0.16 },
      { name: 'Catmint', latin: 'Nepeta × faassenii', color: '#9aa6e2', form: 'spike', h: 0.4, share: 0.16 },
      { name: 'Tall verbena', latin: 'Verbena bonariensis', color: '#9a52b8', form: 'ball', h: 0.9, share: 0.12 },
      { name: 'Mexican feather grass', latin: 'Stipa tenuissima', color: '#d4c78e', form: 'foliage', h: 0.5, share: 0.14 },
    ],
  },
};

// ---------------------------------------------------------------------------
// Costs. Indicative UK prices (2025/26) for budgeting only: get quotes before
// bidding. Each rate splits into materials and labour so the plan can be costed
// as a volunteer-led programme (volunteers replace labour where they safely can)
// or fully contracted.
//   q:   'area' (m², measured from the model), 'units' (containers counted from
//        the model) or a fixed number
//   mat / lab: £ per unit, low–high
//   vol: volunteer hours per unit when volunteers do the work (0 = must be paid)
// ---------------------------------------------------------------------------
export const RATES = {
  bedPrep: { label: 'Bed preparation, peat-free compost and edging', q: 'area', mat: [8, 15], lab: [7, 15], vol: 0.3 },
  bedding: { label: 'Seasonal bedding, two plantings a year', q: 'area', mat: [18, 30], lab: [37, 55], vol: 0.8 },
  perennialPlant: { label: 'Perennial plants (6 per m²) and mulch', q: 'area', mat: [18, 30], lab: [12, 20], vol: 0.25 },
  perennialCare: { label: 'Weeding, cutting back, top-up plants', q: 'area', mat: [1, 2], lab: [3, 6], vol: 0.3 },
  lavenderPlant: { label: 'Lavender plants (4 per m²), ground prep, mulch', q: 'area', mat: [12, 18], lab: [6, 10], vol: 0.2 },
  lavenderCare: { label: 'Late-summer trim and weeding', q: 'area', mat: [0, 0.5], lab: [2, 3.5], vol: 0.06 },
  meadowPrep: { label: 'Ground preparation (machinery)', q: 'area', mat: [0, 0], lab: [1, 3], vol: 0 },
  meadowSeed: { label: 'Native wildflower seed, sown by hand', q: 'area', mat: [0.8, 1.5], lab: [0.2, 0.5], vol: 0.01 },
  meadowPlugs: { label: 'Wildflower plug plants and seed', q: 'area', mat: [5, 9], lab: [3, 6], vol: 0.15 },
  meadowCut: { label: 'Annual cut and collect (machinery)', q: 'area', mat: [0, 0], lab: [0.4, 1], vol: 0 },
  bulbs: { label: 'Bulbs (25 per m²) and planting', q: 'area', mat: [3.5, 7], lab: [3, 6], vol: 0.25 },
  basket: { label: 'Basket, liner and bracket', q: 'units', mat: [45, 80], lab: [0, 0], vol: 0 },
  basketFit: { label: 'Structural check and bracket fitting on lamp columns', q: 'units', mat: [0, 0], lab: [40, 80], vol: 0 },
  basketPlanting: { label: 'Plants, peat-free compost, feed; planting up', q: 'units', mat: [25, 40], lab: [15, 25], vol: 0.75 },
  basketHang: { label: 'Hanging and taking down (access equipment)', q: 'units', mat: [0, 0], lab: [15, 30], vol: 0 },
  basketWater: { label: 'Watering, June to September (lance from the ground)', q: 'units', mat: [2, 5], lab: [50, 85], vol: 6 },
  planterLarge: { label: 'Large planter (1.2–1.5 m), delivered', q: 'units', mat: [700, 1500], lab: [0, 0], vol: 0 },
  planterLargeCare: { label: 'Two plantings a year and watering', q: 'units', mat: [110, 180], lab: [140, 270], vol: 12 },
  planterTimber: { label: 'Timber street planter, delivered', q: 'units', mat: [350, 700], lab: [0, 0], vol: 0 },
  planterTimberCare: { label: 'Perennial and bulb care, watering', q: 'units', mat: [25, 45], lab: [35, 75], vol: 4 },
  trough: { label: 'Parapet trough and fixing to the bridge', q: 'units', mat: [150, 300], lab: [50, 100], vol: 0 },
  troughCare: { label: 'Planting and watering', q: 'units', mat: [25, 40], lab: [45, 80], vol: 5 },
  windowBox: { label: 'Matching window box, supplied to the business', q: 'units', mat: [45, 80], lab: [0, 0], vol: 0 },
  raisedBed: { label: 'Stone-faced raised bed (built by a contractor)', q: 'units', mat: [600, 1100], lab: [600, 1400], vol: 0 },
  centrepiece: { label: 'Tiered centrepiece planter', q: 1, mat: [3000, 6000], lab: [0, 0], vol: 0 },
  centrepieceCare: { label: 'Centrepiece planting and watering', q: 1, mat: [250, 400], lab: [450, 700], vol: 30 },
  trafficMgmt: { label: 'Traffic management, 3 visits a year (must be paid)', q: 3, mat: [0, 0], lab: [250, 600], vol: 0 },
  sign: { label: 'Sponsor or interpretation sign', q: 1, mat: [400, 900], lab: [0, 0], vol: 0 },
  coordination: { label: 'Scheme coordination and publicity', q: 1, mat: [0, 0], lab: [300, 800], vol: 20 },
};

// Running a volunteer programme has its own costs. Contractors include these in their prices.
export const PROGRAMME = [
  { label: 'Tools, gloves, kneelers, first-aid kits', capital: [600, 1500], annual: [100, 300], when: 'volunteer' },
  { label: 'Watering bowser on a trailer (about 1,000 litres)', capital: [1500, 3500], annual: [200, 500], when: 'containers' },
  { label: 'Group insurance (RHS community group scheme, check cover)', capital: [0, 0], annual: [100, 300], when: 'volunteer' },
  { label: 'Volunteer training: first aid, working safely near roads', capital: [0, 0], annual: [200, 600], when: 'volunteer' },
  { label: 'Anglia in Bloom entry and judges’ briefing notes (check current fee)', capital: [0, 0], annual: [250, 700], when: 'always' },
];
export const VOLUNTEER_RATE = 12.5; // £/hour used to value volunteer time as in-kind match funding

export const ROLES = {
  flagship: 'Flagship',
  gateway: 'Gateway',
  centre: 'Town centre',
  green: 'Green space',
};

export const LEVEL = ['Low', 'Medium', 'High'];

// A suggested order for the judges' tour: arrive by train, see the town from the
// hill, walk in through the café street and gardens to the historic centre and river.
export const ROUTE = ['station', 'windmill-hill', 'hermitage-road', 'bancroft-gardens', 'town-hall', 'market-place', 'baskets', 'sun-street', 'st-marys', 'river-hiz', 'bridge-street', 'butts-close', 'gateway'];

// ---------------------------------------------------------------------------
// Sites. Each has 2–3 options; the first is the recommended one.
// Ownership and permissions are best understanding and must be confirmed.
// ---------------------------------------------------------------------------
export const SITES = [
  {
    id: 'windmill-hill',
    name: 'Windmill Hill',
    street: 'Windmill Hill park',
    role: 'flagship',
    headline: 'Hitchin’s signature display, seen from right across the town centre.',
    why: [
      'The west slope faces the old town, so planting here can be seen from Queen Street, Hermitage Road and the churchyard.',
      'A big, simple display on one site gives more impact per pound than dozens of small beds.',
      'It links to Hitchin’s lavender heritage and gives the bid a clear story.',
      'Much of it can be planted at community days, which helps the bid and keeps costs down.',
    ],
    owner: 'North Hertfordshire District Council (parks), to confirm',
    checks: [
      'Permission from the council’s parks team; any conservation-area or local-plan designations for the hill.',
      'Keep existing paths, desire lines, the sledging slope and picnic areas open.',
      'No water supply on the hill, so plants must survive on rainfall once established.',
      'Mowing contract changes: areas to leave uncut, and when.',
    ],
    partners: ['Community planting days', 'Local schools and scout groups', 'Sponsor for an interpretation board'],
    options: [
      {
        id: 'lavender', name: 'Lavender ribbon', scheme: 'lavender',
        summary: 'A sweeping ribbon of lavender that follows the curve of the hill, with rows running along the slope like a Hitchin lavender field. It can be planted in phases over two or three years.',
        maintenance: 0, impact: 2, wildlife: 2,
        shapes: [{ kind: 'ribbon', pts: [[384, -122], [381, -106], [381, -90], [383, -75], [385, -60], [385, -45], [384, -31], [388, -18], [394, -7], [402, 3], [412, 13]], width: 16, spacing: 1.5, every: 0.75, within: 'Windmill Hill' }],
        capital: ['lavenderPlant', 'sign'], annual: ['lavenderCare'],
      },
      {
        id: 'meadow', name: 'Wildflower slope', scheme: 'wildflower',
        summary: 'Sow the whole west slope as a native wildflower meadow, with mown paths through it. The lowest cost per square metre of any option, and the best for wildlife.',
        maintenance: 0, impact: 1, wildlife: 2,
        shapes: [{ kind: 'meadowpoly', pts: [[362, -100], [418, -112], [428, -46], [448, -26], [452, 12], [366, 8]], within: 'Windmill Hill', density: 0.8 }],
        capital: ['meadowPrep', 'meadowSeed', 'sign'], annual: ['meadowCut'],
      },
      {
        id: 'bulbs', name: 'Spring bulb drifts', scheme: 'bulbs',
        summary: 'Drifts of crocus and daffodils across the slope. A spring spectacle that suits community planting days, with no running costs.',
        maintenance: 0, impact: 1, wildlife: 1,
        shapes: [
          { kind: 'meadow', c: [390, -62], r: 20, within: 'Windmill Hill' },
          { kind: 'meadow', c: [410, -20], r: 17, within: 'Windmill Hill' },
          { kind: 'meadow', c: [385, -5], r: 13, within: 'Windmill Hill' },
        ],
        capital: ['bulbs'], annual: [],
      },
    ],
  },
  {
    id: 'market-place',
    name: 'Market Place',
    street: 'Market Place',
    role: 'flagship',
    headline: 'The heart of town and the backdrop to markets and events.',
    why: [
      'The busiest public space in Hitchin, and where most photos of the town are taken.',
      'Moveable planters work around market stalls, the Christmas lights and events.',
    ],
    owner: 'North Hertfordshire District Council, to confirm',
    checks: [
      'Planter positions agreed with the market operator and events team.',
      'Planters on pallet-lift bases so they can be moved.',
      'A watering arrangement (contractor or volunteers with a bowser).',
    ],
    partners: ['Market operator', 'Town centre businesses (planter sponsorship)'],
    options: [
      {
        id: 'four', name: 'Four large planters', scheme: 'summer',
        summary: 'Four moveable planters near the corners of the square with seasonal bedding: bulbs in spring, bedding in summer.',
        maintenance: 1, impact: 1, wildlife: 0,
        shapes: [
          { kind: 'planter', x: -13, z: -9, r: 1.5, h: 0.75, material: 'stone' },
          { kind: 'planter', x: 8, z: 12, r: 1.5, h: 0.75, material: 'stone' },
          { kind: 'planter', x: -17, z: 6, r: 1.5, h: 0.75, material: 'stone' },
          { kind: 'planter', x: 12, z: -3, r: 1.5, h: 0.75, material: 'stone' },
        ],
        capital: ['planterLarge'], annual: ['planterLargeCare'],
      },
      {
        id: 'centrepiece', name: 'Centrepiece and four planters', scheme: 'summer',
        summary: 'Adds a tiered centrepiece in the middle of the square: a showpiece for judging day. It is the most expensive option to run.',
        maintenance: 2, impact: 2, wildlife: 0,
        shapes: [
          { kind: 'planter', x: -3, z: 2, r: 2.8, h: 0.9, tiers: 2, material: 'stone', counts: false },
          { kind: 'planter', x: -13, z: -9, r: 1.5, h: 0.75, material: 'stone' },
          { kind: 'planter', x: 8, z: 12, r: 1.5, h: 0.75, material: 'stone' },
          { kind: 'planter', x: -17, z: 6, r: 1.5, h: 0.75, material: 'stone' },
          { kind: 'planter', x: 12, z: -3, r: 1.5, h: 0.75, material: 'stone' },
        ],
        capital: ['planterLarge', 'centrepiece'], annual: ['planterLargeCare', 'centrepieceCare'],
      },
    ],
  },
  {
    id: 'baskets',
    name: 'Town centre hanging baskets',
    street: 'High Street, Sun Street, Bucklersbury, Churchyard',
    role: 'centre',
    headline: 'The classic In Bloom look along the main shopping streets.',
    why: [
      'Colour at eye level on streets too narrow for beds.',
      'Businesses can sponsor baskets, which cuts the council’s share of the cost.',
      'One watering round covers the whole town centre.',
    ],
    owner: 'Lamp columns: Hertfordshire County Council (highways), to confirm',
    checks: [
      'Structural check and a permit for brackets on each lamp column.',
      'Minimum clear height over the footway (usually 2.6 m).',
      'A daily watering contract from June to September.',
    ],
    partners: ['Town centre businesses (sponsor a basket)', 'Watering contractor'],
    options: [
      {
        id: 'core', name: 'Core streets', scheme: 'summer',
        summary: 'Baskets on the lamp columns along High Street, Sun Street and the Churchyard.',
        maintenance: 2, impact: 2, wildlife: 0,
        shapes: [
          { kind: 'baskets', road: 'High Street', from: 8, to: 195, every: 18, offset: 4.4 },
          { kind: 'baskets', road: 'Sun Street', from: 8, to: 160, every: 18, offset: 4.4 },
          { kind: 'baskets', road: 'Churchyard', from: 6, to: 75, every: 14, offset: 3 },
        ],
        capital: ['basket', 'basketFit'], annual: ['basketPlanting', 'basketHang', 'basketWater'],
      },
      {
        id: 'circuit', name: 'Full town-centre circuit', scheme: 'summer',
        summary: 'Adds Bucklersbury and the south end of Bancroft, so the whole walking loop is covered.',
        maintenance: 2, impact: 2, wildlife: 0,
        shapes: [
          { kind: 'baskets', road: 'High Street', from: 8, to: 195, every: 18, offset: 4.4 },
          { kind: 'baskets', road: 'Sun Street', from: 8, to: 160, every: 18, offset: 4.4 },
          { kind: 'baskets', road: 'Churchyard', from: 6, to: 75, every: 14, offset: 3 },
          { kind: 'baskets', road: 'Bucklersbury', from: 8, to: 185, every: 18, offset: 4.4 },
          { kind: 'baskets', road: 'Bancroft', from: 8, to: 260, every: 22, offset: 5.4 },
        ],
        capital: ['basket', 'basketFit'], annual: ['basketPlanting', 'basketHang', 'basketWater'],
      },
    ],
  },
  {
    id: 'sun-street',
    name: 'Sun Street window boxes',
    street: 'Sun Street',
    role: 'centre',
    headline: 'A business-led scheme that costs the council very little.',
    why: [
      'Sun Street’s historic frontages sit right on the pavement, so there is no room for ground planting.',
      'Matching boxes make the whole street look cared for.',
    ],
    owner: 'Individual building owners and businesses',
    checks: [
      'Listed-building and conservation-area consent for fixings, where needed.',
      'Businesses sign up to plant and water their own boxes.',
    ],
    partners: ['Sun Street businesses', 'Local business network'],
    options: [
      {
        id: 'matched', name: 'Matching boxes, business-planted', scheme: 'summer',
        summary: 'The bid pays for the boxes and coordination. Each business plants and waters its own.',
        maintenance: 1, impact: 1, wildlife: 0,
        shapes: [{ kind: 'windowboxes', road: 'Sun Street', from: 0, to: 165 }],
        capital: ['windowBox', 'coordination'], annual: [],
      },
    ],
  },
  {
    id: 'hermitage-road',
    name: 'Hermitage Road planters',
    street: 'Hermitage Road',
    role: 'centre',
    headline: 'Green up the town’s café and evening street.',
    why: [
      'Planters soften the edge of the traffic and suit outdoor seating.',
      'Perennials and bulbs keep running costs low compared with bedding.',
    ],
    owner: 'Footway: Hertfordshire County Council (highways), to confirm',
    checks: [
      'Highways licence for objects on the footway; keep at least 1.5 m clear for pedestrians.',
      'Away from dropped kerbs, crossings and bus stops.',
    ],
    partners: ['Hermitage Road cafés and restaurants (planter adoption)'],
    options: [
      {
        id: 'perennial', name: 'Perennial planters', scheme: 'perennial',
        summary: 'Timber planters outside café frontages, planted with long-flowering perennials and bulbs.',
        maintenance: 0, impact: 1, wildlife: 1,
        shapes: [{ kind: 'along', road: 'Hermitage Road', from: 14, to: 200, every: 22, offset: 5.3, sides: 'both', w: 2.6, d: 0.9, h: 0.65, material: 'timber' }],
        capital: ['planterTimber'], annual: ['planterTimberCare'],
      },
      {
        id: 'lavender', name: 'Scented lavender planters', scheme: 'lavender',
        summary: 'The same planters filled with lavender and catmint. Scented, loved by bees, and very low water.',
        maintenance: 0, impact: 1, wildlife: 2,
        shapes: [{ kind: 'along', road: 'Hermitage Road', from: 14, to: 200, every: 22, offset: 5.3, sides: 'both', w: 2.6, d: 0.9, h: 0.65, material: 'timber' }],
        capital: ['planterTimber'], annual: ['planterTimberCare'],
      },
    ],
  },
  {
    id: 'bridge-street',
    name: 'Bridge Street bridge',
    street: 'Bridge Street',
    role: 'gateway',
    headline: 'Mark the crossing of the River Hiz into the old town.',
    why: ['A natural gateway into the old town, seen from the road and from the riverside.'],
    owner: 'Bridge: Hertfordshire County Council (highways), to confirm',
    checks: ['Structural approval for trough fixings on the parapets.', 'Nothing may drip or drain into the river.'],
    partners: ['Watering contractor (same round as the baskets)'],
    options: [
      {
        id: 'troughs', name: 'Parapet troughs', scheme: 'summer',
        summary: 'Troughs along both parapets with trailing summer planting.',
        maintenance: 1, impact: 1, wildlife: 0,
        shapes: [{ kind: 'troughs', bridge: 'Bridge Street' }],
        capital: ['trough'], annual: ['troughCare'],
      },
      {
        id: 'perennial', name: 'Trailing perennials', scheme: 'perennial',
        summary: 'The same troughs with tough perennials, which need watering far less often.',
        maintenance: 0, impact: 1, wildlife: 1,
        shapes: [{ kind: 'troughs', bridge: 'Bridge Street' }],
        capital: ['trough'], annual: ['troughCare'],
      },
    ],
  },
  {
    id: 'gateway',
    name: 'Hitchin Hill roundabout',
    street: 'London Road / Stevenage Road / Park Way',
    role: 'gateway',
    headline: 'The main arrival point from the south.',
    why: [
      'Most drivers arriving from the south pass here, so it sets a first impression.',
      'Roundabout sponsorship can pay for most of the running cost.',
    ],
    owner: 'Hertfordshire County Council (highways), to confirm',
    checks: [
      'Highways licence, and traffic management for every visit (the main running cost).',
      'Keep planting low near the edges for sightlines.',
    ],
    partners: ['Roundabout sponsor (local business)'],
    options: [
      {
        id: 'perennial', name: 'Low perennial ring', scheme: 'perennial',
        summary: 'A ring of low perennials with bulbs underneath. Only a few maintenance visits a year, so traffic management costs stay down.',
        maintenance: 0, impact: 1, wildlife: 1,
        shapes: [{ kind: 'ring', c: [228, 733], r0: 7, r1: 15 }],
        capital: ['perennialPlant', 'sign'], annual: ['perennialCare', 'trafficMgmt'],
      },
      {
        id: 'bulbs', name: 'Bulb and wildflower island', scheme: 'bulbs',
        summary: 'Bulbs planted into the existing grass, with the mowing relaxed until June. The cheapest option.',
        maintenance: 0, impact: 0, wildlife: 1,
        shapes: [{ kind: 'meadow', c: [228, 733], r: 15 }],
        capital: ['bulbs'], annual: ['trafficMgmt'],
      },
    ],
  },
  {
    id: 'station',
    name: 'Station Approach',
    street: 'Station Approach',
    role: 'gateway',
    headline: 'The first thing rail visitors see of Hitchin.',
    why: ['Thousands of people use the station every day.', 'A partner-led site: the station operator may fund or co-fund it.'],
    owner: 'Railway land (station operator / Network Rail), to confirm',
    checks: ['Agreement with the station operator on locations and upkeep.'],
    partners: ['Station operator', 'Community rail volunteers'],
    options: [
      {
        id: 'planters', name: 'Welcome planters', scheme: 'perennial',
        summary: 'A row of timber planters with perennials and bulbs along the approach.',
        maintenance: 0, impact: 1, wildlife: 1,
        shapes: [{ kind: 'along', road: 'Station Approach', from: 6, to: 160, every: 18, offset: 5, sides: 'both', w: 2.4, d: 1, h: 0.6, material: 'timber' }],
        capital: ['planterTimber'], annual: ['planterTimberCare'],
      },
    ],
  },
  {
    id: 'river-hiz',
    name: 'River Hiz banks',
    street: 'River Hiz, Bridge Street to Portmill Lane',
    role: 'green',
    headline: 'A wildflower corridor along the town’s chalk stream.',
    why: [
      'The river runs through the middle of town but is easy to miss.',
      'Native wildflower margins support pollinators and help hold the banks.',
      'Scores strongly on the environmental side of In Bloom judging.',
    ],
    owner: 'Riverside land owners (council and private), to confirm',
    checks: [
      'Chalk streams are sensitive: native species only, no fertiliser.',
      'Works near a main river may need an Environment Agency permit.',
    ],
    partners: ['Local wildlife and river volunteer groups'],
    options: [
      {
        id: 'margins', name: 'Native wildflower margins', scheme: 'wildflower',
        summary: 'Plug-planted native wildflower strips on both banks, cut once a year.',
        maintenance: 0, impact: 1, wildlife: 2,
        shapes: [{ kind: 'strip', river: true, fromAt: [58, 207], toAt: [200, -128], o0: 3.6, o1: 7, sides: 'both', meadow: true }],
        capital: ['meadowPlugs'], annual: ['meadowCut'],
      },
    ],
  },
  {
    id: 'bancroft-gardens',
    name: 'Bancroft Gardens',
    street: 'Bancroft Gardens',
    role: 'green',
    headline: 'A formal showpiece bed in the town’s formal gardens.',
    why: ['Judges and photographers expect a formal display in the main gardens.', 'Good footfall from Bancroft and the splash park.'],
    owner: 'North Hertfordshire District Council (parks), to confirm',
    checks: ['Agree the location with the parks team, away from events space.'],
    partners: ['Council parks team', 'Sponsor for the bed'],
    options: [
      {
        id: 'perennial', name: 'Perennial showpiece', scheme: 'perennial',
        summary: 'A round bed of long-flowering perennials. Looks good from May to October for a fraction of the running cost of bedding.',
        maintenance: 1, impact: 1, wildlife: 1,
        shapes: [{ kind: 'carpet', c: [262, -600], r: 10, bands: 5 }],
        capital: ['perennialPlant', 'bedPrep'], annual: ['perennialCare'],
      },
      {
        id: 'carpet', name: 'Traditional carpet bed', scheme: 'summer',
        summary: 'Rings of summer bedding in the classic municipal style. The biggest wow on judging day, and the most expensive to run.',
        maintenance: 2, impact: 2, wildlife: 0,
        shapes: [{ kind: 'carpet', c: [262, -600], r: 10, bands: 5 }],
        capital: ['bedPrep'], annual: ['bedding'],
      },
    ],
  },
  {
    id: 'st-marys',
    name: "St Mary's churchyard",
    street: 'St Mary’s Church',
    role: 'green',
    headline: 'Spring colour around Hertfordshire’s largest parish church.',
    why: ['A major visitor attraction next to Market Place.', 'Bulbs come back every year with almost no upkeep.'],
    owner: "St Mary's Church (parochial church council)",
    checks: ['Permission from the church; no digging near graves or memorials.'],
    partners: ["St Mary's Church", 'Community planting day'],
    options: [
      {
        id: 'bulbs', name: 'Bulb drifts in the grass', scheme: 'bulbs',
        summary: 'Naturalised crocus and daffodil drifts in the lawn along the south side.',
        maintenance: 0, impact: 1, wildlife: 1,
        shapes: [{ kind: 'meadow', c: [110, -24], r: 13 }, { kind: 'meadow', c: [80, -30], r: 9 }],
        capital: ['bulbs'], annual: [],
      },
      {
        id: 'border', name: 'Spring border', scheme: 'spring',
        summary: 'A cultivated border of tulips and spring bulbs along the nave.',
        maintenance: 1, impact: 1, wildlife: 0,
        shapes: [{ kind: 'poly', pts: [[93.7, -42.7], [128.2, -34.3], [127.5, -31.4], [93.0, -39.8]] }],
        capital: ['bedPrep'], annual: ['bedding'],
      },
    ],
  },
  {
    id: 'town-hall',
    name: 'Town Hall',
    street: 'Brand Street',
    role: 'centre',
    headline: 'A welcoming civic frontage.',
    why: ['Weddings, concerts and civic events all start here.'],
    owner: 'North Hertfordshire District Council, to confirm',
    checks: ['Keep the entrance and ramp clear.'],
    partners: ['Town Hall management'],
    options: [
      {
        id: 'beds', name: 'Two raised entrance beds', scheme: 'perennial',
        summary: 'Stone-faced raised beds either side of the entrance, with perennials.',
        maintenance: 1, impact: 1, wildlife: 1,
        shapes: [{ kind: 'frontbeds', near: [-50, -225], road: 'Brand Street' }],
        capital: ['raisedBed', 'perennialPlant'], annual: ['perennialCare'],
      },
    ],
  },
  {
    id: 'butts-close',
    name: 'Butts Close',
    street: 'Butts Close',
    role: 'green',
    headline: 'Community bulb planting on the historic common.',
    why: ['A big open space: bulbs cost little and spread every year.', 'An easy win for community involvement.'],
    owner: 'North Hertfordshire District Council, to confirm',
    checks: ['Check for any restrictions on digging on the common (e.g. archaeology or common-land rules).', 'Keep the fair and event areas clear.'],
    partners: ['Community planting day', 'Local schools'],
    options: [
      {
        id: 'bulbs', name: 'Bulb drifts', scheme: 'bulbs',
        summary: 'Four large drifts of crocus and daffodils, planted by volunteers.',
        maintenance: 0, impact: 1, wildlife: 1,
        shapes: [
          { kind: 'meadow', c: [-280, -520], r: 20, within: 'Butts Close' },
          { kind: 'meadow', c: [-220, -560], r: 16, within: 'Butts Close' },
          { kind: 'meadow', c: [-330, -600], r: 15, within: 'Butts Close' },
          { kind: 'meadow', c: [-200, -620], r: 13, within: 'Butts Close' },
        ],
        capital: ['bulbs'], annual: [],
      },
    ],
  },
];

// Streets whose lamp columns carry the hanging baskets (props skip their own lamps there)
export const BASKET_STREETS = new Set(SITES.flatMap((s) => s.options.flatMap((o) => o.shapes.filter((sh) => sh.kind === 'baskets').map((sh) => sh.road))));

// Landmarks labelled on the map
export const PLACE_LABELS = [
  { text: 'Market Place', at: [-8, -30] },
  { text: "St Mary's Church", at: [105, -80] },
  { text: 'River Hiz', at: [171, -50] },
  { text: 'Windmill Hill', at: [480, -10] },
  { text: 'Bancroft Gardens', at: [310, -640] },
  { text: 'Butts Close', at: [-260, -470] },
  { text: 'Hitchin Priory', at: [-15, 300] },
  { text: 'Priory Park', at: [-20, 470] },
  { text: 'British Schools Museum', at: [215, 165] },
  { text: 'Town Hall', at: [-50, -245] },
  { text: 'Hitchin Library', at: [-198, -90] },
  { text: 'Hitchin Station', at: [1000, -690] },
];

// Cost of one option, given quantities measured from the model and the delivery model
// ('volunteer' or 'contractor'). Returns paid costs and volunteer hours.
export function costOf(option, measured, model = 'volunteer') {
  const lines = (keys) => keys.map((k) => {
    const r = RATES[k];
    const qty = r.q === 'area' ? measured.area : r.q === 'units' ? measured.units : r.q;
    const byVolunteers = model === 'volunteer' && r.vol > 0;
    const lo = (r.mat[0] + (byVolunteers ? 0 : r.lab[0])) * qty, hi = (r.mat[1] + (byVolunteers ? 0 : r.lab[1])) * qty;
    return { label: r.label, qty, kind: r.q === 'area' || r.q === 'units' ? r.q : 'fixed', lo, hi, hours: byVolunteers ? r.vol * qty : 0, byVolunteers, paidLabour: !byVolunteers && r.lab[1] > 0 };
  });
  const capital = lines(option.capital), annual = lines(option.annual);
  const sum = (ls) => ls.reduce((a, l) => [a[0] + l.lo, a[1] + l.hi], [0, 0]);
  const hrs = (ls) => ls.reduce((a, l) => a + l.hours, 0);
  return { capital, annual, capitalTotal: sum(capital), annualTotal: sum(annual), setupHours: hrs(capital), yearHours: hrs(annual) };
}

// Judging criteria (RHS Britain in Bloom standard marking sheet, used by Anglia in Bloom)
export const JUDGING = {
  pillars: [
    { id: 'horticulture', name: 'Horticultural achievement', marks: 40, detail: 'Impact, design, plant choice and special features (20). Cultivation, maintenance, plant quality, sustainability and new planting (20). Judged year-round, including natural areas.' },
    { id: 'environment', name: 'Environmental responsibility', marks: 30, detail: 'Biodiversity and wildlife, saving water, peat-free growing, recycling and composting, and care of the local environment: litter, graffiti, fly-posting, street furniture and heritage.' },
    { id: 'community', name: 'Community participation', marks: 30, detail: 'Volunteers, schools, businesses and residents involved throughout the year, not just in summer, and people along the route who can tell the judges about their projects.' },
  ],
  medals: [['Gold', 85], ['Silver-gilt', 75], ['Silver', 60], ['Bronze', 50]],
  checklist: [
    { pillar: 'community', text: 'A year-round calendar: bulb planting in autumn, litter picks in winter, planting days in spring, with photos and press cuttings as evidence.' },
    { pillar: 'community', text: 'Volunteers, school children and business owners waiting at stops on the route to explain their part.' },
    { pillar: 'community', text: 'Businesses sponsoring baskets and planters, and a best-dressed shop window award to bring the high street in.' },
    { pillar: 'environment', text: 'Peat-free compost throughout, water butts and a rainwater bowser, and bedding and prunings composted.' },
    { pillar: 'environment', text: 'Wildlife features judges can see: meadow areas, bug hotels, bird and bat boxes, the River Hiz margins.' },
    { pillar: 'environment', text: 'A clean route: litter, graffiti and fly-posting cleared, and tired benches, bins and signs repainted before judging week.' },
    { pillar: 'horticulture', text: 'Plants at their peak in the July judging window, well weeded, deadheaded and watered, with no gaps or dead baskets.' },
    { pillar: 'horticulture', text: 'Right plant, right place: drought-tolerant perennials where watering is hard, and showpiece bedding only where people gather.' },
    { pillar: 'horticulture', text: 'One or two special features judges will remember, such as the Windmill Hill lavender and a Market Place centrepiece.' },
    { pillar: 'community', text: 'Clear judges’ briefing notes (Anglia in Bloom uses these instead of a portfolio) and a well-timed route with room for questions.' },
    { pillar: 'environment', text: 'Enter special awards too, e.g. parks (Bancroft Gardens, Windmill Hill) and the churchyard.' },
  ],
  sources: [
    ['RHS Britain in Bloom standard marking sheet', 'https://www.rhs.org.uk/get-involved/britain-in-bloom/resources/standard-marking-sheet'],
    ['RHS judging guidelines', 'https://www.rhs.org.uk/communities/archive/pdf/exhibitor-info/1bjudging-guidelines.pdf'],
    ['Anglia in Bloom campaign details', 'https://www.angliainbloom.co.uk/campaign-details'],
    ['Anglia in Bloom 2025 results', 'https://www.angliainbloom.co.uk/2025-results'],
    ['Dunstable, Anglia in Bloom overall winner 2025', 'https://www.lutontoday.co.uk/community/dunstable-crowned-2025-anglia-in-bloom-overall-winner-and-multiple-category-successes-5307521'],
    ['RHS community group insurance', 'https://www.rhs.org.uk/get-involved/community-gardening/resources/group-insurance'],
  ],
};
