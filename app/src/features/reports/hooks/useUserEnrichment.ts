import { useState, useCallback, useRef } from 'react';
import { api } from '../../../services/api';

export interface EnrichedUser {
  id: string;
  username: string;
  nexudusUser: string | null;
  role: string;
  a3NoPaperMode?: number;
}

export const useUserEnrichment = () => {
  const [enrichedUsers, setEnrichedUsers] = useState<Record<string, EnrichedUser>>({});
  const [isEnriching, setIsEnriching] = useState(false);
  const loadingIds = useRef<Set<string>>(new Set());

  const enrichUsers = useCallback(async (userIds: string[]) => {
    const idsToFetch = userIds.filter(id => !enrichedUsers[id] && !loadingIds.current.has(id));
    
    if (idsToFetch.length === 0) return;

    setIsEnriching(true);
    idsToFetch.forEach(id => loadingIds.current.add(id));

    try {
      // Fetch each user in parallel
      const fetchPromises = idsToFetch.map(async (id) => {
        try {
          const { data, error } = await api.GET('/api/v1/users/{id}', {
            params: { path: { id } }
          });
          
          if (error) {
             console.error(`Error enriching user ${id}:`, error);
             return null;
          }
          
          return data as EnrichedUser;
        } catch (err) {
          console.error(`Technical error enriching user ${id}:`, err);
          return null;
        }
      });

      const results = await Promise.all(fetchPromises);
      
      const newEntries: Record<string, EnrichedUser> = {};
      results.forEach(user => {
        if (user) {
          newEntries[user.id] = user;
        }
      });

      setEnrichedUsers(prev => ({ ...prev, ...newEntries }));
    } finally {
      idsToFetch.forEach(id => loadingIds.current.delete(id));
      setIsEnriching(false);
    }
  }, [enrichedUsers]);

  return {
    enrichedUsers,
    isEnriching,
    enrichUsers
  };
};
