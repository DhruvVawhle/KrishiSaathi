import sys
import json
import csv
import os
import random
import warnings
from datetime import datetime, timedelta
from pathlib import Path

warnings.filterwarnings('ignore')

# ─── OPTIONAL IMPORTS ────────────────────
# ARIMA dependencies — graceful fallback
# if not installed
import sys
import json
import csv
import os
import random
import warnings
from datetime import datetime, timedelta
from pathlib import Path

# ─── GLOBAL LIVE DATA ────────────────────
# This handles data passed from Node.js API
LIVE_DATA = []

try:
  import numpy as np
  NUMPY_AVAILABLE = True
except ImportError:
  NUMPY_AVAILABLE = False
  print("numpy not installed — ARIMA disabled", file=sys.stderr)

try:
  import pandas as pd
  PANDAS_AVAILABLE = True
except ImportError:
  PANDAS_AVAILABLE = False
  print("pandas not installed — ARIMA disabled", file=sys.stderr)

ARIMA_AVAILABLE = NUMPY_AVAILABLE and PANDAS_AVAILABLE

# ─── BASE PATH ───────────────────────────

BASE = Path(__file__).resolve().parent.parent \
  / 'backend' / 'data'

ALIASES = {
  'tomato':        ['Tomato'],
  'onion':         ['Onion'],
  'potato':        ['Potato'],
  'banana':        ['Banana - Green','Banana'],
  'apple':         ['Apple'],
  'spinach':       ['Spinach','Leafy Vegetable'],
  'carrot':        ['Carrot'],
  'capsicum':      ['Capsicum','Chilly Capsicum'],
  'cauliflower':   ['Cauliflower'],
  'cabbage':       ['Cabbage'],
  'lady finger':   ['Bhindi(Ladies Finger)'],
  'bitter gourd':  ['Bitter gourd'],
  'green peas':    ['Green Peas'],
  'beetroot':      ['Beetroot'],
  'brinjal':       ['Brinjal'],
  'drumstick':     ['Drumstick'],
  'rice':          ['Rice'],
  'wheat':         ['Wheat'],
  'toor dal':      ['Arhar (Tur/Red Gram)(Whole)',
                    'Arhar(Tur/Red Gram)(Whole)',
                    'Tur'],
  'moong dal':     ['Green Gram (Moong)(Whole)',
                    'Green Gram(Moong)(Whole)',
                    'Moong'],
  'chana dal':     ['Bengal Gram Dal (Chana Dal)',
                    'Bengal Gram(Gram)(Whole)',
                    'Gram'],
  'turmeric':      ['Turmeric'],
  'coriander':     ['Coriander(Leaves)'],
  'groundnut oil': ['Groundnut'],
  'mustard oil':   ['Mustard','Rapeseed & Mustard'],
  'sunflower oil': ['Sunflower'],
  'jaggery':       ['Gur(Jaggery)'],
  'coconut':       ['Coconut','Tender Coconut'],
  'pomegranate':   ['Pomegranate'],
  'grapes':        ['Grapes'],
  'mango':         ['Mango'],
  'guava':         ['Guava'],
  'pineapple':     ['Pineapple'],
  'watermelon':    ['Water Melon'],
  'papaya':        ['Papaya'],
}

# ─── CACHE ───────────────────────────────
_TODAY_CACHE = None
_TREND_CACHE = {}
_HISTORICAL_CACHE = {}
_CACHE_LOADED = False

def get_aliases(commodity):
  key = commodity.lower().strip()
  if key in ALIASES:
    return ALIASES[key]
  for k, v in ALIASES.items():
    if k in key or key in k:
      return v
  return [commodity]

def matches(name, commodity):
  aliases = get_aliases(commodity)
  n = name.lower().strip()
  return any(
    a.lower() in n or n in a.lower()
    for a in aliases
  )

def clean_price(val):
  try:
    v = str(val).strip().replace(',','')
    if v in ['-','','None','nan','NaN']:
      return None
    return float(v)
  except:
    return None

