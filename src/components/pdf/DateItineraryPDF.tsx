"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { Itinerary, ItinerarySlot } from "@/lib/db/schema";
import { formatFlowersPreference } from "@/lib/format-flowers";
import { formatDressingPreference } from "@/lib/format-dressing";
import { getSlotDisplayAddress, getSlotDisplayTitle } from "@/lib/venue-display";

const colors = {
  bg: "#fdf2f8",
  title: "#7c3aed",
  date: "#be185d",
  time: "#c026d3",
  foreground: "#3b1f4a",
  muted: "#8b6f96",
  spine: "#e879f9",
  cardBorder: "#d8b4dc",
  cardBg: "#fffafc",
  fillerBg: "#fff5f9",
  footer: "#a855f7",
};

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    backgroundColor: colors.bg,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.time,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    marginBottom: 6,
    color: colors.title,
  },
  date: {
    fontSize: 13,
    color: colors.date,
    marginBottom: 24,
  },
  timeline: {
    position: "relative",
    marginBottom: 4,
  },
  spine: {
    position: "absolute",
    left: 7,
    top: 16,
    bottom: 12,
    width: 2,
    backgroundColor: colors.spine,
    opacity: 0.45,
  },
  roadmapItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  markerCol: {
    width: 24,
    position: "relative",
  },
  nodeMain: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.spine,
    marginTop: 20,
    marginLeft: 3,
  },
  fillerMarkerRow: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    left: 7,
    top: "50%",
    marginTop: -3,
  },
  branch: {
    width: 10,
    height: 2,
    backgroundColor: colors.spine,
    opacity: 0.55,
  },
  nodeFiller: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#f9a8d4",
  },
  contentCol: {
    flex: 1,
    paddingBottom: 10,
  },
  cardMain: {
    backgroundColor: colors.cardBg,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  cardFiller: {
    backgroundColor: colors.fillerBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxWidth: 240,
  },
  extrasSection: {
    marginTop: 22,
  },
  standaloneCard: {
    backgroundColor: colors.cardBg,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.time,
    marginBottom: 4,
  },
  time: {
    fontSize: 10,
    color: colors.time,
    marginBottom: 3,
  },
  slotTitleMain: {
    fontSize: 16,
    color: colors.foreground,
    marginBottom: 3,
  },
  slotTitleFiller: {
    fontSize: 12,
    color: colors.foreground,
    marginBottom: 2,
  },
  address: {
    fontSize: 10,
    color: colors.muted,
    marginBottom: 3,
  },
  notes: {
    fontSize: 9,
    color: colors.muted,
    fontStyle: "italic",
  },
  extraSubtitle: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 6,
  },
  extraBody: {
    fontSize: 11,
    color: colors.foreground,
  },
  footer: {
    position: "absolute",
    bottom: 48,
    left: 48,
    fontSize: 10,
    color: colors.footer,
  },
});

function RoadmapSlot({ slot }: { slot: ItinerarySlot }) {
  const isFiller = slot.isFiller;

  return (
    <View style={styles.roadmapItem}>
      <View style={styles.markerCol}>
        {isFiller ? (
          <View style={styles.fillerMarkerRow}>
            <View style={styles.branch} />
            <View style={styles.nodeFiller} />
          </View>
        ) : (
          <View style={styles.nodeMain} />
        )}
      </View>
      <View style={styles.contentCol}>
        <View style={isFiller ? styles.cardFiller : styles.cardMain}>
          {slot.isCustom ? (
            <Text style={styles.label}>Your suggestion</Text>
          ) : null}
          {isFiller && !slot.isCustom ? (
            <Text style={styles.label}>Quick stop</Text>
          ) : null}
          <Text style={styles.time}>{slot.time}</Text>
          <Text style={isFiller ? styles.slotTitleFiller : styles.slotTitleMain}>
            {getSlotDisplayTitle(slot)}
          </Text>
          {getSlotDisplayAddress(slot) ? (
            <Text style={styles.address}>{getSlotDisplayAddress(slot)}</Text>
          ) : null}
          {slot.notes && !isFiller ? (
            <Text style={styles.notes}>{slot.notes}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function StandaloneSection({
  label,
  subtitle,
  body,
}: {
  label: string;
  subtitle?: string;
  body: string;
}) {
  return (
    <View style={styles.standaloneCard}>
      <Text style={styles.label}>{label}</Text>
      {subtitle ? <Text style={styles.extraSubtitle}>{subtitle}</Text> : null}
      <Text style={styles.extraBody}>{body}</Text>
    </View>
  );
}

function DateItineraryDocument({
  itinerary,
  name,
}: {
  itinerary: Itinerary;
  name: string;
}) {
  const flowersLine = formatFlowersPreference(itinerary);
  const dressingLine = formatDressingPreference(itinerary);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Your date plan</Text>
        <Text style={styles.title}>{itinerary.date}</Text>
        <Text style={styles.date}>Planned with care for {name}</Text>

        <View style={styles.timeline}>
          <View style={styles.spine} />
          {itinerary.slots.map((slot) => (
            <RoadmapSlot key={slot.id} slot={slot} />
          ))}
        </View>

        {flowersLine || dressingLine || itinerary.customSuggestions ? (
          <View style={styles.extrasSection}>
            {flowersLine ? (
              <StandaloneSection
                label="Flowers for our date"
                subtitle="What she'd like you to bring"
                body={flowersLine}
              />
            ) : null}
            {dressingLine ? (
              <StandaloneSection
                label="Outfit vibe"
                subtitle="How we're dressing for the date"
                body={dressingLine}
              />
            ) : null}
            {itinerary.customSuggestions ? (
              <StandaloneSection
                label="Her suggestions"
                body={itinerary.customSuggestions}
              />
            ) : null}
          </View>
        ) : null}

        <Text style={styles.footer}>Planned with care for {name}</Text>
      </Page>
    </Document>
  );
}

export async function downloadItineraryPdf(
  itinerary: Itinerary,
  name: string
): Promise<void> {
  const blob = await pdf(
    <DateItineraryDocument itinerary={itinerary} name={name} />
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `date-plan-${name.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
