export interface WorkshopOption {
  id: string;
  overskrift: string;
  broedtekst: string;
  underviser: string;
  maxDeltagere: number;
}

export function createWorkshopOption(
  partial?: Partial<WorkshopOption>,
): WorkshopOption {
  return {
    id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    overskrift: "",
    broedtekst: "",
    underviser: "",
    maxDeltagere: 12,
    ...partial,
  };
}