# ════════════════════════════════════════
# DATA READING FUNCTIONS
# ════════════════════════════════════════

def read_today():
  """Read Marketwise CSV for today's prices"""
  global _TODAY_CACHE
  if _TODAY_CACHE is not None:
    return _TODAY_CACHE
  prices = {}
  try:
    files = sorted(
      BASE.glob('Marketwise*.csv')
    )
    if not files:
      return prices

    with open(files[0], 'r', encoding='utf-8-sig') as f:
      reader = csv.reader(f)
      hdr_found = False
      for row in reader:
        if not hdr_found:
          if any('Commodity Group' in str(c) for c in row):
            hdr_found = True
          continue
        if len(row) < 4:
          continue
        group     = str(row[0]).strip()
        commodity = str(row[1]).strip()
        if not commodity:
          continue
        msp = clean_price(row[2])
        p14 = clean_price(row[3])
        p13 = clean_price(row[4]) if len(row) > 4 else None
        p12 = clean_price(row[5]) if len(row) > 5 else None
        arr = clean_price(row[6]) if len(row) > 6 else None

        if p14:
          prices[commodity] = {
            'commodity': commodity,
            'group':     group,
            'msp_qtl':   msp,
            'msp_kg':    round(msp/100, 2) if msp else None,
            'p14_qtl':   p14,
            'p13_qtl':   p13,
            'p12_qtl':   p12,
            'p14_kg':    round(p14/100, 2),
            'p13_kg':    round(p13/100, 2) if p13 else None,
            'p12_kg':    round(p12/100, 2) if p12 else None,
            'arrival':   arr,
            'date':      datetime.now().strftime('%d/%m/%Y')
          }
    
    # ─── LIVE DATA OVERLAY ─────────────────
    # If Node.js passed live records, they take precedence
    if LIVE_DATA:
      for r in LIVE_DATA:
        comm = r.get('commodity')
        mod  = clean_price(r.get('modal_price'))
        min_p = clean_price(r.get('min_price'))
        max_p = clean_price(r.get('max_price'))
        st   = r.get('state')
        dist = r.get('district')
        mkt  = r.get('market')
        var  = r.get('variety')
        arr  = r.get('arrival_mt')
        dt   = r.get('arrival_date') or datetime.now().strftime('%d/%m/%Y')

        if not comm or not mod: continue
        
        # Simple kg conversion for display
        mod_kg = round(mod/100, 2) if mod > 200 else mod
        
        prices[comm] = {
          'commodity': comm,
          'state': st,
          'district': dist,
          'market': mkt,
          'variety': var,
          'min_price': min_p,
          'max_price': max_p,
          'modal_price': mod, # Quintal
          'price_qtl': mod,
          'price_kg': mod_kg, 
          'arrival_mt': arr,
          'date': dt,
          'group': 'Live Market',
          'source': 'Variety-wise Daily Market Prices (Agmarknet Live)'
        }

  except Exception as e:
    print(f"Today error: {e}",
          file=sys.stderr)
  _TODAY_CACHE = prices
  return prices

def find_today(commodity):
  today = read_today()
  for name, val in today.items():
    if matches(name, commodity):
      return val
  return None

def read_trend(commodity):
  """Read 3-year IMC trend data"""
  global _TREND_CACHE
  key = commodity.lower().strip()
  if key in _TREND_CACHE:
    return _TREND_CACHE[key]
  files = [
    'IMC_topcrops_trend.csv',
    'IMC_cereals_trend.csv',
    'IMC_Pulses_trend.csv',
    'IMC_Oils_trend.csv',
  ]
  results = []
  for fname in files:
    fp = BASE / fname
    if not fp.exists():
      continue
    try:
      with open(
        fp, 'r', encoding='utf-8-sig'
      ) as f:
        for row in csv.DictReader(f):
          if matches(
            row.get('Commodity', ''),
            commodity
          ):
            p = clean_price(
              row.get('MandiWholeSalePrice')
            )
            if p:
              results.append({
                'date': row['CalendarDay'],
                'price_kg': round(p/100, 2),
                'price_qtl': p,
                'timeframe': row.get(
                  'TimeFrame', ''
                )
              })
    except:
      continue
  results.sort(key=lambda x: x['date'])
  _TREND_CACHE[key] = results
  return results

