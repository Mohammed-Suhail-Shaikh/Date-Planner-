import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const invites = sqliteTable("invites", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const responses = sqliteTable("responses", {
  inviteId: text("invite_id")
    .primaryKey()
    .references(() => invites.id),
  answers: text("answers", { mode: "json" }).$type<QuizAnswers>(),
  itinerary: text("itinerary", { mode: "json" }).$type<Itinerary>(),
  herEmail: text("her_email"),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
});

export type QuizAnswers = {
  mood: string;
  energy: string;
  activity: string;
  time: string;
  selectedDate: string;
  dietaryNotes?: string;
  herEmail: string;
};

export type ItinerarySlot = {
  id: string;
  time: string;
  title: string;
  location: string;
  address: string;
  notes: string;
  durationMinutes: number;
  isCustom?: boolean;
};

export type Itinerary = {
  date: string;
  dateIso?: string;
  slots: ItinerarySlot[];
  customSuggestions?: string;
};

export type Invite = typeof invites.$inferSelect;
export type Response = typeof responses.$inferSelect;
