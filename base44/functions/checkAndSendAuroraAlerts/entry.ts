import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const NOAA_FORECAST_URL = 'https://services.swpc.noaa.gov/json/planetary_k_index_forecast.json';
const EARTH_RADIUS_KM = 6371;

function getKpColor(kp) {
  if (kp >= 7) return 'Very Strong';
  if (kp >= 5) return 'Strong';
  if (kp >= 3) return 'Moderate';
  return 'Low';
}

function getVisibilityRating(kp, latitude) {
  if (latitude < 50) {
    return kp >= 7 ? 'good' : kp >= 5 ? 'possible' : 'unlikely';
  } else {
    return kp >= 5 ? 'good' : kp >= 3 ? 'possible' : 'unlikely';
  }
}

async function fetchCurrentKpIndex() {
  try {
    const response = await fetch(NOAA_FORECAST_URL);
    const data = await response.json();
    if (data && data.length > 0) {
      const latest = data[0];
      return parseFloat(latest.estimated_kp) || parseFloat(latest.kp) || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching KP index:', error);
    return 0;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all active profiles with alerts enabled
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({});
    const currentKp = await fetchCurrentKpIndex();

    const alerts = [];

    for (const profile of profiles) {
      if (!profile.alert_prefs?.aurora_alerts_enabled) continue;
      if (!profile.alert_locations || profile.alert_locations.length === 0) continue;

      const kpThreshold = profile.alert_prefs?.kp_threshold || 5;

      // Only send if KP exceeds threshold
      if (currentKp < kpThreshold) continue;

      for (const location of profile.alert_locations) {
        const visibilityRating = getVisibilityRating(currentKp, location.lat);
        
        // Check if alert was recently sent (within 6 hours)
        const recentAlerts = await base44.asServiceRole.entities.AuroraAlertLog.filter({
          user_email: profile.user_email,
          location_name: location.name
        }, '-created_date', 1);

        const lastAlertTime = recentAlerts.length > 0 ? new Date(recentAlerts[0].created_date) : new Date(0);
        const hoursSinceLastAlert = (Date.now() - lastAlertTime.getTime()) / (1000 * 60 * 60);

        // Skip if alert was sent less than 6 hours ago
        if (hoursSinceLastAlert < 6) continue;

        // Send email alert
        const emailBody = `
Aurora Alert for ${location.name}

Current KP Index: ${currentKp.toFixed(1)} (${getKpColor(currentKp)})
Your Alert Threshold: ${kpThreshold}
Visibility Rating: ${visibilityRating}

The aurora activity is predicted to be ${getKpColor(currentKp).toLowerCase()} in your area. 
This is a great time to head out if you have clear skies!

Check real-time conditions and plan your shoot:
https://app.unchartedgalaxy.com/?page=TonightHub

Clear skies,
Uncharted Galaxy
        `.trim();

        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: profile.user_email,
            subject: `🌌 Aurora Alert: KP ${currentKp.toFixed(1)} near ${location.name}`,
            body: emailBody,
            from_name: 'Uncharted Galaxy'
          });

          // Log the alert
          await base44.asServiceRole.entities.AuroraAlertLog.create({
            user_email: profile.user_email,
            location_name: location.name,
            location_lat: location.lat,
            location_lon: location.lon,
            kp_index: currentKp,
            kp_threshold: kpThreshold,
            alert_type: 'email',
            visibility_rating: visibilityRating,
            sent_at: new Date().toISOString()
          });

          alerts.push({
            user: profile.user_email,
            location: location.name,
            kp: currentKp,
            threshold: kpThreshold,
            status: 'sent'
          });
        } catch (emailError) {
          console.error(`Failed to send email to ${profile.user_email}:`, emailError);
        }
      }
    }

    return Response.json({
      success: true,
      currentKp: currentKp.toFixed(1),
      alertsSent: alerts.length,
      alerts: alerts
    });
  } catch (error) {
    console.error('Error in checkAndSendAuroraAlerts:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});