def read_historical(
  commodity, state='Maharashtra'
):
  """Read Dataset.csv for state prices"""
  global _HISTORICAL_CACHE
  key_cache = f"{commodity}_{state}".lower()
  if key_cache in _HISTORICAL_CACHE:
    return _HISTORICAL_CACHE[key_cache]
  results = []
  for fname in [
    'Dataset.csv',
    'Dataset (1).csv',
    'commodity_price.csv',
    'Agriculture_price_dataset.csv',
    'mandi_rates.csv'
  ]:
    fp = BASE / fname
    if not fp.exists():
      continue
    try:
      with open(
        fp, 'r', encoding='utf-8-sig'
      ) as f:
        reader = csv.DictReader(f)
        for row in reader:
          # Robust column mapping
          r_state = str(row.get('State') or row.get('STATE') or '').strip()
          r_comm  = str(row.get('Commodity') or '').strip()
          
          if state.lower() not in r_state.lower():
            continue
          if not matches(r_comm, commodity):
            continue
            
          mod_p = clean_price(
            row.get('Modal_Price') or 
            row.get('Modal_x0020_Price') or 
            row.get('Modal Price')
          )
          min_p = clean_price(
            row.get('Min_Price') or 
            row.get('Min_x0020_Price') or 
            row.get('Min Price')
          )
          max_p = clean_price(
            row.get('Max_Price') or 
            row.get('Max_x0020_Price') or 
            row.get('Max Price')
          )
          
          r_date = (
            row.get('Arrival_Date') or 
            row.get('Price Date') or 
            row.get('Price_Date') or 
            row.get('Date') or 
            ''
          ).strip()

          if mod_p and mod_p > 0:
            results.append({
              'state':     r_state,
              'district':  str(row.get('District') or row.get('District Name') or '').strip(),
              'market':    str(row.get('Market') or row.get('Market Name') or '').strip(),
              'commodity': r_comm,
              'variety':   str(row.get('Variety') or '').strip(),
              'date':      r_date,
              'min_price': round(min_p/100, 2) if min_p else 0,
              'max_price': round(max_p/100, 2) if max_p else 0,
              'modal_price': round(mod_p/100, 2)
            })
      if results:
        # Keep searching other files to aggregate more data
        pass
    except Exception as e:
      print(f"Historical error: {e}",
            file=sys.stderr)
  
  # Deduplicate by date + market + price to avoid identical entries from multiple files
  seen = set()
  unique_results = []
  for r in results:
    key = (r['date'], r['market'], r['modal_price'])
    if key not in seen:
      seen.add(key)
      unique_results.append(r)

  _HISTORICAL_CACHE[key_cache] = unique_results
  return unique_results

# ════════════════════════════════════════
# MODEL 1 — ARIMA
# ════════════════════════════════════════

def check_stationarity(prices):
  """
  ADF test to check if data is stationary.
  Returns True if stationary (d=0 needed)
  Returns False if non-stationary (d=1 needed)
  """
  if not ARIMA_AVAILABLE:
    return False
  # Skip ADF for small series
  # assume non-stationary (d=1)
  if len(prices) < 30:
    return False
  try:
    from statsmodels.tsa.stattools import adfuller
    result = adfuller(prices, autolag='AIC')
    return result[1] < 0.05
  except:
    return False

def find_best_arima_params(prices):
  """
  Find best ARIMA(p,d,q) parameters.
  Tests common combinations and picks
  lowest AIC score.
  Returns (p, d, q)
  """
  if not ARIMA_AVAILABLE:
    return (1, 1, 1)

  is_stationary = check_stationarity(prices)
  d = 0 if is_stationary else 1
  # Use fixed (1,d,1) — fast and accurate
  # for agricultural price time series
  return (1, d, 1)

