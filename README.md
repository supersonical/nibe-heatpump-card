# NIBE Heat Pump Card

[![HACS](https://img.shields.io/badge/HACS-Default-41BDF5.svg)](https://hacs.xyz) [![Validate](https://github.com/supersonical/nibe-heatpump-card/actions/workflows/validate.yml/badge.svg)](https://github.com/supersonical/nibe-heatpump-card/actions/workflows/validate.yml)

A futuristic, animated Lovelace card for NIBE heat pumps (S-series / myUplink / Modbus).

- Compressor frequency ring gauge (spins faster with Hz)
- Power used, COP (with efficiency bar) and average house temperature
- Animated hydronic loop: supply (BT2) / return (BT3) pipes coloured by temperature, flow (BF1) speed drives the animation
- Hot water tank (BT7 top / BT6 charging) with temperature-gradient fill, bubbles while charging hot water
- Ventilation: extract (BT21) / exhaust (BT20) air and heat recovered ΔT
- Status chip that re-themes the whole card (heating = orange, hot water = pink, cooling = cyan, off = grey)
- Heating curve and loop ΔT
- **Price boost panel**: shows when your Nordpool boost automation is active (glowing green, BOOST tag on the heating curve), on standby (with the cheap-heating plan), or disabled — plus the spot price on a min→max scale
- Tap any value to open its more-info dialog
- Visual editor (entity pickers) in the dashboard UI

## Install with HACS

[![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=supersonical&repository=nibe-heatpump-card&category=plugin)

1. Click the button above, or in HACS search for **NIBE Heat Pump Card**.
   (Until it's listed in the default store: HACS → ⋮ → **Custom repositories** → `https://github.com/supersonical/nibe-heatpump-card`, type **Dashboard**.)
2. Download, then reload the browser.

## Manual install

Copy `dist/nibe-heatpump-card.js` to `config/www/` and add it as a dashboard resource:
`/local/nibe-heatpump-card.js` (type: JavaScript module).

## Configuration

All entities default to the standard NIBE Modbus entity IDs, so the minimum config is:

```yaml
type: custom:nibe-heatpump-card
```

Full example:

```yaml
type: custom:nibe-heatpump-card
title: NIBE S735
max_frequency: 120   # Hz at full gauge
max_cop: 6           # COP at full bar
entities:
  status: sensor.priority_31029
  outdoor_temp: sensor.current_outdoor_temperature_bt1_30002
  heating_curve: number.heating_curve_climate_system_1_40027
  power: sensor.energy_log_current_power_consumption_32306
  cop: sensor.s735_nibe_cop
  compressor_freq: sensor.compressor_frequency_current_31047
  house_temp: sensor.average_tempratur_house
  hot_water_top: sensor.hot_water_top_bt7_30009
  hot_water_charging: sensor.hot_water_charging_bt6_30010
  supply_line: sensor.supply_line_bt2_30006
  return_line: sensor.return_line_bt3_30008
  flow: sensor.flow_sensor_bf1_30041
  extract_air: sensor.extr_air_bt21_30021
  exhaust_air: sensor.exh_air_bt20_30020
  # price boost (panel hides itself if neither of the first two exist)
  boost_automation: automation.heating_curve_cheap_electricity_boost_nordpool
  cheap_period: binary_sensor.nordpool_cheap_heating_period
  cheap_plan: sensor.nordpool_cheap_heating_plan
  price: sensor.nordpool_kwh_se3_sek_3_10_025
```

## Development

Open `preview.html` through any static server (e.g. `python3 -m http.server`) to see the card with mock data.

## License

MIT
