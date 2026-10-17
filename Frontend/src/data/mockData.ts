import { CityLocation, WeatherDay, MapPOI, TaskItem, ChatMessage, ShelterResource, EvacuationRoute, SDGAlignment, HistoricalDisaster } from '../types';

export const CITIES: CityLocation[] = [
  {
    id: 'kolkata',
    name: 'Kolkata',
    region: 'West Bengal',
    country: 'India',
    lat: 22.5726,
    lng: 88.3639,
    coordinatesFormatted: '22.5726° N, 88.3639° E',
    population: 4496700,
    populationFormatted: '4,496,700',
    currentTemp: 31,
    currentWeather: 'Light Rain',
    tempRangeAvg: '28° / 35°C',
    forecastSummary: 'Rain likely',
    riskScore: 68,
    riskLevel: 'Orange',
    officialWarning: {
      agency: 'IMD',
      level: 'ORANGE WARNING',
      title: 'Heavy to Very Heavy Rainfall',
      validity: 'Valid: 24 Sep, 13:00 IST – 25 Sep, 13:00 IST',
      details: 'Severe cyclonic storm intensifying over North-West Bay of Bengal. Gale winds reaching 115-135 km/h along coastal West Bengal. Intense precipitation spells (120-200mm) expected in next 24 hours.'
    },
    operationalRisk: {
      score: 68,
      level: 'ORANGE',
      factors: [
        'Heavy rainfall forecast (140mm / 24hr)',
        'River discharge rising along Hooghly Basin',
        'High population exposure in Wards 17, 24, 58'
      ]
    },
    aiPreparednessBrief: {
      summary: 'Based on current forecasts and hydrological signals, there is a high chance of urban flooding in low-lying areas. Prepare additional shelter capacity and verify alternate transportation routes.',
      detailedPlan: [
        'Pre-position 18 de-watering pump units in Ward 17, Topsia, and Bidhannagar Sector V.',
        'Mandate 100% generator diesel refueling at Kolkata Medical College and SSKM Hospital.',
        'Activate 24-hour flood gate vigil at Circular Canal and Tolly Nullah sluices.',
        'Clear Kona Expressway and Eastern Metropolitan (EM) Bypass as designated green logistics corridors.'
      ],
      rationale: [
        'Copernicus Sentinel-1 SAR imagery shows Hooghly riverbank saturation at 94%.',
        'Global Flood Awareness System (GloFAS) predicts river discharge exceeding 5,800 m³/s.',
        'Historical analog matches Cyclone Amphan (May 2020) tidal surge amplification curve.'
      ]
    },
    evidenceQuality: {
      rating: 'HIGH',
      items: [
        { label: 'IMD warning available', available: true },
        { label: 'Current weather available', available: true },
        { label: '7-day forecast available', available: true },
        { label: 'Hydrological data available', available: true },
        { label: 'Population data available', available: true },
        { label: 'Resource data available', available: true },
        { label: 'Route data available', available: true }
      ],
      lastAssessment: '14:07 IST'
    }
  },
  {
    id: 'sundarbans',
    name: 'Sundarbans Biosphere',
    region: 'South 24 Parganas',
    country: 'India',
    lat: 21.9497,
    lng: 88.9468,
    coordinatesFormatted: '21.9497° N, 88.9468° E',
    population: 4120000,
    populationFormatted: '4,120,000',
    currentTemp: 29,
    currentWeather: 'Heavy Squalls',
    tempRangeAvg: '26° / 32°C',
    forecastSummary: 'Severe Cyclone',
    riskScore: 84,
    riskLevel: 'Red',
    officialWarning: {
      agency: 'IMD',
      level: 'RED WARNING',
      title: 'Very Severe Storm & Coastal Surge',
      validity: 'Valid: 24 Sep, 12:00 IST – 26 Sep, 08:00 IST',
      details: 'Storm surge of 3.5 to 4.5 meters expected during high tide. Total suspension of all ferry operations and estuarine navigation.'
    },
    operationalRisk: {
      score: 84,
      level: 'RED',
      factors: [
        'Earthen embankment breaches projected on Matla & Gosaba rivers',
        'Direct landfall trajectory within 35km radius',
        'Mangrove attenuation reduced on degraded southern spits'
      ]
    },
    aiPreparednessBrief: {
      summary: 'Immediate mandatory evacuation of 85,000 residents in Gosaba, Hingalganj, and Sagar Island to multi-hazard cyclone shelters.',
      detailedPlan: [
        'Deploy 8 NDRF speed rescue boat units along Bidyadhari river.',
        'Pre-position 10 tons of water purification tablets and solar communication beacons.'
      ],
      rationale: [
        'Tidal astronomical peak coincides with landfall zero hour.',
        'Soil liquefaction index along coastal mudflats at maximum criticality.'
      ]
    },
    evidenceQuality: {
      rating: 'HIGH',
      items: [
        { label: 'IMD warning available', available: true },
        { label: 'Current weather available', available: true },
        { label: '7-day forecast available', available: true },
        { label: 'Hydrological data available', available: true },
        { label: 'Population data available', available: true },
        { label: 'Resource data available', available: true },
        { label: 'Route data available', available: true }
      ],
      lastAssessment: '14:15 IST'
    }
  },
  {
    id: 'puri',
    name: 'Puri Coastal Belt',
    region: 'Odisha',
    country: 'India',
    lat: 19.8135,
    lng: 85.8312,
    coordinatesFormatted: '19.8135° N, 85.8312° E',
    population: 201100,
    populationFormatted: '201,100',
    currentTemp: 32,
    currentWeather: 'Cloudy, Gusty',
    tempRangeAvg: '27° / 34°C',
    forecastSummary: 'Squall Alert',
    riskScore: 52,
    riskLevel: 'Moderate',
    officialWarning: {
      agency: 'IMD',
      level: 'YELLOW WATCH',
      title: 'High Wave & Swell Surge',
      validity: 'Valid: 24 Sep, 10:00 IST – 26 Sep, 18:00 IST',
      details: 'Rough sea conditions. Fishermen advised not to venture into deep sea along and off Odisha coast.'
    },
    operationalRisk: {
      score: 52,
      level: 'YELLOW',
      factors: [
        'Sea swell waves reaching 3.2m',
        'Low pressure trough moving North-East',
        'Beach erosion near Swargadwar promenade'
      ]
    },
    aiPreparednessBrief: {
      summary: 'Maintain maritime vigilance, restrict beach tourism access, and test cyclone shelter power backups.',
      detailedPlan: [
        'Sound coastal siren network at 17:00 IST for fisherman recall.',
        'Activate ODRAF emergency command center at Puri collectorate.'
      ],
      rationale: [
        'Secondary feeder bands expected to cause 60-80mm rain.'
      ]
    },
    evidenceQuality: {
      rating: 'HIGH',
      items: [
        { label: 'IMD warning available', available: true },
        { label: 'Current weather available', available: true },
        { label: '7-day forecast available', available: true },
        { label: 'Hydrological data available', available: true },
        { label: 'Population data available', available: true },
        { label: 'Resource data available', available: true },
        { label: 'Route data available', available: true }
      ],
      lastAssessment: '13:50 IST'
    }
  }
];

