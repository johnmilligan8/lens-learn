import React from 'react';

/**
 * PrecisionAROverlay: Advanced rendering for AR with landscape integration
 * Handles Milky Way path, galactic core, composition guides, obstruction warnings
 */
export default function PrecisionAROverlay({
  ctx,
  w,
  h,
  coreAlt,
  coreAz,
  heading,
  manualOffset,
  visColor,
  visRating,
  moonAlt,
  moonAz,
  moonIllum,
  moonDist,
  shooterMode,
  selectedDate,
  selectedTime,
  horizonY,
  drawLandscapeOverlay,
  isObstructed
}) {
  const centerX = w / 2;
  const centerY = h / 2;
  const pxPerDegree = w / 100; // ~100° horizontal FoV

  // Adjusted heading with manual calibration
  const adjustedHeading = (heading + manualOffset) % 360;
  const azDev = ((coreAz - adjustedHeading + 360) % 360);
  const visualAz = azDev > 180 ? azDev - 360 : azDev;

  // Landscape overlay (obstruction visualization)
  drawLandscapeOverlay(ctx, w, h, visColor);

  // ===== MILKY WAY RENDERING =====
  if (coreAlt > -8) {
    const xPos = centerX + visualAz * pxPerDegree;
    const yPos = horizonY - coreAlt * pxPerDegree * 0.6;

    // Galactic equator (extended Milky Way path)
    ctx.strokeStyle = visColor;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);

    // North arc
    ctx.beginPath();
    ctx.arc(xPos, yPos + 80, 90, (Math.PI * 5) / 4, (Math.PI * 7) / 4);
    ctx.stroke();

    // South arc
    ctx.beginPath();
    ctx.arc(xPos, yPos - 60, 70, Math.PI / 4, (Math.PI * 3) / 4);
    ctx.stroke();

    ctx.setLineDash([]);

    // Sgr A* core
    const coreSize = 12;
    const isBlocked = isObstructed(yPos);

    ctx.fillStyle = isBlocked ? 'rgba(200, 50, 50, 0.6)' : visColor;
    ctx.globalAlpha = isBlocked ? 0.5 : 1;
    ctx.beginPath();
    ctx.arc(xPos, yPos, coreSize, 0, Math.PI * 2);
    ctx.fill();

    // Glow ring
    ctx.strokeStyle = visColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(xPos, yPos, coreSize + 15, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 1;

    // Core label with alt/az
    ctx.fillStyle = isBlocked ? '#ff6666' : visColor;
    ctx.font = 'bold 14px Montserrat';
    ctx.textAlign = 'left';
    ctx.fillText(`Sgr A* ${coreAlt.toFixed(1)}°`, xPos + 20, yPos - 8);
    ctx.font = '11px Montserrat';
    ctx.fillStyle = 'rgba(200, 200, 200, 0.9)';
    ctx.fillText(`Az: ${coreAz.toFixed(0)}°`, xPos + 20, yPos + 8);

    // Obstruction warning
    if (isBlocked) {
      ctx.fillStyle = '#ff6666';
      ctx.font = 'bold 12px Montserrat';
      ctx.textAlign = 'center';
      ctx.fillText('🚫 OBSTRUCTED by terrain', xPos, yPos + 35);
    }
  }

  // ===== COMPOSITION GUIDES =====
  if (shooterMode === 'photographer' && coreAlt > 5) {
    const coreX = centerX + visualAz * pxPerDegree;
    const coreY = horizonY - coreAlt * pxPerDegree * 0.6;

    // Rule of thirds grid
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo((w * i) / 3, 0);
      ctx.lineTo((w * i) / 3, h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, (h * i) / 3);
      ctx.lineTo(w, (h * i) / 3);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Foreground line (lower third)
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, (h * 2) / 3);
    ctx.lineTo(w, (h * 2) / 3);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255, 200, 100, 0.4)';
    ctx.font = '10px Montserrat';
    ctx.textAlign = 'center';
    ctx.fillText('← Place core here for foreground composition →', w / 2, (h * 2) / 3 + 15);
  }

  // ===== MOON POSITION & INTERFERENCE =====
  if (moonAlt > -5) {
    const moonX = centerX + ((moonAz - adjustedHeading + 360) % 360 - 180) * pxPerDegree;
    const moonY = horizonY - moonAlt * pxPerDegree * 0.6;

    // Moon circle
    ctx.fillStyle = `rgba(255, 240, 180, ${0.3 + moonIllum / 100 * 0.4})`;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
    ctx.fill();

    // Moon label
    ctx.fillStyle = '#ffffb0';
    ctx.font = '11px Montserrat';
    ctx.textAlign = 'center';
    ctx.fillText(`🌙 ${moonIllum}%`, moonX, moonY + 30);

    // Interference zone (if close to core)
    if (moonDist < 60) {
      ctx.strokeStyle = '#ffaa44';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // ===== HEADING & COMPASS =====
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(10, 10, 240, 110);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Montserrat';
  ctx.textAlign = 'left';
  ctx.fillText(`📍 Compass: ${Math.round(adjustedHeading)}°`, 20, 32);

  ctx.fillStyle = '#aaaaaa';
  ctx.font = '11px Montserrat';
  ctx.fillText(`Device Alt: ${coreAlt.toFixed(1)}° | Az: ${coreAz.toFixed(0)}°`, 20, 50);
  ctx.fillText(`Visibility: ${visRating}`, 20, 68);
  ctx.fillText(`📅 ${selectedDate} ${selectedTime} UTC`, 20, 86);
  ctx.fillText(`Offset: ${manualOffset.toFixed(1)}° | Moon Dist: ${moonDist.toFixed(0)}°`, 20, 104);

  // ===== VISIBILITY SCORE BAR =====
  const scoreWidth = (w - 40) * (parseInt(visRating) / 100);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(20, h - 140, w - 40, 20);

  ctx.fillStyle = visColor;
  ctx.globalAlpha = 0.8;
  ctx.fillRect(20, h - 140, scoreWidth, 20);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Montserrat';
  ctx.textAlign = 'center';
  ctx.fillText(`Milky Way Visibility: ${visRating}`, w / 2, h - 120);

  // ===== MODE-AWARE TIPS & BOTTOM INSTRUCTIONS =====
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, h - 95, w, 95);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#cccccc';
  ctx.font = '11px Montserrat';
  ctx.fillText('Drag horizontally to calibrate compass · Point at landmark to align', w / 2, h - 75);

  if (shooterMode === 'photographer') {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 10px Montserrat';
    ctx.fillText('📷 Pro tip: Use fast glass (f/1.4–f/2.0), 15–20sec at ISO 3200–6400', w / 2, h - 55);
  } else if (shooterMode === 'smartphone') {
    ctx.fillStyle = '#87ceeb';
    ctx.font = 'bold 10px Montserrat';
    ctx.fillText('📱 Night Mode: 1–3 sec exposure, steady tripod essential', w / 2, h - 55);
  } else {
    ctx.fillStyle = '#9966ff';
    ctx.font = 'bold 10px Montserrat';
    ctx.fillText('👁 Allow 20 min dark adaptation to see full Milky Way detail', w / 2, h - 55);
  }

  if (moonIllum > 70) {
    ctx.fillStyle = '#ffaa44';
    ctx.fillText(`⚠️ Bright moon (${moonIllum}%) will wash sky – consider darker location`, w / 2, h - 35);
  }

  if (coreAlt < 10 && coreAlt > 0) {
    ctx.fillStyle = '#ffaa44';
    ctx.fillText('⚠️ Low altitude – wait 1–2 hours for better angle', w / 2, h - 15);
  }
}