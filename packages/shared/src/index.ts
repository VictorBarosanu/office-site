// packages/shared/src/index.ts — what the server and the web agree on
export type Entrance = {
  id: number;
  address: string;
  floors: number;
  hasElevator: boolean;
};