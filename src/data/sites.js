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
};

export const SITE_TYPES = {
  bed: 'Flower bed',
  planters: 'Planters',
  windowboxes: 'Window boxes',
  baskets: 'Hanging baskets',
  troughs: 'Bridge troughs',
  meadow: 'Wildflower area',
  stripes: 'Lavender rows',
  carpet: 'Carpet bed',
};

// Shape vocabulary used by siteBuilder.js
//   { kind: 'poly', pts }                        soil bed
//   { kind: 'circle', c, r }                     round soil bed
//   { kind: 'ring', c, r0, r1 }                  ring-shaped bed
//   { kind: 'strip', road|river, from, to, o0, o1, sides } bed along a street
//   { kind: 'planter', x, z, r | w,d, h, rot }   container
//   { kind: 'along', road, from, to, every, offset, sides, w, d, h }  row of containers
//   { kind: 'windowboxes', road, from, to }      boxes under windows on a street
//   { kind: 'baskets', road, from, to, every, offset }  lamp-post baskets
//   { kind: 'troughs', bridge }                  on bridge parapets
//   { kind: 'frontbeds', near, road }            raised beds at a building entrance
//   { kind: 'meadow', pts | c,r }                sparse planting on grass
//   { kind: 'rows', pts, spacing }               lavender-field rows