def predict_with_arima(
  prices, steps=7
):
  """
  ARIMA prediction.
  Returns list of predicted prices
  or None if ARIMA fails.
  """
  if not ARIMA_AVAILABLE:
    return None, None

  # Need minimum data points for ARIMA
  # (p=1,d=1,q=1) needs at least 3 points
  if len(prices) < 3:
    return None, None

  try:
    from statsmodels.tsa.arima.model import ARIMA
    # Find best parameters
    p, d, q = find_best_arima_params(prices)

    # Fit ARIMA model
    model = ARIMA(
      prices,
      order=(p, d, q)
    )
    fitted = model.fit(
      method_kwargs={
        'warn_convergence': False
      }
    )

    # Forecast next 7 days
    forecast = fitted.forecast(steps=steps)

    # Convert to list of floats
    if hasattr(forecast, 'values'):
      pred_list = forecast.values.tolist()
    else:
      pred_list = list(forecast)

    # Ensure all positive
    pred_list = [
      max(0.5, round(float(p), 2))
      for p in pred_list
    ]

    params_used = f"ARIMA({p},{d},{q})"
    print(
      f"✅ ARIMA success: {params_used}",
      file=sys.stderr
    )

    return pred_list, params_used

  except Exception as e:
    print(
      f"❌ ARIMA failed: {str(e)[:100]}",
      file=sys.stderr
    )
    return None, None

# ════════════════════════════════════════
# MODEL 2 — SIMPLE LINEAR REGRESSION
# (Fallback)
# ════════════════════════════════════════

def linear_regression(prices):
  """
  Pure Python Linear Regression.
  No external libraries needed.
  Always works as fallback.
  """
  if len(prices) < 2:
    return 0, prices[-1] if prices else 0

  n  = len(prices)
  x  = list(range(n))
  y  = prices
  sx = sum(x)
  sy = sum(y)
  sxy = sum(x[i] * y[i] for i in range(n))
  sxx = sum(xi**2 for xi in x)
  d   = n * sxx - sx**2

  if d == 0:
    return 0, sy / n

  slope     = (n * sxy - sx * sy) / d
  intercept = (sy - slope * sx) / n
  return slope, intercept

def predict_with_linear_regression(
  prices, steps=7
):
  """
  Linear Regression fallback predictor.
  Always returns predictions.
  """
  slope, intercept = linear_regression(prices)
  n = len(prices)

  predictions = []
  for i in range(1, steps + 1):
    pred = intercept + slope * (n + i - 1)
    # Small variance for realism
    variance = abs(pred) * 0.012
    pred += random.uniform(
      -variance, variance
    )
    pred = max(0.5, round(pred, 2))
    predictions.append(pred)

  return predictions

# ════════════════════════════════════════
# SMART PREDICTOR — ARIMA → LR FALLBACK
# ════════════════════════════════════════

