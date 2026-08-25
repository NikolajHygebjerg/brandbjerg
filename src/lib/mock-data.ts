export type CourseStatus =
  | "udkast"
  | "godkendt"
  | "markedsfoeres"
  | "aaben"
  | "fuldt"
  | "afvikles"
  | "afsluttet";

export type Department =
  | "Planlægning"
  | "Kommunikation"
  | "Salg"
  | "Afvikling"
  | "Regnskab"
  | "Ledelse";

export interface Course {
  id: string;
  title: string;
  category: string;
  startDate: string;
  endDate: string;
  price: number;
  capacity: number;
  enrolled: number;
  paid: number;
  status: CourseStatus;
  instructor: string;
  location: string;
  department: Department;
}

export interface Enrollment {
  id: string;
  courseId: string;
  name: string;
  email: string;
  status: "reserveret" | "betalt" | "venteliste" | "aflyst";
  registeredAt: string;
  amount: number;
}

export interface Campaign {
  id: string;
  title: string;
  courses: string[];
  channel: string;
  startDate: string;
  endDate: string;
  budget: number;
  leads: number;
  conversions: number;
  owner: string;
}

export interface Activity {
  id: string;
  courseId: string;
  department: Department;
  message: string;
  time: string;
}

export const statusLabels: Record<CourseStatus, string> = {
  udkast: "Udkast",
  godkendt: "Godkendt",
  markedsfoeres: "Markedsføres",
  aaben: "Åben tilmelding",
  fuldt: "Fuldt booket",
  afvikles: "Afvikles",
  afsluttet: "Afsluttet",
};

export const statusColors: Record<CourseStatus, string> = {
  udkast: "bg-slate-100 text-slate-700",
  godkendt: "bg-blue-100 text-blue-800",
  markedsfoeres: "bg-purple-100 text-purple-800",
  aaben: "bg-emerald-100 text-emerald-800",
  fuldt: "bg-amber-100 text-amber-800",
  afvikles: "bg-orange-100 text-orange-800",
  afsluttet: "bg-gray-100 text-gray-600",
};

export const courses: Course[] = [
  {
    id: "kur-001",
    title: "Akvarelmaleri for begyndere",
    category: "Kreativt",
    startDate: "2026-03-14",
    endDate: "2026-03-15",
    price: 1_450,
    capacity: 16,
    enrolled: 14,
    paid: 12,
    status: "aaben",
    instructor: "Lise Møller",
    location: "Atelier Øst",
    department: "Planlægning",
  },
  {
    id: "kur-002",
    title: "Nordisk mad & fermentering",
    category: "Mad",
    startDate: "2026-04-10",
    endDate: "2026-04-12",
    price: 2_950,
    capacity: 12,
    enrolled: 12,
    paid: 11,
    status: "fuldt",
    instructor: "Thomas Berg",
    location: "Køkkenlaboratoriet",
    department: "Planlægning",
  },
  {
    id: "kur-003",
    title: "Stille retreat – mindfulness",
    category: "Wellness",
    startDate: "2026-05-02",
    endDate: "2026-05-04",
    price: 3_200,
    capacity: 20,
    enrolled: 6,
    paid: 4,
    status: "markedsfoeres",
    instructor: "Anna Krogh",
    location: "Skovhytten",
    department: "Kommunikation",
  },
  {
    id: "kur-004",
    title: "Digital fortælling & podcast",
    category: "Medier",
    startDate: "2026-06-06",
    endDate: "2026-06-07",
    price: 1_750,
    capacity: 18,
    enrolled: 3,
    paid: 1,
    status: "godkendt",
    instructor: "Mikkel Sørensen",
    location: "Medieværksted",
    department: "Planlægning",
  },
  {
    id: "kur-005",
    title: "Sommerkursus: Keramik",
    category: "Kreativt",
    startDate: "2026-07-13",
    endDate: "2026-07-17",
    price: 4_500,
    capacity: 14,
    enrolled: 0,
    paid: 0,
    status: "udkast",
    instructor: "Sofie Lind",
    location: "Keramikværksted",
    department: "Planlægning",
  },
  {
    id: "kur-006",
    title: "Vinterlæseklub & litteratur",
    category: "Kultur",
    startDate: "2026-01-24",
    endDate: "2026-01-25",
    price: 950,
    capacity: 24,
    enrolled: 22,
    paid: 22,
    status: "afsluttet",
    instructor: "Helle Vang",
    location: "Biblioteket",
    department: "Afvikling",
  },
];

export const enrollments: Enrollment[] = [
  {
    id: "til-101",
    courseId: "kur-001",
    name: "Mette Hansen",
    email: "mette@example.dk",
    status: "betalt",
    registeredAt: "2026-02-10",
    amount: 1_450,
  },
  {
    id: "til-102",
    courseId: "kur-001",
    name: "Jens Pedersen",
    email: "jens@example.dk",
    status: "betalt",
    registeredAt: "2026-02-11",
    amount: 1_450,
  },
  {
    id: "til-103",
    courseId: "kur-001",
    name: "Camilla Olsen",
    email: "camilla@example.dk",
    status: "reserveret",
    registeredAt: "2026-02-18",
    amount: 1_450,
  },
  {
    id: "til-104",
    courseId: "kur-002",
    name: "Peter Nielsen",
    email: "peter@example.dk",
    status: "venteliste",
    registeredAt: "2026-02-20",
    amount: 2_950,
  },
  {
    id: "til-105",
    courseId: "kur-003",
    name: "Louise Frandsen",
    email: "louise@example.dk",
    status: "betalt",
    registeredAt: "2026-02-15",
    amount: 3_200,
  },
];

export const campaigns: Campaign[] = [
  {
    id: "kam-01",
    title: "Forårskampagne – kreative kurser",
    courses: ["kur-001", "kur-005"],
    channel: "Nyhedsbrev + SoMe",
    startDate: "2026-02-01",
    endDate: "2026-03-01",
    budget: 8_000,
    leads: 340,
    conversions: 28,
    owner: "Kommunikation",
  },
  {
    id: "kam-02",
    title: "Mad & wellness push",
    courses: ["kur-002", "kur-003"],
    channel: "Facebook + lokale aviser",
    startDate: "2026-03-15",
    endDate: "2026-04-15",
    budget: 12_500,
    leads: 210,
    conversions: 15,
    owner: "Kommunikation",
  },
];

export const activities: Activity[] = [
  {
    id: "act-1",
    courseId: "kur-001",
    department: "Salg",
    message: "Ny tilmelding: Mette Hansen (betalt)",
    time: "I dag 09:14",
  },
  {
    id: "act-2",
    courseId: "kur-001",
    department: "Kommunikation",
    message: "SoMe-post planlagt til torsdag",
    time: "I dag 08:30",
  },
  {
    id: "act-3",
    courseId: "kur-002",
    department: "Salg",
    message: "Kurset er nu fuldt – venteliste aktiveret",
    time: "I går 16:45",
  },
  {
    id: "act-4",
    courseId: "kur-003",
    department: "Regnskab",
    message: "Bogføringskladde klar til KOMiT-import",
    time: "I går 11:20",
  },
  {
    id: "act-5",
    courseId: "kur-001",
    department: "Afvikling",
    message: "Lokalebookning bekræftet: Atelier Øst",
    time: "20. feb 14:00",
  },
];

export const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Maj",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dec",
];

export function getCourse(id: string) {
  return courses.find((c) => c.id === id);
}

export function formatDKK(amount: number) {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("da-DK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