export const SITES = [
  {
    id: 'market-place',
    name: 'Market Place planters',
    street: 'Market Place',
    type: 'planters',
    scheme: 'summer',
    care: 'High', water: 'Daily in summer',
    blurb: 'A tiered centrepiece and four smaller planters in the square, placed so they don’t get in the way on market days.',
    why: 'The heart of the town and the backdrop to the markets, the Christmas lights switch-on and the festival. The planters stand on their own, so they can be moved for events.',
    shapes: [
      { kind: 'planter', x: -3, z: 2, r: 2.8, h: 0.9, tiers: 2, material: 'stone' },
      { kind: 'planter', x: -13, z: -9, r: 1.5, h: 0.75, material: 'stone' },
      { kind: 'planter', x: 8, z: 12, r: 1.5, h: 0.75, material: 'stone' },
      { kind: 'planter', x: -17, z: 6, r: 1.5, h: 0.75, material: 'stone' },
      { kind: 'planter', x: 12, z: -3, r: 1.5, h: 0.75, material: 'stone' },
    ],
  },
  {
    id: 'churchyard-baskets',
    name: 'Churchyard hanging baskets',
    street: 'Churchyard',
    type: 'baskets',
    scheme: 'summer',
    care: 'High', water: 'Daily (self-watering liners recommended)',
    blurb: 'Hanging baskets on heritage lamp posts along the Churchyard lane between Market Place and St Mary’s.',
    why: 'Churchyard is a narrow, busy walking route with no room for beds on the ground. Baskets add colour at eye level and lead people towards the church.',
    shapes: [{ kind: 'baskets', road: 'Churchyard', from: 6, to: 75, every: 10, offset: 3 }],
  },
  {
    id: 'st-marys',
    name: "St Mary's spring border",
    street: 'St Mary’s Church',
    type: 'bed',
    scheme: 'spring',
    care: 'Low', water: 'Rain-fed after planting',
    blurb: 'A long bulb border along the south side of the nave, facing the Market Place side of the churchyard.',
    why: 'Hertfordshire’s largest parish church draws visitors from Easter onwards. Bulbs give a spring show with almost no maintenance, and they come back every year.',
    shapes: [
      { kind: 'poly', pts: [[93.7, -42.7], [128.2, -34.3], [127.5, -31.4], [93.0, -39.8]] },
      { kind: 'circle', c: [62, -50], r: 3.2 },
    ],
  },
  {
    id: 'sun-street',
    name: 'Sun Street window boxes',
    street: 'Sun Street',
    type: 'windowboxes',
    scheme: 'summer',
    care: 'Medium', water: 'Every other day, by businesses',
    blurb: 'Matching window boxes on the upper floors of the shopfronts along both sides of Sun Street.',
    why: 'Sun Street’s old buildings sit right on the pavement, so there is no room at ground level. A shared window-box scheme, perhaps sponsored by the shops, makes the whole street look looked-after.',
    shapes: [{ kind: 'windowboxes', road: 'Sun Street', from: 0, to: 165 }],
  },
  {
    id: 'bridge-street',
    name: 'Bridge Street troughs',
    street: 'Bridge Street',
    type: 'troughs',
    scheme: 'summer',
    care: 'Medium', water: 'Every other day',
    blurb: 'Troughs on both parapets where Bridge Street crosses the River Hiz.',
    why: 'This is where people cross the river into the old town. Trailing plants on the parapets show from the road and from the riverside.',
    shapes: [{ kind: 'troughs', bridge: 'Bridge Street' }],
  },
  {
    id: 'river-hiz',
    name: 'River Hiz pollinator banks',
    street: 'River Hiz',
    type: 'meadow',
    scheme: 'pollinator',
    care: 'Low', water: 'None once established',
    blurb: 'Wildflower strips along both banks of the Hiz as it runs past St Mary’s, from Bridge Street up to Portmill Lane.',
    why: 'A chalk stream through the middle of town. Native wildflowers on the banks feed pollinators, help hold the soil and keep the river looking natural rather than tidy.',
    shapes: [{ kind: 'strip', river: true, fromAt: [58, 207], toAt: [200, -128], o0: 3.6, o1: 8, sides: 'both', meadow: true }],
  },
  {
    id: 'windmill-hill',
    name: 'Windmill Hill lavender rows',
    street: 'Windmill Hill',
    type: 'stripes',
    scheme: 'lavender',
    care: 'Low', water: 'None once established',
    blurb: 'Rows of lavender across the west-facing slope of Windmill Hill, looking down on the town centre.',
    why: 'Hitchin was once famous for its lavender. Rows on the hillside can be seen from Queen Street and the old town, and they need very little looking after once established.',
    shapes: [{ kind: 'rows', pts: [[370, -95], [415, -105], [420, -50], [445, -30], [450, 10], [372, 6]], spacing: 2.4, within: 'Windmill Hill' }],
  },
  {
    id: 'hermitage-road',
    name: 'Hermitage Road café planters',
    street: 'Hermitage Road',
    type: 'planters',
    scheme: 'lavender',
    care: 'Medium', water: 'Twice a week',
    blurb: 'Timber planters along both pavements, lined up with the café and restaurant frontages.',
    why: 'Hermitage Road is the town’s evening and café street. Planters soften the edge of the traffic and give outdoor seating a garden feel, and scented lavender suits eating outside.',
    shapes: [{ kind: 'along', road: 'Hermitage Road', from: 14, to: 200, every: 16, offset: 5.3, sides: 'both', w: 2.6, d: 0.9, h: 0.65, material: 'timber' }],
  },
  {
    id: 'bancroft-verges',
    name: 'Bancroft kerbside beds',
    street: 'Bancroft',
    type: 'bed',
    scheme: 'pollinator',
    care: 'Low', water: 'Rain-fed',
    blurb: 'Long, narrow nectar-rich beds along the kerbs of Bancroft, under the avenue trees.',
    why: 'Bancroft is Hitchin’s widest street and already feels like an avenue. Planting along the kerbs turns a road people drive through into a place people notice.',
    shapes: [{ kind: 'strip', road: 'Bancroft', from: 60, to: 330, o0: 4.2, o1: 5.6, sides: 'both' }],
  },
  {
    id: 'bancroft-gardens',
    name: 'Bancroft Gardens carpet bed',
    street: 'Bancroft Gardens',
    type: 'carpet',
    scheme: 'summer',
    care: 'High', water: 'Daily in dry spells',
    blurb: 'A traditional round carpet bed of rings, one plant per ring: the showpiece for judging day.',
    why: 'The gardens are the natural home for a showpiece that judges and photographers will look for. Rings of one plant each make a bold pattern seen from the paths.',
    shapes: [{ kind: 'carpet', c: [262, -600], r: 10, bands: 5 }],
  },
  {
    id: 'town-hall',
    name: 'Town Hall entrance beds',
    street: 'Brand Street',
    type: 'bed',
    scheme: 'autumn',
    care: 'Medium', water: 'Weekly',
    blurb: 'A pair of raised stone beds either side of the Town Hall frontage on Brand Street.',
    why: 'Weddings, concerts and civic events all start here. Late-summer perennials look their best through the busy autumn events season.',
    shapes: [{ kind: 'frontbeds', near: [-50, -225], road: 'Brand Street' }],
  },
  {
    id: 'british-schools',
    name: 'British Schools cottage garden',
    street: 'Queen Street',
    type: 'bed',
    scheme: 'pollinator',
    care: 'Medium', water: 'Weekly in summer',
    blurb: 'Cottage-garden beds in front of the Victorian schoolrooms on Queen Street.',
    why: 'A heritage museum suits a cottage-garden look, and visiting school groups could help plant and look after it as a learning project.',
    shapes: [{ kind: 'frontbeds', near: [216, 180], road: 'Queen Street' }],
  },
  {
    id: 'gateway',
    name: 'Hitchin Hill roundabout',
    street: 'Hitchin Hill',
    type: 'bed',
    scheme: 'autumn',
    care: 'Medium', water: 'Weekly',
    blurb: 'A ring bed on the big roundabout where London Road, Stevenage Road and Park Way meet Hitchin Hill.',
    why: 'This is where most drivers arrive from the south, so first impressions count. Gateway planting tells visitors, and the judges, that the town cares before they have even parked.',
    shapes: [{ kind: 'ring', c: [228, 733], r0: 7, r1: 15 }],
  },
  {
    id: 'station',
    name: 'Station Approach welcome planters',
    street: 'Station Approach',
    type: 'planters',
    scheme: 'spring',
    care: 'Medium', water: 'Twice a week',
    blurb: 'A row of planters along Station Approach to greet people arriving by train.',
    why: 'Thousands of commuters and visitors pass through the station every day. It is the first thing rail visitors see of Hitchin.',
    shapes: [{ kind: 'along', road: 'Station Approach', from: 6, to: 160, every: 14, offset: 5, sides: 'both', w: 2.4, d: 1, h: 0.6, material: 'timber' }],
  },
  {
    id: 'butts-close',
    name: 'Butts Close bulb drifts',
    street: 'Butts Close',
    type: 'meadow',
    scheme: 'spring',
    care: 'Low', water: 'None',
    blurb: 'Drifts of bulbs spread naturally across the open common, planted by volunteers.',
    why: 'A big, open common where fairs and circuses have been held for centuries. Bulb drifts cost little, can be planted at community days and get bigger every year.',
    shapes: [
      { kind: 'meadow', c: [-280, -520], r: 24, within: 'Butts Close' },
      { kind: 'meadow', c: [-220, -560], r: 20, within: 'Butts Close' },
      { kind: 'meadow', c: [-330, -600], r: 18, within: 'Butts Close' },
      { kind: 'meadow', c: [-200, -620], r: 16, within: 'Butts Close' },
    ],
  },
];

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
