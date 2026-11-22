/*
 * NIBE Heat Pump Card — a futuristic Lovelace card for NIBE heat pumps.
 * Single file, no build step, no external dependencies.
 */
const CARD_VERSION = "1.0.1";

const DEFAULT_ENTITIES = {
  status: "sensor.priority_31029",
  outdoor_temp: "sensor.current_outdoor_temperature_bt1_30002",
  heating_curve: "number.heating_curve_climate_system_1_40027",
  power: "sensor.energy_log_current_power_consumption_32306",
  cop: "sensor.s735_nibe_cop",
  compressor_freq: "sensor.compressor_frequency_current_31047",
  house_temp: "sensor.average_tempratur_house",
  hot_water_top: "sensor.hot_water_top_bt7_30009",
  hot_water_charging: "sensor.hot_water_charging_bt6_30010",
  supply_line: "sensor.supply_line_bt2_30006",
  return_line: "sensor.return_line_bt3_30008",
  flow: "sensor.flow_sensor_bf1_30041",
  extract_air: "sensor.extr_air_bt21_30021",
  exhaust_air: "sensor.exh_air_bt20_30020",
  boost_automation: "automation.heating_curve_cheap_electricity_boost_nordpool",
  cheap_period: "binary_sensor.nordpool_cheap_heating_period",
  cheap_plan: "sensor.nordpool_cheap_heating_plan",
  price: "sensor.nordpool_kwh_se3_sek_3_10_025",
};

const ENTITY_LABELS = {
  status: "Status (priority)",
  outdoor_temp: "Outdoor temperature (BT1)",
  heating_curve: "Heating curve",
  power: "Power consumption",
  cop: "COP",
  compressor_freq: "Compressor frequency",
  house_temp: "Average house temperature",
  hot_water_top: "Hot water top (BT7)",
  hot_water_charging: "Hot water charging (BT6)",
  supply_line: "Supply line (BT2)",
  return_line: "Return line (BT3)",
  flow: "Flow sensor (BF1)",
  extract_air: "Extract air (BT21)",
  exhaust_air: "Exhaust air (BT20)",
  boost_automation: "Price boost automation",
  cheap_period: "Cheap price period (binary sensor)",
  cheap_plan: "Cheap heating plan (text sensor, optional)",
  price: "Electricity price (Nordpool, optional)",
};

const GAUGE_LEN = 376.99; // 270° of r=80 circle

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Map a temperature to a cold→hot color. */
function tempColor(t, lo = 20, hi = 60) {
  if (t == null || isNaN(t)) return "#5b6b8c";
  const p = clamp((t - lo) / (hi - lo));
  const hue = (200 + p * 175) % 360; // cyan → violet → magenta → red-orange (skips green)
  return `hsl(${hue}, 95%, ${60 - p * 2}%)`;
}

/* ---------------------------------- icons --------------------------------- */
const ICON = {
  sun: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><g stroke-linecap="round"><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></g></svg>`,
  bolt: `<svg viewBox="0 0 24 24"><path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z" stroke-linejoin="round"/></svg>`,
  spark: `<svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5" stroke-linecap="round"/></svg>`,
  home: `<svg viewBox="0 0 24 24"><path d="M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 20v-5h4v5"/></svg>`,
  curve: `<svg viewBox="0 0 24 24"><path d="M3 20h18M3 20V4" stroke-linecap="round"/><path d="M5 17c4-1 7-4 9-8s4-5 6-5" stroke-linecap="round"/></svg>`,
  drop: `<svg viewBox="0 0 24 24"><path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z" stroke-linejoin="round"/></svg>`,
  fan: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.8"/><path d="M12 10.2c-.5-3 .3-6.2 3-6.2 2.2 0 2.6 3.6-3 6.2zM13.8 12c3-.5 6.2.3 6.2 3 0 2.2-3.6 2.6-6.2-3zM12 13.8c.5 3-.3 6.2-3 6.2-2.2 0-2.6-3.6 3-6.2zM10.2 12c-3 .5-6.2-.3-6.2-3 0-2.2 3.6-2.6 6.2 3z" stroke-linejoin="round"/></svg>`,
  wave: `<svg viewBox="0 0 24 24"><path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke-linecap="round"/></svg>`,
};

