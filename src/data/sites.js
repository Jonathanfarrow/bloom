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
// bidding. Each line is [what, quantity, low £, high £] where quantity is
// 'area' (m², measured from the model), 'units' (containers counted from the
// model) or a fixed number.
// ---------------------------------------------------------------------------
export const RATES = {
  bedPrep: ['Bed preparation, soil and edging', 'area', 15, 30],
  bedding: ['Seasonal bedding, two plantings a year', 'area', 55, 85],
  perennialPlant: ['Perennial plants (6 per m²), mulch', 'area', 30, 50],
  perennialCare: ['Weeding, cutting back, top-up plants', 'area', 4, 8],
  lavenderPlant: ['Lavender (4 per m²), ground prep, mulch', 'area', 18, 28],
  lavenderCare: ['Late-summer trim and weeding', 'area', 2, 4],
  meadowSow: ['Ground preparation and native seed', 'area', 2, 5],
  meadowPlugs: ['Wildflower plug plants and seed', 'area', 8, 15],
  meadowCut: ['Annual cut and collect', 'area', 0.4, 1],
  bulbs: ['Bulbs (25 per m²), planted by volunteers', 'area', 4, 8],
  basket: ['Basket, liner, bracket fitting', 'units', 60, 110],
  basketCheck: ['Lamp-column structural check', 'units', 25, 50],
  basketCare: ['Planting and daily watering, one season', 'units', 90, 150],
  planterLarge: ['Large planter (1.2–1.5 m), delivered', 'units', 700, 1500],
  planterLargeCare: ['Two plantings a year and watering', 'units', 250, 450],
  planterTimber: ['Timber street planter, delivered', 'units', 350, 700],
  planterTimberCare: ['Perennial and bulb care, watering', 'units', 60, 120],
  trough: ['Parapet trough with fixings', 'units', 200, 400],
  troughCare: ['Planting and watering', 'units', 70, 120],
  windowBox: ['Matching window box, supplied to the business', 'units', 45, 80],
  raisedBed: ['Stone-faced raised bed', 'units', 1200, 2500],
  centrepiece: ['Tiered centrepiece planter', 1, 3000, 6000],
  centrepieceCare: ['Centrepiece planting and watering', 1, 700, 1100],
  trafficMgmt: ['Traffic management, 3 visits a year', 3, 250, 600],
  sign: ['Sponsor or interpretation sign', 1, 400, 900],
  coordination: ['Scheme coordination and publicity', 1, 300, 800],
};

export const ROLES = {
  flagship: 'Flagship',
  gateway: 'Gateway',
  centre: 'Town centre',
  green: 'Green space',
};

export const LEVEL = ['Low', 'Medium', 'High'];

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
        summary: 'A broad band of lavender rows across the upper west slope, facing the town. It can be planted in phases over two or three years.',
        maintenance: 0, impact: 2, wildlife: 2,
        shapes: [{ kind: 'rows', pts: [[376, -74], [406, -84], [414, -26], [384, -18]], spacing: 1.8, within: 'Windmill Hill' }],
        capital: ['lavenderPlant', 'sign'], annual: ['lavenderCare'],
      },
      {
        id: 'meadow', name: 'Wildflower slope', scheme: 'wildflower',
        summary: 'Sow the whole west slope as a native wildflower meadow, with mown paths through it. The lowest cost per square metre of any option, and the best for wildlife.',
        maintenance: 0, impact: 1, wildlife: 2,
        shapes: [{ kind: 'meadowpoly', pts: [[362, -100], [418, -112], [428, -46], [448, -26], [452, 12], [366, 8]], within: 'Windmill Hill', density: 0.8 }],
        capital: ['meadowSow', 'sign'], annual: ['meadowCut'],
      },
      {
        id: 'bulbs', name: 'Spring bulb drifts', scheme: 'bulbs',
        summary: 'Drifts of crocus and daffodils across the slope. A spring spectacle planted entirely by volunteers, with no running costs.',
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
        capital: ['basket', 'basketCheck'], annual: ['basketCare'],
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
        capital: ['basket', 'basketCheck'], annual: ['basketCare'],
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

// Cost of one option, given the quantities measured from the model
export function costOf(option, measured) {
  const lines = (keys) => keys.map((k) => {
    const [label, q, lo, hi] = RATES[k];
    const qty = q === 'area' ? measured.area : q === 'units' ? measured.units : q;
    return { label, qty, unit: q === 'area' ? 'm²' : q === 'units' ? '' : '', lo: lo * qty, hi: hi * qty, per: [lo, hi], kind: q };
  });
  const capital = lines(option.capital), annual = lines(option.annual);
  const sum = (ls) => ls.reduce((a, l) => [a[0] + l.lo, a[1] + l.hi], [0, 0]);
  return { capital, annual, capitalTotal: sum(capital), annualTotal: sum(annual) };
}
