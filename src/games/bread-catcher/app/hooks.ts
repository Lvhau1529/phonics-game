/**
 * Hook React đọc store của Bread Catcher.
 */
import { appStore, type AppState } from '@/games/bread-catcher/session/sessionStore';
import type { TeamTotal } from '@/games/bread-catcher/session/leaderboard';
import { teamTotalsStore } from '@/games/bread-catcher/session/storage';
import { useStore } from '@/core/store/useStore';

export const useAppState = <S>(selector: (state: AppState) => S): S => useStore(appStore, selector);

export const useTeamTotals = (): TeamTotal[] => useStore(teamTotalsStore, (state) => state.totals);