/* ---------------------------------- styles -------------------------------- */
const STYLES = `
:host {
  --nh-bg1: #070b17;
  --nh-bg2: #0d1630;
  --nh-panel: rgba(120, 170, 255, 0.055);
  --nh-border: rgba(120, 180, 255, 0.14);
  --nh-text: #e8f1ff;
  --nh-dim: #7d90b5;
  --nh-faint: #43557a;
  --nh-cyan: #38e1ff;
  --nh-hot: #ff7a3d;
  --nh-cold: #4da3ff;
  --nh-good: #3dffb0;
  --nh-accent: var(--nh-cyan);
  display: block;
}
ha-card {
  display: block;
  overflow: hidden;
  border-radius: var(--ha-card-border-radius, 22px);
  border: 1px solid var(--nh-border);
  background:
    radial-gradient(120% 70% at 85% -10%, color-mix(in srgb, var(--nh-accent) 22%, transparent), transparent 60%),
    radial-gradient(90% 60% at -10% 110%, rgba(77, 163, 255, 0.14), transparent 60%),
    linear-gradient(160deg, var(--nh-bg2), var(--nh-bg1));
  color: var(--nh-text);
  font-family: var(--ha-font-family-body, Inter, "Segoe UI", Roboto, system-ui, sans-serif);
  font-variant-numeric: tabular-nums;
  transition: background 0.8s ease;
}
.wrap { position: relative; padding: 18px; display: grid; gap: 14px; }
.wrap[data-mode="heating"]  { --nh-accent: #ff8a3d; }
.wrap[data-mode="hotwater"] { --nh-accent: #ff4d8d; }
.wrap[data-mode="cooling"]  { --nh-accent: #38e1ff; }
.wrap[data-mode="off"]      { --nh-accent: #6b7a99; }
.grid-bg {
  position: absolute; inset: 0; pointer-events: none; opacity: 0.5;
  background-image:
    linear-gradient(var(--nh-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--nh-border) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: radial-gradient(ellipse at 50% 0%, #000 10%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at 50% 0%, #000 10%, transparent 75%);
}
button { all: unset; cursor: pointer; box-sizing: border-box; }
button:focus-visible { outline: 2px solid var(--nh-accent); outline-offset: 2px; border-radius: 10px; }
svg { display: block; }
.ico svg, .chip svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 1.7; }
small { font-size: 0.55em; font-weight: 500; color: var(--nh-dim); margin-left: 2px; letter-spacing: 0; }
.lbl { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--nh-dim); font-weight: 600; }
.unavail { opacity: 0.45; }

/* header */
header { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
.logo {
  width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center;
  background: linear-gradient(140deg, color-mix(in srgb, var(--nh-accent) 35%, transparent), transparent);
  border: 1px solid color-mix(in srgb, var(--nh-accent) 45%, transparent);
  box-shadow: 0 0 18px color-mix(in srgb, var(--nh-accent) 35%, transparent);
  color: var(--nh-accent);
}
.logo svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.7; }
.wrap.running .logo svg { animation: spin 4s linear infinite; }
.title { font-size: 17px; font-weight: 700; letter-spacing: 0.02em; }
.sub { font-size: 10px; letter-spacing: 0.22em; color: var(--nh-dim); margin-top: 2px; display: flex; align-items: center; gap: 6px; }
.live { width: 6px; height: 6px; border-radius: 50%; background: var(--nh-good); box-shadow: 0 0 8px var(--nh-good); animation: blink 2s ease-in-out infinite; }
.chips { display: flex; gap: 8px; flex-wrap: wrap; }
.chip {
  display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; border-radius: 999px;
  background: var(--nh-panel); border: 1px solid var(--nh-border);
  font-size: 13px; font-weight: 600; backdrop-filter: blur(6px);
  transition: border-color 0.3s, background 0.3s;
}
.chip:hover { border-color: color-mix(in srgb, var(--nh-accent) 60%, transparent); }
.chip .ico { width: 16px; height: 16px; color: #ffc24d; }
.chip.status { border-color: color-mix(in srgb, var(--nh-accent) 55%, transparent); background: color-mix(in srgb, var(--nh-accent) 14%, transparent); }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--nh-accent); box-shadow: 0 0 10px var(--nh-accent); }
.wrap:not([data-mode="off"]) .dot { animation: pulse 1.8s ease-out infinite; }

/* hero */
.hero { position: relative; display: grid; grid-template-columns: minmax(150px, 0.9fr) 1.1fr; gap: 14px; align-items: stretch; }
.panel {
  position: relative; background: var(--nh-panel); border: 1px solid var(--nh-border);
  border-radius: 18px; backdrop-filter: blur(8px);
}
.gauge { position: relative; display: grid; place-items: center; padding: 10px; }
.gauge svg { width: 100%; max-width: 210px; aspect-ratio: 1; }
.g-track { stroke: rgba(120, 170, 255, 0.1); }
.g-arc { stroke: url(#nhGrad); transition: stroke-dasharray 1s cubic-bezier(.2,.8,.2,1); filter: drop-shadow(0 0 6px color-mix(in srgb, var(--nh-accent) 70%, transparent)); }
.g-tick { stroke: var(--nh-faint); stroke-width: 1.4; }
.g-tick.on { stroke: var(--nh-accent); }
.g-center { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; gap: 2px; }
.g-val { font-size: 34px; font-weight: 700; line-height: 1; letter-spacing: -0.02em; }
.g-ring { position: absolute; inset: 22%; border-radius: 50%; border: 1px dashed var(--nh-border); }
.wrap.running .g-ring { animation: spin 18s linear infinite; border-color: color-mix(in srgb, var(--nh-accent) 30%, transparent); }

.stats { display: grid; gap: 10px; grid-template-rows: repeat(3, 1fr); }
.stat { display: grid; grid-template-columns: 38px 1fr; align-items: center; gap: 12px; padding: 10px 14px; transition: border-color .3s, transform .2s; }
.stat:hover, .tile:hover, .gauge:hover { border-color: color-mix(in srgb, var(--nh-accent) 50%, transparent); }
.stat .ico {
  width: 38px; height: 38px; padding: 9px; box-sizing: border-box; border-radius: 12px;
  background: rgba(120, 170, 255, 0.08); color: var(--nh-cyan);
}
.stat.power .ico { color: #ffd84d; }
.stat.cop .ico { color: var(--nh-good); }
.stat.house .ico { color: #b78bff; }
.s-val { font-size: 22px; font-weight: 700; line-height: 1.1; }
.bar { height: 4px; border-radius: 4px; background: rgba(120, 170, 255, 0.1); margin-top: 6px; overflow: hidden; }
.bar > i { display: block; height: 100%; width: 0; border-radius: 4px; background: linear-gradient(90deg, #ff4d6d, #ffd84d, var(--nh-good)); transition: width 1s ease; box-shadow: 0 0 8px var(--nh-good); }

/* price boost */
.boost {
  --nh-boost: #3dffb0;
  position: relative; overflow: hidden; display: grid; grid-template-columns: auto 1fr auto; gap: 14px; align-items: center;
  padding: 12px 14px; border-radius: 18px; background: var(--nh-panel); border: 1px solid var(--nh-border);
}
.boost[hidden] { display: none; }
.boost[data-state="disabled"] { --nh-boost: #6b7a99; }
.boost[data-state="armed"] { --nh-boost: #ffd84d; }
.boost[data-state="active"] {
  border-color: color-mix(in srgb, var(--nh-boost) 70%, transparent);
  background: linear-gradient(100deg, color-mix(in srgb, var(--nh-boost) 16%, transparent), var(--nh-panel) 60%);
  box-shadow: 0 0 24px color-mix(in srgb, var(--nh-boost) 22%, transparent), inset 0 0 18px color-mix(in srgb, var(--nh-boost) 10%, transparent);
}
.boost[data-state="active"]::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(100deg, transparent 30%, color-mix(in srgb, var(--nh-boost) 25%, transparent) 50%, transparent 70%);
  transform: translateX(-100%); animation: sweep 2.8s ease-in-out infinite;
}
.b-ico {
  width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; color: var(--nh-boost);
  border: 1px solid color-mix(in srgb, var(--nh-boost) 45%, transparent);
  background: color-mix(in srgb, var(--nh-boost) 12%, transparent);
}
.b-ico svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.8; }
.boost[data-state="active"] .b-ico { box-shadow: 0 0 16px color-mix(in srgb, var(--nh-boost) 55%, transparent); }
.boost[data-state="active"] .b-ico svg { animation: zap 1.4s ease-in-out infinite; }
.b-main { min-width: 0; display: grid; gap: 3px; }
.b-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--nh-boost); }
.b-badge { font-size: 9px; letter-spacing: .16em; padding: 2px 7px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--nh-boost) 50%, transparent); color: var(--nh-boost); }
.b-sub { font-size: 12px; color: var(--nh-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.b-price { display: grid; justify-items: end; gap: 4px; min-width: 110px; padding: 2px 4px; border-radius: 10px; }
.b-price[hidden] { display: none; }
.b-price:hover { background: rgba(120, 170, 255, 0.06); }
.b-price .p { font-size: 18px; font-weight: 700; }
.p-scale { position: relative; width: 110px; height: 4px; border-radius: 4px; background: linear-gradient(90deg, #3dffb0, #ffd84d, #ff4d6d); opacity: .85; }
.p-scale i { position: absolute; top: 50%; width: 10px; height: 10px; border-radius: 50%; background: #fff; transform: translate(-50%, -50%); box-shadow: 0 0 8px #fff; transition: left 1s ease; }
.p-range { font-size: 9px; color: var(--nh-faint); letter-spacing: .08em; display: flex; justify-content: space-between; width: 110px; }
.curve-boost { display: none; font-size: 9px; letter-spacing: .14em; color: #3dffb0; border: 1px solid rgba(61,255,176,.5); border-radius: 999px; padding: 1px 6px; margin-left: 6px; }
.wrap.boosting .curve-boost { display: inline-block; }
.wrap.boosting { box-shadow: inset 0 0 0 1px rgba(61, 255, 176, 0.25); border-radius: inherit; }

/* hydronic flow */
.flow { padding: 12px 12px 8px; }
.flow-head { display: flex; justify-content: space-between; align-items: center; padding: 0 4px 4px; }
.schem { position: relative; aspect-ratio: 400 / 140; }
.schem svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.pipe-base { stroke: rgba(120, 170, 255, 0.1); stroke-width: 8; stroke-linecap: round; fill: none; }
.pipe { stroke-width: 3; stroke-linecap: round; fill: none; stroke-dasharray: 7 11; opacity: 0.35; }
.wrap.flowing .pipe { opacity: 1; animation: flow var(--nh-flow-dur, 2s) linear infinite; filter: drop-shadow(0 0 4px currentColor); }
.unit { fill: rgba(120, 170, 255, 0.07); stroke: var(--nh-border); stroke-width: 1.2; }
.unit-acc { stroke: var(--nh-accent); stroke-width: 1.6; fill: none; }
.rotor { transform-origin: 49px 62px; transform-box: view-box; }
.wrap.running .rotor { animation: spin var(--nh-rotor-dur, 1.2s) linear infinite; }
.house-glow { fill: color-mix(in srgb, var(--nh-accent) 18%, transparent); }
.tag {
  position: absolute; transform: translate(-50%, -50%); display: grid; justify-items: center; gap: 1px;
  padding: 4px 9px; border-radius: 10px; background: rgba(7, 11, 23, 0.75);
  border: 1px solid var(--nh-border); backdrop-filter: blur(6px); white-space: nowrap;
}
.tag .t-val { font-size: 15px; font-weight: 700; }
.tag .lbl { font-size: 8.5px; }
.tag:hover { border-color: var(--nh-accent); }

/* duo */
.duo { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.tile { padding: 14px; display: grid; gap: 10px; align-content: start; transition: border-color .3s; }
.tile-head { display: flex; align-items: center; gap: 8px; }
.tile-head .ico { width: 18px; height: 18px; color: var(--nh-cyan); }
.tank-wrap { display: grid; grid-template-columns: 54px 1fr; gap: 14px; align-items: center; }
.tank {
  position: relative; height: 112px; border-radius: 27px; overflow: hidden;
  border: 1.5px solid var(--nh-border); background: rgba(120, 170, 255, 0.05);
}
.tank-fill {
  position: absolute; left: 0; right: 0; bottom: 0; height: 0;
  background: linear-gradient(to top, var(--nh-tank-bot, #4da3ff), var(--nh-tank-top, #ff7a3d));
  transition: height 1.2s ease; box-shadow: 0 0 22px var(--nh-tank-top, #ff7a3d);
}
.tank-fill::before {
  content: ""; position: absolute; left: -50%; top: -6px; width: 200%; height: 12px;
  background: radial-gradient(circle at 10px -4px, transparent 9px, rgba(255,255,255,.35) 10px) 0 0 / 20px 12px repeat-x;
  animation: waveX 3s linear infinite; opacity: .6;
}
.tank::after { content: ""; position: absolute; inset: 6px 10px auto auto; width: 6px; height: 40%; border-radius: 4px; background: rgba(255,255,255,.12); }
.bubbles i { position: absolute; bottom: -8px; width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,.5); opacity: 0; }
.wrap[data-mode="hotwater"] .bubbles i { animation: bubble 2.6s ease-in infinite; }
.bubbles i:nth-child(1) { left: 25%; animation-delay: 0s; }
.bubbles i:nth-child(2) { left: 55%; animation-delay: .9s; }
.bubbles i:nth-child(3) { left: 40%; animation-delay: 1.7s; }
.readings { display: grid; gap: 10px; }
.reading { display: grid; gap: 2px; padding: 4px 6px; border-radius: 10px; }
.reading:hover { background: rgba(120, 170, 255, 0.06); }
.r-val { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.r-val .sw { width: 8px; height: 8px; border-radius: 50%; flex: none; }

.vent { display: grid; grid-template-columns: 54px 1fr; gap: 14px; align-items: center; }
.vent-fan {
  width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center;
  border: 1.5px solid var(--nh-border); color: var(--nh-cyan);
  background: radial-gradient(circle, rgba(56, 225, 255, 0.15), transparent 70%);
}
.vent-fan svg { width: 34px; height: 34px; fill: rgba(56,225,255,.15); stroke: currentColor; stroke-width: 1.4; animation: spin 2.4s linear infinite; }
.vent-fan.stopped svg { animation: none; }
.delta { font-size: 12px; color: var(--nh-dim); display: flex; align-items: center; gap: 6px; margin-top: 2px; }
.delta b { color: var(--nh-good); font-weight: 700; }

/* footer */
footer { display: flex; gap: 10px; flex-wrap: wrap; }
.pill {
  flex: 1 1 160px; display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 10px 14px; border-radius: 14px; background: var(--nh-panel); border: 1px solid var(--nh-border);
}
.pill:hover { border-color: color-mix(in srgb, var(--nh-accent) 50%, transparent); }
.pill .l { display: flex; align-items: center; gap: 8px; }
.pill .ico { width: 18px; height: 18px; color: var(--nh-accent); }
.pill .p-val { font-size: 16px; font-weight: 700; }
.ver { font-size: 9px; color: var(--nh-faint); letter-spacing: .15em; align-self: center; margin-left: auto; }

@keyframes sweep { to { transform: translateX(100%); } }
@keyframes zap { 50% { transform: scale(1.15); filter: drop-shadow(0 0 6px currentColor); } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes flow { to { stroke-dashoffset: -36; } }
@keyframes blink { 50% { opacity: .3; } }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--nh-accent) 70%, transparent); } 100% { box-shadow: 0 0 0 9px transparent; } }
@keyframes waveX { to { transform: translateX(20px); } }
@keyframes bubble { 0% { transform: translateY(0); opacity: 0; } 20% { opacity: .8; } 100% { transform: translateY(-110px); opacity: 0; } }

@media (max-width: 460px) {
  .hero { grid-template-columns: 1fr; }
  .gauge svg { max-width: 180px; }
  .duo { grid-template-columns: 1fr; }
  .boost { grid-template-columns: auto 1fr; }
  .b-price { grid-column: 1 / -1; justify-items: start; }
  .b-sub { white-space: normal; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before { animation: none !important; transition: none !important; }
}
`;

