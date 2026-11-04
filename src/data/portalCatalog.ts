import type {
  SareeGarment,
  DrapingStyle,
  JewellerySet,
  OccasionScene,
  SleeveStyle
} from '../types/portal';

export const SAREE_PORTAL_CATALOG: SareeGarment[] = [
  {
    id: 'banarasi-orange-gold',
    name: 'Vibrant Banarasi Katan Silk',
    fabric: 'Banarasi',
    origin: 'Varanasi, Uttar Pradesh',
    price: '₹34,500',
    description: 'As demonstrated in Sample 01: Radiant sunset orange silk with handwoven gold bullion zari border and rich floral kadhwa pallu.',
    primaryColor: '#D9531E',
    secondaryColor: '#E6A122',
    zariType: 'Pure Gold Zari',
    frontImage: '/sarees/saree_garment_cutout.png',
    backImage: '/sarees/saree_garment_clean.png',
    recommendedJewellery: 'temple',
    recommendedBlouseColor: '#800020'
  },
  {
    id: 'kanjeevaram-red',
    name: 'Kanjeevaram Royal Bridal Silk',
    fabric: 'Kanjeevaram',
    origin: 'Kanchipuram, Tamil Nadu',
    price: '₹48,000',
    description: 'Crimson vermillion heavy mulberry silk with korvai contrast temple border and pure gold dipped zari work.',
    primaryColor: '#9E1B2A',
    secondaryColor: '#E0A838',
    zariType: 'Temple Gold',
    frontImage: '/sarees/saree_red.png',
    backImage: '/sarees/looks/look_kanjeevaram-red.jpg',
    recommendedJewellery: 'temple',
    recommendedBlouseColor: '#0E3B2E'
  },
  {
    id: 'royal-banarasi',
    name: 'Midnight Navy Zardozi Silk',
    fabric: 'Silk',
    origin: 'Varanasi, Uttar Pradesh',
    price: '₹38,500',
    description: 'Deep midnight blue with metallic silver brocade booti, scallop zardozi pallu, and lustrous silk texture.',
    primaryColor: '#1A2A44',
    secondaryColor: '#C0C0C0',
    zariType: 'Silver Brocade',
    frontImage: '/sarees/saree_royal_blue.png',
    backImage: '/sarees/looks/look_royal-banarasi.jpg',
    recommendedJewellery: 'polki',
    recommendedBlouseColor: '#D4AF37'
  },
  {
    id: 'emerald-silk',
    name: 'Heritage Mysore Emerald Silk',
    fabric: 'Silk',
    origin: 'Mysuru, Karnataka',
    price: '₹29,000',
    description: 'Lustrous deep forest green silk featuring traditional rudraksha zari borders and featherlight fall.',
    primaryColor: '#0D472D',
    secondaryColor: '#E6A122',
    zariType: 'Gold Foil',
    frontImage: '/sarees/saree_emerald.png',
    backImage: '/sarees/looks/look_emerald-silk.jpg',
    recommendedJewellery: 'kundan',
    recommendedBlouseColor: '#9E1B2A'
  },
  {
    id: 'mustard-cotton',
    name: 'Chanderi Gold Mustard Cotton',
    fabric: 'Cotton',
    origin: 'Chanderi, Madhya Pradesh',
    price: '₹14,500',
    description: 'Breathable festive handspun cotton-silk blend with delicate antique gold border and lightweight comfort.',
    primaryColor: '#D49B28',
    secondaryColor: '#8C1D2F',
    zariType: 'Thread Work',
    frontImage: '/sarees/saree_mustard.png',
    backImage: '/sarees/looks/look_mustard-cotton.jpg',
    recommendedJewellery: 'oxidised',
    recommendedBlouseColor: '#1A2A44'
  },
  {
    id: 'pastel-georgette',
    name: 'Blush Georgette Chikankari',
    fabric: 'Georgette',
    origin: 'Lucknow, Uttar Pradesh',
    price: '₹22,000',
    description: 'Powder blush pure georgette embellished with delicate tonal threadwork, pearls, and fluid drape.',
    primaryColor: '#E29587',
    secondaryColor: '#F5D3C8',
    zariType: 'Sheer Matte',
    frontImage: '/sarees/saree_pink.png',
    backImage: '/sarees/looks/look_pastel-georgette.jpg',
    recommendedJewellery: 'pearl',
    recommendedBlouseColor: '#FFFFFF'
  }
];

