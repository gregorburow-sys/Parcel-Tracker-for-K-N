import type { Models } from "appwrite";

export interface ParcelDocument extends Models.Document {
  "parcel-name": string;
}

export interface Parcel extends ParcelDocument {
  name: string;
}

export interface ParcelEventDocument extends Models.Document {
  parcelId: string;
  status: string;
}

export interface ParcelEvent extends ParcelEventDocument {
  bgColor: string;
  datetime: string;
}
