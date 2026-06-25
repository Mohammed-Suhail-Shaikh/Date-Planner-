"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { Itinerary } from "@/lib/db/schema";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    backgroundColor: "#faf8f5",
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
    color: "#2c2420",
  },
  date: {
    fontSize: 14,
    color: "#8a7f78",
    marginBottom: 32,
  },
  slot: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e0da",
  },
  time: {
    fontSize: 11,
    color: "#c4715a",
    marginBottom: 4,
  },
  slotTitle: {
    fontSize: 16,
    marginBottom: 4,
    color: "#2c2420",
  },
  address: {
    fontSize: 11,
    color: "#8a7f78",
    marginBottom: 4,
  },
  notes: {
    fontSize: 10,
    color: "#8a7f78",
    fontStyle: "italic",
  },
  footer: {
    position: "absolute",
    bottom: 48,
    left: 48,
    fontSize: 10,
    color: "#8a7f78",
  },
});

function DateItineraryDocument({
  itinerary,
  name,
}: {
  itinerary: Itinerary;
  name: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Your Date Plan</Text>
        <Text style={styles.date}>{itinerary.date}</Text>

        {itinerary.slots.map((slot) => (
          <View key={slot.id} style={styles.slot}>
            <Text style={styles.time}>{slot.time}</Text>
            <Text style={styles.slotTitle}>{slot.title}</Text>
            <Text style={styles.address}>{slot.address}</Text>
            {slot.notes ? <Text style={styles.notes}>{slot.notes}</Text> : null}
          </View>
        ))}

        {itinerary.customSuggestions ? (
          <View style={styles.slot}>
            <Text style={styles.slotTitle}>Her suggestions</Text>
            <Text style={styles.notes}>{itinerary.customSuggestions}</Text>
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
