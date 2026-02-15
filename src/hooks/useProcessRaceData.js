// Shared hook for processing race form data
import { useMemo } from 'react';

export function useProcessRaceData(fullData) {
  return useMemo(() => {
    if (!fullData) return null;

    const details = fullData.race_details || {};
    const raceInfoRows = fullData.race_info?.data || [];
    const formRows = fullData.race_form?.data || [];

    // Build maps for horse meta
    const infoByHorseId = new Map();
    for (const r of raceInfoRows) {
      if (r?.horse_id != null) infoByHorseId.set(r.horse_id, r);
    }

    // Group form by horse
    const grouped = new Map();
    for (const row of formRows) {
      const hid = row.horse_id;
      if (hid == null) continue;
      if (!grouped.has(hid)) grouped.set(hid, []);
      grouped.get(hid).push(row);
    }

    const horse_data = Array.from(grouped.entries()).map(([horse_id, rows]) => {
      rows.sort((a, b) => new Date(a.race_date) - new Date(b.race_date));
      const info = infoByHorseId.get(horse_id) || {};

      // Calculate days since last run
      const weeks = rows
        .map((r) => r.total_weeks_since_run)
        .filter((x) => typeof x === 'number' && x >= 0);
      const minWeeks = weeks.length ? Math.min(...weeks) : undefined;
      const todays_days_since_last_ran =
        typeof minWeeks === 'number' ? Math.round(minWeeks * 7) : undefined;

      return {
        horse_id,
        horse_name: rows[rows.length - 1]?.horse_name || info.horse_name,
        todays_betfair_win_sp: info.betfair_win_sp ?? null,
        todays_betfair_place_sp: info.betfair_place_sp ?? null,
        todays_sim_place_sp: info.sim_place_sp ?? null,
        todays_horse_age: info.age ?? null,
        todays_headgear: info.headgear ?? null,
        todays_official_rating: info.official_rating ?? null,
        todays_weight_carried: info.weight_carried_lbs ?? null,
        todays_win_percentage: info.win_percentage ?? null,
        todays_place_percentage: info.place_percentage ?? null,
        todays_days_since_last_ran,
        number_of_runs: info.number_of_runs ?? null,
        // Betfair IDs for betting
        todays_selection_id: info.selection_id ?? null,
        todays_market_id_win: info.market_id_win ?? null,
        todays_market_id_place: info.market_id_place ?? null,
        // Performance history with full details
        performance_data: rows.map((r) => ({
          race_id: r.race_id,
          race_date: r.race_date,
          race_class: r.race_class,
          distance: r.distance,
          going: r.going,
          course: r.course,
          finishing_position: r.finishing_position,
          number_of_runners: r.number_of_runners,
          total_distance_beaten: r.total_distance_beaten,
          betfair_win_sp: r.betfair_win_sp,
          official_rating: r.official_rating,
          headgear: r.headgear,
          speed_figure: r.speed_figure,
          rating: r.rating,
          weeks_since_last_ran: r.weeks_since_last_ran,
          total_weeks_since_run: r.total_weeks_since_run,
          hcap_range: r.hcap_range,
          age_range: r.age_range,
          race_type: r.race_type,
          surface: r.surface,
          first_place_prize_money: r.first_place_prize_money,
          class_diff: r.class_diff,
          rating_range_diff: r.rating_range_diff,
          // Comments
          tf_comment: r.tf_comment,
          rp_comment: r.rp_comment,
          main_race_comment: r.main_race_comment,
          race_title: r.race_title,
        })),
      };
    });

    return {
      ...details,
      horse_data,
    };
  }, [fullData]);
}
