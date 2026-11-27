// Realistic Live Traffic Simulation & Corridor Mapping for Delhi NCR
// Generates live congestion levels (smooth green, moderate orange, heavy red)
// based on real-time peak hours (9:00-11:30 AM & 5:30-9:00 PM IST)

export interface TrafficCorridor {
  id: string;
  name: string;
  level: "smooth" | "moderate" | "heavy";
  speedKmh: number;
  delayMins: number;
  color: string;
  coordinates: [number, number][];
}

// Key Arterial Corridors in Delhi NCR
export const DELHI_MAJOR_CORRIDORS: {
  id: string;
  name: string;
  baseSpeed: number;
  coordinates: [number, number][];
}[] = [
  {
    id: "inner-ring-road-north",
    name: "Inner Ring Road (Kashmere Gate to AIIMS)",
    baseSpeed: 45,
    coordinates: [
      [28.6675, 77.2285],
      [28.6508, 77.2422],
      [28.6328, 77.248],
      [28.6012, 77.245],
      [28.5866, 77.228],
      [28.5705, 77.2125],
    ],
  },
  {
    id: "outer-ring-road-south",
    name: "Outer Ring Road (Nehru Place to IIT Gate)",
    baseSpeed: 50,
    coordinates: [
      [28.552, 77.253],
      [28.545, 77.234],
      [28.542, 77.214],
      [28.543, 77.195],
      [28.547, 77.185],
    ],
  },
  {
    id: "delhi-gurugram-expressway",
    name: "Delhi - Gurugram Expressway (NH-48 / Dhaula Kuan to CyberHub)",
    baseSpeed: 60,
    coordinates: [
      [28.592, 77.162],
      [28.575, 77.135],
      [28.548, 77.108],
      [28.521, 77.091],
      [28.498, 77.087],
    ],
  },
  {
    id: "delhi-noida-direct",
    name: "DND Flyway (Mayur Vihar to Noida Sector 16)",
    baseSpeed: 65,
    coordinates: [
      [28.588, 77.262],
      [28.581, 77.288],
      [28.579, 77.305],
      [28.575, 77.318],
    ],
  },
  {
    id: "connaught-place-corridor",
    name: "Connaught Circus & Barakhamba Road",
    baseSpeed: 30,
    coordinates: [
      [28.6328, 77.2197],
      [28.629, 77.224],
      [28.626, 77.228],
      [28.629, 77.215],
      [28.6328, 77.2197],
    ],
  },
  {
    id: "mathura-road-corridor",
    name: "Mathura Road (ITO to Ashram Chowk)",
    baseSpeed: 40,
    coordinates: [
      [28.628, 77.244],
      [28.608, 77.246],
      [28.591, 77.252],
      [28.571, 77.257],
    ],
  },
  {
    id: "rohtak-road-west",
    name: "Rohtak Road (Punjabi Bagh to Peera Garhi)",
    baseSpeed: 35,
    coordinates: [
      [28.668, 77.126],
      [28.674, 77.108],
      [28.679, 77.092],
    ],
  },
  {
    id: "gt-karnal-road",
    name: "GT Karnal Road (Azadpur to Singhu Border)",
    baseSpeed: 55,
    coordinates: [
      [28.7032, 77.1856],
      [28.7303, 77.1492],
      [28.775, 77.128],
      [28.825, 77.112],
    ],
  },
];

export function getLiveDelhiTraffic(): TrafficCorridor[] {
  // Determine traffic congestion level based on current IST hour
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMins = now.getUTCMinutes();
  const istMinutes = (utcHours * 60 + utcMins + 330) % 1440;
  const istHour = Math.floor(istMinutes / 60);

  // Peak rush hours: Morning (8:30 - 11:30) and Evening (17:30 - 21:00)
  const isMorningPeak = (istHour === 8 && istMinutes % 60 >= 30) || (istHour >= 9 && istHour <= 11);
  const isEveningPeak = (istHour === 17 && istMinutes % 60 >= 30) || (istHour >= 18 && istHour <= 21);

  return DELHI_MAJOR_CORRIDORS.map((corridor, idx) => {
    let level: "smooth" | "moderate" | "heavy" = "smooth";
    let speedKmh = corridor.baseSpeed;
    let delayMins = 0;
    let color = "#22c55e"; // Green (Fast / Normal flow)

    // DND and Gurugram Expressway have heavy evening traffic; CP has heavy noon-evening traffic
    if (isEveningPeak) {
      if (idx % 2 === 0) {
        level = "heavy";
        speedKmh = Math.round(corridor.baseSpeed * 0.38);
        delayMins = Math.round(6 + (idx * 2));
        color = "#ef4444"; // Red
      } else {
        level = "moderate";
        speedKmh = Math.round(corridor.baseSpeed * 0.65);
        delayMins = 3;
        color = "#f59e0b"; // Orange
      }
    } else if (isMorningPeak) {
      if (idx % 3 === 0) {
        level = "heavy";
        speedKmh = Math.round(corridor.baseSpeed * 0.42);
        delayMins = 5;
        color = "#ef4444";
      } else {
        level = "moderate";
        speedKmh = Math.round(corridor.baseSpeed * 0.7);
        delayMins = 2;
        color = "#f59e0b";
      }
    } else {
      // Off peak: mostly fast with occasional moderate spots
      if (idx === 0 || idx === 4) {
        level = "moderate";
        speedKmh = Math.round(corridor.baseSpeed * 0.75);
        delayMins = 2;
        color = "#f59e0b";
      } else {
        level = "smooth";
        speedKmh = corridor.baseSpeed;
        delayMins = 0;
        color = "#22c55e";
      }
    }

    return {
      id: corridor.id,
      name: corridor.name,
      level,
      speedKmh,
      delayMins,
      color,
      coordinates: corridor.coordinates,
    };
  });
}
