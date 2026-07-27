import { Card } from "../models/card";
import cardsJson from "./cards.json";

export const cards: Card[] = cardsJson as unknown as Card[];