/* -------------------------------- template -------------------------------- */
function gaugeTicks() {
  let out = "";
  const n = 28;
  for (let i = 0; i < n; i++) {
    const a = ((135 + (270 / (n - 1)) * i) * Math.PI) / 180;
    const r1 = 93, r2 = i % 3 === 0 ? 86 : 89;
    out += `<line class="g-tick" data-i="${i}" x1="${100 + r1 * Math.cos(a)}" y1="${100 + r1 * Math.sin(a)}" x2="${100 + r2 * Math.cos(a)}" y2="${100 + r2 * Math.sin(a)}"/>`;
  }
  return out;
}

function template(c) {
  const v = (k) => `<span data-v="${k}">—</span>`;
  return `
<ha-card>
  <div class="wrap" data-mode="idle">
    <div class="grid-bg"></div>

    <header>
      <div class="brand">
        <div class="logo">${ICON.fan}</div>
        <div>
          <div class="title">${esc(c.title)}</div>
          <div class="sub"><span class="live"></span>LIVE TELEMETRY</div>
        </div>
      </div>
      <div class="chips">
        <button class="chip status" data-e="status" title="Status"><span class="dot"></span>${v("status")}</button>
        <button class="chip" data-e="outdoor_temp" title="Outdoor temperature"><span class="ico">${ICON.sun}</span>${v("outdoor_temp")}</button>
      </div>
    </header>

    <section class="hero">
      <button class="panel gauge" data-e="compressor_freq" title="Compressor frequency">
        <svg viewBox="0 0 200 200">
          <defs>
            <linearGradient id="nhGrad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stop-color="#38e1ff"/>
              <stop offset="1" stop-color="var(--nh-accent)" style="stop-color: var(--nh-accent)"/>
            </linearGradient>
          </defs>
          ${gaugeTicks()}
          <circle class="g-track" cx="100" cy="100" r="80" fill="none" stroke-width="10" stroke-linecap="round"
            stroke-dasharray="${GAUGE_LEN} 999" transform="rotate(135 100 100)"/>
          <circle class="g-arc" cx="100" cy="100" r="80" fill="none" stroke-width="10" stroke-linecap="round"
            stroke-dasharray="0 999" transform="rotate(135 100 100)"/>
        </svg>
        <div class="g-ring"></div>
        <div class="g-center">
          <div class="g-val">${v("compressor_freq")}</div>
          <div class="lbl">Compressor</div>
        </div>
      </button>

      <div class="stats">
        <button class="panel stat power" data-e="power" title="Power used">
          <span class="ico">${ICON.bolt}</span>
          <div><div class="lbl">Power used</div><div class="s-val">${v("power")}</div></div>
        </button>
        <button class="panel stat cop" data-e="cop" title="Performance (COP)">
          <span class="ico">${ICON.spark}</span>
          <div><div class="lbl">Performance · COP</div><div class="s-val">${v("cop")}</div><div class="bar"><i data-bar="cop"></i></div></div>
        </button>
        <button class="panel stat house" data-e="house_temp" title="Average house temperature">
          <span class="ico">${ICON.home}</span>
          <div><div class="lbl">Avg. house temp</div><div class="s-val">${v("house_temp")}</div></div>
        </button>
      </div>
    </section>

    <section class="boost" data-state="disabled" hidden>
      <button class="b-ico" data-e="boost_automation" title="Price boost automation">${ICON.bolt}</button>
      <button class="b-main" data-e="cheap_period" title="Cheap price period">
        <span class="b-title"><span data-boost-title>Price boost</span><span class="b-badge" data-boost-badge>OFF</span></span>
        <span class="b-sub" data-boost-sub>—</span>
      </button>
      <button class="b-price" data-e="price" title="Electricity price">
        <span class="lbl">Spot price</span>
        <span class="p">${v("price")}</span>
        <span class="p-scale"><i data-price-mark></i></span>
        <span class="p-range"><span data-price-min>—</span><span data-price-max>—</span></span>
      </button>
    </section>

    <section class="panel flow">
      <div class="flow-head"><span class="lbl">Climate system · hydronic loop</span></div>
      <div class="schem">
        <svg viewBox="0 0 400 140" preserveAspectRatio="xMidYMid meet">
          <!-- pipes -->
          <path class="pipe-base" d="M86 46 H324"/>
          <path class="pipe-base" d="M324 94 H86"/>
          <path class="pipe" data-pipe="supply" d="M86 46 H324"/>
          <path class="pipe" data-pipe="return" d="M324 94 H86"/>
          <!-- heat pump unit -->
          <rect class="unit" x="12" y="26" width="74" height="88" rx="12"/>
          <rect class="unit-acc" x="12" y="26" width="74" height="88" rx="12" opacity=".35"/>
          <circle cx="49" cy="62" r="23" fill="none" stroke="rgba(120,170,255,.2)" stroke-width="1.2"/>
          <g class="rotor" fill="rgba(56,225,255,.18)" stroke="#38e1ff" stroke-width="1.2">
            <path d="M49 62 C47 52 50 44 56 42 C60 46 56 56 49 62Z"/>
            <path d="M49 62 C59 60 67 63 69 69 C65 73 55 69 49 62Z"/>
            <path d="M49 62 C51 72 48 80 42 82 C38 78 42 68 49 62Z"/>
            <path d="M49 62 C39 64 31 61 29 55 C33 51 43 55 49 62Z"/>
            <circle cx="49" cy="62" r="3" fill="#38e1ff"/>
          </g>
          <g stroke="rgba(120,170,255,.25)" stroke-width="1.5" stroke-linecap="round">
            <path d="M24 96 H74"/><path d="M24 102 H74"/><path d="M24 108 H60"/>
          </g>
          <!-- house -->
          <path class="house-glow" d="M326 60 L356 34 L386 60 V112 H326 Z"/>
          <path d="M318 62 L356 28 L394 62" fill="none" stroke="var(--nh-accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
          <rect class="unit" x="326" y="58" width="60" height="54" rx="4"/>
          <g fill="none" stroke="rgba(232,241,255,.55)" stroke-width="1.4" stroke-linecap="round">
            <path d="M338 76 v24 M346 76 v24 M354 76 v24 M362 76 v24 M370 76 v24"/>
            <path d="M334 76 H374 M334 100 H374"/>
          </g>
        </svg>
        <button class="tag" data-e="supply_line" style="left:50%; top:17%" title="Supply line (BT2)">
          <span class="lbl">Supply · BT2</span><span class="t-val">${v("supply_line")}</span>
        </button>
        <button class="tag" data-e="flow" style="left:50%; top:50%" title="Flow (BF1)">
          <span class="lbl">Flow · BF1</span><span class="t-val">${v("flow")}</span>
        </button>
        <button class="tag" data-e="return_line" style="left:50%; top:84%" title="Return line (BT3)">
          <span class="lbl">Return · BT3</span><span class="t-val">${v("return_line")}</span>
        </button>
      </div>
    </section>

    <section class="duo">
      <div class="panel tile">
        <div class="tile-head"><span class="ico">${ICON.drop}</span><span class="lbl">Hot water</span></div>
        <div class="tank-wrap">
          <div class="tank"><div class="tank-fill"></div><div class="bubbles"><i></i><i></i><i></i></div></div>
          <div class="readings">
            <button class="reading" data-e="hot_water_top" title="Hot water top (BT7)">
              <span class="lbl">Top · BT7</span>
              <span class="r-val"><span class="sw" data-sw="hot_water_top"></span>${v("hot_water_top")}</span>
            </button>
            <button class="reading" data-e="hot_water_charging" title="Hot water charging (BT6)">
              <span class="lbl">Charging · BT6</span>
              <span class="r-val"><span class="sw" data-sw="hot_water_charging"></span>${v("hot_water_charging")}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="panel tile">
        <div class="tile-head"><span class="ico">${ICON.wave}</span><span class="lbl">Ventilation</span></div>
        <div class="vent">
          <div class="vent-fan">${ICON.fan}</div>
          <div class="readings">
            <button class="reading" data-e="extract_air" title="Extract air (BT21)">
              <span class="lbl">Extract air · BT21</span>
              <span class="r-val"><span class="sw" data-sw="extract_air"></span>${v("extract_air")}</span>
            </button>
            <button class="reading" data-e="exhaust_air" title="Exhaust air (BT20)">
              <span class="lbl">Exhaust air · BT20</span>
              <span class="r-val"><span class="sw" data-sw="exhaust_air"></span>${v("exhaust_air")}</span>
            </button>
            <div class="delta">Heat recovered <b data-delta>—</b></div>
          </div>
        </div>
      </div>
    </section>

    <footer>
      <button class="pill" data-e="heating_curve" title="Heating curve">
        <span class="l"><span class="ico">${ICON.curve}</span><span class="lbl">Heating curve</span><span class="curve-boost">BOOST</span></span>
        <span class="p-val">${v("heating_curve")}</span>
      </button>
      <button class="pill" data-e="supply_line" title="Supply / return ΔT">
        <span class="l"><span class="ico">${ICON.wave}</span><span class="lbl">Loop ΔT</span></span>
        <span class="p-val" data-loopdelta>—</span>
      </button>
    </footer>
  </div>
</ha-card>`;
}