export const WEATHER_FORECAST_DAYS: WeatherDay[] = [
  { day: 'Today', date: '24 Sep', high: 35, low: 28, rainProb: 80, condition: 'rain-heavy', temp: 31, rainfallMm: 45 },
  { day: 'Thu', date: '25 Sep', high: 34, low: 27, rainProb: 90, condition: 'storm', temp: 33, rainfallMm: 85 },
  { day: 'Fri', date: '26 Sep', high: 32, low: 26, rainProb: 80, condition: 'storm', temp: 32, rainfallMm: 72 },
  { day: 'Sat', date: '27 Sep', high: 31, low: 25, rainProb: 70, condition: 'rain-moderate', temp: 30, rainfallMm: 58 },
  { day: 'Sun', date: '28 Sep', high: 32, low: 26, rainProb: 60, condition: 'rain-light', temp: 32, rainfallMm: 35 },
  { day: 'Mon', date: '29 Sep', high: 33, low: 27, rainProb: 50, condition: 'cloudy-sun', temp: 33, rainfallMm: 18 },
  { day: 'Tue', date: '30 Sep', high: 34, low: 27, rainProb: 40, condition: 'sunny-rain', temp: 34, rainfallMm: 12 }
];

export const MAP_POIS: MapPOI[] = [
  { id: 'poi-1', name: 'Alipore Cyclone Shelter', type: 'shelter', x: 42, y: 55, capacity: 500, status: 'safe', details: 'Operational · Standby Gen 40kVA' },
  { id: 'poi-2', name: 'Bidhannagar High School Shelter', type: 'shelter', x: 68, y: 38, capacity: 300, status: 'safe', details: 'Dry storage, 180 capacity remaining' },
  { id: 'poi-3', name: 'Ward 17 Community Center', type: 'shelter', x: 52, y: 48, capacity: 200, status: 'at_risk', details: 'Flood perimeter alert <0.4m water ingress' },
  { id: 'poi-4', name: 'Kolkata Medical College', type: 'hospital', x: 50, y: 42, status: 'operational', details: 'Tertiary Trauma Ready · Level 1 EMS' },
  { id: 'poi-5', name: 'SSKM Super Specialty Hospital', type: 'hospital', x: 44, y: 58, status: 'operational', details: 'Emergency ICU backed up' },
  { id: 'poi-6', name: 'Lalbazar Police HQ', type: 'police', x: 48, y: 45, status: 'operational', details: 'Central Command & Communications' },
  { id: 'poi-7', name: 'Bhowanipore Fire & Rescue Station', type: 'fire', x: 45, y: 62, status: 'operational', details: '5 Inflatable Rescue Boats on trailer' },
  { id: 'poi-8', name: 'Dum Dum High Capacity Water Reservoir', type: 'water', x: 58, y: 22, status: 'safe', details: 'Filtered supply online: 120,000L' },
  { id: 'poi-9', name: 'Howrah Central Evacuation Hub', type: 'transport', x: 36, y: 46, status: 'operational', details: '35 Municipal buses staged' }
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Deploy 15,000 Sandbags along Hooghly Embankment (Ward 17)',
    department: 'Municipal Corp',
    priority: 'Critical',
    status: 'in_progress',
    ward: 'Ward 17',
    assignee: 'Eng. S. Chatterjee (PWD)',
    timeRemaining: '2.5 hrs left'
  },
  {
    id: 'task-2',
    title: 'Pre-position 22 High-Capacity De-watering Diesel Pumps',
    department: 'PWD Water Supply',
    priority: 'Critical',
    status: 'pending',
    ward: 'Ward 17 & Topsia',
    assignee: 'Pumps Div Team 3',
    timeRemaining: 'T-36h Target'
  },
  {
    id: 'task-3',
    title: 'Mobilize NDRF 2nd Battalion Team 4 to Bidhannagar Sector V',
    department: 'NDRF',
    priority: 'High',
    status: 'in_progress',
    ward: 'Bidhannagar',
    assignee: 'Cmdr. R. Verma',
    timeRemaining: 'En route (35 min)'
  },
  {
    id: 'task-4',
    title: 'Stock Cyclone Shelter 1 with 72-hr Rations & 5,000L Potable Water',
    department: 'Municipal Corp',
    priority: 'High',
    status: 'done',
    ward: 'Ward 84 / Alipore',
    assignee: 'Civil Supplies Dept',
    timeRemaining: 'Completed'
  },
  {
    id: 'task-5',
    title: 'Inspect Emergency Diesel Generators at Kolkata Medical College',
    department: 'Power Utility',
    priority: 'Critical',
    status: 'done',
    ward: 'Ward 40',
    assignee: 'CESC Grid Inspector',
    timeRemaining: 'Certified OK'
  },
  {
    id: 'task-6',
    title: 'Clear Silt Blockages from Circular Canal Sluice Gates',
    department: 'PWD Water Supply',
    priority: 'Medium',
    status: 'pending',
    ward: 'Dum Dum Canal Link',
    assignee: 'Irrigation & Waterways',
    timeRemaining: 'T-24h Target'
  }
];

