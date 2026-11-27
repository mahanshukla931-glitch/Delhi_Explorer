export interface MetroStation {
  id: string;
  name: string;
  hindiName: string;
  line: string;
  lineColor: string;
  coordinates: [number, number]; // [lat, lng]
  isInterchange?: boolean;
  interchanges?: string[];
}

export interface MetroLine {
  id: string;
  name: string;
  color: string;
  routeCoordinates: [number, number][]; // Array of [lat, lng]
  stations: MetroStation[];
}

export const DELHI_METRO_LINES: MetroLine[] = [
  // 1. YELLOW LINE (Samaypur Badli -> Kashmere Gate -> Rajiv Chowk -> INA -> HUDA City Centre/Millennium City Centre)
  {
    id: "yellow-line",
    name: "Yellow Line (Line 2)",
    color: "#eab308", // Golden Yellow
    routeCoordinates: [
      [28.7456, 77.1354], // Samaypur Badli
      [28.7303, 77.1492], // Jahangirpuri
      [28.7145, 77.1645], // Adarsh Nagar
      [28.7032, 77.1856], // Azadpur
      [28.6948, 77.2052], // Model Town
      [28.6888, 77.2104], // GTB Nagar
      [28.6728, 77.2185], // Vishwavidyalaya
      [28.6675, 77.2285], // Kashmere Gate
      [28.6575, 77.2282], // Chandni Chowk
      [28.6508, 77.2272], // Chawri Bazar
      [28.6425, 77.2215], // New Delhi
      [28.6328, 77.2197], // Rajiv Chowk
      [28.6231, 77.2144], // Patel Chowk
      [28.6148, 77.2115], // Central Secretariat
      [28.6012, 77.2084], // Udyog Bhawan
      [28.5866, 77.2105], // Dilli Haat - INA
      [28.5705, 77.2125], // AIIMS
      [28.5585, 77.2075], // Green Park
      [28.5475, 77.2058], // Hauz Khas
      [28.5325, 77.1985], // Malviya Nagar
      [28.5205, 77.1855], // Saket
      [28.5015, 77.1695], // Qutab Minar
      [28.4815, 77.1425], // Chhatarpur
      [28.4615, 77.1085], // Sultanpur
      [28.4525, 77.0855], // Guru Dronacharya
      [28.4612, 77.0825], // Sikanderpur
      [28.4725, 77.0725], // MG Road
      [28.4655, 77.0625], // IFFCO Chowk
      [28.4595, 77.0725], // Millennium City Centre (HUDA City Centre)
    ],
    stations: [
      {
        id: "kashmere-gate-yellow",
        name: "Kashmere Gate",
        hindiName: "कश्मीरी गेट",
        line: "Yellow Line",
        lineColor: "#eab308",
        coordinates: [28.6675, 77.2285],
        isInterchange: true,
        interchanges: ["Red Line", "Violet Line"],
      },
      {
        id: "chandni-chowk-yellow",
        name: "Chandni Chowk",
        hindiName: "चाँदनी चौक",
        line: "Yellow Line",
        lineColor: "#eab308",
        coordinates: [28.6575, 77.2282],
      },
      {
        id: "new-delhi-yellow",
        name: "New Delhi Railway Station",
        hindiName: "नई दिल्ली रेलवे स्टेशन",
        line: "Yellow Line",
        lineColor: "#eab308",
        coordinates: [28.6425, 77.2215],
        isInterchange: true,
        interchanges: ["Airport Express Line"],
      },
      {
        id: "rajiv-chowk-yellow",
        name: "Rajiv Chowk (Connaught Place)",
        hindiName: "राजीव चौक",
        line: "Yellow Line",
        lineColor: "#eab308",
        coordinates: [28.6328, 77.2197],
        isInterchange: true,
        interchanges: ["Blue Line"],
      },
      {
        id: "central-secretariat-yellow",
        name: "Central Secretariat",
        hindiName: "केन्द्रीय सचिवालय",
        line: "Yellow Line",
        lineColor: "#eab308",
        coordinates: [28.6148, 77.2115],
        isInterchange: true,
        interchanges: ["Violet Line"],
      },
      {
        id: "dilli-haat-ina-yellow",
        name: "Dilli Haat - INA",
        hindiName: "दिल्ली हाट - आईएनए",
        line: "Yellow Line",
        lineColor: "#eab308",
        coordinates: [28.5866, 77.2105],
        isInterchange: true,
        interchanges: ["Pink Line"],
      },
      {
        id: "hauz-khas-yellow",
        name: "Hauz Khas",
        hindiName: "हौज़ खास",
        line: "Yellow Line",
        lineColor: "#eab308",
        coordinates: [28.5475, 77.2058],
        isInterchange: true,
        interchanges: ["Magenta Line"],
      },
      {
        id: "qutab-minar-yellow",
        name: "Qutab Minar",
        hindiName: "क़ुतुब मीनार",
        line: "Yellow Line",
        lineColor: "#eab308",
        coordinates: [28.5015, 77.1695],
      },
    ],
  },

  // 2. BLUE LINE (Dwarka Sector 21 -> Kirti Nagar -> Rajiv Chowk -> Mandi House -> Yamuna Bank -> Noida / Vaishali)
  {
    id: "blue-line",
    name: "Blue Line (Line 3 & 4)",
    color: "#2563eb", // Royal Blue
    routeCoordinates: [
      [28.5522, 77.0583], // Dwarka Sector 21
      [28.5722, 77.0652], // Dwarka Sector 9
      [28.5912, 77.0422], // Dwarka Mor
      [28.6195, 77.0682], // Janakpuri West
      [28.6385, 77.1122], // Rajouri Garden
      [28.6555, 77.1492], // Kirti Nagar
      [28.6505, 77.1652], // Shadipur
      [28.6442, 77.1902], // Karol Bagh
      [28.6365, 77.2052], // Ramakrishna Ashram Marg
      [28.6328, 77.2197], // Rajiv Chowk
      [28.6305, 77.2345], // Barakhamba Road
      [28.6255, 77.2385], // Mandi House
      [28.6225, 77.2485], // Pragati Maidan (Supreme Court)
      [28.6185, 77.2685], // Indraprastha
      [28.6225, 77.2885], // Yamuna Bank
      [28.6305, 77.3055], // Laxmi Nagar
      [28.6355, 77.3185], // Nirman Vihar
      [28.6385, 77.3385], // Preet Vihar
      [28.6255, 77.3755], // Anand Vihar ISBT
      [28.5705, 77.3255], // Botanical Garden (Noida branch)
      [28.5405, 77.3855], // Noida City Centre
    ],
    stations: [
      {
        id: "janakpuri-west-blue",
        name: "Janakpuri West",
        hindiName: "जनकपुरी पश्चिम",
        line: "Blue Line",
        lineColor: "#2563eb",
        coordinates: [28.6195, 77.0682],
        isInterchange: true,
        interchanges: ["Magenta Line"],
      },
      {
        id: "rajouri-garden-blue",
        name: "Rajouri Garden",
        hindiName: "राजौरी गार्डन",
        line: "Blue Line",
        lineColor: "#2563eb",
        coordinates: [28.6385, 77.1122],
        isInterchange: true,
        interchanges: ["Pink Line"],
      },
      {
        id: "karol-bagh-blue",
        name: "Karol Bagh",
        hindiName: "करोल बाग",
        line: "Blue Line",
        lineColor: "#2563eb",
        coordinates: [28.6442, 77.1902],
      },
      {
        id: "mandi-house-blue",
        name: "Mandi House",
        hindiName: "मंडी हाउस",
        line: "Blue Line",
        lineColor: "#2563eb",
        coordinates: [28.6255, 77.2385],
        isInterchange: true,
        interchanges: ["Violet Line"],
      },
      {
        id: "supreme-court-blue",
        name: "Supreme Court (Pragati Maidan)",
        hindiName: "सर्वोच्च न्यायालय",
        line: "Blue Line",
        lineColor: "#2563eb",
        coordinates: [28.6225, 77.2485],
      },
      {
        id: "anand-vihar-blue",
        name: "Anand Vihar ISBT",
        hindiName: "आनंद विहार",
        line: "Blue Line",
        lineColor: "#2563eb",
        coordinates: [28.6255, 77.3755],
        isInterchange: true,
        interchanges: ["Pink Line", "Indian Railways Terminal"],
      },
    ],
  },

  // 3. RED LINE (Rithala -> Netaji Subhash Place -> Kashmere Gate -> Dilshad Garden -> Shaheed Sthal Ghaziabad)
  {
    id: "red-line",
    name: "Red Line (Line 1)",
    color: "#dc2626", // Bright Red
    routeCoordinates: [
      [28.7202, 77.1072], // Rithala
      [28.7102, 77.1212], // Rohini West
      [28.6975, 77.1485], // Pitampura
      [28.6922, 77.1555], // Kohat Enclave
      [28.6912, 77.1585], // Netaji Subhash Place
      [28.6822, 77.1725], // Keshav Puram
      [28.6742, 77.1955], // Inderlok
      [28.6692, 77.2085], // Shastri Nagar
      [28.6655, 77.2185], // Tis Hazari
      [28.6675, 77.2285], // Kashmere Gate
      [28.6685, 77.2455], // Shastri Park
      [28.6725, 77.2685], // Seelampur
      [28.6775, 77.2925], // Shahdara
      [28.6825, 77.3155], // Mansarovar Park
      [28.6865, 77.3285], // Dilshad Garden
      [28.6955, 77.3685], // Major Mohit Sharma Rajendra Nagar
      [28.6705, 77.4125], // Shaheed Sthal (New Bus Adda Ghaziabad)
    ],
    stations: [
      {
        id: "netaji-subhash-red",
        name: "Netaji Subhash Place",
        hindiName: "नेताजी सुभाष प्लेस",
        line: "Red Line",
        lineColor: "#dc2626",
        coordinates: [28.6912, 77.1585],
        isInterchange: true,
        interchanges: ["Pink Line"],
      },
      {
        id: "inderlok-red",
        name: "Inderlok",
        hindiName: "इंदरलोक",
        line: "Red Line",
        lineColor: "#dc2626",
        coordinates: [28.6742, 77.1955],
        isInterchange: true,
        interchanges: ["Green Line"],
      },
      {
        id: "shahdara-red",
        name: "Shahdara",
        hindiName: "शाहदरा",
        line: "Red Line",
        lineColor: "#dc2626",
        coordinates: [28.6775, 77.2925],
      },
    ],
  },

  // 4. VIOLET LINE (Kashmere Gate -> ITO -> Central Secretariat -> Lajpat Nagar -> Kalkaji Mandir -> Raja Nahar Singh Faridabad)
  {
    id: "violet-line",
    name: "Violet Line (Line 6)",
    color: "#8b5cf6", // Purple/Violet
    routeCoordinates: [
      [28.6675, 77.2285], // Kashmere Gate
      [28.6555, 77.2395], // Lal Quila (Red Fort)
      [28.6495, 77.2405], // Jama Masjid
      [28.6385, 77.2415], // Delhi Gate
      [28.6295, 77.2425], // ITO
      [28.6255, 77.2385], // Mandi House
      [28.6195, 77.2255], // Janpath
      [28.6148, 77.2115], // Central Secretariat
      [28.6015, 77.2225], // Khan Market
      [28.5885, 77.2325], // Jawaharlal Nehru Stadium
      [28.5795, 77.2385], // Jangpura
      [28.5705, 77.2425], // Lajpat Nagar
      [28.5495, 77.2525], // Moolchand
      [28.5395, 77.2585], // Nehru Place
      [28.5285, 77.2615], // Kalkaji Mandir
      [28.5145, 77.2785], // Govind Puri
      [28.4895, 77.3015], // Badarpur Border
      [28.4095, 77.3185], // Old Faridabad
      [28.3595, 77.3225], // Raja Nahar Singh (Ballabhgarh)
    ],
    stations: [
      {
        id: "lal-quila-violet",
        name: "Lal Quila (Red Fort)",
        hindiName: "लाल क़िला",
        line: "Violet Line",
        lineColor: "#8b5cf6",
        coordinates: [28.6555, 77.2395],
      },
      {
        id: "jama-masjid-violet",
        name: "Jama Masjid",
        hindiName: "जामा मस्जिद",
        line: "Violet Line",
        lineColor: "#8b5cf6",
        coordinates: [28.6495, 77.2405],
      },
      {
        id: "ito-violet",
        name: "ITO",
        hindiName: "आईटीओ",
        line: "Violet Line",
        lineColor: "#8b5cf6",
        coordinates: [28.6295, 77.2425],
      },
      {
        id: "khan-market-violet",
        name: "Khan Market",
        hindiName: "खान मार्केट",
        line: "Violet Line",
        lineColor: "#8b5cf6",
        coordinates: [28.6015, 77.2225],
      },
      {
        id: "lajpat-nagar-violet",
        name: "Lajpat Nagar (Central Market)",
        hindiName: "लाजपत नगर",
        line: "Violet Line",
        lineColor: "#8b5cf6",
        coordinates: [28.5705, 77.2425],
        isInterchange: true,
        interchanges: ["Pink Line"],
      },
      {
        id: "nehru-place-violet",
        name: "Nehru Place (IT Hub)",
        hindiName: "नेहरू प्लेस",
        line: "Violet Line",
        lineColor: "#8b5cf6",
        coordinates: [28.5395, 77.2585],
      },
      {
        id: "kalkaji-mandir-violet",
        name: "Kalkaji Mandir / Lotus Temple",
        hindiName: "कालकाजी मंदिर",
        line: "Violet Line",
        lineColor: "#8b5cf6",
        coordinates: [28.5285, 77.2615],
        isInterchange: true,
        interchanges: ["Magenta Line"],
      },
    ],
  },

  // 5. MAGENTA LINE (Janakpuri West -> Terminal 1 IGI Airport -> Hauz Khas -> Kalkaji Mandir -> Botanical Garden)
  {
    id: "magenta-line",
    name: "Magenta Line (Line 8)",
    color: "#d946ef", // Vibrant Magenta
    routeCoordinates: [
      [28.6195, 77.0682], // Janakpuri West
      [28.5995, 77.0882], // Palam
      [28.5795, 77.1082], // Sadar Bazar Cantonment
      [28.5602, 77.1195], // Terminal 1 IGI Airport
      [28.5495, 77.1495], // Shankar Vihar
      [28.5445, 77.1725], // Vasant Vihar
      [28.5455, 77.1855], // Munirka
      [28.5465, 77.1955], // IIT Delhi
      [28.5475, 77.2058], // Hauz Khas
      [28.5445, 77.2185], // Panchsheel Park
      [28.5395, 77.2355], // Chirag Delhi
      [28.5345, 77.2485], // Greater Kailash
      [28.5285, 77.2615], // Kalkaji Mandir
      [28.5405, 77.2855], // Okhla NSIC
      [28.5505, 77.3055], // Jamia Millia Islamia
      [28.5605, 77.3255], // Kalindi Kunj
      [28.5705, 77.3255], // Botanical Garden Noida
    ],
    stations: [
      {
        id: "igi-airport-t1-magenta",
        name: "Terminal 1 - IGI Airport",
        hindiName: "टर्मिनल 1 - आईजीआई एयरपोर्ट",
        line: "Magenta Line",
        lineColor: "#d946ef",
        coordinates: [28.5602, 77.1195],
      },
      {
        id: "iit-delhi-magenta",
        name: "IIT Delhi",
        hindiName: "आईआईटी दिल्ली",
        line: "Magenta Line",
        lineColor: "#d946ef",
        coordinates: [28.5465, 77.1955],
      },
      {
        id: "botanical-garden-magenta",
        name: "Botanical Garden",
        hindiName: "बोटैनिकल गार्डन",
        line: "Magenta Line",
        lineColor: "#d946ef",
        coordinates: [28.5705, 77.3255],
        isInterchange: true,
        interchanges: ["Blue Line"],
      },
    ],
  },

  // 6. AIRPORT EXPRESS ORANGE LINE (New Delhi Railway Station -> Shivaji Stadium -> Dhaula Kuan -> Aerocity -> IGI T3 Airport -> Dwarka Sec 21)
  {
    id: "airport-express",
    name: "Airport Express (Orange Line)",
    color: "#ea580c", // Vibrant Orange
    routeCoordinates: [
      [28.6425, 77.2215], // New Delhi
      [28.6295, 77.2135], // Shivaji Stadium (CP)
      [28.5912, 77.1612], // Dhaula Kuan
      [28.5522, 77.1222], // Delhi Aerocity
      [28.5555, 77.0855], // Airport (Terminal 3)
      [28.5522, 77.0583], // Yashobhoomi Dwarka Sector 25
    ],
    stations: [
      {
        id: "shivaji-stadium-orange",
        name: "Shivaji Stadium (Connaught Place)",
        hindiName: "शिवाजी स्टेडियम",
        line: "Airport Express",
        lineColor: "#ea580c",
        coordinates: [28.6295, 77.2135],
      },
      {
        id: "dhaula-kuan-orange",
        name: "Dhaula Kuan (Transit Hub)",
        hindiName: "धौला कुआँ",
        line: "Airport Express",
        lineColor: "#ea580c",
        coordinates: [28.5912, 77.1612],
        isInterchange: true,
        interchanges: ["Durgabai Deshmukh South Campus (Pink Line)"],
      },
      {
        id: "aerocity-orange",
        name: "Delhi Aerocity (Hospitality District)",
        hindiName: "दिल्ली एरोसिटी",
        line: "Airport Express",
        lineColor: "#ea580c",
        coordinates: [28.5522, 77.1222],
      },
      {
        id: "igi-t3-orange",
        name: "IGI Airport Terminal 3",
        hindiName: "आईजीआई एयरपोर्ट टर्मिनल 3",
        line: "Airport Express",
        lineColor: "#ea580c",
        coordinates: [28.5555, 77.0855],
      },
    ],
  },
];
