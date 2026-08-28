export interface AnsatVaerelseBooking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  roomNumber: string;
  /** Check-in (inklusive) */
  fromDate: string;
  /** Check-out (eksklusiv) */
  toDate: string;
  needsBedding: boolean;
  createdAt: string;
}
