/**
 * Checks aurora forecasts and sends email alerts to Plus tier users
 * Should be called daily, ideally triggered by a scheduled task
 */
import { base44 } from '@/api/base44Client';

export async function checkAuroraAlerts() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get today's aurora forecasts
    const forecasts = await base44.entities.AuroraForecast.filter(
      { date: today },
      '-created_date',
      100
    );

    // Filter for good/possible conditions
    const alertForecasts = forecasts.filter(f =>
      f.visibility_rating === 'good' || f.visibility_rating === 'possible'
    );

    if (alertForecasts.length === 0) return { sent: 0 };

    // Get all Plus tier users with aurora alerts enabled
    const allUsers = await base44.entities.User.list('-created_date', 500);
    let sentCount = 0;

    for (const user of allUsers) {
      try {
        // Check subscription
        const subs = await base44.entities.Subscription.filter(
          { user_email: user.email, status: 'active' },
          '-created_date',
          1
        );
        if (subs.length === 0) continue;

        // Get user profile with alert locations
        const profiles = await base44.entities.UserProfile.filter(
          { user_email: user.email },
          '-created_date',
          1
        );
        const profile = profiles[0];

        // Check if alerts enabled
        if (profile?.alert_prefs?.aurora_alerts_enabled === false) continue;

        // Build email
        const alertLocs = profile?.alert_locations || [];
        const locationList = alertLocs.length > 0
          ? alertLocs.map(l => `• ${l.name}: ${l.lat.toFixed(2)}°, ${l.lon.toFixed(2)}°`).join('\n')
          : 'Your saved locations (none yet)';

        const forecast = alertForecasts[0];
        const subject = `🌌 Aurora Alert: KP ${forecast.kp_index} — Possible Tonight`;
        const body = `
Hi ${user.full_name || 'Explorer'},

Aurora activity is predicted with KP index ${forecast.kp_index} and ${forecast.cloud_cover_percent}% cloud cover.

Visibility: ${forecast.visibility_rating === 'good' ? '✓ Good conditions' : '◐ Possible conditions'}

Your alert locations:
${locationList}

Check detailed conditions and forecasts:
[View Full Aurora Forecast](${process.env.APP_URL || 'https://app.example.com'}/cosmic-events?tab=aurora)

Clear skies,
Uncharted Galaxy Team
        `.trim();

        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject,
          body,
          from_name: 'Uncharted Aurora Alerts',
        });

        sentCount++;
      } catch (err) {
        console.error(`Error alerting user ${user.email}:`, err);
      }
    }

    return { sent: sentCount, total: allUsers.length };
  } catch (err) {
    console.error('Aurora alert check failed:', err);
    throw err;
  }
}