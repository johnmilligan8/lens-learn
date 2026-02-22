import React, { useEffect, useRef } from 'react';

/**
 * LandscapeDetector: Real-time edge & horizon detection from camera feed
 * Provides terrain silhouette overlay + obstruction warnings
 */
export default function useLandscapeDetector(videoRef, canvasRef) {
  const horizonY = useRef(0);
  const terrainMask = useRef(null);
  const isProcessing = useRef(false);

  // Detect horizon line via Canny edge detection (simplified)
  const detectHorizon = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    if (isProcessing.current) return;
    isProcessing.current = true;

    const w = canvas.width;
    const h = canvas.height;

    // Create temp canvas for processing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

    // Draw video & convert to grayscale
    tempCtx.drawImage(video, 0, 0, w, h);
    const imgData = tempCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const gray = new Uint8Array(w * h);
    for (let i = 0; i < data.length; i += 4) {
      gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // Sobel edge detection (simplified horizontal edges)
    const edges = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const gy = gray[(y - 1) * w + x] * -1 + gray[(y + 1) * w + x] * 1; // Vertical gradient
        edges[idx] = Math.abs(gy);
      }
    }

    // Find strongest horizontal edge (horizon line)
    let maxScore = 0;
    let horizonRow = Math.floor(h * 0.65); // Default ~65% down (typical horizon)

    for (let y = Math.floor(h * 0.4); y < Math.floor(h * 0.85); y++) {
      let rowScore = 0;
      for (let x = 0; x < w; x++) {
        rowScore += edges[y * w + x];
      }
      if (rowScore > maxScore) {
        maxScore = rowScore;
        horizonRow = y;
      }
    }

    horizonY.current = horizonRow;

    // Build terrain mask (below horizon = terrain, above = sky)
    const mask = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const y = Math.floor(i / w);
      const x = i % w;
      // Terrain = lower edge/gradient areas below horizon
      if (y > horizonRow && edges[i] > 20) {
        mask[i] = 1; // Terrain/obstruction
      }
    }
    terrainMask.current = mask;

    isProcessing.current = false;
  };

  // Draw landscape silhouette overlay
  const drawLandscapeOverlay = (ctx, w, h, visColor) => {
    if (!terrainMask.current) return;

    const mask = terrainMask.current;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; // Darken obstructed areas
    ctx.globalCompositeOperation = 'multiply';

    // Draw terrain blocks
    const blockSize = 4;
    for (let y = horizonY.current; y < h; y += blockSize) {
      for (let x = 0; x < w; x += blockSize) {
        const idx = y * w + x;
        if (mask[idx]) {
          ctx.fillRect(x, y, blockSize, blockSize);
        }
      }
    }

    ctx.globalCompositeOperation = 'source-over';

    // Draw horizon line
    ctx.strokeStyle = visColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(0, horizonY.current);
    ctx.lineTo(w, horizonY.current);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  };

  // Check if celestial object is obstructed by terrain
  const isObstructed = (screenY) => {
    return screenY > horizonY.current;
  };

  useEffect(() => {
    const interval = setInterval(detectHorizon, 500); // Update every 500ms
    return () => clearInterval(interval);
  }, []);

  return { horizonY: horizonY.current, drawLandscapeOverlay, isObstructed, detectHorizon };
}