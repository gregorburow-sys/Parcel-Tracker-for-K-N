import type { Models } from "appwrite";

export interface Parcel extends Models.Document {
  "parcel-name": string;
}

export type ParcelStatus =
  | "created"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "delayed"
  | "cancelled"
  | "returned";

export interface ParcelEvent extends Models.Document {
  parcelId: string;
  status: string;
}

export interface DisplayParcel {
  id: string;
  name: string;
}

export interface DisplayEvent {
  id: string;
  status: string;
  occurredAt: string;
  bgColor: string;
}