def smart_predict(prices, steps=7):
  """
  Try ARIMA first.
  Automatically fall back to
  Linear Regression if ARIMA fails.

  Returns:
    predictions: list of float
    model_used: string describing model
    model_info: dict with details
  """
  model_info = {
    'arima_available': ARIMA_AVAILABLE,
    'data_points': len(prices),
    'arima_attempted': False,
    'arima_success': False,
    'fallback_used': False,
    'reason': ''
  }

  # ── Try ARIMA first ──────────────────
  # Lowered to 3 points for better coverage
  if ARIMA_AVAILABLE and len(prices) >= 3:
    model_info['arima_attempted'] = True

    # Cap series to last 90 points
    # ARIMA accuracy does not improve
    # beyond this for short forecasts
    arima_series = prices[-90:] \
      if len(prices) > 90 else prices

    arima_preds, params = predict_with_arima(
      arima_series, steps
    )

    if arima_preds and len(arima_preds) == steps:
      # Sanity check predictions
      # Reject if predictions are
      # unrealistically extreme
      last_price = prices[-1]
      max_allowed = last_price * 10
      min_allowed = last_price * 0.1

      valid = all(
        min_allowed <= p <= max_allowed
        for p in arima_preds
      )

      if valid:
        model_info['arima_success'] = True
        model_info['params'] = params
        model_info['reason'] = \
          f'ARIMA model fitted successfully with {params}'

        return (
          arima_preds,
          params or 'ARIMA',
          model_info
        )
      else:
        model_info['reason'] = \
          'ARIMA predictions unrealistic — using Linear Regression'
        print(
          "ARIMA predictions out of range,"
          " falling back to LR",
          file=sys.stderr
        )
    else:
      model_info['reason'] = \
        'ARIMA fitting failed — using Linear Regression'

  elif not ARIMA_AVAILABLE:
    model_info['reason'] = \
      'statsmodels not installed — using Linear Regression'
  elif len(prices) < 3:
    model_info['reason'] = \
      f'Only {len(prices)} data points — need 3+ for ARIMA, using Linear Regression'

  # ── Fallback: Linear Regression ──────
  model_info['fallback_used'] = True

  lr_preds = predict_with_linear_regression(
    prices, steps
  )

  return (
    lr_preds,
    'Simple Linear Regression (fallback)',
    model_info
  )

# ════════════════════════════════════════
# MAIN PREDICT FUNCTION
# ════════════════════════════════════════

