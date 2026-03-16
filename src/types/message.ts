export type Message =  {
  id: string;
  role: "user" | "bot";
  text: string;
  time?: string;
  streaming?: boolean;
}