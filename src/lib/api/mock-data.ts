import type {
  Attendee,
  ClassStatus,
  FitnessClass,
  Member,
  PaymentType
} from "@/types/data-table.type";

const classNames = [
  "Yoga Flow",
  "HIIT Circuit",
  "Pilates Reformer",
  "Strength Foundations",
  "Spin Endurance",
  "Barre Sculpt",
  "Mobility Reset",
  "Boxing Skills",
  "Prenatal Yoga",
  "TRX Conditioning",
  "Mat Pilates",
  "Kettlebell Basics"
];

const instructors = [
  "Maya Chen",
  "John Doe",
  "Ari Patel",
  "Sofia Mendes",
  "Leo Grant",
  "Nora Kim"
];

const members = [
  "Amelia Carter",
  "Noah Wilson",
  "Mia Thompson",
  "Ethan Brooks",
  "Isla Bennett",
  "Lucas Morgan",
  "Ava Foster",
  "Liam Price",
  "Grace Hall",
  "Henry Ward",
  "Chloe Reed",
  "Owen Clark",
  "Lily Turner",
  "Jack Morris",
  "Ruby Hughes",
  "Theo Scott",
  "Ella Cooper",
  "Max Bailey"
];

export const inlineClasses: FitnessClass[] = Array.from({ length: 8 }).map(
  (_, index) => createClass(index, true)
);

export const allClasses: FitnessClass[] = Array.from({ length: 48 }).map(
  (_, index) => createClass(index, false)
);

export const allMembers: Member[] = Array.from({ length: 63 }).map(
  (_, index) => ({
    id: `member-${index + 1}`,
    name: members[index % members.length],
    plan: ["Drop-in", "Core", "Unlimited", "Corporate"][
      index % 4
    ] as Member["plan"],
    visitsThisMonth: (index * 7) % 24,
    nextBillingDate: toDateLabel(addDays(new Date("2026-07-01"), index * 2)),
    status: ["Active", "Paused", "Past due"][index % 3] as Member["status"]
  })
);

export function createAttendees(
  classIndex: number,
  count: number
): Attendee[] {
  return Array.from({ length: count }).map((_, index) => ({
    id: `attendee-${classIndex + 1}-${index + 1}`,
    memberName: members[(classIndex + index) % members.length],
    paymentType: ["One-time", "Package", "Membership"][
      (classIndex + index) % 3
    ] as PaymentType,
    bookingStatus: ["Booked", "Checked-in", "Cancelled", "No-show"][
      (classIndex + index) % 4
    ] as Attendee["bookingStatus"]
  }));
}

function createClass(index: number, includeAttendees: boolean): FitnessClass {
  const hour = 6 + (index % 12);
  const capacity = [12, 15, 18, 20][index % 4];
  const enrolled = Math.min(capacity, 5 + ((index * 3) % 17));
  const status: ClassStatus =
    index % 13 === 0 ? "Cancelled" : enrolled >= capacity ? "Full" : "Scheduled";

  return {
    id: `class-${index + 1}`,
    className: classNames[index % classNames.length],
    instructor: instructors[index % instructors.length],
    startsAt: `${hour.toString().padStart(2, "0")}:00`,
    endsAt: `${(hour + 1).toString().padStart(2, "0")}:00`,
    enrolled,
    capacity,
    status,
    attendees: includeAttendees
      ? createAttendees(index, Math.min(enrolled, 5 + (index % 4)))
      : undefined
  };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}