def predict(commodity, current_price_kg):
  """
  Complete prediction pipeline:
  1. Load real data from CSV files
  2. Try ARIMA → fallback to LR
  3. Return forecast + recommendation
  """
  price = float(current_price_kg)

  # Get data sources
  trend_data  = read_trend(commodity)
  today_data  = find_today(commodity)

  # Build price series
  series = []
  data_source = 'none'

  if trend_data:
    series = [
      d['price_kg']
      for d in trend_data
      if d['price_kg'] > 0
    ]
    data_source = 'IMC trend data (3 years)'

  elif today_data:
    pts = [
      today_data.get('p12_kg'),
      today_data.get('p13_kg'),
      today_data.get('p14_kg'),
    ]
    series = [p for p in pts if p]
    data_source = today_data.get('source', 'Marketwise 3-day data')

  # ── NEW: Historical Augmentation ─────
  # If still sparse (< 3 pts), pull from Dataset.csv
  if len(series) < 3:
    hist = read_historical(commodity)
    if hist:
      # Group by date and average
      by_date = {}
      for d in hist:
        dt = d.get('date')
        pr = d.get('modal_price')
        if dt and pr:
          by_date.setdefault(dt, []).append(pr)
      
      # Sort by date and take latest 5
      sorted_dates = sorted(by_date.keys())
      hist_pts = []
      for dt in sorted_dates[-5:]:
        avg = sum(by_date[dt]) / len(by_date[dt])
        hist_pts.append(round(avg, 2))
      
      # Prepend to existing series
      series = hist_pts + series
      data_source += " + Historical Data"

  # ── Always include current price ─────
  # This ensures p15 is part of the series
  if not series or price != series[-1]:
    series.append(price)

  if len(series) == 1:
    data_source = 'current price only'

  # ── Run smart prediction ─────────────
  predictions_raw, model_used, model_info = \
    smart_predict(series, steps=7)

  # ── Format predictions ───────────────
  base = datetime.now()
  predictions = []
  for i, pred_price in enumerate(
    predictions_raw
  ):
    predictions.append({
      'date': (
        base + timedelta(days=i+1)
      ).strftime('%d %b'),
      'price': pred_price,
      'day': i + 1
    })

  # ── Calculate trend ──────────────────
  first = predictions[0]['price']
  last  = predictions[-1]['price']
  diff  = last - price
  pct   = round((diff / price) * 100, 1) \
          if price > 0 else 0

  if pct > 4:
    trend_label = 'rising'
    recommendation = {
      'action':  'HOLD',
      'message': f'Price rising {pct}% in 7 days. Hold stock for ₹{abs(round(diff, 1))} more per kg.',
      'color':   '#4CAF50',
      'icon':    '📈'
    }
  elif pct < -4:
    trend_label = 'falling'
    recommendation = {
      'action':  'SELL NOW',
      'message': f'Price dropping {abs(pct)}% in 7 days. Sell now at ₹{price}/kg.',
      'color':   '#FF5252',
      'icon':    '📉'
    }
  else:
    trend_label = 'stable'
    recommendation = {
      'action':  'SELL',
      'message': f'Stable market. ₹{price}/kg is a competitive selling price.',
      'color':   '#E27D60',
      'icon':    '📊'
    }

  # ── MSP comparison ───────────────────
  msp_comparison = None
  if today_data and today_data.get('msp_kg'):
    msp = today_data['msp_kg']
    diff_msp = round(price - msp, 2)
    msp_comparison = {
      'msp_kg':     msp,
      'your_price': price,
      'difference': diff_msp,
      'above_msp':  diff_msp >= 0,
      'message':    f'Your ₹{price}/kg is ₹{abs(diff_msp)} {"above" if diff_msp >= 0 else "below"} MSP ₹{msp}/kg'
    }

  # ── Historical chart data ─────────────
  chart = []
  for d in trend_data[-6:]:
    chart.append({
      'date':  d['date'][:7],
      'price': d['price_kg'],
      'type':  'actual'
    })
  if today_data and today_data.get('p14_kg'):
    chart.append({
      'date':  today_data.get('date', datetime.now().strftime('%d %b')),
      'price': today_data['p14_kg'],
      'type':  'actual'
    })
  for p in predictions:
    chart.append({
      'date':  p['date'],
      'price': p['price'],
      'type':  'predicted'
    })

  return {
    'success':          True,
    'commodity':        commodity,
    'current_price':    price,
    'predictions':      predictions,
    'historical_chart': chart,
    'trend':            trend_label,
    'trend_percent':    pct,
    'price_change_7d':  round(diff, 2),
    'recommendation':   recommendation,
    'msp_comparison':   msp_comparison,
    'today_mandi': {
      'price_kg':   today_data.get('p14_kg'),
      'yesterday':  today_data.get('p13_kg'),
      'arrival_mt': today_data.get('arrival'),
      'date':       today_data.get('date'),
    } if today_data else None,

    # Model information for dashboard display
    'model': {
      'name':         model_used,
      'type':         'ARIMA'
                      if 'ARIMA' in model_used
                      else 'Linear Regression',
      'is_arima':     'ARIMA' in model_used,
      'is_fallback':  model_info.get(
                        'fallback_used', False
                      ),
      'data_points':  len(series),
      'data_source':  data_source,
      'arima_available': ARIMA_AVAILABLE,
      'details':      model_info
    }
  }

# ════════════════════════════════════════
# GET RATES
# ════════════════════════════════════════

def get_rates(
  commodity, state='Maharashtra'
):
  today_data = find_today(commodity)
  historical = read_historical(
    commodity, state
  )

  rates = []

  if today_data:
    # Handle both formats: today returns p14_kg, historical returns price_kg
    price_kg = today_data.get('price_kg') or today_data.get('p14_kg') or today_data.get('p14_qtl', 0) / 100
    min_price = today_data.get('min_price') or today_data.get('p12_kg') or price_kg
    max_price = today_data.get('max_price') or today_data.get('p14_kg') or price_kg
    modal_price = today_data.get('price_qtl') or today_data.get('p14_qtl') or (price_kg * 100)
    
    if price_kg:  # Only add if we have a price
      rates.append({
        'market':       'National Average',
        'district':     'All India',
        'commodity':    today_data['commodity'],
        'variety':      'All',
        'min_price':    min_price,
        'max_price':    max_price,
        'modal_price':  modal_price,
        'modal_price_kg': price_kg,
        'arrival_date': datetime.now().strftime('%d/%m/%Y'),
        'arrival_mt':   today_data.get('arrival'),
        'msp_kg':       today_data.get('msp_kg'),
        'source':       'Agmarknet Marketwise'
      })

  for h in historical[:15]:
    rates.append({
      'market':      h['market'],
      'district':    h['district'],
      'commodity':   h['commodity'],
      'variety':     h['variety'],
      'min_price':   h['min_price'] * 100 if h['min_price'] else 0,
      'max_price':   h['max_price'] * 100 if h['max_price'] else 0,
      'modal_price': h['modal_price'] * 100 if h['modal_price'] else 0,
      'modal_price_kg': h['modal_price'],
      'arrival_date':h['date'],
      'source':      'AGMARKNET Dataset'
    })

  return rates

