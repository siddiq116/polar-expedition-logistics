import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import client from '../api/client';

const LEVEL_COLOR = {
  critical: '#f87171',
  warning: '#fbbf24',
  ok: '#34d399',
};

const HAZARD_COLOR = {
  high: '#f87171',
  moderate: '#fbbf24',
  low: '#5aa8d1',
};

export default function MapView() {
  const [camps, setCamps] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([client.get('/camps'), client.get('/hazards')]).then(([campsRes, hazardsRes]) => {
      setCamps(campsRes.data);
      setHazards(hazardsRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-ice-400">Loading map…</div>;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-ice-100">Live Operations Map</h1>
      <p className="mb-6 text-sm text-ice-400">
        Camp status by resupply risk and reported terrain hazards.
      </p>

      <div className="mb-4 flex gap-4 text-xs text-ice-300">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: LEVEL_COLOR.ok }} /> OK
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: LEVEL_COLOR.warning }} /> Warning
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: LEVEL_COLOR.critical }} /> Critical
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rotate-45 bg-ice-400" /> Hazard
        </span>
      </div>

      <div className="h-[600px] overflow-hidden rounded-xl border border-ice-800/60">
        <MapContainer center={[-78, 20]} zoom={2} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          />
          {camps.map((camp) => {
            const level =
              camp.alert_summary.critical > 0
                ? 'critical'
                : camp.alert_summary.warning > 0
                ? 'warning'
                : 'ok';
            return (
              <CircleMarker
                key={camp.id}
                center={[camp.lat, camp.lng]}
                radius={10}
                pathOptions={{ color: LEVEL_COLOR[level], fillColor: LEVEL_COLOR[level], fillOpacity: 0.8 }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{camp.name}</div>
                    <div className="text-xs capitalize">{camp.type.replace('_', ' ')}</div>
                    <div className="text-xs mt-1">{camp.personnel_count} personnel</div>
                    <Link to={`/camps/${camp.id}`} className="text-xs text-blue-600 underline">
                      View details
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
          {hazards.map((h) => (
            <CircleMarker
              key={`hazard-${h.id}`}
              center={[h.lat, h.lng]}
              radius={7}
              pathOptions={{
                color: HAZARD_COLOR[h.severity] || HAZARD_COLOR.moderate,
                fillColor: HAZARD_COLOR[h.severity] || HAZARD_COLOR.moderate,
                fillOpacity: 0.6,
                dashArray: '3,3',
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold capitalize">{h.type.replace('_', ' ')}</div>
                  <div className="text-xs capitalize">Severity: {h.severity}</div>
                  {h.description && <div className="text-xs mt-1">{h.description}</div>}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