/* ---------------------------------- card ---------------------------------- */
class NibeHeatpumpCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static getStubConfig() {
    return { title: "Heat Pump", entities: { ...DEFAULT_ENTITIES } };
  }

  static getConfigElement() {
    return document.createElement("nibe-heatpump-card-editor");
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = {
      title: "Heat Pump",
      max_frequency: 120,
      max_cop: 6,
      ...config,
      entities: { ...DEFAULT_ENTITIES, ...(config.entities || {}) },
    };
    this._build();
    if (this._hass) this._update();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) this._build();
    this._update();
  }

  getCardSize() {
    return 9;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  _build() {
    if (!this._config) return;
    this.shadowRoot.innerHTML = `<style>${STYLES}</style>${template(this._config)}`;
    this.shadowRoot.querySelectorAll("[data-e]").forEach((el) =>
      el.addEventListener("click", () => this._moreInfo(el.dataset.e))
    );
    this._$ = (s) => this.shadowRoot.querySelector(s);
    this._$$ = (s) => this.shadowRoot.querySelectorAll(s);
    this._built = true;
  }

  _moreInfo(key) {
    const entityId = this._config.entities[key];
    if (!entityId) return;
    const ev = new Event("hass-more-info", { bubbles: true, composed: true });
    ev.detail = { entityId };
    this.dispatchEvent(ev);
  }

  _read(key) {
    const id = this._config.entities[key];
    const s = id && this._hass && this._hass.states[id];
    if (!s || s.state === "unavailable" || s.state === "unknown") return { ok: false };
    const num = parseFloat(s.state);
    return { ok: true, s, num: isNaN(num) ? null : num, unit: s.attributes.unit_of_measurement || "" };
  }

  _fmt(r, dec = 1) {
    if (!r.ok) return "—";
    if (r.num == null) {
      const txt = this._hass.formatEntityState ? this._hass.formatEntityState(r.s) : r.s.state;
      return esc(txt);
    }
    const n = r.num.toFixed(dec);
    return `${esc(n)}${r.unit ? `<small>${esc(r.unit)}</small>` : ""}`;
  }

  _set(key, dec) {
    const r = this._read(key);
    this._$$(`[data-v="${key}"]`).forEach((el) => {
      el.innerHTML = this._fmt(r, dec);
      el.classList.toggle("unavail", !r.ok);
    });
    const sw = this._$(`[data-sw="${key}"]`);
    if (sw) {
      const col = tempColor(r.num);
      sw.style.background = col;
      sw.style.boxShadow = `0 0 8px ${col}`;
    }
    return r;
  }

  _update() {
    if (!this._built || !this._hass) return;
    const c = this._config;
    const wrap = this._$(".wrap");

    const status = this._set("status");
    const outdoor = this._set("outdoor_temp", 1);
    this._set("heating_curve", 0);
    const power = this._set("power", this._read("power").num >= 100 ? 0 : 2);
    const cop = this._set("cop", 2);
    const freq = this._set("compressor_freq", 0);
    this._set("house_temp", 1);
    const hwTop = this._set("hot_water_top", 1);
    const hwChg = this._set("hot_water_charging", 1);
    const sup = this._set("supply_line", 1);
    const ret = this._set("return_line", 1);
    const flow = this._set("flow", 1);
    const ext = this._set("extract_air", 1);
    const exh = this._set("exhaust_air", 1);

    // mode from priority text
    const st = status.ok ? String(status.s.state).toLowerCase() : "";
    let mode = "idle";
    if (/hot ?water|varmvatten|brauchwasser|warmwasser|dhw|vv/.test(st)) mode = "hotwater";
    else if (/cool|kyl/.test(st)) mode = "cooling";
    else if (/heat|värme|heiz/.test(st)) mode = "heating";
    else if (/^off$|^av$|^aus$|stop/.test(st)) mode = "off";
    wrap.dataset.mode = mode;

    // compressor gauge
    const f = freq.num || 0;
    const pct = clamp(f / c.max_frequency);
    this._$(".g-arc").setAttribute("stroke-dasharray", `${(GAUGE_LEN * pct).toFixed(1)} 999`);
    const nTicks = this._$$(".g-tick").length;
    this._$$(".g-tick").forEach((t, i) => t.classList.toggle("on", f > 0 && i / (nTicks - 1) <= pct));
    const running = f > 0;
    wrap.classList.toggle("running", running);
    wrap.style.setProperty("--nh-rotor-dur", `${running ? Math.max(0.25, 3 - f / 40).toFixed(2) : 0}s`);

    // COP bar
    const copBar = this._$('[data-bar="cop"]');
    copBar.style.width = `${(clamp((cop.num || 0) / c.max_cop) * 100).toFixed(1)}%`;

    // pipes
    const fl = flow.num || 0;
    wrap.classList.toggle("flowing", fl > 0);
    wrap.style.setProperty("--nh-flow-dur", `${Math.max(0.5, 4 - fl / 8).toFixed(2)}s`);
    this._$('[data-pipe="supply"]').style.stroke = tempColor(sup.num, 20, 55);
    this._$('[data-pipe="supply"]').style.color = tempColor(sup.num, 20, 55);
    this._$('[data-pipe="return"]').style.stroke = tempColor(ret.num, 20, 55);
    this._$('[data-pipe="return"]').style.color = tempColor(ret.num, 20, 55);
    const ld = this._$("[data-loopdelta]");
    ld.innerHTML = sup.num != null && ret.num != null ? `${(sup.num - ret.num).toFixed(1)}<small>${esc(sup.unit || "°C")}</small>` : "—";

    // tank
    const top = hwTop.num, chg = hwChg.num;
    const ref = top != null ? top : chg;
    const fill = this._$(".tank-fill");
    fill.style.height = `${(clamp(((ref ?? 15) - 15) / (60 - 15)) * 100).toFixed(1)}%`;
    fill.style.setProperty("--nh-tank-top", tempColor(top));
    fill.style.setProperty("--nh-tank-bot", tempColor(chg != null ? chg : top));

    // ventilation
    const dEl = this._$("[data-delta]");
    dEl.innerHTML = ext.num != null && exh.num != null ? `${(exh.num - ext.num).toFixed(1)}<small>${esc(ext.unit || "°C")}</small>` : "—";
    this._$(".vent-fan").classList.toggle("stopped", !ext.ok && !exh.ok);

    this._updateBoost(wrap);
  }

  _updateBoost(wrap) {
    const box = this._$(".boost");
    const auto = this._read("boost_automation");
    const cheap = this._read("cheap_period");
    const plan = this._read("cheap_plan");
    const price = this._set("price", 2);
    const curve = this._read("heating_curve");

    if (!auto.ok && !cheap.ok) {
      box.hidden = true;
      wrap.classList.remove("boosting");
      return;
    }
    box.hidden = false;

    const enabled = !auto.ok || auto.s.state === "on";
    const isCheap = cheap.ok && cheap.s.state === "on";
    const state = !enabled ? "disabled" : isCheap ? "active" : "armed";
    box.dataset.state = state;
    wrap.classList.toggle("boosting", state === "active");

    const curveTxt = curve.num != null ? curve.num.toFixed(0) : "—";
    const planTxt = plan.ok ? plan.s.state : "";
    const since = cheap.ok && cheap.s.last_changed
      ? new Date(cheap.s.last_changed).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";
    let title, badge, sub;
    if (state === "active") {
      title = "Price boost";
      badge = "ACTIVE";
      sub = `Cheap power since ${since} · curve ${curveTxt}`;
    } else if (state === "armed") {
      title = "Price boost";
      badge = "STANDBY";
      sub = planTxt || "Waiting for a cheap price period";
    } else {
      title = "Price boost";
      badge = "OFF";
      sub = "Automation disabled";
    }
    this._$("[data-boost-title]").textContent = title;
    this._$("[data-boost-badge]").textContent = badge;
    const subEl = this._$("[data-boost-sub]");
    subEl.textContent = sub;
    subEl.title = sub;

    // price scale (Nordpool attributes min / max / current_price)
    const priceBtn = this._$(".b-price");
    priceBtn.hidden = !price.ok;
    if (price.ok) {
      const a = price.s.attributes;
      const min = parseFloat(a.min), max = parseFloat(a.max);
      const cur = price.num;
      const hasRange = !isNaN(min) && !isNaN(max) && max > min && cur != null;
      this._$("[data-price-mark]").style.left = `${hasRange ? (clamp((cur - min) / (max - min)) * 100).toFixed(1) : 50}%`;
      this._$("[data-price-min]").textContent = hasRange ? `min ${min.toFixed(2)}` : "";
      this._$("[data-price-max]").textContent = hasRange ? `max ${max.toFixed(2)}` : "";
      this._$(".p-scale").style.visibility = hasRange ? "visible" : "hidden";
    }
  }
}