export const SHELTERS: ShelterResource[] = [
  { id: 'sh-1', name: 'Cyclone Shelter 1 (Alipore Center)', distance: '1.2 km', capacity: 500, available: 320, status: 'Safe' },
  { id: 'sh-2', name: 'School Shelter 2 (Bidhannagar Model School)', distance: '2.8 km', capacity: 300, available: 180, status: 'Safe' },
  { id: 'sh-3', name: 'Community Hall 3 (Ward 17 Civic Hub)', distance: '4.5 km', capacity: 200, available: 90, status: 'At Risk' }
];

export const EVACUATION_ROUTES: EvacuationRoute[] = [
  { id: 'rt-1', title: 'Shelter 1 (Cyclone Shelter)', destination: 'Alipore Hub', distance: '4.3 km', estimatedTime: '12 min', riskStatus: 'Safe', details: 'Elevated roadway via AJC Bose Flyover. Completely clear.' },
  { id: 'rt-2', title: 'Shelter 2 (School Shelter)', destination: 'Bidhannagar', distance: '6.7 km', estimatedTime: '18 min', riskStatus: 'Moderate', details: 'EM Bypass link experiencing minor slow downs. Passable.' },
  { id: 'rt-3', title: 'Shelter 3 (Community Hall)', destination: 'Ward 17 North', distance: '8.9 km', estimatedTime: '26 min', riskStatus: 'Risky', details: 'Central Ave approaches have 0.45m pooling water. Heavy vehicles only.' }
];

