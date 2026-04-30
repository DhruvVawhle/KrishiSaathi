/**
 * Automated lint fixer for KrishiSaathi
 * Fixes: unused catch params, unused imports, unused destructured vars
 */
import { readFileSync, writeFileSync } from 'fs';

const fixes = [
  // App.jsx: line 99 - unused 'e' in catch
  { file: 'src/App.jsx', find: '} catch (e) {\n          // ignore', replace: '} catch {\n          // ignore' },

  // AvatarWrappers.jsx: line 20 - unused 'cn'
  { file: 'src/frontend/components/AvatarWrappers.jsx', find: "import { cn } from '../../lib/utils'", replace: "// cn utility available if needed\n// import { cn } from '../../lib/utils'" },

  // CartSidebar.jsx: line 1 - unused useMemo; line 228 - unused index
  { file: 'src/frontend/components/CartSidebar.jsx', find: 'import React, { useState, useEffect, useRef, useMemo } from', replace: 'import React, { useState, useEffect, useRef } from' },
  { file: 'src/frontend/components/CartSidebar.jsx', find: '.map((item, index) => {', replace: '.map((item) => {' },

  // Checkout.jsx: line 34 - unused saveOrderHistory
  { file: 'src/frontend/components/Checkout.jsx', find: "const { saveOrderHistory } = await import('../services/hybridService');", replace: "await import('../services/hybridService');" },

  // DashboardStats.jsx: line 231 - unused i
  { file: 'src/frontend/components/DashboardStats.jsx', find: '.map((o, i) => {', replace: '.map((o) => {' },

  // FarmerHeader.jsx: line 2 - unused useEffect, useRef, useCallback
  { file: 'src/frontend/components/FarmerHeader.jsx', find: 'import React, { useState, useEffect, useRef, useCallback } from', replace: 'import React, { useState } from' },

  // FarmerLayout.jsx: line 17 - unused Icon param
  { file: 'src/frontend/components/FarmerLayout.jsx', find: '({ label, path, Icon })', replace: '({ label, path, Icon: _Icon })' },

  // FeaturedProducts.jsx: line 2 - unused useMemo
  { file: 'src/frontend/components/FeaturedProducts.jsx', find: 'import React, { useState, useEffect, useRef, useMemo } from', replace: 'import React, { useState, useEffect, useRef } from' },

  // Layout.jsx: line 65 - unused lockBodyScroll, line 105 - unused handleCloseCart
  { file: 'src/frontend/components/Layout.jsx', find: 'const lockBodyScroll =', replace: '// eslint-disable-next-line no-unused-vars\n  const lockBodyScroll =' },
  { file: 'src/frontend/components/Layout.jsx', find: 'const handleCloseCart =', replace: '// eslint-disable-next-line no-unused-vars\n  const handleCloseCart =' },

  // MarketProductCard.jsx: line 101 - unused e, line 139 - unused isAdded, line 147 - unused index
  { file: 'src/frontend/components/MarketProductCard.jsx', find: 'onError={(e) => {', replace: 'onError={(_e) => {' },
  { file: 'src/frontend/components/MarketProductCard.jsx', find: 'const isAdded =', replace: 'const _isAdded =' },
  { file: 'src/frontend/components/MarketProductCard.jsx', find: 'const index =', replace: 'const _index =' },

  // UIKrishiSaathi.jsx: line 101, 103 - unused e/err, line 247 - unused Icon
  { file: 'src/frontend/components/UIKrishiSaathi.jsx', find: '} catch (e) {\n      console.error', replace: '} catch (_e) {\n      console.error' },
  { file: 'src/frontend/components/UIKrishiSaathi.jsx', find: 'catch (err) {}', replace: 'catch { /* intentional */ }' },
  { file: 'src/frontend/components/UIKrishiSaathi.jsx', find: '({ label, href, Icon })', replace: '({ label, href, Icon: _Icon })' },

  // firestoreService.js: line 5 - unused orderBy
  { file: 'src/frontend/services/firestoreService.js', find: "  orderBy,\n", replace: "" },

  // fetchUtils.js: line 47 - unused e
  { file: 'src/frontend/utils/fetchUtils.js', find: '} catch (e) {\n    return', replace: '} catch {\n    return' },

  // CartContext.jsx: line 19 - unused unsubscribeCartRef, line 53 - unused e
  { file: 'src/frontend/contexts/CartContext.jsx', find: 'const unsubscribeCartRef =', replace: '// eslint-disable-next-line no-unused-vars\n  const unsubscribeCartRef =' },
  { file: 'src/frontend/contexts/CartContext.jsx', find: 'catch (e) {}', replace: 'catch { /* intentional */ }' },

  // CartProvider.jsx: line 10 - unused toast, line 84 - unused uid, line 103 - unused err
  { file: 'src/frontend/contexts/CartProvider.jsx', find: "import { toast } from 'react-toastify'", replace: "// toast available if needed\n// import { toast } from 'react-toastify'" },
  { file: 'src/frontend/contexts/CartProvider.jsx', find: 'const uid =', replace: 'const _uid =' },
  { file: 'src/frontend/contexts/CartProvider.jsx', find: 'catch (err) {\n      // Silently', replace: 'catch {\n      // Silently' },

  // ProductContext.jsx: line 105 - unused e
  { file: 'src/frontend/contexts/ProductContext.jsx', find: '} catch (e) {\n      console.error', replace: '} catch {\n      console.error' },

  // UserContext.jsx: line 2 - unused getAuth, line 5 - unused hybridService
  { file: 'src/frontend/contexts/UserContext.jsx', find: "import { getAuth, onAuthStateChanged", replace: "import { onAuthStateChanged" },
  { file: 'src/frontend/contexts/UserContext.jsx', find: "import hybridService", replace: "// hybridService available if needed\n// import hybridService" },

  // Support.jsx: line 247 - unused err
  { file: 'src/frontend/pages/Support.jsx', find: '} catch (err) {\n      notifications', replace: '} catch {\n      notifications' },

  // ThankYou.jsx: line 18 - unused idx
  { file: 'src/frontend/pages/ThankYou.jsx', find: '.map((p, idx) =>', replace: '.map((p) =>' },

  // BuyerOrders.jsx: line 96 - unused err
  { file: 'src/frontend/pages/BuyerOrders.jsx', find: 'catch (err) {\n      console', replace: 'catch {\n      console' },
];

let totalFixed = 0;
let totalFailed = 0;

for (const fix of fixes) {
  try {
    let content = readFileSync(fix.file, 'utf8');
    if (content.includes(fix.find)) {
      content = content.replace(fix.find, fix.replace);
      writeFileSync(fix.file, content, 'utf8');
      console.log(`✅ Fixed: ${fix.file}`);
      totalFixed++;
    } else {
      console.log(`⚠️ Pattern not found in ${fix.file}: "${fix.find.substring(0, 50)}..."`);
      totalFailed++;
    }
  } catch (err) {
    console.error(`❌ Error: ${fix.file}: ${err.message}`);
    totalFailed++;
  }
}

console.log(`\nDone: ${totalFixed} fixed, ${totalFailed} skipped`);