/* --------------------------------- editor --------------------------------- */
const EDITOR_SCHEMA = [
  { name: "title", label: "Title", selector: { text: {} } },
  {
    type: "grid",
    name: "",
    schema: [
      { name: "max_frequency", label: "Max compressor frequency (Hz)", selector: { number: { min: 30, max: 200, mode: "box" } } },
      { name: "max_cop", label: "Max COP (bar scale)", selector: { number: { min: 2, max: 10, step: 0.5, mode: "box" } } },
    ],
  },
  ...Object.keys(DEFAULT_ENTITIES).map((k) => ({
    name: `entity_${k}`,
    label: ENTITY_LABELS[k],
    selector: { entity: { domain: k === "heating_curve" ? ["number", "sensor", "input_number"] : undefined } },
  })),
];

class NibeHeatpumpCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => s.label || s.name;
      this._form.addEventListener("value-changed", (ev) => this._changed(ev.detail.value));
      this.appendChild(this._form);
    }
    const data = {
      title: this._config.title ?? "Heat Pump",
      max_frequency: this._config.max_frequency ?? 120,
      max_cop: this._config.max_cop ?? 6,
    };
    const ents = { ...DEFAULT_ENTITIES, ...(this._config.entities || {}) };
    for (const k of Object.keys(DEFAULT_ENTITIES)) data[`entity_${k}`] = ents[k];
    this._form.hass = this._hass;
    this._form.data = data;
    this._form.schema = EDITOR_SCHEMA.map((s) =>
      s.selector && s.selector.entity && !s.selector.entity.domain ? { ...s, selector: { entity: {} } } : s
    );
  }

  _changed(value) {
    const entities = {};
    for (const k of Object.keys(DEFAULT_ENTITIES)) {
      const v = value[`entity_${k}`];
      if (v) entities[k] = v;
    }
    const config = {
      ...this._config,
      title: value.title,
      max_frequency: value.max_frequency,
      max_cop: value.max_cop,
      entities,
    };
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }
}

if (!customElements.get("nibe-heatpump-card")) customElements.define("nibe-heatpump-card", NibeHeatpumpCard);
if (!customElements.get("nibe-heatpump-card-editor")) customElements.define("nibe-heatpump-card-editor", NibeHeatpumpCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "nibe-heatpump-card")) {
  window.customCards.push({
    type: "nibe-heatpump-card",
    name: "NIBE Heat Pump Card",
    description: "Futuristic live overview of a NIBE heat pump: compressor, COP, hydronic loop, hot water and ventilation.",
    preview: true,
    documentationURL: "https://github.com/supersonical/nibe-heatpump-card",
  });
}

console.info(
  `%c NIBE-HEATPUMP-CARD %c v${CARD_VERSION} `,
  "color:#070b17;background:#38e1ff;font-weight:700;border-radius:4px 0 0 4px;padding:2px 4px",
  "color:#38e1ff;background:#0d1630;border-radius:0 4px 4px 0;padding:2px 4px"
);
