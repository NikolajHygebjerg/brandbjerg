export type RegistrationFormData = {
  firstName: string;
  lastName: string;
  email: string;
  emailConfirm: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  accommodation: "dobbelt" | "enkelt";
  roomNeighbor: string;
  bedding: "ja" | "nej";
  bhvMember: "ja" | "nej";
  discountCode: string;
  elderCouncil: "ja" | "nej";
  previousParticipant: "ja" | "nej";
  heardFrom: string;
  dietaryNeeds: string;
  otherConsiderations: string;
  photoConsent: "ja" | "nej";
  acceptDataTerms: boolean;
  acceptNewsletter: boolean;
};

export function buildRegistrationSummary(data: RegistrationFormData): string {
  const lines = [
    data.bedding === "ja" ? "Sengetøj: Ja (+150 kr.)" : "Sengetøj: Nej",
    data.bhvMember === "ja" ? "BHV-medlem: Ja" : "BHV-medlem: Nej",
    data.discountCode.trim()
      ? `Rabatkode: ${data.discountCode.trim()}`
      : null,
    data.elderCouncil === "ja" ? "Ældreråds nr.: Ja" : null,
    data.previousParticipant === "ja" ? "Tidligere deltager: Ja" : null,
    data.heardFrom && data.heardFrom !== "Vælg"
      ? `Hørt om kurset: ${data.heardFrom}`
      : null,
    data.dietaryNeeds && data.dietaryNeeds !== "Vælg"
      ? `Kost: ${data.dietaryNeeds}`
      : null,
    data.otherConsiderations.trim()
      ? `Andre hensyn: ${data.otherConsiderations.trim()}`
      : null,
    data.roomNeighbor.trim()
      ? `Værelse ved siden af: ${data.roomNeighbor.trim()}`
      : null,
    data.photoConsent === "ja"
      ? "Foto/video: Ja"
      : "Foto/video: Nej",
    data.acceptNewsletter ? "Nyhedsbrev: Ja" : "Nyhedsbrev: Nej",
  ].filter(Boolean);

  return lines.join(" · ");
}
