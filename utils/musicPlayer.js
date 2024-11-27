export const drawDefaultTheme = (ctx, width, height, dataArray, hue) => {
  const barWidth = width / 64;

  ctx.beginPath();
  ctx.moveTo(0, height);

  for (let i = 0; i < dataArray.length; i++) {
    const x = i * barWidth;
    const barHeight = (dataArray[i] / 255) * height;

    if (i === 0) {
      ctx.moveTo(x, height - barHeight);
    } else {
      ctx.lineTo(x, height - barHeight);
    }
  }

  ctx.lineTo(width, height);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, `hsla(${hue}, 70%, 50%, 0.8)`);
  gradient.addColorStop(1, `hsla(${hue}, 70%, 50%, 0.1)`);

  ctx.fillStyle = gradient;
  ctx.fill();
};

export const drawSpectrumTheme = (ctx, width, height, dataArray, hue) => {
  const barWidth = width / 128;
  const barGap = 2;

  for (let i = 0; i < dataArray.length; i++) {
    const barHeight = (dataArray[i] / 255) * height;
    const x = i * (barWidth + barGap);

    const gradient = ctx.createLinearGradient(x, height - barHeight, x, height);
    gradient.addColorStop(0, `hsla(${hue + i}, 70%, 50%, 0.8)`);
    gradient.addColorStop(1, `hsla(${hue + i}, 70%, 50%, 0.2)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(x, height - barHeight, barWidth, barHeight);
  }
};

export const drawParticlesTheme = (ctx, width, height, dataArray, hue) => {
  const particles = 50;
  const radius = 2;
  let prevY = height / 2;

  for (let i = 0; i < particles; i++) {
    const x = (width / particles) * i;
    const amplitude =
      dataArray[Math.floor((i * dataArray.length) / particles)] / 255;
    const y =
      height / 2 + (Math.sin(Date.now() * 0.001 + i) * amplitude * height) / 3;

    ctx.beginPath();
    ctx.arc(x, y, radius * (1 + amplitude), 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue + (i * 360) / particles}, 70%, 50%, ${
      0.3 + amplitude * 0.7
    })`;
    ctx.fill();

    if (i > 0) {
      ctx.beginPath();
      ctx.moveTo(x - width / particles, prevY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = `hsla(${hue + (i * 360) / particles}, 70%, 50%, 0.2)`;
      ctx.stroke();
    }
    prevY = y;
  }
};

 
export const drawMinimalTheme = (ctx, width, height, dataArray) => {
  const centerY = height / 2;
  let prevY = centerY;

  ctx.beginPath();
  ctx.moveTo(0, centerY);

  for (let i = 0; i < dataArray.length; i++) {
    const x = (width / dataArray.length) * i;
    const amplitude = dataArray[i] / 255;
    const y = centerY + ((amplitude - 0.5) * height) / 2;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.quadraticCurveTo(x - width / dataArray.length / 2, prevY, x, y);
    }
    prevY = y;
  }

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.stroke();
};

export const drawCircularVisualizer = (circularCanvas, dataArray, hue) => {
  if (!circularCanvas.value) return;

  const cCanvas = circularCanvas.value;
  const cCtx = cCanvas.getContext("2d");
  const centerX = cCanvas.width / 2;
  const centerY = cCanvas.height / 2;
  const radius = Math.min(centerX, centerY) - 10;

  cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);

  if (currentTheme.value === "minimal") {
    // 简约主题的圆形可视化器
    const segments = 32;
    const segmentAngle = (Math.PI * 2) / segments;

    cCtx.beginPath();
    for (let i = 0; i < segments; i++) {
      const amplitude = dataArray[i * 2] / 255;
      const r = radius * (0.8 + amplitude * 0.2);
      const x = centerX + Math.cos(i * segmentAngle) * r;
      const y = centerY + Math.sin(i * segmentAngle) * r;

      if (i === 0) {
        cCtx.moveTo(x, y);
      } else {
        cCtx.lineTo(x, y);
      }
    }
    cCtx.closePath();
    cCtx.strokeStyle = "#ffffff";
    cCtx.lineWidth = 2;
    cCtx.stroke();
  } else {
    // 其他主题的圆形可视化器
    const segments = 32;
    const segmentAngle = (Math.PI * 2) / segments;

    for (let i = 0; i < segments; i++) {
      const amplitude = dataArray[i * 2] / 255;
      const startAngle = i * segmentAngle;
      const endAngle = startAngle + segmentAngle;

      cCtx.beginPath();
      cCtx.arc(
        centerX,
        centerY,
        radius * (0.5 + amplitude * 0.5),
        startAngle,
        endAngle
      );
      cCtx.lineWidth = 2;
      cCtx.strokeStyle = `hsla(${hue + (i * 360) / segments}, 70%, 50%, ${
        0.3 + amplitude * 0.7
      })`;
      cCtx.stroke();
    }
  }
};