export const DRAPING_STYLES: DrapingStyle[] = [
  {
    id: 'nivi',
    name: 'Nivi Drape',
    region: 'Andhra Pradesh / Pan-India',
    description: 'The timeless standard drape with 6-8 front knife pleats tucked into the waistband and pallu pleated over the left shoulder.',
    palluPlacement: 'Pleated or open over left shoulder falling to knee length at back',
    pleatStyle: 'Even, crisp front pleats tucked neatly below navel'
  },
  {
    id: 'gujarati',
    name: 'Gujarati (Seedha Pallu)',
    region: 'Gujarat & Rajasthan',
    description: 'Pleats are tucked in front, but the pallu is brought from the back over the right shoulder to showcase the rich zardozi border in front.',
    palluPlacement: 'Brought forward over right shoulder and fanned across bodice',
    pleatStyle: 'Pleats facing to the right'
  },
  {
    id: 'bengali',
    name: 'Bengali (Aathpoure)',
    region: 'West Bengal',
    description: 'Regal traditional drape without central pleats. The pallu is draped from left to right, then brought back over the right shoulder with ornamental keys.',
    palluPlacement: 'Double drape across back with right shoulder key-bunch accent',
    pleatStyle: 'Broad box pleats across the front'
  },
  {
    id: 'nauvari',
    name: 'Nauvari (Maharashtrian)',
    region: 'Maharashtra',
    description: 'Dhoti-style 9-yard pant drape tucked between the legs, offering warrior-queen elegance and unrestricted movement.',
    palluPlacement: 'Cross-chest drape tucked at the left waist',
    pleatStyle: 'Central back tuck (kashta) with trouser-like silhouette'
  },
  {
    id: 'kerala',
    name: 'Kerala Kasavu (Mundum Neriyathum)',
    region: 'Kerala',
    description: 'Two-piece ivory and gold drape worn tucked around the waist with the neriyathu draped diagonally over the left shoulder.',
    palluPlacement: 'Diagonal chest drape with crisp parallel gold kara lines',
    pleatStyle: 'Fan-pleated at the side waist'
  }
];

export const SLEEVE_DESIGNS: { id: SleeveStyle; name: string; description: string }[] = [
  { id: 'sleeveless', name: 'Sleeveless / Halter', description: 'Modern chic cut highlighting shoulder posture' },
  { id: 'cap', name: 'Cap Sleeve', description: 'Minimal 2-inch capped sleeve for subtle grace' },
  { id: 'elbow', name: 'Elbow-Length (Couture)', description: 'Royal Indian bridal cut extending just above the elbow' },
  { id: 'three-quarter', name: '3/4th Sleeve', description: 'Sophisticated vintage cut ending mid-forearm' },
  { id: 'full', name: 'Full Sleeve / Churidar', description: 'Regal full wrist length with snug wrist fit' },
  { id: 'puff', name: 'Puff Sleeve (Retro)', description: 'Gathered princess puff sleeve with contrast zari cuff' },
  { id: 'bell', name: 'Bell / Flared Sleeve', description: 'Flowing dramatic flare starting from mid-arm' }
];

export const CONTRAST_BLOUSE_SWATCHES = [
  { name: 'Matching Saree', hex: 'inherit', isMatching: true },
  { name: 'Couture Ruby Red', hex: '#8B0A1A' },
  { name: 'Royal Emerald Green', hex: '#0B472A' },
  { name: 'Midnight Navy', hex: '#0F1E36' },
  { name: 'Antique Metallic Gold', hex: '#CBA135' },
  { name: 'Burnt Marigold', hex: '#D97706' },
  { name: 'Wine Plum', hex: '#4A154B' },
  { name: 'Raw Ivory Silk', hex: '#FDFBF7' },
  { name: 'Pitch Velvet Black', hex: '#111111' }
];

