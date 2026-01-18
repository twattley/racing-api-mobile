// React Query hooks for API calls
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { buildPath } from './config';

// Generic API query hook
export function useApiQuery({ queryKey, url, enabled = true, staleTime = 60000, ...rest }) {
  return useQuery({
    queryKey,
    queryFn: () => api(url),
    enabled,
    staleTime,
    ...rest,
  });
}

// Generic API mutation hook
export function useApiMutation({ mutationKey, url, method = 'POST', invalidate = [], onSuccess, ...rest }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey,
    mutationFn: async (body) =>
      api(url, {
        method,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),
    onSuccess: (...args) => {
      if (invalidate.length) {
        invalidate.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      }
      onSuccess?.(...args);
    },
    ...rest,
  });
}

// Today's race times
export function useTodaysRaceTimes(base = 'today', options = {}) {
  const url = buildPath(base, '/todays-race-times');
  return useQuery({
    queryKey: [base, 'todays-race-times'],
    queryFn: () => api(url),
    staleTime: 60000,
    ...options,
  });
}

// Full race form data
export function useRaceFormFull(base = 'today', raceId, options = {}) {
  const url = buildPath(base, `/race-form/${raceId}/full`);
  return useQuery({
    queryKey: [base, 'race-form-full', raceId],
    queryFn: () => api(url),
    enabled: !!raceId,
    staleTime: 60000,
    ...options,
  });
}

// Contender selections
export function usePostContenderSelection(base = 'betting', raceId, options = {}) {
  const url = buildPath(base, '/contender_selections');
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [base, 'contender_selections', 'create'],
    mutationFn: async (body) =>
      api(url, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      if (raceId) {
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[1] === 'race-form-full' &&
            String(query.queryKey[2]) === String(raceId),
        });
      }
    },
    ...options,
  });
}

export function useDeleteContenderSelection(base = 'betting', raceId, options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [base, 'contender_selections', 'delete'],
    mutationFn: async ({ raceId: rid, horseId }) => {
      const url = buildPath(base, `/contender_selections/${rid}/${horseId}`);
      return api(url, { method: 'DELETE' });
    },
    onSuccess: () => {
      if (raceId) {
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[1] === 'race-form-full' &&
            String(query.queryKey[2]) === String(raceId),
        });
      }
    },
    ...options,
  });
}

// Betting selection
export function usePostBettingSelection(base = 'betting', options = {}) {
  const url = buildPath(base, '/selections');
  return useMutation({
    mutationKey: [base, 'selections', 'create'],
    mutationFn: async (body) =>
      api(url, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    ...options,
  });
}

// Live betting selections
export function useLiveBettingSelections(options = {}) {
  return useApiQuery({
    queryKey: ['betting', 'live_selections'],
    url: '/betting/live_selections',
    staleTime: 10000, // 10 seconds - betting data should be fresh
    refetchOnMount: 'always',
    ...options,
  });
}

// Betting results analysis
export function useBettingResultsAnalysis(options = {}) {
  return useApiQuery({
    queryKey: ['betting', 'selections_analysis'],
    url: '/betting/selections_analysis',
    ...options,
  });
}

// Void betting selection
export function useVoidBettingSelection(options = {}) {
  return useApiMutation({
    mutationKey: ['betting', 'live_selections', 'void_bets'],
    url: '/betting/live_selections/void_bets',
    method: 'POST',
    invalidate: [['betting', 'live_selections']],
    ...options,
  });
}

// Feedback race times (historical)
export function useFeedbackRaceTimes(base = 'feedback', options = {}) {
  const url = buildPath(base, '/todays-race-times');
  return useQuery({
    queryKey: [base, 'todays-race-times'],
    queryFn: () => api(url),
    staleTime: 60000,
    ...options,
  });
}

// Current date for feedback
export function useCurrentDate(base = 'feedback', options = {}) {
  const url = buildPath(base, '/current-date');
  return useQuery({
    queryKey: [base, 'current-date'],
    queryFn: () => api(url),
    staleTime: 60000,
    ...options,
  });
}

export function useSetCurrentDate(base = 'feedback', options = {}) {
  const url = buildPath(base, '/current-date');
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [base, 'current-date', 'set'],
    mutationFn: async (date) =>
      api(url, {
        method: 'POST',
        body: JSON.stringify({ date }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [base, 'current-date'] });
      queryClient.invalidateQueries({ queryKey: [base, 'todays-race-times'] });
    },
    ...options,
  });
}

// Race result for feedback
export function useRaceResult(base = 'feedback', raceId, options = {}) {
  const url = buildPath(base, `/race-result/${raceId}`);
  return useQuery({
    queryKey: [base, 'race-result', raceId],
    queryFn: () => api(url),
    enabled: !!raceId,
    staleTime: 60000,
    ...options,
  });
}
