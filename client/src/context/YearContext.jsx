import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAnnees, getActiveAnnee } from '../services/anneeAcademiqueService';

const YearContext = createContext(null);

export const YearProvider = ({ children }) => {
  const [annees, setAnnees] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchYears = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [anneesRes, activeRes] = await Promise.all([
        getAnnees(),
        getActiveAnnee(),
      ]);

      const data = anneesRes.data.data || anneesRes.data.annees || [];
      setAnnees(data);

      const activeData = activeRes.data.data || activeRes.data;
      const savedYearId = localStorage.getItem('selectedYearId');

      if (savedYearId) {
        const found = data.find(a => a.idAnnee === parseInt(savedYearId));
        setSelectedYear(found || activeData);
      } else {
        setSelectedYear(activeData);
        if (activeData?.idAnnee) {
          localStorage.setItem('selectedYearId', activeData.idAnnee);
        }
      }
    } catch (error) {
      console.warn('Erreur chargement des années académiques:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  const refreshYears = () => {
    setLoading(true);
    fetchYears();
  };

  const changeYear = (idAnnee) => {
    const found = annees.find(a => a.idAnnee === parseInt(idAnnee));
    if (found) {
      setSelectedYear(found);
      localStorage.setItem('selectedYearId', idAnnee);
      window.location.reload();
    }
  };

  return (
    <YearContext.Provider value={{ annees, selectedYear, changeYear, refreshYears, loading }}>
      {children}
    </YearContext.Provider>
  );
};

export const useYear = () => {
  const ctx = useContext(YearContext);
  if (!ctx) throw new Error('useYear doit être dans YearProvider');
  return ctx;
};