export const JEWELLERY_SETS: JewellerySet[] = [
  {
    id: 'temple',
    name: 'Temple Nakshi Gold Set',
    category: 'South Indian Antique',
    description: '22K matte antique gold hand-carved with divine motifs, deep red cabochon rubies, and clustered pearls.',
    pieces: ['Choker with Goddess Lakshmi Pendant', 'Jhumka Earrings', 'Temple Maang Tikka', 'Kadas & Bangles'],
    swatchColor: '#D4AF37',
    accentColor: '#9E1B2A'
  },
  {
    id: 'kundan',
    name: 'Royal Rajasthani Kundan',
    category: 'North Indian Heritage',
    description: 'Foil-set glass stones encrusted on pure gold with vibrant green meenakari enameling on reverse.',
    pieces: ['Hasli Collar Necklace', 'Chandbali Earrings', 'Floral Mathapatti', 'Hathphool'],
    swatchColor: '#FFF8DC',
    accentColor: '#107C41'
  },
  {
    id: 'polki',
    name: 'Polki Uncut Diamonds',
    category: 'Nizam Mughal Haute Joaillerie',
    description: 'Raw uncut natural diamonds mounted in jadau setting with emerald drops and woven pearls.',
    pieces: ['Multi-Strand Haar', 'Emerald-Drop Earrings', 'Statement Borla', 'Diamond Kada'],
    swatchColor: '#E6E8FA',
    accentColor: '#0A5C36'
  },
  {
    id: 'kasu-mala',
    name: 'Traditional Kasu Mala',
    category: 'Kerala / Tamil Heritage',
    description: 'Classic auspicious gold coin garland string with micro-embossed Lakshmi emblems.',
    pieces: ['Double Layer Kasu Mala', 'Jimikki Kammal', 'Gold Netti Chutti', 'Valayal Bangles'],
    swatchColor: '#FFD700',
    accentColor: '#B8860B'
  },
  {
    id: 'pearl',
    name: 'Hyderabadi Basra Pearls',
    category: 'Nizami Aristocratic',
    description: 'Luminous natural cream pearls layered with antique filigree pendants and rose-cut stones.',
    pieces: ['Satlada 7-String Pearl Haar', 'Passa & Pearl Jhumkas', 'Pearl Kangan'],
    swatchColor: '#F5F5F0',
    accentColor: '#D4AF37'
  },
  {
    id: 'oxidised',
    name: 'Artisan Oxidised Silver',
    category: 'Contemporary Bohemian',
    description: 'Handcrafted blackened tribal silver with ghungroo bells and geometric mirror work.',
    pieces: ['Tribal Statement Choker', 'Heavy Jhumkas', 'Nose Pin (Nath)', 'Chunky Cuffs'],
    swatchColor: '#A8A9AD',
    accentColor: '#2B2B2B'
  }
];

export const OCCASION_SCENES: OccasionScene[] = [
  {
    id: 'original',
    name: 'Keep Original Photo Background',
    category: 'Sample 01 Pipeline',
    description: 'Preserves the exact room, office, or live environment of your uploaded photo with zero alteration.',
    lightingTone: 'Natural Ambient',
    previewColor: '#262626'
  },
  {
    id: 'mandap',
    name: 'Royal Wedding Mandap',
    category: 'Wedding Festive',
    description: 'Draped in golden marigolds, carved teakwood pillars, brass oil lamps (vilakku), and warm candlelit glow.',
    lightingTone: 'Warm 2800K Golden Hour',
    previewColor: '#78350F'
  },
  {
    id: 'palace-reception',
    name: 'Grand Palace Reception Hall',
    category: 'Evening Gala',
    description: 'High-vaulted arches with crystal chandeliers, polished Italian marble reflection, and soft royal velvet drapery.',
    lightingTone: 'Opulent Champagne Glow',
    previewColor: '#1E1B4B'
  },
  {
    id: 'temple',
    name: 'Heritage Temple Courtyard',
    category: 'Ritual & Traditional',
    description: 'Ancient granite stone carved corridors with morning temple mist and brass urlis floating with lotus petals.',
    lightingTone: 'Soft Morning Sunlight',
    previewColor: '#451A03'
  },
  {
    id: 'garden',
    name: 'Lush Botanical Garden',
    category: 'Daytime Outdoor',
    description: 'Sun-dappled tropical palm groves, blooming bougainvillea, and clean natural outdoor daylight.',
    lightingTone: 'Crisp Natural Daylight',
    previewColor: '#064E3B'
  },
  {
    id: 'studio',
    name: 'Haute Couture Minimal Studio',
    category: 'Vogue Editorial',
    description: 'Chic seamless warm taupe studio backdrop with soft diffused beauty dish lighting.',
    lightingTone: 'Neutral Studio 5000K',
    previewColor: '#27272A'
  }
];

export const SAMPLE_USER_MODELS = [
  {
    id: 'sample-01-office',
    name: 'Sample 01: Office Casual',
    description: 'Matches Sample 01 in documentation: Customer standing in everyday clothes in an office setting.',
    photoUrl: '/sarees/teal_zardozi_reference.jpg',
    gender: 'female',
    pose: 'Standing straight, front view'
  }
];
