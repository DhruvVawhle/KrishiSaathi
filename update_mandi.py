import sys

file_path = r"C:\Users\Admin\krishisaathi\src\frontend\components\ui\MandiRates.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add imports
imports_to_add = """
import { DatePickerInput } from '@mantine/dates';
import { Listbox } from '@headlessui/react';
import '@mantine/dates/styles.css';
"""
content = content.replace("from 'antd'", f"from 'antd'{imports_to_add}")

if "DatePickerInput" not in content:
    print("Warning: Import replace failed")

# 2. Add `date` state
content = content.replace(
    "const [maxPrice, setMaxPrice] = useState(0)",
    "const [maxPrice, setMaxPrice] = useState(0)\n  const [date, setDate] = useState(null)"
)

# 3. Add `date` to useEffect
content = content.replace(
    "if (commodity || state) {",
    "if (commodity || state || date) {"
)
content = content.replace(
    "}, [commodity, state])",
    "}, [commodity, state, date])"
)

# 4. Add date to fetchAll URL
url_build_code = """      if (state &&
          state.trim() !== '') {
        url +=
          `&filters[state]=` +
          encodeURIComponent(state)
      }"""
url_build_code_new = url_build_code + """\n
      if (date) {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        url += `&filters[arrival_date]=${d}/${m}/${y}`;
      }"""
content = content.replace(url_build_code, url_build_code_new)

# 5. Add DatePickerInput into filters row
filters_code = """        {/* State */}
        <div style={{ flex: '1 1 140px' }}>"""

filters_code_new = """        {/* Date */}
        <div style={{ flex: '1 1 140px' }}>
          <label style={{
            display: 'block',
            fontFamily: 'DM Sans',
            fontWeight: 700,
            fontSize: 10,
            color: '#7A7A7A',
            marginBottom: 5,
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            Date Filter
          </label>
          <DatePickerInput
            placeholder="Select date"
            value={date}
            onChange={setDate}
            clearable
            maxDate={new Date()}
            styles={{
              input: {
                padding: '10px 14px',
                borderRadius: 10,
                border: '1.5px solid #EDD9B0',
                background: '#FDFAF4',
                fontFamily: 'DM Sans',
                fontSize: 14,
                color: '#4A4A4A',
                height: 44
              }
            }}
          />
        </div>

""" + filters_code

content = content.replace(filters_code, filters_code_new)

# 6. Replace State `<select>` with `<Listbox>` (Headless UI)
state_select_code = """          <select
            value={state}
            onChange={e => {
              setState(e.target.value)
              setCurrentPage(1)
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1.5px solid #EDD9B0',
              background: '#FDFAF4',
              fontFamily: 'DM Sans',
              fontSize: 14,
              color: '#4A4A4A',
              cursor: 'pointer',
              appearance: 'none'
            }}
          >
            {INDIAN_STATES.map(s => (
              <option
                key={s.value}
                value={s.value}
              >
                {s.label}
              </option>
            ))}
          </select>"""

headless_ui_combo = """          <Listbox value={state} onChange={(val) => { setState(val); setCurrentPage(1); }}>
            <div style={{ position: 'relative' }}>
              <Listbox.Button style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #EDD9B0', background: '#FDFAF4', fontFamily: 'DM Sans', fontSize: 14, color: '#4A4A4A', textAlign: 'left', height: 44 }}>
                {INDIAN_STATES.find(s => s.value === state)?.label || 'All States'}
              </Listbox.Button>
              <Listbox.Options style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: '#FDFAF4', border: '1.5px solid #EDD9B0', borderRadius: 10, zIndex: 1000, maxHeight: 200, overflowY: 'auto', width: '100%', boxShadow: '0 8px 24px rgba(45,79,30,0.12)' }}>
                {INDIAN_STATES.map((s) => (
                  <Listbox.Option key={s.value} value={s.value} as="template">
                    {({ active, selected }) => (
                      <div style={{ padding: '10px 14px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 13, background: active ? '#F5E6CC' : 'transparent', fontWeight: selected ? '700' : '400', color: '#2D4F1E' }}>
                        {s.label}
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>"""

content = content.replace(state_select_code, headless_ui_combo)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("MandiRates.jsx updated successfully!")
