// Ethiopian Market Vehicle Options — Country Standard

export const MANUFACTURERS = [
  'Toyota','Hyundai','Kia','BYD','Chery','Suzuki','Nissan',
  'Mitsubishi','Volkswagen','Mercedes-Benz','BMW','Great Wall',
  'Lifan','Geely','Honda','Ford','Isuzu','Land Rover','Peugeot',
  'Renault','Volvo','Audi','Lexus','Mazda','Subaru','Jetour','Haval'
];

export const BODY_TYPES = [
  { value: 'SEDAN', label: 'Sedan' },
  { value: 'SUV', label: 'SUV / Crossover' },
  { value: 'HATCHBACK', label: 'Hatchback' },
  { value: 'PICKUP', label: 'Pickup Truck' },
  { value: 'VAN', label: 'Van / Cargo' },
  { value: 'MINIBUS', label: 'Minibus' },
  { value: 'COUPE', label: 'Coupe / Sport' },
  { value: 'WAGON', label: 'Station Wagon' },
];

export const COLORS = [
  'White','Black','Silver','Gray','Red','Blue','Green',
  'Gold','Beige','Brown','Orange','Burgundy','Navy','Pearl White'
];

export const PLATE_CODES = [
  { value: 'CODE_1', label: 'Code 1 — Government' },
  { value: 'CODE_2', label: 'Code 2 — Private / Residential' },
  { value: 'CODE_3', label: 'Code 3 — Commercial' },
  { value: 'CODE_4', label: 'Code 4 — Taxi / Public Transport' },
  { value: 'CODE_5', label: 'Code 5 — Diplomatic / Organization' },
  { value: 'DUTY_FREE', label: 'Bank-Financed' },
  { value: 'NO_PLATE', label: 'No Plate' },
];

export const FUEL_TYPES = [
  { value: 'PETROL', label: 'Petrol (Benzine)' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'ELECTRIC', label: 'Full Electric (EV)' },
];

export const TRANSMISSIONS = [
  { value: 'AUTOMATIC', label: 'Automatic' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'CVT', label: 'CVT' },
  { value: 'DCT', label: 'Dual Clutch (DCT)' },
];

export const DRIVE_TYPES = [
  { value: 'FWD', label: '2WD — Front' },
  { value: 'RWD', label: '2WD — Rear' },
  { value: '4WD', label: '4WD' },
  { value: 'AWD', label: 'AWD' },
];

export const SOFTWARE_LANGUAGES = [
  { value: 'ENGLISH', label: 'English' },
  { value: 'CHINESE', label: 'Chinese' },
  { value: 'KOREAN', label: 'Korean' },
  { value: 'JAPANESE', label: 'Japanese' },
  { value: 'OTHER', label: 'Other' },
];

export const CHARGER_TYPES = [
  { value: 'GB_T', label: 'GB/T (China Standard)' },
  { value: 'TYPE_2', label: 'Type 2 (EU Standard)' },
  { value: 'CCS2', label: 'CCS2' },
  { value: 'NONE', label: 'No Charger / Unknown' },
];

export const PAYMENT_STATUSES = [
  { value: 'DUTY_PAID', label: 'Fully Paid' },
  { value: 'DUTY_FREE', label: 'Bank-Financed' },
  { value: 'PENDING', label: 'Payment Pending' },
];

export const LIBRE_STATUSES = [
  { value: 'CLEAN', label: 'Clean — Original in Hand' },
  { value: 'LOST', label: 'Lost — Replacement Pending' },
  { value: 'IN_TRANSFER', label: 'In Transfer Process' },
  { value: 'WITH_BANK', label: 'Original with Bank (Loan)' },
];

export const OWNER_COUNTS = [
  { value: '1ST', label: '1st Owner' },
  { value: '2ND', label: '2nd Owner' },
  { value: '3RD_PLUS', label: '3rd Owner or More' },
  { value: 'UNKNOWN', label: 'Unknown' },
];

export const ACCIDENT_HISTORY = [
  { value: 'NONE', label: 'No Accidents' },
  { value: 'MINOR', label: 'Minor — Cosmetic Only' },
  { value: 'MAJOR', label: 'Major — Structural Damage' },
  { value: 'UNKNOWN', label: 'Unknown' },
];

export const INSURANCE_STATUSES = [
  { value: 'COMPREHENSIVE', label: 'Active — Comprehensive' },
  { value: 'THIRD_PARTY', label: 'Active — Third Party Only' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'NONE', label: 'No Insurance' },
];

export const IMPORT_ORIGINS = [
  { value: 'LOCAL', label: 'Local (Ethiopian Market)' },
  { value: 'DUBAI', label: 'Dubai (UAE)' },
  { value: 'CHINA', label: 'China' },
  { value: 'JAPAN', label: 'Japan' },
  { value: 'USA', label: 'United States' },
  { value: 'EUROPE', label: 'Europe' },
  { value: 'KOREA', label: 'South Korea' },
  { value: 'OTHER', label: 'Other' },
];

export const ETHIOPIAN_CITIES = [
  'Addis Ababa','Dire Dawa','Adama (Nazret)','Hawassa','Bahir Dar',
  'Mekelle','Jimma','Gondar','Dessie','Bishoftu (Debre Zeit)',
  'Harar','Shashamane','Arba Minch','Hosaena','Woldia'
];