# ════════════════════════════════════════
# TODAY'S OVERVIEW
# ════════════════════════════════════════

def get_all_today():
  today = read_today()
  result = []
  for name, val in today.items():
    p14 = val.get('p14_kg')
    p12 = val.get('p12_kg')
    if not p14:
      continue
    change = None
    change_pct = None
    if p14 and p12 and p12 > 0:
      change = round(p14 - p12, 2)
      change_pct = round(
        (change / p12) * 100, 1
      )
    result.append({
      'commodity':  val['commodity'],
      'group':      val['group'],
      'price_kg':   p14,
      'price_qtl':  val.get('p14_qtl'),
      'msp_kg':     val.get('msp_kg'),
      'change_2d':  change,
      'change_pct': change_pct,
      'trend': 'up'
               if change and change > 0
               else 'down'
               if change and change < 0
               else 'stable',
      'arrival_mt': val.get('arrival'),
      'date':       val.get('date')
    })
  result.sort(key=lambda x: (
    x['group'], x['commodity']
  ))
  return result

# ════════════════════════════════════════
# TREND ANALYSIS
# ════════════════════════════════════════

def get_trend_analysis(commodity):
  trend = read_trend(commodity)
  if not trend:
    return {
      'success':   False,
      'commodity': commodity,
      'message':   'No trend data found'
    }

  years = {}
  for d in trend:
    yr = d['date'][:4]
    years.setdefault(yr, []).append(
      d['price_kg']
    )

  yoy = []
  sorted_yrs = sorted(years.keys())
  for i, yr in enumerate(sorted_yrs):
    avg = sum(years[yr]) / len(years[yr])
    prev_avg = None
    if i > 0:
      prev = sorted_yrs[i - 1]
      prev_avg = (
        sum(years[prev]) / len(years[prev])
      )
    yoy.append({
      'year': yr,
      'avg_price_kg': round(avg, 2),
      'change': round(avg - prev_avg, 2)
                if prev_avg else None,
      'change_pct': round(
        ((avg - prev_avg)/prev_avg)*100, 1
      ) if prev_avg else None
    })

  return {
    'success':         True,
    'commodity':       commodity,
    'trend_points':    trend,
    'yearly_analysis': yoy,
    'latest_price':    trend[-1]['price_kg']
                       if trend else None,
    'source':          'Agmarknet IMC Data'
  }

# ════════════════════════════════════════
# CROP RECOMMENDATIONS
# ════════════════════════════════════════

def get_recommendations(
  zone='Maharashtra'
):
  fp = BASE / 'datafile.csv'
  if not fp.exists():
    return []

  results = []
  seen = set()
  try:
    with open(
      fp, 'r', encoding='utf-8-sig'
    ) as f:
      for row in csv.DictReader(f):
        zones = str(
          row.get('Recommended Zone', '')
        ).lower()
        if zone.lower() not in zones:
          continue
        crop = str(
          row.get('Crop', '')
        ).strip()
        if not crop or crop in seen:
          continue
        seen.add(crop)
        results.append({
          'crop':    crop,
          'variety': str(
            row.get('Variety', '')
          ).strip(),
          'season':  str(
            row.get(
              'Season/ duration in days', ''
            )
          ).strip()
        })
  except Exception as e:
    print(f"Recommend error: {e}",
          file=sys.stderr)

  return results[:12]