export const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'system',
    senderName: 'ClimaGuard Verified Dispatch',
    text: 'Operations Dispatch Terminal initialized. Connected to River Sensor Grid (GloFAS), IMD Doppler Radar, and Municipal IoT water depth telemetry. All queries are answered with verified ground clearance data.',
    timestamp: '14:02 IST'
  },
  {
    id: 'msg-2',
    sender: 'officer',
    senderName: 'Officer K. Sen (EMS Unit 3)',
    text: 'Ambulance Unit 3 blocked at Park Circus Seven Point crossing. Request safe route to Kolkata Medical College with water clearance depth strictly under 0.30 meters.',
    timestamp: '14:05 IST'
  },
  {
    id: 'msg-3',
    sender: 'system',
    senderName: 'ClimaGuard Verified Dispatch',
    text: 'Verified Routing Generated for Ambulance Unit 3:',
    timestamp: '14:06 IST',
    verifiedRoute: {
      origin: 'Park Circus Seven Point',
      destination: 'Kolkata Medical College (Emergency Ward)',
      clearanceStatus: 'VERIFIED_CLEAR',
      waterDepth: '0.14m max (Dry along flyovers)',
      recommendedPath: 'Park Circus 4 No. Bridge -> AJC Bose Road Flyover -> Moulali Crossing -> APC Road -> College Street North Entrance.',
      waypoints: [
        'AJC Bose Flyover Ramp (ELEVATED - 0.0m flood)',
        'Moulali Underpass (BYPASS: take surface elevated lane)',
        'Sealdah Flyover connector (CLEARED by Police Escort)',
        'College Street Gate 2 (Clear 0.12m runoff)'
      ],
      sensorVerification: 'GloFAS Ward-48 Ultrasound Sensor ID: US-204 confirms 0.14m water level at 14:05 IST.',
      validityWindow: 'Confirmed passable for next 45 minutes until next tidal crest.'
    }
  }
];

export const SDG_ALIGNMENTS: SDGAlignment[] = [
  {
    id: 11,
    title: 'Sustainable Cities & Communities',
    badge: 'SDG 11.5',
    description: 'Significantly reduce the number of deaths and the number of people affected by water-related disasters and decrease economic losses.',
    progressPercentage: 94,
    targetMetric: '98.4% Population in Risk Zones evacuated to resilient cyclone shelters within 24h of T-48 threshold.',
    status: 'Compliant'
  },
  {
    id: 13,
    title: 'Climate Action & Early Warning',
    badge: 'SDG 13.1',
    description: 'Strengthen resilience and adaptive capacity to climate-related hazards and natural disasters across coastal urban deltas.',
    progressPercentage: 96,
    targetMetric: 'Anticipatory action triggered 48 hours in advance using verified Earth observation data provenance.',
    status: 'Accelerated'
  },
  {
    id: 14,
    title: 'Life Below Water',
    badge: 'SDG 14.2',
    description: 'Sustainably manage and protect marine and coastal ecosystems to avoid significant adverse impacts.',
    progressPercentage: 88,
    targetMetric: 'Sediment trap sluices activated to prevent Hooghly chemical run-off from contaminating estuarine fisheries.',
    status: 'On Track'
  },
  {
    id: 15,
    title: 'Life on Land & Mangrove Buffering',
    badge: 'SDG 15.5',
    description: 'Take urgent and significant action to reduce the degradation of natural habitats and halt the loss of biodiversity.',
    progressPercentage: 91,
    targetMetric: '420 km² Sundarbans mangrove bio-shield preserved, absorbing 42% of incoming cyclone wave kinetic energy.',
    status: 'Compliant'
  }
];

