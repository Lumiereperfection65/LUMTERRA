import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { DEFAULT_REGION, STATUS_META } from '@/constants/config';
import type { Report } from '@/types';

const PIN: Record<string, string> = { pending: '#F59E0B', in_progress: '#14B8A6', resolved: '#059669' };

export function ReportMap({ reports, onSelect }: { reports: Report[]; onSelect: (r: Report) => void }) {
  const first = reports[0];
  const region = first ? { ...DEFAULT_REGION, latitude: first.latitude, longitude: first.longitude } : DEFAULT_REGION;
  return (
    <MapView style={StyleSheet.absoluteFill} initialRegion={region} showsUserLocation>
      {reports.map((r) => (
        <Marker
          key={r.id}
          coordinate={{ latitude: r.latitude, longitude: r.longitude }}
          title={r.title}
          description={STATUS_META[r.status].label}
          pinColor={PIN[r.status]}
          onCalloutPress={() => onSelect(r)}
        />
      ))}
    </MapView>
  );
}
