import argparse
import os
import shutil
import sys
from tempfile import NamedTemporaryFile

def safe_replace(content, search, replace, label):
    if search not in content:
        print(f"Error: Could not find '{label}' in the file.")
        sys.exit(1)
    new_content = content.replace(search, replace)
    if new_content == content:
        # This could happen if search == replace, which shouldn't be the case here
        print(f"Warning: Replacement for '{label}' resulted in no changes.")
    return new_content

def main():
    parser = argparse.ArgumentParser(description="Update MandiRates.jsx with date filter and Headless UI.")
    parser.add_argument("-f", "--file", help="Path to MandiRates.jsx", 
                        default=os.environ.get("MANDI_FILE", "src/frontend/components/ui/MandiRates.jsx"))
    args = parser.parse_args()

    file_path = args.file
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        sys.exit(1)

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # 1. Add imports
        # Add Fragment to react import if not present
        if "Fragment" not in content and "from 'react'" in content:
            content = safe_replace(content, 
                                   "import React, {", 
                                   "import React, { Fragment,", 
                                   "react import")
        
        imports_to_add = """
import { DatePickerInput } from '@mantine/dates';
import { Listbox } from '@headlessui/react';
import '@mantine/dates/styles.css';
"""
        content = safe_replace(content, "from 'antd'", f"from 'antd'{imports_to_add}", "antd imports")

        if "DatePickerInput" not in content:
            print("Error: DatePickerInput import failed.")
            sys.exit(1)

        # 2. Add `date` state
        content = safe_replace(content, 
                               "const [maxPrice, setMaxPrice] = useState(0)",
                               "const [maxPrice, setMaxPrice] = useState(0)\n  const [date, setDate] = useState(null)",
                               "useState for date")

        # 3. Add `date` to useEffect
        content = safe_replace(content, 
                               "if (commodity || state) {",
                               "if (commodity || state || date) {",
                               "useEffect condition")
        
        content = safe_replace(content, 
                               "}, [commodity, state])",
                               "}, [commodity, state, date])",
                               "useEffect dependencies")

        # 4. Add date to fetchAll URL with proper encoding
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
        const formattedDate = `${d}/${m}/${y}`;
        url += `&filters[arrival_date]=${encodeURIComponent(formattedDate)}`;
      }"""
        content = safe_replace(content, url_build_code, url_build_code_new, "URL date filter")

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

        content = safe_replace(content, filters_code, filters_code_new, "DatePickerInput UI")

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
                  <Listbox.Option key={s.value} value={s.value} as={Fragment}>
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

        content = safe_replace(content, state_select_code, headless_ui_combo, "Headless UI Listbox")

        # Backup creation
        backup_path = file_path + ".bak"
        shutil.copy2(file_path, backup_path)
        print(f"Backup created at {backup_path}")

        # Atomic write
        # Atomic write with cleanup and local directory default
        dir_name = os.path.dirname(file_path) or "."
        temp_name = None
        try:
            with NamedTemporaryFile('w', dir=dir_name, delete=False, encoding='utf-8', suffix='.tmp') as tf:
                tf.write(content)
                temp_name = tf.name
            
            # Atomic rename (overwrites if destination exists)
            os.replace(temp_name, file_path)
            temp_name = None  # Successfully moved
            print(f"✅ {os.path.basename(file_path)} updated successfully!")
        finally:
            if temp_name and os.path.exists(temp_name):
                try:
                    os.remove(temp_name)
                except:
                    pass

    except Exception as e:
        print(f"Error during file update: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