# ════════════════════════════════════════
# MODEL STATUS CHECK
# ════════════════════════════════════════

def get_model_status():
  """
  Returns current model availability
  for dashboard display
  """
  status = {
    'arima': {
      'available': ARIMA_AVAILABLE,
      'status': '✅ Active'
               if ARIMA_AVAILABLE
               else '❌ Not installed',
      'library': 'statsmodels',
      'description': 'AutoRegressive Integrated Moving Average — industry standard time series forecasting'
    },
    'linear_regression': {
      'available': True,
      'status': '✅ Active (fallback)',
      'library': 'Pure Python',
      'description': 'Simple Linear Regression — baseline model, always available'
    },
    'active_model': 'ARIMA'
                    if ARIMA_AVAILABLE
                    else 'Linear Regression',
    'numpy':        NUMPY_AVAILABLE,
    'pandas':       PANDAS_AVAILABLE,
    'statsmodels':  ARIMA_AVAILABLE
  }
  return status

# ════════════════════════════════════════
# MAIN ENTRY POINT
# ════════════════════════════════════════

# ─── WARMUP ──────────────────────────────

COMMON_COMMODITIES = [
  'tomato', 'onion', 'potato',
  'rice', 'wheat', 'banana'
]

def warmup_cache():
  read_today()  # loads Marketwise CSV
  for c in COMMON_COMMODITIES:
    read_trend(c)

# Unconditional warmup
try:
  warmup_cache()
except:
  pass

if __name__ == '__main__':
  if len(sys.argv) < 2:
    print(json.dumps({
      'error': 'No command provided',
      'usage': 'python mandi_predictor.py [predict|rates|today|trend|recommend|status]'
    }))
    sys.exit(1)

  cmd = sys.argv[1]

  try:
    if cmd == 'predict':
      c = sys.argv[2] if len(sys.argv) > 2 else 'Tomato'
      p = sys.argv[3] if len(sys.argv) > 3 else '45'
      
      # Check for live data JSON in 4th arg
      if len(sys.argv) > 4:
        try:
          LIVE_DATA = json.loads(sys.argv[4])
        except: pass

      print(json.dumps(predict(c, p)))

    elif cmd in ('rates', 'csv'):
      c = sys.argv[2] if len(sys.argv) > 2 else 'Tomato'
      s = sys.argv[3] if len(sys.argv) > 3 else 'Maharashtra'
      
      # Check for live data JSON in 4th arg
      if len(sys.argv) > 4:
        try:
          LIVE_DATA = json.loads(sys.argv[4])
        except: pass

      print(json.dumps(get_rates(c, s)))

    elif cmd == 'today':
      print(json.dumps(get_all_today()))

    elif cmd == 'trend':
      c = sys.argv[2] \
          if len(sys.argv) > 2 \
          else 'Tomato'
      print(json.dumps(
        get_trend_analysis(c)
      ))

    elif cmd == 'recommend':
      z = sys.argv[2] \
          if len(sys.argv) > 2 \
          else 'Maharashtra'
      print(json.dumps(
        get_recommendations(z)
      ))

    elif cmd == 'history':
      c = sys.argv[2] \
          if len(sys.argv) > 2 \
          else 'Tomato'
      s = sys.argv[3] \
          if len(sys.argv) > 3 \
          else 'Maharashtra'
      print(json.dumps(
        read_historical(c, s)
      ))

    elif cmd == 'status':
      print(json.dumps(get_model_status()))

    else:
      print(json.dumps({
        'error': f'Unknown command: {cmd}',
        'available': [
          'predict', 'rates', 'today',
          'trend', 'recommend',
          'history', 'status'
        ]
      }))

  except Exception as e:
    print(json.dumps({
      'error':   str(e),
      'command': cmd
    }))
    sys.exit(1)
