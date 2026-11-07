import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';

// Fix for default marker icons in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ReportMapProps {
  reports: any[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export function ReportMap({ reports, center = [48.8566, 2.3522], zoom = 13, className }: ReportMapProps) {
  return (
    <div className={cn("rounded-2xl overflow-hidden border border-slate-200 shadow-sm", className)}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map((report) => (
          <Marker 
            key={report.id} 
            position={[report.latitude, report.longitude]}
          >
            <Popup>
              <div className="p-1">
                <h4 className="font-bold text-sm mb-1">{report.title}</h4>
                <p className="text-xs text-slate-500 mb-2">{report.category?.name}</p>
                <div className={cn(
                  "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                  report.status === 'RESOLVED' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                )}>
                  {report.status}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
