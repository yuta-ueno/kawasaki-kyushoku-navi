import { useState, useEffect, useCallback } from 'react';
import { getCacheData, setCacheData, CACHE_KEYS } from '../utils/waterSpotUtils';
import { addDistanceToSpots } from '../utils/geoUtils';

export function useWaterSpots() {
  const [spots, setSpots] = useState([]);
  const [filteredSpots, setFilteredSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    ward: '全区',
    category: '全て'
  });
  const [userLocation, setUserLocation] = useState(null);

  const fetchSpots = useCallback(async (light = true) => {
    try {
      setLoading(true);
      setError(null);

      const cacheKey = `${light ? CACHE_KEYS.LIGHT_DATA : 'water_spots_full'}_${filters.ward}_${filters.category}`;
      const cached = getCacheData(cacheKey);
      
      if (cached) {
        setSpots(cached.spots);
        return cached.spots;
      }

      const params = new URLSearchParams({
        light: light.toString(),
        ward: filters.ward,
        category: filters.category
      });
      const response = await fetch(`/api/water-spots/list?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch water spots');
      }

      const spotsData = result.data.spots;
      setSpots(spotsData);
      setCacheData(cacheKey, result.data);
      
      return spotsData;
    } catch (err) {
      console.error('Error fetching water spots:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [filters.ward, filters.category]);

  const applyFilters = useCallback(() => {
    let filtered = [...spots];
    
    if (userLocation) {
      filtered = addDistanceToSpots(filtered, userLocation);
    }
    
    setFilteredSpots(filtered);
  }, [spots, userLocation]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCacheData(CACHE_KEYS.FILTER_SETTINGS, { ...filters, ...newFilters });
  }, [filters]);

  const setLocation = useCallback((location) => {
    setUserLocation(location);
    if (location) {
      setCacheData(CACHE_KEYS.USER_LOCATION, location);
    }
  }, []);

  useEffect(() => {
    const savedFilters = getCacheData(CACHE_KEYS.FILTER_SETTINGS);
    if (savedFilters) {
      setFilters(savedFilters);
    }
    
    const savedLocation = getCacheData(CACHE_KEYS.USER_LOCATION);
    if (savedLocation) {
      setUserLocation(savedLocation);
    }
  }, []);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return {
    spots: filteredSpots,
    allSpots: spots,
    loading,
    error,
    filters,
    userLocation,
    updateFilters,
    setLocation,
    refetch: fetchSpots,
    clearError: () => setError(null)
  };
}

export function useWaterSpotDetail(spotId) {
  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async (id) => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);

      const cacheKey = `${CACHE_KEYS.DETAIL_DATA}${id}`;
      const cached = getCacheData(cacheKey);
      
      if (cached) {
        setSpot(cached);
        return cached;
      }

      const response = await fetch(`/api/water-spots/detail?id=${encodeURIComponent(id)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch spot details');
      }

      const spotData = result.data;
      setSpot(spotData);
      setCacheData(cacheKey, spotData);
      
      return spotData;
    } catch (err) {
      console.error('Error fetching spot detail:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (spotId) {
      fetchDetail(spotId);
    }
  }, [spotId, fetchDetail]);

  return {
    spot,
    loading,
    error,
    refetch: () => fetchDetail(spotId),
    clearError: () => setError(null)
  };
}