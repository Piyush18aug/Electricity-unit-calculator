import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { Property, Meter } from '../types';

interface MeterContextType {
  properties: Property[];
  meters: Meter[];
  selectedProperty: Property | null;
  selectedMeter: Meter | null;
  loading: boolean;
  setSelectedProperty: (property: Property) => void;
  setSelectedMeter: (meter: Meter) => void;
  refreshProperties: () => Promise<void>;
}

const MeterContext = createContext<MeterContextType | undefined>(undefined);

export const MeterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      setProperties(response.data);
      if (response.data.length > 0 && !selectedProperty) {
        const defaultProp = response.data[0];
        setSelectedProperty(defaultProp);
        await fetchMetersForProperty(defaultProp.id);
      }
    } catch {
      // Ignore initial load unauth error
    } finally {
      setLoading(false);
    }
  };

  const fetchMetersForProperty = async (propertyId: number) => {
    try {
      const response = await api.get(`/properties/${propertyId}/meters`);
      setMeters(response.data);
      if (response.data.length > 0) {
        setSelectedMeter(response.data[0]);
      } else {
        setSelectedMeter(null);
      }
    } catch (err) {
      console.error('Failed to load meters', err);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleSelectProperty = (prop: Property) => {
    setSelectedProperty(prop);
    fetchMetersForProperty(prop.id);
  };

  return (
    <MeterContext.Provider
      value={{
        properties,
        meters,
        selectedProperty,
        selectedMeter,
        loading,
        setSelectedProperty: handleSelectProperty,
        setSelectedMeter,
        refreshProperties: fetchProperties,
      }}
    >
      {children}
    </MeterContext.Provider>
  );
};

export const useMeter = () => {
  const context = useContext(MeterContext);
  if (!context) throw new Error('useMeter must be used within MeterProvider');
  return context;
};