export const HISTORICAL_DISASTERS: HistoricalDisaster[] = [
  {
    id: 'cyclone-remal-2024',
    name: 'Cyclone Remal',
    date: '26–27 May 2024',
    year: 2024,
    category: 'Severe Cyclonic Storm (IMD)',
    hazardType: 'Severe Cyclonic Storm',
    peakGusts: '135 km/h',
    windSpeedMaxKmH: 135,
    stormSurge: '2.8m MSL',
    surgeHeightM: 2.8,
    impactedAreas: 'Kolkata, North & South 24 Parganas, Sundarbans, Howrah',
    inundatedWardsCount: 38,
    fatalities: '14 confirmed in West Bengal',
    displaced: '240,000 evacuated',
    economicDamage: '₹4,200 Crore ($510M USD)',
    description: 'Made landfall near Sagar Island and Khepupara. Severe municipal waterlogging in Kolkata Wards 17, 24, and 58. Sluice gates overflowed during high tide concurrent with 180mm rain.',
    lessonsApplied: [
      'Automated sluice gates on Tolly Nullah and Circular Canal',
      'Pre-positioned generator sets at 12 critical trauma hospitals',
      'Mandatory municipal tree-clearing rapid response battalions'
    ],
    satelliteTag: 'Sentinel-1 SAR Radar Track Ref: WB-2024-REMAL',
    severityColor: 'orange'
  },
  {
    id: 'cyclone-michaung-2023',
    name: 'Cyclone Michaung',
    date: '3–5 December 2023',
    year: 2023,
    category: 'Super Severe Cyclonic Storm (IMD)',
    hazardType: 'Severe Cyclonic Storm',
    peakGusts: '110 km/h',
    windSpeedMaxKmH: 110,
    stormSurge: '2.1m MSL',
    surgeHeightM: 2.1,
    impactedAreas: 'Coastal Andhra, Coastal West Bengal, Odisha Coast',
    inundatedWardsCount: 16,
    fatalities: '17 across East Coast',
    displaced: '90,000 evacuated',
    economicDamage: '₹3,100 Crore ($375M USD)',
    description: 'Heavy moisture convergence caused prolonged torrential rainfall along the Bay of Bengal coastline, inundating agricultural tracts and estuarine shrimp farms in the lower delta.',
    lessonsApplied: [
      'Smallholder farmer parametric insurance fast-track mechanism',
      'Telemetry integration with GloFAS river level sensors',
      'Drainage channel silt dredging schedule acceleration'
    ],
    satelliteTag: 'Copernicus Sentinel-2 Optical / IMD Radar ID: MCH-23',
    severityColor: 'amber'
  },
  {
    id: 'cyclone-yaas-2021',
    name: 'Cyclone Yaas',
    date: '26–28 May 2021',
    year: 2021,
    category: 'Very Severe Cyclonic Storm (Cat 3 Equivalent)',
    hazardType: 'Very Severe',
    peakGusts: '145 km/h',
    windSpeedMaxKmH: 145,
    stormSurge: '3.8m MSL (Spring Tide Confluence)',
    surgeHeightM: 3.8,
    impactedAreas: 'East Medinipur, Digha, Sagar Island, South 24 Parganas, Howrah',
    inundatedWardsCount: 52,
    fatalities: '20 in West Bengal & Odisha',
    displaced: '1,500,000 evacuated to shelters',
    economicDamage: '₹18,500 Crore ($2.25B USD)',
    description: 'Made landfall north of Dhamra port. Coincided with perigean spring tide ("Purna Chandra"), causing catastrophic saline water intrusion through 134 breached earthen embankments.',
    lessonsApplied: [
      'Geotextile-reinforced concrete embankments along vulnerable river bends',
      'Multi-purpose cyclone shelters equipped with solar micro-grids',
      '48-hour anticipatory parametric liquidity release protocol'
    ],
    satelliteTag: 'Copernicus Sentinel-1 SAR Embankment Breach Analysis 2021',
    severityColor: 'red'
  },
  {
    id: 'cyclone-amphan-2020',
    name: 'Super Cyclone Amphan',
    date: '16–21 May 2020',
    year: 2020,
    category: 'Super Cyclonic Storm / Cat 5 Basin Peak',
    hazardType: 'Super Cyclone',
    peakGusts: '185 km/h in Kolkata (260 km/h over Bay of Bengal)',
    windSpeedMaxKmH: 260,
    stormSurge: '5.2m MSL',
    surgeHeightM: 5.2,
    impactedAreas: 'Direct hit on Kolkata Metropolitan, Howrah, Hooghly, 24 Parganas',
    inundatedWardsCount: 112,
    fatalities: '98 fatalities in West Bengal',
    displaced: '4,400,000 impacted / displaced',
    economicDamage: '₹102,000 Crore ($13.8B USD)',
    description: 'The strongest cyclone to strike the Ganges Delta since 1737. Caused widespread power grid collapse, uprooted 15,000+ trees in Kolkata, submerged Netaji Subhash Chandra Bose Airport, and submerged 28% of the Sundarbans.',
    lessonsApplied: [
      'ClimaGuard T-48 Hours countdown and automated SMS broadcast protocol',
      'Underground electrical power cable conversions in high-density wards',
      'Satellite Earth observation bio-shield monitoring for Sundarbans preservation'
    ],
    satelliteTag: 'IMD Doppler Radar Kolkata & INSAT-3D Infrared Track: AMPHAN-20',
    severityColor: 'red'
  },
  {
    id: 'cyclone-bulbul-2019',
    name: 'Cyclone Bulbul',
    date: '5–11 November 2019',
    year: 2019,
    category: 'Very Severe Cyclonic Storm (Cat 2 Equivalent)',
    hazardType: 'Very Severe',
    peakGusts: '135 km/h',
    windSpeedMaxKmH: 135,
    stormSurge: '2.4m MSL',
    surgeHeightM: 2.4,
    impactedAreas: 'Sagar Island, Bakkhali, Kakdwip, South 24 Parganas',
    inundatedWardsCount: 29,
    fatalities: '14 in West Bengal',
    displaced: '465,000 evacuated',
    economicDamage: '₹23,800 Crore ($3.3B USD)',
    description: 'Made landfall at the Sundarbans National Park. The dense mangrove forest absorbed substantial cyclonic energy, saving Kolkata from catastrophic wind damage but severely devastating delta agriculture.',
    lessonsApplied: [
      'Mangrove Protection Layer mapping integrated as Tier-1 municipal defense',
      'Early harvesting warnings issued to paddy and betel-vine farmers',
      'Inter-agency communications between Coast Guard, IMD, and NDRF'
    ],
    satelliteTag: 'GEE Copernicus Sentinel-2 Biomass & Damage Survey 2019',
    severityColor: 'orange'
  },
  {
    id: 'cyclone-fani-2019',
    name: 'Extremely Severe Cyclone Fani',
    date: '26 April – 4 May 2019',
    year: 2019,
    category: 'Extremely Severe Cyclonic Storm (Cat 4 Equivalent)',
    hazardType: 'Extremely Severe',
    peakGusts: '215 km/h',
    windSpeedMaxKmH: 215,
    stormSurge: '5.0m MSL',
    surgeHeightM: 5.0,
    impactedAreas: 'Puri, Bhubaneswar, Cuttack, Coastal Odisha & Bengal periphery',
    inundatedWardsCount: 45,
    fatalities: '89 fatalities across region',
    displaced: '1,200,000 evacuated in 24 hours',
    economicDamage: '₹24,000 Crore ($3.4B USD)',
    description: 'One of the rarest April-May intense cyclones in the Bay of Bengal. Remarkable mass evacuation prevented tens of thousands of deaths, but telecommunication and water distribution was knocked out for weeks.',
    lessonsApplied: [
      'World-class mass evacuation corridor routing models',
      'Satellite-linked emergency operations chat for dispatch units',
      'Emergency water purification mobile trailers pre-deployed'
    ],
    satelliteTag: 'NASA MODIS Terra/Aqua & INSAT-3DR Rapid Scan: FANI-19',
    severityColor: 'red'
  },
  {
    id: 'cyclone-phailin-2013',
    name: 'Very Severe Cyclone Phailin',
    date: '4–14 October 2013',
    year: 2013,
    category: 'Very Severe Cyclonic Storm (Cat 5 Equivalent Peak)',
    hazardType: 'Extremely Severe',
    peakGusts: '215 km/h',
    windSpeedMaxKmH: 215,
    stormSurge: '3.5m MSL',
    surgeHeightM: 3.5,
    impactedAreas: 'Ganjam, Gopalpur, Chilika Lake, Southern Bengal coastline',
    inundatedWardsCount: 34,
    fatalities: '45 fatalities (massive reduction vs 1999)',
    displaced: '1,150,000 people moved to safe shelters',
    economicDamage: '₹26,000 Crore ($4.2B USD)',
    description: 'Prompted India’s largest peacetime evacuation operation in 23 years. Validated the life-saving impact of Doppler radar advance warnings and fortified coastal cyclone shelters.',
    lessonsApplied: [
      'Strict zero-casualty municipal mission standard',
      'Standardized Common Alerting Protocol (CAP) for cell sirens',
      'GIS mapping of high-density coastal demographic vulnerabilities'
    ],
    satelliteTag: 'NOAA AVHRR & Oceansat-2 Scatterometer Wind Vector: PHAILIN',
    severityColor: 'red'
  },
  {
    id: 'cyclone-aila-2009',
    name: 'Severe Cyclone Aila',
    date: '23–26 May 2009',
    year: 2009,
    category: 'Severe Cyclonic Storm (IMD)',
    hazardType: 'Severe Cyclonic Storm',
    peakGusts: '120 km/h',
    windSpeedMaxKmH: 120,
    stormSurge: '3.0m Tidal Bore',
    surgeHeightM: 3.0,
    impactedAreas: 'Sundarbans Biosphere, Hingalganj, Gosaba, Kolkata South',
    inundatedWardsCount: 65,
    fatalities: '149 in India, 190 in Bangladesh',
    displaced: '1,000,000+ marooned without potable water',
    economicDamage: '₹7,500 Crore ($1.6B USD)',
    description: 'While wind speeds were moderate (120 km/h), the storm struck during noon high tide, obliterating 400 km of delta mud embankments and marooning hundreds of island villages in seawater for months.',
    lessonsApplied: [
      'Elevation modeling requirement for all secondary evacuation hubs',
      'Water point resilience: Elevated tube-wells with sanitary berms',
      'Ecosystem-based climate adaptation (EbA) with mangrove replanting'
    ],
    satelliteTag: 'USGS Landsat & IRS-P6 AWiFS Post-Disaster Inundation Map: AILA',
    severityColor: 'orange'
  },
  {
    id: 'super-cyclone-1999',
    name: '1999 Odisha Super Cyclone',
    date: '25 October – 3 November 1999',
    year: 1999,
    category: 'Super Cyclonic Storm (BoB 05B / Cat 5)',
    hazardType: 'Super Cyclone',
    peakGusts: '260 km/h (Recorded before anemometer failed)',
    windSpeedMaxKmH: 260,
    stormSurge: '6.8m MSL',
    surgeHeightM: 6.8,
    impactedAreas: 'Paradip, Jagatsinghpur, Kendrapara, Bengal Estuary',
    inundatedWardsCount: 140,
    fatalities: '9,887 confirmed fatalities',
    displaced: '12,900,000 people severely impacted',
    economicDamage: '₹22,000 Crore ($4.5B USD in 1999 value)',
    description: 'The benchmark historical catastrophe of modern Indian disaster management history. A massive 6.8m storm wall swept up to 20 km inland, obliterating coastal villages. Led directly to the creation of the National Disaster Management Authority (NDMA) and early warning radar architecture.',
    lessonsApplied: [
      'Foundational catalyst for modern Indian early warning architecture',
      'Creation of the National Disaster Response Force (NDRF)',
      'Development of ClimaGuard baseline operational screening paradigms'
    ],
    satelliteTag: 'INSAT-1D Satellite Infrared & Historical Synoptic Chart 1999',
    severityColor: 'red'
  }
];
