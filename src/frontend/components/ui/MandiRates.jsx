import React, { useState, useEffect, useTransition } from 'react'
import {
  ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
  BarChart, Bar
} from 'recharts'
import {
  Table,
  Tag,
  ConfigProvider
} from 'antd'
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOption,
  ComboboxOptions,
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption
} from '@headlessui/react'
import '@mantine/dates/styles.css';

import {
  TrendingUp, TrendingDown,
  Minus, RefreshCw,
  AlertTriangle, CheckCircle,
  BarChart3, Leaf, IndianRupee,
  ArrowUp, ArrowDown, Search
} from 'lucide-react'

import {
  safeDate,
  formatDate,
} from '@/frontend/utils/dateUtils'

import {
  fetchJSON,
  handleFetchError
} from '@/frontend/utils/fetchUtils'

import { motion, AnimatePresence } from "motion/react";

const INDIAN_STATES = [
  { value: '', label: 'All States' },
  {
    value: 'Andhra Pradesh',
    label: 'Andhra Pradesh'
  },
  {
    value: 'Arunachal Pradesh',
    label: 'Arunachal Pradesh'
  },
  {
    value: 'Assam',
    label: 'Assam'
  },
  {
    value: 'Bihar',
    label: 'Bihar'
  },
  {
    value: 'Chhattisgarh',
    label: 'Chhattisgarh'
  },
  {
    value: 'Goa',
    label: 'Goa'
  },
  {
    value: 'Gujarat',
    label: 'Gujarat'
  },
  {
    value: 'Haryana',
    label: 'Haryana'
  },
  {
    value: 'Himachal Pradesh',
    label: 'Himachal Pradesh'
  },
  {
    value: 'Jharkhand',
    label: 'Jharkhand'
  },
  {
    value: 'Karnataka',
    label: 'Karnataka'
  },
  {
    value: 'Kerala',
    label: 'Kerala'
  },
  {
    value: 'Madhya Pradesh',
    label: 'Madhya Pradesh'
  },
  {
    value: 'Maharashtra',
    label: 'Maharashtra'
  },
  {
    value: 'Manipur',
    label: 'Manipur'
  },
  {
    value: 'Meghalaya',
    label: 'Meghalaya'
  },
  {
    value: 'Mizoram',
    label: 'Mizoram'
  },
  {
    value: 'Nagaland',
    label: 'Nagaland'
  },
  {
    value: 'Odisha',
    label: 'Odisha'
  },
  {
    value: 'Punjab',
    label: 'Punjab'
  },
  {
    value: 'Rajasthan',
    label: 'Rajasthan'
  },
  {
    value: 'Sikkim',
    label: 'Sikkim'
  },
  {
    value: 'Tamil Nadu',
    label: 'Tamil Nadu'
  },
  {
    value: 'Telangana',
    label: 'Telangana'
  },
  {
    value: 'Tripura',
    label: 'Tripura'
  },
  {
    value: 'Uttar Pradesh',
    label: 'Uttar Pradesh'
  },
  {
    value: 'Uttarakhand',
    label: 'Uttarakhand'
  },
  {
    value: 'West Bengal',
    label: 'West Bengal'
  },
  {
    value: 'Andaman and Nicobar Islands',
    label: 'Andaman & Nicobar Islands'
  },
  {
    value: 'Chandigarh',
    label: 'Chandigarh'
  },
  {
    value: 'Dadra and Nagar Haveli',
    label: 'Dadra & Nagar Haveli'
  },
  {
    value: 'Daman and Diu',
    label: 'Daman & Diu'
  },
  {
    value: 'Delhi',
    label: 'Delhi'
  },
  {
    value: 'Jammu and Kashmir',
    label: 'Jammu & Kashmir'
  },
  {
    value: 'Ladakh',
    label: 'Ladakh'
  },
  {
    value: 'Lakshadweep',
    label: 'Lakshadweep'
  },
  {
    value: 'Puducherry',
    label: 'Puducherry'
  },
]

const COMMODITIES = [
  {
    value: '',
    label: 'All Commodities',
    hindi: '',
    local: []
  },

  // ── VEGETABLES ──────────────────
  {
    value: 'Tomato',
    label: 'Tomato',
    hindi: 'टमाटर',
    marathi: 'टोमॅटो',
    tamil: 'தக்காளி',
    telugu: 'టమాటా',
    local: ['tamatar', 'tamato',
      'lal sabzi']
  },
  {
    value: 'Onion',
    label: 'Onion',
    hindi: 'प्याज',
    marathi: 'कांदा',
    tamil: 'வெங்காயம்',
    telugu: 'ఉల్లిపాయ',
    local: ['pyaz', 'pyaaz', 'kanda']
  },
  {
    value: 'Potato',
    label: 'Potato',
    hindi: 'आलू',
    marathi: 'बटाटा',
    tamil: 'உருளைக்கிழங்கு',
    telugu: 'బంగాళాదుంప',
    local: ['aloo', 'alu', 'batata']
  },
  {
    value: 'Brinjal',
    label: 'Brinjal',
    hindi: 'बैंगन',
    marathi: 'वांगे',
    tamil: 'கத்தரிக்காய்',
    telugu: 'వంకాయ',
    local: ['baingan', 'baigan',
      'vange', 'eggplant']
  },
  {
    value: 'Cauliflower',
    label: 'Cauliflower',
    hindi: 'फूलगोभी',
    marathi: 'फुलकोबी',
    tamil: 'காலிஃப்ளவர்',
    telugu: 'కాలీఫ్లవర్',
    local: ['gobi', 'gobhi',
      'phool gobhi', 'flower']
  },
  {
    value: 'Cabbage',
    label: 'Cabbage',
    hindi: 'पत्तागोभी',
    marathi: 'कोबी',
    tamil: 'முட்டைகோஸ்',
    telugu: 'క్యాబేజీ',
    local: ['patta gobhi', 'band gobhi',
      'kobi']
  },
  {
    value: 'Capsicum',
    label: 'Capsicum',
    hindi: 'शिमला मिर्च',
    marathi: 'ढोबळी मिरची',
    tamil: 'குடைமிளகாய்',
    telugu: 'క్యాప్సికం',
    local: ['shimla mirch', 'shimla',
      'bell pepper', 'dhobali']
  },
  {
    value: 'Carrot',
    label: 'Carrot',
    hindi: 'गाजर',
    marathi: 'गाजर',
    tamil: 'கேரட்',
    telugu: 'క్యారెట్',
    local: ['gajar', 'lal mooli']
  },
  {
    value: 'Spinach',
    label: 'Spinach',
    hindi: 'पालक',
    marathi: 'पालक',
    tamil: 'பசலை கீரை',
    telugu: 'పాలకూర',
    local: ['palak', 'saag',
      'harey patte']
  },
  {
    value: 'Ladies Finger',
    label: 'Ladies Finger',
    hindi: 'भिंडी',
    marathi: 'भेंडी',
    tamil: 'வெண்டைக்காய்',
    telugu: 'బెండకాయ',
    local: ['bhindi', 'bhendi',
      'okra', 'lady finger']
  },
  {
    value: 'Green Chilli',
    label: 'Green Chilli',
    hindi: 'हरी मिर्च',
    marathi: 'हिरवी मिरची',
    tamil: 'பச்சை மிளகாய்',
    telugu: 'పచ్చి మిర్చి',
    local: ['hari mirch', 'mirchi',
      'chilli', 'mirch']
  },
  {
    value: 'Bitter Gourd',
    label: 'Bitter Gourd',
    hindi: 'करेला',
    marathi: 'कारले',
    tamil: 'பாகற்காய்',
    telugu: 'కాకరకాయ',
    local: ['karela', 'karle',
      'bitter vegetable']
  },
  {
    value: 'Bottle Gourd',
    label: 'Bottle Gourd',
    hindi: 'लौकी',
    marathi: 'दुधी',
    tamil: 'சுரைக்காய்',
    telugu: 'సొర కాయ',
    local: ['lauki', 'dudhi', 'ghia',
      'doodhi']
  },
  {
    value: 'Pumpkin',
    label: 'Pumpkin',
    hindi: 'कद्दू',
    marathi: 'भोपळा',
    tamil: 'பரங்கிக்காய்',
    telugu: 'గుమ్మడికాయ',
    local: ['kaddu', 'bhopla',
      'kumhda']
  },
  {
    value: 'Radish',
    label: 'Radish',
    hindi: 'मूली',
    marathi: 'मुळा',
    tamil: 'முள்ளங்கி',
    telugu: 'ముల్లంగి',
    local: ['mooli', 'mula',
      'white radish']
  },
  {
    value: 'Cucumber',
    label: 'Cucumber',
    hindi: 'खीरा',
    marathi: 'काकडी',
    tamil: 'வெள்ளரிக்காய்',
    telugu: 'దోసకాయ',
    local: ['kheera', 'kakdi',
      'khira', 'kakdi']
  },
  {
    value: 'Drumstick',
    label: 'Drumstick',
    hindi: 'सहजन',
    marathi: 'शेवगा',
    tamil: 'முருங்கைக்காய்',
    telugu: 'మునగకాయ',
    local: ['sahjan', 'shevga',
      'moringa', 'murungai']
  },
  {
    value: 'Coriander Leaves',
    label: 'Coriander Leaves',
    hindi: 'धनिया पत्ती',
    marathi: 'कोथिंबीर',
    tamil: 'கொத்தமல்லி',
    telugu: 'కొత్తిమీర',
    local: ['dhaniya', 'kothamalli',
      'kothimbir', 'cilantro']
  },
  {
    value: 'Methi Leaves',
    label: 'Methi Leaves',
    hindi: 'मेथी',
    marathi: 'मेथी',
    tamil: 'வெந்தய கீரை',
    telugu: 'మెంతి కూర',
    local: ['methi', 'fenugreek leaves',
      'methi saag']
  },
  {
    value: 'Ginger',
    label: 'Ginger',
    hindi: 'अदरक',
    marathi: 'आलं',
    tamil: 'இஞ்சி',
    telugu: 'అల్లం',
    local: ['adrak', 'aale',
      'inji', 'allam']
  },
  {
    value: 'Garlic',
    label: 'Garlic',
    hindi: 'लहसुन',
    marathi: 'लसूण',
    tamil: 'பூண்டு',
    telugu: 'వెల్లుల్లి',
    local: ['lahsun', 'lasun',
      'lasoon', 'poondu']
  },
  {
    value: 'Mushroom',
    label: 'Mushroom',
    hindi: 'मशरूम',
    marathi: 'मशरूम',
    tamil: 'காளான்',
    telugu: 'పుట్టగొడుగు',
    local: ['mushroom', 'khumb',
      'dhingri']
  },
  {
    value: 'Sweet Potato',
    label: 'Sweet Potato',
    hindi: 'शकरकंद',
    marathi: 'रताळे',
    tamil: 'சர்க்கரைவள்ளி',
    telugu: 'చిలగడదుంప',
    local: ['shakarkand', 'ratale',
      'sweet aloo']
  },

  // ── FRUITS ──────────────────────

  {
    value: 'Banana',
    label: 'Banana',
    hindi: 'केला',
    marathi: 'केळ',
    tamil: 'வாழைப்பழம்',
    telugu: 'అరటి పండు',
    local: ['kela', 'kel', 'kele',
      'kadali']
  },
  {
    value: 'Mango',
    label: 'Mango',
    hindi: 'आम',
    marathi: 'आंबा',
    tamil: 'மாம்பழம்',
    telugu: 'మామిడి పండు',
    local: ['aam', 'amba', 'keri',
      'hapus', 'alphonso',
      'langda', 'dasheri']
  },
  {
    value: 'Apple',
    label: 'Apple',
    hindi: 'सेब',
    marathi: 'सफरचंद',
    tamil: 'ஆப்பிள்',
    telugu: 'యాపిల్',
    local: ['seb', 'safarchand',
      'apple fruit']
  },
  {
    value: 'Grapes',
    label: 'Grapes',
    hindi: 'अंगूर',
    marathi: 'द्राक्षे',
    tamil: 'திராட்சை',
    telugu: 'ద్రాక్ష',
    local: ['angur', 'draksha',
      'angoor', 'drakhe']
  },
  {
    value: 'Pomegranate',
    label: 'Pomegranate',
    hindi: 'अनार',
    marathi: 'डाळिंब',
    tamil: 'மாதுளை',
    telugu: 'దానిమ్మ',
    local: ['anar', 'dalimb',
      'matulam']
  },
  {
    value: 'Orange',
    label: 'Orange',
    hindi: 'संतरा',
    marathi: 'संत्रे',
    tamil: 'ஆரஞ்சு',
    telugu: 'నారింజ',
    local: ['santra', 'santre',
      'orange fruit', 'narangi']
  },
  {
    value: 'Papaya',
    label: 'Papaya',
    hindi: 'पपीता',
    marathi: 'पपई',
    tamil: 'பப்பாளி',
    telugu: 'బొప్పాయి',
    local: ['papita', 'papai',
      'pappali']
  },
  {
    value: 'Watermelon',
    label: 'Watermelon',
    hindi: 'तरबूज',
    marathi: 'कलिंगड',
    tamil: 'தர்பூசணி',
    telugu: 'పుచ్చకాయ',
    local: ['tarbuj', 'kalingad',
      'tarbooj']
  },
  {
    value: 'Guava',
    label: 'Guava',
    hindi: 'अमरूद',
    marathi: 'पेरू',
    tamil: 'கொய்யா',
    telugu: 'జామ',
    local: ['amrood', 'peru',
      'koyya', 'jaam']
  },
  {
    value: 'Coconut',
    label: 'Coconut',
    hindi: 'नारियल',
    marathi: 'नारळ',
    tamil: 'தேங்காய்',
    telugu: 'కొబ్బరి',
    local: ['nariyal', 'naral',
      'thengai', 'kobbari']
  },
  {
    value: 'Lemon',
    label: 'Lemon',
    hindi: 'नींबू',
    marathi: 'लिंबू',
    tamil: 'எலுமிச்சை',
    telugu: 'నిమ్మకాయ',
    local: ['nimbu', 'limbu',
      'elumichai', 'nimboo']
  },

  // ── CEREALS ─────────────────────
  {
    value: 'Wheat',
    label: 'Wheat',
    hindi: 'गेहूं',
    marathi: 'गहू',
    tamil: 'கோதுமை',
    telugu: 'గోధుమ',
    local: ['gehun', 'gehu',
      'gahu', 'gahun']
  },
  {
    value: 'Rice',
    label: 'Rice',
    hindi: 'चावल',
    marathi: 'तांदूळ',
    tamil: 'அரிசி',
    telugu: 'బియ్యం',
    local: ['chawal', 'tandul',
      'arisi', 'bhat', 'anna']
  },
  {
    value: 'Maize',
    label: 'Maize',
    hindi: 'मक्का',
    marathi: 'मका',
    tamil: 'மக்காச்சோளம்',
    telugu: 'మొక్జొన్న',
    local: ['makka', 'bhutta',
      'corn', 'makki', 'maka']
  },
  {
    value: 'Paddy (Dhan) Common',
    label: 'Paddy',
    hindi: 'धान',
    marathi: 'भात',
    tamil: 'நெல்',
    telugu: 'వరి',
    local: ['dhan', 'bhat', 'nel',
      'paddy', 'vari']
  },
  {
    value: 'Bajra (Pearl Millet/Cumbu)',
    label: 'Bajra',
    hindi: 'बाजरा',
    marathi: 'बाजरी',
    tamil: 'கம்பு',
    telugu: 'సజ్జలు',
    local: ['bajra', 'bajri',
      'kambu', 'sajjalu']
  },
  {
    value: 'Jowar (Sorghum)',
    label: 'Jowar',
    hindi: 'ज्वार',
    marathi: 'ज्वारी',
    tamil: 'சோளம்',
    telugu: 'జొన్న',
    local: ['jowar', 'jwari',
      'cholam', 'jonna']
  },
  {
    value: 'Ragi (Finger Millet)',
    label: 'Ragi',
    hindi: 'रागी',
    marathi: 'नाचणी',
    tamil: 'கேழ்வரகு',
    telugu: 'రాగి',
    local: ['ragi', 'nachni',
      'nachani', 'mandua']
  },

  // ── PULSES ──────────────────────
  {
    value: 'Arhar (Tur/Red Gram)',
    label: 'Arhar / Tur Dal',
    hindi: 'अरहर दाल',
    marathi: 'तूर डाळ',
    tamil: 'தூவரம் பருப்பு',
    telugu: 'కందిపప్పు',
    local: ['arhar', 'tur', 'toor',
      'tur dal', 'toor dal',
      'red gram']
  },
  {
    value: 'Green Gram (Moong)',
    label: 'Moong Dal',
    hindi: 'मूंग दाल',
    marathi: 'मूग डाळ',
    tamil: 'பாசிப்பருப்பு',
    telugu: 'పెసలు',
    local: ['moong', 'mung',
      'moog', 'green gram',
      'moong dal']
  },
  {
    value: 'Black Gram (Urd Beans)',
    label: 'Urad Dal',
    hindi: 'उड़द दाल',
    marathi: 'उडीद डाळ',
    tamil: 'உளுத்தம்பருப்பு',
    telugu: 'మినపప్పు',
    local: ['urad', 'udad', 'urad dal',
      'black gram', 'maash']
  },
  {
    value: 'Bengal Gram Dal (Chana Dal)',
    label: 'Chana Dal',
    hindi: 'चना दाल',
    marathi: 'चणा डाळ',
    tamil: 'கடலைப்பருப்பு',
    telugu: 'శనగపప్పు',
    local: ['chana', 'channa',
      'chana dal', 'gram dal',
      'chickpea']
  },
  {
    value: 'Lentil (Masur)',
    label: 'Masur Dal',
    hindi: 'मसूर दाल',
    marathi: 'मसूर डाळ',
    tamil: 'மசூர் பருப்பு',
    telugu: 'మసూర్ పప్పు',
    local: ['masur', 'masoor',
      'masur dal', 'red lentil']
  },
  {
    value: 'Soybean',
    label: 'Soybean',
    hindi: 'सोयाबीन',
    marathi: 'सोयाबीन',
    tamil: 'சோயா பீன்',
    telugu: 'సోయాబీన్',
    local: ['soya', 'soyabean',
      'soybean seeds']
  },

  // ── OILSEEDS ────────────────────
  {
    value: 'Groundnut',
    label: 'Groundnut',
    hindi: 'मूंगफली',
    marathi: 'शेंगदाणे',
    tamil: 'வேர்க்கடலை',
    telugu: 'వేరుశెనగ',
    local: ['moongphali', 'shengdane',
      'peanut', 'verkadalai',
      'sing', 'mungphali']
  },
  {
    value: 'Mustard',
    label: 'Mustard',
    hindi: 'सरसों',
    marathi: 'मोहरी',
    tamil: 'கடுகு',
    telugu: 'ఆవాలు',
    local: ['sarso', 'rai', 'mohri',
      'kadugu', 'avalu',
      'sarson', 'raai']
  },
  {
    value: 'Sunflower',
    label: 'Sunflower',
    hindi: 'सूरजमुखी',
    marathi: 'सूर्यफूल',
    tamil: 'சூரியகாந்தி',
    telugu: 'పొద్దుతిరుగుడు',
    local: ['surajmukhi', 'surjamukhi',
      'suryaphool']
  },
  {
    value: 'Cotton',
    label: 'Cotton',
    hindi: 'कपास',
    marathi: 'कापूस',
    tamil: 'பருத்தி',
    telugu: 'పత్తి',
    local: ['kapas', 'kapoos',
      'parutti', 'patti']
  },

  // ── SPICES ──────────────────────
  {
    value: 'Turmeric',
    label: 'Turmeric',
    hindi: 'हल्दी',
    marathi: 'हळद',
    tamil: 'மஞ்சள்',
    telugu: 'పసుపు',
    local: ['haldi', 'halad',
      'manjal', 'pasupu']
  },
  {
    value: 'Chilli Red',
    label: 'Red Chilli',
    hindi: 'लाल मिर्च',
    marathi: 'लाल मिरची',
    tamil: 'சிவப்பு மிளகாய்',
    telugu: 'ఎండు మిర్చి',
    local: ['lal mirch', 'lal mirchi',
      'dry chilli', 'sukhi mirch']
  },
  {
    value: 'Coriander Seed',
    label: 'Coriander Seed',
    hindi: 'धनिया',
    marathi: 'धने',
    tamil: 'மல்லி விதை',
    telugu: 'దనియాలు',
    local: ['dhaniya', 'dhana',
      'dhane', 'kothmir seed']
  },
  {
    value: 'Cumin Seed (Jeera)',
    label: 'Jeera / Cumin',
    hindi: 'जीरा',
    marathi: 'जिरे',
    tamil: 'சீரகம்',
    telugu: 'జీలకర్ర',
    local: ['jeera', 'jira', 'jire',
      'zeera', 'cumin']
  },
  {
    value: 'Fenugreek Seed (Methi)',
    label: 'Methi Seeds',
    hindi: 'मेथी दाना',
    marathi: 'मेथी दाणे',
    tamil: 'வெந்தயம்',
    telugu: 'మెంతులు',
    local: ['methi dana', 'methi seeds',
      'fenugreek']
  },
  {
    value: 'Black Pepper',
    label: 'Black Pepper',
    hindi: 'काली मिर्च',
    marathi: 'काळी मिरी',
    tamil: 'கருமிளகு',
    telugu: 'నల్ల మిరియాలు',
    local: ['kali mirch', 'kali miri',
      'pepper', 'miriyalu']
  },
  {
    value: 'Cardamom',
    label: 'Cardamom',
    hindi: 'इलायची',
    marathi: 'वेलची',
    tamil: 'ஏலக்காய்',
    telugu: 'యాలకులు',
    local: ['elaichi', 'velchi',
      'elakkai', 'cardamom']
  },

  // ── JAGGERY & SUGAR ─────────────
  {
    value: 'Jaggery',
    label: 'Jaggery',
    hindi: 'गुड़',
    marathi: 'गूळ',
    tamil: 'வெல்லம்',
    telugu: 'బెల్లం',
    local: ['gur', 'gud', 'gul',
      'vellam', 'bellam',
      'shakkar']
  },
  {
    value: 'Sugarcane',
    label: 'Sugarcane',
    hindi: 'गन्ना',
    marathi: 'ऊस',
    tamil: 'கரும்பு',
    telugu: 'చెరకు',
    local: ['ganna', 'oos', 'ikh',
      'karumbu', 'cheraku']
  },

  // ── PLANTATION ──────────────────
  {
    value: 'Arecanut',
    label: 'Arecanut',
    hindi: 'सुपारी',
    marathi: 'सुपारी',
    tamil: 'பாக்கு',
    telugu: 'వక్కలు',
    local: ['supari', 'baaku',
      'paan supari']
  },
  {
    value: 'Cashew Kernel',
    label: 'Cashew',
    hindi: 'काजू',
    marathi: 'काजू',
    tamil: 'முந்திரி',
    telugu: 'జీడిపప్పు',
    local: ['kaju', 'keshew',
      'mundhiri']
  },
  {
    value: 'Tamarind Fruit',
    label: 'Tamarind',
    hindi: 'इमली',
    marathi: 'चिंच',
    tamil: 'புளி',
    telugu: 'చింతపండు',
    local: ['imli', 'chinch',
      'puli', 'chintapandu']
  },
]

const STATE_LANGUAGE_MAP = {
  // Maharashtra → Marathi
  'Maharashtra': {
    lang: 'marathi',
    label: 'मराठी',
    script: 'marathi'
  },
  // Gujarat → Gujarati
  'Gujarat': {
    lang: 'gujarati',
    label: 'ગુજરાતી',
    script: 'gujarati'
  },
  // Tamil Nadu → Tamil
  'Tamil Nadu': {
    lang: 'tamil',
    label: 'தமிழ்',
    script: 'tamil'
  },
  // Andhra Pradesh → Telugu
  'Andhra Pradesh': {
    lang: 'telugu',
    label: 'తెలుగు',
    script: 'telugu'
  },
  // Telangana → Telugu
  'Telangana': {
    lang: 'telugu',
    label: 'తెలుగు',
    script: 'telugu'
  },
  // Karnataka → Kannada
  'Karnataka': {
    lang: 'kannada',
    label: 'ಕನ್ನಡ',
    script: 'kannada'
  },
  // West Bengal → Bengali
  'West Bengal': {
    lang: 'bengali',
    label: 'বাংলা',
    script: 'bengali'
  },
  // Punjab → Punjabi
  'Punjab': {
    lang: 'punjabi',
    label: 'ਪੰਜਾਬੀ',
    script: 'punjabi'
  },
  // Haryana → Hindi
  'Haryana': {
    lang: 'hindi',
    label: 'हिंदी',
    script: 'hindi'
  },
  // Uttar Pradesh → Hindi
  'Uttar Pradesh': {
    lang: 'hindi',
    label: 'हिंदी',
    script: 'hindi'
  },
  // Madhya Pradesh → Hindi
  'Madhya Pradesh': {
    lang: 'hindi',
    label: 'हिंदी',
    script: 'hindi'
  },
  // Rajasthan → Hindi
  'Rajasthan': {
    lang: 'hindi',
    label: 'हिंदी',
    script: 'hindi'
  },
  // Bihar → Hindi
  'Bihar': {
    lang: 'hindi',
    label: 'हिंदी',
    script: 'hindi'
  },
  // Jharkhand → Hindi
  'Jharkhand': {
    lang: 'hindi',
    label: 'हिंदी',
    script: 'hindi'
  },
  // Himachal Pradesh → Hindi
  'Himachal Pradesh': {
    lang: 'hindi',
    label: 'हिंदी',
    script: 'hindi'
  },
  // Uttarakhand → Hindi
  'Uttarakhand': {
    lang: 'hindi',
    label: 'हिंदी',
    script: 'hindi'
  },
  // Delhi → Hindi
  'Delhi': {
    lang: 'hindi',
    label: 'हिंदी',
    script: 'hindi'
  },
  // Odisha → Odia (use Hindi fallback)
  'Odisha': {
    lang: 'hindi',
    label: 'ଓଡ଼ିଆ',
    script: 'hindi'
  },
  // Kerala → Malayalam (use Hindi fallback)
  'Kerala': {
    lang: 'hindi',
    label: 'മലയാളം',
    script: 'hindi'
  },
  // Assam → Bengali script
  'Assam': {
    lang: 'bengali',
    label: 'অসমীয়া',
    script: 'bengali'
  },
  // Default for all other states
  'default': {
    lang: 'hindi',
    label: 'हिंदी',
    script: 'hindi'
  }
}

/**
 * safeDate utility is now imported from @/frontend/utils/dateUtils
 */

// Safe render — never crashes on objects
const _safeRender = (value, fallback = '') => {
  if (value === null || value === undefined) {
    return fallback
  }
  if (typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'object') {
    // Try common string properties
    return value.name
      || value.label
      || value.title
      || value.type
      || value.message
      || value.text
      || fallback
  }
  return fallback
}

const MandiRates = ({
  _farmerProducts = []
}) => {
  const [commodity, setCommodity]
    = useState('')
  const [state, setState]
    = useState('')
  const [farmerPrice, setFarmerPrice]
    = useState('')
  const [rates, setRates] = useState([])
  const [minPrice, setMinPrice] = useState(0)
  const [modalPrice, setModalPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(0)
  const [date, setDate] = useState(null)
  const [prediction, setPrediction]
    = useState(null)
  const [comparison, setComparison]
    = useState(null)
  const [history, setHistory] = useState([])
  const [_allRates, _setAllRates] = useState([])
  const [loading, setLoading] = useState(false)
  const [predLoading, setPredLoading]
    = useState(false)
  const [source, setSource] = useState('')
  const [activeTab, setActiveTab]
    = useState('rates')
  const [error, setError] = useState(null)

  const [searchQuery, setSearchQuery]
    = useState('')
  const [_currentPage, setCurrentPage]
    = useState(1)

  const [commoditySearch, setCommoditySearch]
    = useState('')

  const [_isPending, startTransition] = useTransition()

  // -- TABLE DATA PROCESSING --
  const filteredRecords = React.useMemo(() => {
    let filtered = [...(rates || [])]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(r =>
        (r.market || '').toLowerCase().includes(q) ||
        (r.commodity || '').toLowerCase().includes(q) ||
        (r.district || '').toLowerCase().includes(q) ||
        (r.state || '').toLowerCase().includes(q)
      )
    }
    return filtered
  }, [rates, searchQuery])

  const columns = [
    {
      title: 'COMMODITY',
      dataIndex: 'commodity',
      key: 'commodity',
      sorter: (a, b) => (a.commodity || '').localeCompare(b.commodity || ''),
      render: (text) => <span style={{ fontWeight: 600, color: '#2D4F1E' }}>{text}</span>
    },
    {
      title: 'MARKET',
      dataIndex: 'market',
      key: 'market',
      sorter: (a, b) => (a.market || '').localeCompare(b.market || '')
    },
    {
      title: 'DISTRICT',
      dataIndex: 'district',
      key: 'district',
      responsive: ['md']
    },
    {
      title: 'STATE',
      dataIndex: 'state',
      key: 'state',
      responsive: ['lg']
    },
    {
      title: 'MODAL ₹',
      dataIndex: 'modalPrice',
      key: 'modalPrice',
      sorter: (a, b) => a.modalPrice - b.modalPrice,
      render: (val) => (
        <div>
          <div style={{ fontWeight: 700, color: '#2D4F1E' }}>₹{(val / 100).toFixed(2)}/{unit}</div>
          <div style={{ fontSize: 10, color: '#B0A898' }}>₹{Math.round(val)}/qtl</div>
        </div>
      )
    },
    {
      title: 'RANGE',
      key: 'range',
      render: (_, record) => {
        const badge = getPriceBadge(record.modalPrice)
        if (!badge) return null
        return (
          <Tag color={badge.color === '#2D4F1E' ? 'green' : badge.color === '#FF5252' ? 'red' : 'orange'} style={{ borderRadius: 6, fontWeight: 600 }}>
            {badge.label}
          </Tag>
        )
      }
    },
    {
      title: 'DATE',
      dataIndex: 'arrivalDate',
      key: 'arrivalDate',
      sorter: (a, b) => new Date(a.arrivalDate) - new Date(b.arrivalDate),
      render: (val) => formatDate(val)
    }
  ]

  // Price category badge
  const getPriceBadge = (modalPrice) => {
    if (!modalPrice) return null
    const kg = modalPrice / 100
    if (kg < 5) return { label: 'Low', color: '#FF5252' }
    if (kg < 15) return { label: 'Fair', color: '#2E7D32' }
    if (kg < 30) return { label: 'Good', color: '#2D4F1E' }
    return { label: 'Premium', color: '#C96848' }
  }


  const isLiquid = (commodity || '').toLowerCase().includes('milk') || (commodity || '').toLowerCase().includes('oil')
  const unit = isLiquid ? 'L' : 'kg'

  // ✅ Consolidated Effect: Prevents duplicate triggers and ensures cleanup
  useEffect(() => {
    const controller = new AbortController()
    fetchAll(controller.signal)
    return () => controller.abort()
  }, [commodity, state, date])

  const fetchAll = async (outerSignal) => {
    setLoading(true)
    setError('')
    try {
      const limit = (!commodity && !state) ? 100 : 50
      let url = `/api/mandi/today?limit=${limit}&state=${encodeURIComponent(state || '')}&commodity=${encodeURIComponent(commodity || '')}`

      if (date) {
        const dObj = safeDate(date)
        if (dObj) {
          const d = dObj.getDate().toString().padStart(2, '0')
          const m = (dObj.getMonth() + 1).toString().padStart(2, '0')
          const y = dObj.getFullYear()
          url += `&date=${d}/${m}/${y}`
        }
      }

      const data = await fetchJSON(url, { signal: outerSignal })
      if (data.aborted) return

      if (!data.success || !data.records || data.records.length === 0) {
        startTransition(() => {
          setRates([])
          const msg = data.error || (commodity || state ? `No data found. Try different filters.` : `No rates available.`)
          setError(msg)
          notifications.show({
            title: '🔎 No data found',
            message: msg,
            color: 'orange',
            styles: { root: { fontFamily: 'DM Sans', borderLeft: '4px solid #F5A623' } }
          });
        })
        return
      }

      const parsed = []
      let sumModal = 0
      let runningMin = Infinity
      let runningMax = -Infinity

      data.records.forEach(r => {
        const modal = parseFloat(r.modal_price || r.Modal_Price || r.modalPrice || r.price_qtl || 0)
        if (modal > 0) {
          const min = parseFloat(r.min_price || r.Min_Price || r.minPrice || r.price_qtl || 0)
          const max = parseFloat(r.max_price || r.Max_Price || r.maxPrice || r.price_qtl || 0)

          parsed.push({
            commodity: r.commodity || r.Commodity || '',
            market: r.market || r.Market || '',
            district: r.district || r.District || '',
            state: r.state || r.State || '',
            variety: r.variety || r.Variety || 'Other',
            minPrice: min,
            modalPrice: modal,
            maxPrice: max,
            arrivalDate: r.arrival_date || r.Arrival_Date || formatDate(new Date())
          })

          sumModal += modal
          if (min > 0 && min < runningMin) runningMin = min
          if (max > runningMax) runningMax = max
        }
      })

      startTransition(() => {
        setRates(parsed)
        setSource('live')

        if (parsed.length > 0) {
          const avgModal = Math.round((sumModal / parsed.length) * 10) / 10
          setModalPrice(avgModal)
          setMinPrice(runningMin === Infinity ? 0 : runningMin)
          setMaxPrice(runningMax === -Infinity ? 0 : runningMax)

          if (commodity) {
            const firstMarket = parsed[0]?.market || ''
            fetchPrediction(commodity, avgModal, firstMarket, outerSignal)
            fetchHistory(commodity, state, outerSignal)
          }
        }
      })
    } catch (err) {
      if (err.name === 'AbortError') return
      console.error('Mandi data fetch error:', err)
      setError('Could not load data. Please try again.')
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch mandi data',
        color: 'red'
      })
    } finally {
      if (!outerSignal.aborted) setLoading(false)
    }
  }

  const fetchPrediction = async (comm, price, mkt, signal) => {
    if (!comm || !price) return
    setPredLoading(true)
    try {
      const url = `/api/mandi/predict?commodity=${comm}&current_price=${price}&state=${state || ''}&market=${mkt || ''}`
      const data = await fetchJSON(url, { signal })
      if (data.aborted) return
      if (data.success) {
        console.log('[MandiRates] Prediction loaded, keys:', Object.keys(data))
        setPrediction(data)
      } else {
        console.warn('[MandiRates] Prediction failed:', data.error || 'unknown')
      }
    } catch (err) {
      handleFetchError(err)
    } finally {
      setPredLoading(false)
    }
  }

  const fetchHistory = async (comm, st, signal) => {
    if (!comm) return
    try {
      const url = `/api/mandi/history?commodity=${comm}&state=${st || ''}`
      const data = await fetchJSON(url, { signal })
      if (data.aborted) return
      if (data.success && Array.isArray(data.history)) {
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const formatHistDate = (raw) => {
          if (!raw) return ''
          const s = String(raw).trim()
          // Try DD/MM/YYYY or DD-MM-YYYY
          const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
          if (dmy) {
            const day = dmy[1].padStart(2, '0')
            const mon = MONTHS[parseInt(dmy[2], 10) - 1] || dmy[2]
            return `${day} ${mon}`
          }
          // Try YYYY-MM-DD or YYYY/MM/DD
          const ymd = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
          if (ymd) {
            const day = ymd[3].padStart(2, '0')
            const mon = MONTHS[parseInt(ymd[2], 10) - 1] || ymd[2]
            return `${day} ${mon}`
          }
          // Try native Date parse as last resort
          const d = new Date(s)
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
          }
          return s.slice(0, 6)
        }
        setHistory(data.history.map(h => ({
          ...h,
          modal: h.modal_price || h.modalPrice || 0,
          date: formatHistDate(h.date || h.arrival_date)
        })))
      }
    } catch (err) {
      handleFetchError(err)
    }
  }

  const handleCompare = async () => {
    if (!commodity) {
      notifications.show({
        title: '⚠️ Select Commodity',
        message: 'Please select a commodity first to compare prices.',
        color: 'orange',
        styles: { root: { fontFamily: 'DM Sans', borderLeft: '4px solid #F5A623' } }
      });
      return
    }

    if (!farmerPrice) return

    const validPrice = validatePrice(
      farmerPrice
    )

    if (farmerPrice && !validPrice) {
      notifications.show({
        title: '❌ Invalid Price',
        message: 'Please enter a valid price greater than ₹0',
        color: 'red',
        styles: { root: { fontFamily: 'DM Sans', borderLeft: '4px solid #FF5252' } }
      });
      return
    }

    // Auto convert local name to English
    const englishCommodity =
      getEnglishName(commodity)

    if (englishCommodity !==
      commodity) {
      setCommodity(
        englishCommodity
      )
      console.log(
        `Converted: ${commodity}` +
        ` → ${englishCommodity}`
      )
    }

    try {
      if (!modalPrice || modalPrice <= 0) {
        notifications.show({
          title: '⏳ No Mandi Data',
          message: 'Mandi rates are currently not available. Please wait or select a different state.',
          color: 'blue'
        });
        return
      }

      const yourPrice = parseFloat(farmerPrice)
      const data = {
        commodity: englishCommodity,
        farmer_price: yourPrice,
        mandi_modal: modalPrice
      }

      const mandiKgPrice = modalPrice / 100
      const diff = yourPrice - mandiKgPrice
      const pct = (
        (yourPrice - mandiKgPrice) / mandiKgPrice * 100
      ).toFixed(1)

      data.diff_percent = parseFloat(pct)
      data.diff = diff

      if (diff > 0) {
        data.message = `Your price is ₹${diff.toFixed(2)} above mandi rate.`
        data.status = 'above_market'
        data.color = '#E27D60'
        data.badge = 'Above Market'
      } else if (diff < 0) {
        data.message = `Your price is ₹${Math.abs(diff).toFixed(2)} below mandi rate.`
        data.status = 'competitive'
        data.color = '#4CAF50'
        data.badge = 'Competitive'
      } else {
        data.message = 'Your price matches the mandi modal rate.'
        data.status = 'average'
        data.color = '#F2B94A'
        data.badge = 'At Market'
      }

      setComparison(data)
    } catch (err) {
      console.error('Compare error:', err)
    }
  }

  // Helper utilities for data processing
  const toKg = React.useCallback((qtlPrice) => {
    if (!qtlPrice || qtlPrice <= 0) return 0
    const kg = qtlPrice / 100
    return Math.round(kg * 100) / 100
  }, [])

  const formatKg = React.useCallback((qtlPrice) => {
    const kg = toKg(qtlPrice)
    if (kg === 0) return '0'
    return kg % 1 === 0 ? String(kg) : kg.toFixed(2)
  }, [toKg])

  const forecastData = prediction

  // Memoize chart data to avoid expensive re-calculations on every render
  const chartData = React.useMemo(() => {
    const points = []

    // Helper: normalize date labels to 'DD Mon' format
    const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const normalizeDate = (raw) => {
      if (!raw) return ''
      const s = String(raw).trim()
      // Already in 'DD Mon' format (e.g., '06 Apr')?
      if (/^\d{1,2}\s[A-Z][a-z]{2}$/.test(s)) return s
      // DD/MM or DD/MM/YYYY
      const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-]\d{2,4})?$/)
      if (dmy) {
        return `${dmy[1].padStart(2, '0')} ${MONTHS_SHORT[parseInt(dmy[2], 10) - 1] || dmy[2]}`
      }
      // YYYY-MM-DD
      const ymd = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
      if (ymd) {
        return `${ymd[3].padStart(2, '0')} ${MONTHS_SHORT[parseInt(ymd[2], 10) - 1] || ymd[2]}`
      }
      return s
    }

    // Helper: safely parse a price value (backend already returns ₹/kg)
    const safePrice = (val) => {
      if (val === null || val === undefined) return null
      const n = parseFloat(String(val))
      if (isNaN(n) || !isFinite(n) || n <= 0) return null
      return Math.round(n * 100) / 100
    }

    // ── HISTORICAL DATA ──────────────────
    // Priority 1: history state from /api/mandi/history
    // Backend read_historical() already returns modal_price in ₹/kg via to_kg()
    if (Array.isArray(history) && history.length > 0) {
      history.slice(-15).forEach(h => {
        const kg = safePrice(h.modal)
        if (!kg) return
        points.push({
          date: normalizeDate(h.date),
          actual: kg,
          predicted: null,
          type: 'historical'
        })
      })
    }

    // Priority 2: historical_chart from prediction response (Python)
    if (points.filter(p => p.type === 'historical').length === 0 && forecastData?.historical_chart) {
      const histChart = forecastData.historical_chart.filter(d => d.type === 'actual')
      histChart.forEach(h => {
        // predict endpoint returns prices already in ₹/kg
        const kg = safePrice(h.price)
        if (!kg) return
        points.push({
          date: normalizeDate(h.date) || '',
          actual: kg,
          predicted: null,
          type: 'historical'
        })
      })
      console.log('[Chart] Used historical_chart from prediction:', points.length, 'points')
    }

    // ── TODAY BRIDGE POINT ──────────────
    // price_kg and current_price are already in ₹/kg
    const todayKg = safePrice(
      forecastData?.today_mandi?.price_kg
      || forecastData?.current_price
    )
    if (todayKg) {
      const todayLabel = new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short'
      })
      points.push({
        date: todayLabel,
        actual: todayKg,
        predicted: todayKg,
        isToday: true,
        type: 'today'
      })
    }

    // ── ML PREDICTIONS ──────────────────
    // Python returns 'predictions' as array of {date, price, day}
    const rawPredictions = forecastData?.predictions

    if (Array.isArray(rawPredictions) && rawPredictions.length > 0) {
      rawPredictions.slice(0, 7).forEach((item, i) => {
        // Handle both object {date, price} and plain number formats
        // Python predict returns prices already in ₹/kg
        const rawPrice = typeof item === 'number' ? item : (item?.price || 0)
        const kg = safePrice(rawPrice)
        if (!kg) return

        const dateLabel = (typeof item === 'object' && item?.date)
          ? item.date
          : (() => {
            const d = new Date()
            d.setDate(d.getDate() + i + 1)
            return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
          })()

        points.push({
          date: dateLabel,
          actual: null,
          predicted: kg,
          type: 'forecast'
        })
      })
    }

    console.log(
      '[Chart] Total points:', points.length,
      '| Historical:', points.filter(p => p.type === 'historical').length,
      '| Today:', points.filter(p => p.type === 'today').length,
      '| Forecast:', points.filter(p => p.type === 'forecast').length
    )

    return points
  }, [history, forecastData, state, toKg])

  // Compute Y-axis domain from actual data (exclude nulls/zeros for tight fit)
  const yDomain = React.useMemo(() => {
    const prices = chartData
      .flatMap(p => [p.actual, p.predicted])
      .filter(v => v !== null && v !== undefined && !isNaN(v) && v > 0)

    if (prices.length === 0) return [0, 100]

    const dataMin = Math.min(...prices)
    const dataMax = Math.max(...prices)
    const range = dataMax - dataMin

    // If all values are the same or very close, create a visible range
    if (range < 1) {
      return [
        Math.max(0, Math.floor(dataMin - 5)),
        Math.ceil(dataMax + 5)
      ]
    }

    // Pad 20% above and below for visible fluctuations
    const pad = range * 0.25
    return [
      Math.max(0, Math.floor(dataMin - pad)),
      Math.ceil(dataMax + pad)
    ]
  }, [chartData])

  // Memoize summary statistics
  const summary = React.useMemo(() => {
    if (!rates.length) return null
    return {
      avg_modal: parseFloat(
        (rates.reduce((s, r) => s + (r.modalPrice || 0), 0) / rates.length).toFixed(2)
      ),
      min: Math.min(...rates.map(r => r.minPrice || Infinity).filter(p => !isNaN(p))),
      max: Math.max(...rates.map(r => r.maxPrice || -Infinity).filter(p => !isNaN(p)))
    }
  }, [rates])

  const fixRecommendationMessage = (msg) => {
    if (!msg) return msg
    // Replace prices > 100 in message
    // with /100 converted version
    return msg.replace(
      /₹(\d+(?:\.\d+)?)/g,
      (match, price) => {
        const num = parseFloat(price)
        if (num > 100) {
          return `₹${(num / 100).toFixed(2)}`
        }
        return match
      }
    )
  }

  const getRecommendationDisplay = () => {
    const rec = forecastData?.recommendation
    if (!rec) return null

    return {
      action: rec.action || 'HOLD',
      message: fixRecommendationMessage(
        rec.message || ''
      ),
      color: rec.color || '#E27D60',
      icon: rec.icon || '📊',
      trend: rec.trend || rec.direction
        || 'STABLE',
      change: rec.change_pct
        || rec.percent_change
        || forecastData.trend_percent
        || 0
    }
  }

  // Debug — remove after testing
  useEffect(() => {
    if (chartData.length > 0) {
      const prices = chartData
        .map(p => p.actual ?? p.predicted)
        .filter(v => v !== null && v !== undefined && !isNaN(v))

      const minPrice = prices.length > 0 ? Math.min(...prices) : 0
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

      console.log(
        '[Chart Debug]',
        'Points:', chartData.length,
        'Min price:', minPrice,
        'Max price:', maxPrice,
        'First:', chartData[0],
        'Last:', chartData[chartData.length - 1]
      )
    }
  }, [chartData])

  const TABS = React.useMemo(() => [
    { id: 'rates', label: '📋 Live Rates' },
    { id: 'prediction', label: '🔮 ML Forecast' },
    { id: 'history', label: '📈 Price History' }
  ], [])



  // Memoized search results for high performance
  const filteredCommodities = React.useMemo(() => {
    const query = (commoditySearch || '').toLowerCase().trim()

    // If query is empty, return top commodities or full list
    if (!query) {
      return COMMODITIES.slice(0, 100) // Show first 100 as default
    }

    // Get current state language
    const stateConfig =
      STATE_LANGUAGE_MAP[state]
      || STATE_LANGUAGE_MAP['default']
    const stateLang = stateConfig.lang

    return COMMODITIES
      .filter(c => {
        // Special case: "All Commodities" should always match if query is empty
        // or if it explicitly matches "all" or the label
        if (c.value === '') {
          return query === '' || c.label.toLowerCase().includes(query)
        }

        // Check state language FIRST
        const stateMatch =
          (c[stateLang] || '')
            .toLowerCase()
            .includes(query)

        // Check all other fields
        const otherMatch = (
          c.value.toLowerCase().includes(query)
          || c.label.toLowerCase().includes(query)
          || (c.hindi || '').toLowerCase()
            .includes(query)
          || (c.marathi || '').toLowerCase()
            .includes(query)
          || (c.tamil || '').toLowerCase()
            .includes(query)
          || (c.telugu || '').toLowerCase()
            .includes(query)
          || (c.kannada || '').toLowerCase()
            .includes(query)
          || (c.bengali || '').toLowerCase()
            .includes(query)
          || (c.gujarati || '').toLowerCase()
            .includes(query)
          || (c.punjabi || '').toLowerCase()
            .includes(query)
          || (c.local || []).some(
            l => l.toLowerCase()
              .includes(query)
          )
        )

        return stateMatch || otherMatch
      })
      .sort((a, b) => {
        // Exact match on value or label first
        const aExact = a.value.toLowerCase() === query || a.label.toLowerCase() === query
        const bExact = b.value.toLowerCase() === query || b.label.toLowerCase() === query
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1

        // Sort state language matches first
        const aMatch =
          (a[stateLang] || '')
            .toLowerCase()
            .includes(query)
        const bMatch =
          (b[stateLang] || '')
            .toLowerCase()
            .includes(query)

        if (aMatch && !bMatch) return -1
        if (!aMatch && bMatch) return 1
        return 0
      })
  }, [commoditySearch, state])

  // Get English name from any language
  const getEnglishName = (localName) => {
    if (!localName) return localName

    const query = localName
      .toLowerCase()
      .trim()

    for (const c of COMMODITIES) {
      if (!c.value) continue

      if (c.value.toLowerCase() === query || c.label.toLowerCase() === query) {
        return c.value
      }

      const allNames = [
        c.hindi, c.marathi, c.tamil, c.telugu,
        ...(c.local || [])
      ].filter(Boolean)

      const found = allNames.find(
        n => n.toLowerCase() === query
      )

      if (found) return c.value
    }

    return localName
  }

  const validatePrice = (val) => {
    if (!val || val === '') return null
    const num = parseFloat(val)
    if (isNaN(num)) return null
    if (num <= 0) return null
    if (num > 100000) return null
    return num
  }

  // Get local name for commodity
  // based on selected state
  const getLocalName = (commodity) => {
    if (!commodity || !commodity.value) {
      return null
    }

    // Get language for selected state
    const stateConfig =
      STATE_LANGUAGE_MAP[state]
      || STATE_LANGUAGE_MAP['default']

    const lang = stateConfig.lang

    // Get local name from commodity
    return commodity[lang]
      || commodity.hindi
      || null
  }

  // Get label to show in dropdown
  const _getCommodityDisplayLabel = (c) => {
    if (!c.value) return c.label

    const localName = getLocalName(c)

    if (localName && localName.trim()) {
      return `${c.label} (${localName})`
    }

    return c.label
  }

  // Get language label for placeholder
  const getLanguageLabel = () => {
    const stateConfig =
      STATE_LANGUAGE_MAP[state]
    if (!stateConfig) {
      return 'Hindi, Marathi, Tamil...'
    }
    return `${stateConfig.label} or English`
  }

  // Get search placeholder based on state
  const _getSearchPlaceholder = () => {
    const examples = {
      'Maharashtra':
        'टोमॅटो, कांदा, बटाटा...',
      'Gujarat':
        'ટામેટાં, ડુંગળી, બટેટા...',
      'Tamil Nadu':
        'தக்காளி, வெங்காயம்...',
      'Andhra Pradesh':
        'టమాటా, ఉల్లిపాయ...',
      'Telangana':
        'టమాటా, ఉల్లిపాయ...',
      'Karnataka':
        'ಟೊಮೇಟೊ, ಈರುಳ್ಳಿ...',
      'West Bengal':
        'টমেটো, পেঁয়াজ...',
      'Punjab':
        'ਟਮਾਟਰ, ਪਿਆਜ਼...',
      'default':
        'टमाटर, Pyaz, Palak...'
    }

    return examples[state]
      || examples['default']
  }

  return (
    <div style={{
      background: '#FDFAF4',
      borderRadius: 20,
      border: '1.5px solid #EDD9B0',
      overflow: 'hidden',
      fontFamily: 'DM Sans',
      boxShadow:
        '0 4px 16px rgba(45,79,30,0.08)'
    }}>

      {/* ── ERROR & LOADING OVERLAYS ── */}
      {error && (
        <div style={{
          padding: '12px 28px',
          background: '#FFF5F5',
          borderBottom: '1px solid #FED7D7',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: '#C53030',
          fontSize: 13,
          fontWeight: 600
        }}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {(loading && rates.length === 0) && (
        <div style={{
          padding: '12px 28px',
          background: '#E6FFFA',
          borderBottom: '1px solid #B2F5EA',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: '#234E52',
          fontSize: 13,
          fontWeight: 600
        }}>
          <RefreshCw size={14} className="animate-spin" />
          Updating mandi rates...
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{
        background:
          'linear-gradient(135deg, #1A2E12 0%, #2D4F1E 100%)',
        padding: '24px 28px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16
        }}>
          <div>
            <div style={{
              fontFamily: 'Caveat',
              fontSize: 16,
              color: '#F0A080',
              marginBottom: 4
            }}>
              AI Powered Intelligence
            </div>
            <h2 style={{
              fontFamily: 'Playfair Display',
              fontWeight: 700,
              fontSize: 22,
              color: 'white',
              margin: '0 0 6px'
            }}>
              Mandi Rate Analyzer 📊
            </h2>
            <p style={{
              fontFamily: 'DM Sans',
              fontSize: 12,
              color: 'rgba(255,255,255,0.65)',
              margin: 0
            }}>
              Variety-wise Agmarknet Live Prices •
              Hybrid ARIMA Forecast •
              Real-time Market Insights
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchAll()}
            disabled={loading}
            style={{
              width: 38, height: 38,
              borderRadius: '50%',
              border:
                '1px solid rgba(255,255,255,0.25)',
              background:
                'rgba(255,255,255,0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0
            }}
          >
            <RefreshCw
              size={15}
              style={{
                animation: loading
                  ? 'spin 1s linear infinite'
                  : 'none'
              }}
            />
          </button>
        </div>

        {/* Source + Summary pills */}
        <div style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 12px',
            background:
              'rgba(255,255,255,0.12)',
            borderRadius: 999,
            fontSize: 11,
            color: 'white'
          }}>
            <div style={{
              width: 6, height: 6,
              borderRadius: '50%',
              background: source === 'live'
                ? '#4CAF50' : '#E27D60'
            }} />
            {source === 'live'
              ? '🟢 data.gov.in (Agmarknet)'
              : '📄 CSV Offline Data'}
          </div>
          {summary && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 12px',
              background:
                'rgba(255,255,255,0.12)',
              borderRadius: 999,
              fontSize: 11,
              color: 'white'
            }}>
              📍 {rates.length} markets •
              Modal ₹{formatKg(summary.avg_modal)}/{unit}
            </div>
          )}
        </div>
      </div>

      {/* ── FILTERS ROW ── */}
      <div style={{
        padding: '20px 28px',
        borderBottom: '1px solid #EDD9B0',
        display: 'flex',
        gap: 14,
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        background: '#F5E6CC'
      }}>

        {/* Commodity Search with Headless UI Combobox */}
        <div style={{ flex: '1 1 300px' }}>
          <label style={{
            display: 'block',
            fontFamily: 'DM Sans',
            fontWeight: 700,
            fontSize: 10,
            color: '#7A7A7A',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            Commodity Analyzer
          </label>
          <Combobox
            value={COMMODITIES.find(c => c.value === commodity) || COMMODITIES[0]}
            onChange={(c) => {
              setCommodity(c.value);
              setCommoditySearch(c.label);
              setCurrentPage(1);
            }}
          >
            <div style={{ position: 'relative' }}>
              <ComboboxButton
                as="div"
                style={{
                  position: 'relative',
                  width: '100%',
                  cursor: 'text',
                  overflow: 'hidden',
                  borderRadius: 12,
                  background: '#FDFAF4',
                  border: '1.5px solid #EDD9B0',
                }}
              >
                <ComboboxInput
                  style={{
                    width: '100%',
                    border: 'none',
                    padding: '12px 14px 12px 40px',
                    fontSize: 14,
                    lineHeight: '20px',
                    color: '#2D4F1E',
                    background: 'transparent',
                    fontFamily: 'DM Sans',
                    outline: 'none'
                  }}
                  displayValue={(c) => c?.label || ''}
                  onChange={(event) => setCommoditySearch(event.target.value)}
                  onFocus={(e) => {
                    // Auto-select text on focus to allow easy over-typing
                    e.target.select();
                    // Clear search query to show full list
                    setCommoditySearch('');
                  }}
                  placeholder={`🔍 Search ${getLanguageLabel()}`}
                />
                <div style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#B0A898',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }}>
                  <Search size={16} />
                </div>
              </ComboboxButton>

              <ComboboxOptions
                transition
                style={{
                  position: 'absolute',
                  zIndex: 2000,
                  marginTop: 8,
                  maxHeight: 300,
                  width: '100%',
                  overflow: 'auto',
                  borderRadius: 12,
                  background: '#FDFAF4',
                  border: '1.5px solid #EDD9B0',
                  boxShadow: '0 10px 25px rgba(45,79,30,0.15)',
                  padding: '4px',
                  transition: 'opacity 100ms ease-out, transform 100ms ease-out',
                }}
              >
                {filteredCommodities.length === 0 ? (
                  <div style={{ padding: '12px 14px', fontSize: 13, color: '#7A7A7A' }}>
                    Nothing found.
                  </div>
                ) : (
                  filteredCommodities.map((c) => (
                    <ComboboxOption
                      key={c.value}
                      value={c}
                      style={{
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '10px 12px',
                        borderRadius: 8,
                        fontFamily: 'DM Sans',
                        transition: 'background 0.2s'
                      }}
                    >
                      {({ selected, focus }) => (
                        <div style={{
                          background: focus ? 'rgba(45,79,30,0.08)' : 'transparent',
                          padding: '4px 8px',
                          borderRadius: 6
                        }}>
                          <div style={{ fontWeight: selected ? 700 : 500, color: '#2D4F1E', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{c.label} {getLocalName(c) && <span style={{ opacity: 0.6, fontSize: 12 }}>({getLocalName(c)})</span>}</span>
                            {selected && <CheckCircle size={14} color="#2D4F1E" />}
                          </div>
                          {c.hindi && <div style={{ fontSize: 11, color: '#7A7A7A' }}>{c.hindi} • {c.marathi || 'Local'}</div>}
                        </div>
                      )}
                    </ComboboxOption>
                  ))
                )}
              </ComboboxOptions>
            </div>
          </Combobox>
        </div>

        {/* Date */}
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

        {/* State */}
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
            State
          </label>
          <Listbox
            value={state}
            onChange={(val) => {
              setState(val)
              setCurrentPage(1)
            }}
          >
            <div style={{ position: 'relative' }}>
              <ListboxButton
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #EDD9B0',
                  background: '#FDFAF4',
                  fontFamily: 'DM Sans',
                  fontSize: 14,
                  color: '#4A4A4A',
                  textAlign: 'left',
                  height: 44,
                  cursor: 'pointer'
                }}
              >
                {INDIAN_STATES.find(
                  s => s.value === state
                )?.label || 'All States'}
              </ListboxButton>

              <ListboxOptions
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 4,
                  background: '#FDFAF4',
                  border: '1.5px solid #EDD9B0',
                  borderRadius: 10,
                  zIndex: 1000,
                  maxHeight: 200,
                  overflowY: 'auto',
                  width: '100%',
                  boxShadow:
                    '0 8px 24px rgba(45,79,30,0.12)',
                  padding: '4px 0',
                  listStyle: 'none',
                  margin: 0
                }}
              >
                {INDIAN_STATES.map((s) => (
                  <ListboxOption
                    key={s.value}
                    value={s.value}
                  >
                    {({ active, selected }) => (
                      <div
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          fontFamily: 'DM Sans',
                          fontSize: 13,
                          background: active
                            ? '#F5E6CC'
                            : 'transparent',
                          fontWeight: selected
                            ? 700 : 400,
                          color: '#2D4F1E'
                        }}
                      >
                        {selected && (
                          <span style={{
                            marginRight: 6,
                            fontSize: 11
                          }}>
                            ✓
                          </span>
                        )}
                        {s.label}
                      </div>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </div>
          </Listbox>
        </div>

        {/* Your price + compare */}
        <div style={{ flex: '2 1 220px' }}>
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
            Your Selling Price (₹/{(commodity || '').toLowerCase().includes('milk') || (commodity || '').toLowerCase().includes('oil') ? 'L' : 'kg'})
          </label>
          <div style={{
            display: 'flex', gap: 8
          }}>
            <input
              type="number"
              placeholder="Enter your price"
              value={farmerPrice}
              min="0.01"
              step="0.01"
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                if (val < 0) {
                  e.target.value = ''
                  return
                }
                setFarmerPrice(e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key === '-' ||
                  e.key === 'e' ||
                  e.key === 'E' ||
                  e.key === '+') {
                  e.preventDefault()
                }
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleCompare()
                }
              }}
              style={{
                flex: 1,
                height: 44,
                padding: '0 14px',
                background: 'white',
                border: '1.5px solid #EDD9B0',
                borderRadius: 12,
                fontFamily: 'DM Sans',
                fontSize: 14,
                outline: 'none',
                color: '#2D4F1E'
              }}
            />
            <button
              type="button"
              onClick={handleCompare}
              style={{
                height: 44,
                padding: '0 18px',
                background:
                  'linear-gradient(135deg, #E27D60, #C96848)',
                border: 'none',
                borderRadius: 12,
                fontFamily: 'DM Sans',
                fontWeight: 700,
                fontSize: 13,
                color: 'white',
                cursor: 'pointer',
                boxShadow:
                  '0 4px 12px rgba(226,125,96,0.35)',
                whiteSpace: 'nowrap'
              }}
            >
              Compare →
            </button>
          </div>
          {error && (
            <div style={{
              marginTop: 4,
              padding: '6px 10px',
              background: 'rgba(255,82,82,0.08)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span style={{ fontSize: 12 }}>⚠️</span>
              <span style={{
                fontFamily: 'DM Sans',
                fontSize: 12,
                color: '#FF5252',
                fontWeight: 600
              }}>
                {error}
              </span>
            </div>
          )}
          {farmerPrice &&
            parseFloat(farmerPrice) <= 0 && (
              <div style={{
                marginTop: 4,
                padding: '6px 10px',
                background: 'rgba(255,82,82,0.08)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span style={{ fontSize: 12 }}>
                  ⚠️
                </span>
                <span style={{
                  fontFamily: 'DM Sans',
                  fontSize: 12,
                  color: '#FF5252',
                  fontWeight: 600
                }}>
                  Price cannot be negative or zero
                </span>
              </div>
            )}
        </div>
      </div>

      {/* ── PRICE SUMMARY CARDS ── */}
      {!loading && rates.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14,
          padding: '20px 28px',
          borderBottom: '1px solid #EDD9B0'
        }}>
          {[
            {
              label: 'Mandi Minimum Price',
              value: minPrice,
              sub: 'Lowest in market',
              color: '#FF5252',
              bg: 'rgba(255,82,82,0.07)',
              icon: ArrowDown
            },
            {
              label: 'Mandi Modal Price',
              value: modalPrice,
              sub: 'Most traded rate',
              color: '#2D4F1E',
              bg: 'rgba(45,79,30,0.07)',
              icon: Minus
            },
            {
              label: 'Mandi Maximum Price',
              value: maxPrice,
              sub: 'Highest in market',
              color: '#4CAF50',
              bg: 'rgba(76,175,80,0.07)',
              icon: ArrowUp
            }
          ].map(card => {
            const Icon = card.icon
            const isLiquid = (commodity || '').toLowerCase().includes('milk') || (commodity || '').toLowerCase().includes('oil')
            const unit = isLiquid ? 'L' : 'kg'
            return (
              <div key={card.label} style={{
                background: card.bg,
                borderRadius: 14,
                padding: '16px 18px',
                border:
                  `1px solid ${card.color}20`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8
                }}>
                  <Icon
                    size={14}
                    color={card.color}
                  />
                  <span style={{
                    fontFamily: 'DM Sans',
                    fontSize: 10,
                    color: '#7A7A7A',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em'
                  }}>
                    {card.label}
                  </span>
                </div>
                <div>
                  <div style={{
                    fontFamily: 'DM Sans',
                    fontWeight: 800,
                    fontSize: 28,
                    color: card.color,
                    lineHeight: 1
                  }}>
                    ₹{(card.value / 100).toFixed(2)}/{unit}
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans',
                    fontSize: 11,
                    color: '#B0A898',
                    marginTop: 4
                  }}>
                    ₹{Math.round(card.value)}/qtl
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── COMPARISON RESULT ── */}
      <AnimatePresence>
        {comparison && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1, height: 'auto'
            }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div style={{
              margin: '0 28px 0',
              padding: '16px 20px',
              background:
                comparison.color + '10',
              border:
                `1.5px solid ${comparison.color}25`,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 4
            }}>
              {comparison.status ===
                'competitive'
                ? <CheckCircle
                  size={22}
                  color={comparison.color}
                />
                : comparison.status ===
                  'above_market'
                  ? <AlertTriangle
                    size={22}
                    color={comparison.color}
                  />
                  : <TrendingDown
                    size={22}
                    color={comparison.color}
                  />
              }
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'DM Sans',
                  fontWeight: 800,
                  fontSize: 14,
                  color: comparison.color,
                  marginBottom: 3
                }}>
                  {comparison.mandi_modal !== null && comparison.mandi_modal !== undefined
                    ? <>
                      Your ₹{comparison.farmer_price}/{unit} vs Mandi ₹{(comparison.mandi_modal / 100).toFixed(2)}/{unit} (₹{Math.round(comparison.mandi_modal)}/qtl)
                      {' '}({comparison.diff_percent > 0 ? '+' : ''}{comparison.diff_percent}%)
                    </>
                    : <>
                      Your Price: ₹{comparison.farmer_price}/{unit}
                    </>
                  }
                </div>
                <div style={{
                  fontFamily: 'DM Sans',
                  fontSize: 13,
                  color: '#4A4A4A'
                }}>
                  {comparison.message}
                </div>
              </div>
              <div style={{
                padding: '6px 14px',
                background: comparison.color,
                borderRadius: 999,
                fontFamily: 'DM Sans',
                fontWeight: 800,
                fontSize: 11,
                color: 'white',
                flexShrink: 0
              }}>
                {comparison.badge}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TABS ── */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '16px 28px 0',
        borderTop: comparison
          ? '1px solid #EDD9B0' : 'none',
        marginTop: comparison ? 16 : 0
      }}>
        {TABS.map(tab => (
          <button
            type="button"
            key={tab.id}
            onClick={() =>
              setActiveTab(tab.id)
            }
            style={{
              padding: '8px 18px',
              borderRadius: '10px 10px 0 0',
              border: 'none',
              background:
                activeTab === tab.id
                  ? '#FDFAF4'
                  : 'transparent',
              fontFamily: 'DM Sans',
              fontWeight: 600,
              fontSize: 12,
              color: activeTab === tab.id
                ? '#2D4F1E' : '#7A7A7A',
              cursor: 'pointer',
              borderBottom:
                activeTab === tab.id
                  ? '2px solid #2D4F1E'
                  : '2px solid transparent',
              transition: 'all 150ms'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div style={{
        padding: '20px 28px 28px'
      }}>

        {/* RATES TAB */}
        {activeTab === 'rates' && (
          <div>
            {/* ── MANDI RATES TABLE ─────── */}
            <div style={{
              background: '#FDFAF4',
              borderRadius: 16,
              border: '1.5px solid #EDD9B0',
              overflow: 'hidden',
              boxShadow:
                '0 1px 4px rgba(45,79,30,0.06)'
            }}>

              {/* Table header card */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #EDD9B0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                background: '#FDFAF4'
              }}>
                <div>
                  <h3 style={{
                    fontFamily: 'Playfair Display',
                    fontWeight: 700,
                    fontSize: 16,
                    color: '#2D4F1E',
                    margin: 0
                  }}>
                    Live Mandi Rates
                  </h3>
                  <p style={{
                    fontFamily: 'DM Sans',
                    fontSize: 12,
                    color: '#7A7A7A',
                    margin: '2px 0 0'
                  }}>
                    {filteredRecords.length} markets
                    found • Source: data.gov.in
                  </p>
                </div>

                {/* Search input */}
                <div style={{
                  position: 'relative',
                  minWidth: 220
                }}>
                  <span style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 13,
                    pointerEvents: 'none'
                  }}>
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Search market, district..."
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    style={{
                      padding: '8px 12px 8px 30px',
                      borderRadius: 8,
                      border: '1.5px solid #EDD9B0',
                      background: '#F5E6CC',
                      fontFamily: 'DM Sans',
                      fontSize: 13,
                      color: '#4A4A4A',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor
                        = '#2D4F1E'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor
                        = '#EDD9B0'
                    }}
                  />
                </div>
              </div>

              {/* Table */}
              {/* Ant Design Table */}
              <ConfigProvider
                theme={{
                  token: {
                    colorPrimary: '#2D4F1E',
                    borderRadius: 12,
                    fontFamily: 'DM Sans'
                  },
                  components: {
                    Table: {
                      headerBg: '#F5E6CC',
                      headerColor: '#2D4F1E',
                      rowHoverBg: '#F5E6CC50'
                    }
                  }
                }}
              >
                <Table
                  dataSource={filteredRecords}
                  columns={columns}
                  rowKey={(record) => record.id || record._id || `${record.market}-${record.commodity}-${record.variety}-${record.arrivalDate}`}
                  loading={loading}
                  size="middle"
                  sticky={{ offsetHeader: 0 }}
                  pagination={{
                    defaultPageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '25', '50', '100'],
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} markets`,
                    placement: 'bottomCenter',
                    style: { marginTop: 32, fontFamily: 'DM Sans', fontWeight: 500 }
                  }}
                  rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
                  style={{
                    fontFamily: 'DM Sans',
                    border: '1px solid #EDD9B0',
                    borderRadius: 12,
                    overflow: 'hidden'
                  }}
                  scroll={{ x: 'max-content' }}
                />
              </ConfigProvider>
            </div>
          </div>
        )}

        {/* PREDICTION TAB */}
        {activeTab === 'prediction' && (
          <div>
            {prediction?.model && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 999,
                background: (typeof prediction.model === 'object' && prediction.model?.is_arima)
                  ? 'rgba(45,79,30,0.10)'
                  : 'rgba(226,125,96,0.10)',
                border: `1px solid ${(typeof prediction.model === 'object' && prediction.model?.is_arima)
                  ? 'rgba(45,79,30,0.20)'
                  : 'rgba(226,125,96,0.20)'
                  }`,
                marginBottom: 12,
                flexShrink: 0
              }}>
                <span style={{ fontSize: 14 }}>
                  {(typeof prediction.model === 'object' && prediction.model?.is_arima)
                    ? '🤖' : '📐'}
                </span>
                <span style={{
                  fontFamily: 'DM Sans',
                  fontWeight: 700,
                  fontSize: 11,
                  color: (typeof prediction.model === 'object' && prediction.model?.is_arima)
                    ? '#2D4F1E' : '#E27D60',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {prediction.model?.name || prediction.model?.type || 'ML Model'}
                </span>
                {(typeof prediction.model === 'object' && prediction.model?.is_fallback) && (
                  <span style={{
                    fontFamily: 'DM Sans',
                    fontSize: 10,
                    color: '#B0A898'
                  }}>
                    (fallback)
                  </span>
                )}
                <span style={{
                  fontFamily: 'DM Sans',
                  fontSize: 10,
                  color: '#B0A898'
                }}>
                  • {typeof prediction.model === 'object' ? prediction.model?.data_points : 0} pts
                  {prediction.model?.data_source && ` • Source: ${prediction.model.data_source}`}
                </span>
              </div>
            )}
            {predLoading ? (
              <div style={{
                textAlign: 'center',
                padding: 40,
                color: '#7A7A7A',
                fontFamily: 'DM Sans'
              }}>
                🤖 Running ML model...
              </div>
            ) : prediction ? (
              <div>
                {/* Recommendation */}
                {(() => {
                  const rec = getRecommendationDisplay()
                  if (!rec) return null
                  return (
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: 12,
                      background: `${rec.color}15`,
                      border: `1px solid ${rec.color}40`,
                      marginBottom: 20
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 20 }}>{rec.icon}</span>
                        <span style={{
                          fontFamily: 'DM Sans',
                          fontWeight: 800,
                          fontSize: 16,
                          color: rec.color
                        }}>
                          {rec.action}
                        </span>
                        <span style={{
                          fontSize: 12,
                          color: '#7A7A7A',
                          marginLeft: 'auto'
                        }}>
                          {rec.trend?.toUpperCase()} ({rec.change > 0 ? '+' : ''}{rec.change}%)
                        </span>
                      </div>
                      <p style={{
                        fontFamily: 'DM Sans',
                        fontSize: 13,
                        color: '#4A4A4A',
                        margin: 0,
                        lineHeight: 1.5
                      }}>
                        {rec.message}
                      </p>
                    </div>
                  )
                })()}

                {/* Today Mandi & MSP */}
                {(prediction?.today_mandi || prediction?.msp_comparison) && (
                  <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap', background: '#F5E6CC', padding: 16, borderRadius: 12, border: '1px solid #EDD9B0' }}>
                    {prediction.today_mandi && (
                      <div>
                        <div style={{ fontFamily: 'DM Sans', fontSize: 10, color: '#7A7A7A', textTransform: 'uppercase', marginBottom: 4 }}>Today's Mandi</div>
                        <div style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: 18, color: '#2D4F1E' }}>₹{prediction.today_mandi.price_kg || 'N/A'}/{unit}</div>
                        {prediction.today_mandi.price_qtl && (
                          <div style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: '#E27D60' }}>₹{prediction.today_mandi.price_qtl}/qtl</div>
                        )}
                        {prediction.today_mandi.arrival_mt && (
                          <div style={{ fontSize: 10, color: '#7A7A7A' }}>Arrival: {prediction.today_mandi.arrival_mt} MT</div>
                        )}
                      </div>
                    )}
                    {prediction.msp_comparison && (
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontFamily: 'DM Sans', fontSize: 10, color: '#7A7A7A', textTransform: 'uppercase', marginBottom: 4 }}>MSP Comparison</div>
                        <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#4A4A4A' }}>{prediction.msp_comparison?.message || ''}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* 7-day forecast chart */}
                <div style={{
                  fontFamily: 'DM Sans',
                  fontWeight: 700,
                  fontSize: 13,
                  color: '#2D4F1E',
                  marginBottom: 12
                }}>
                  7-Day Price Forecast —
                  {' '}{prediction.commodity}
                </div>

                {chartData.length === 0 ? (
                  <div style={{
                    height: 280,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(45,79,30,0.05)',
                    borderRadius: 12,
                    border: '1px dashed #EDD9B0'
                  }}>
                    <div style={{
                      textAlign: 'center',
                      fontFamily: 'DM Sans'
                    }}>
                      <div style={{ fontSize: 32 }}>📊</div>
                      <p style={{
                        color: '#7A7A7A',
                        fontSize: 13,
                        marginTop: 8
                      }}>
                        No forecast data available for {commodity}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height={280}
                  >
                    <ComposedChart
                      data={chartData}
                      margin={{
                        top: 10,
                        right: 20,
                        left: 10,
                        bottom: 10
                      }}
                    >
                      <defs>
                        <linearGradient
                          id="actualGrad"
                          x1="0" y1="0"
                          x2="0" y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#2D4F1E"
                            stopOpacity={0.15}
                          />
                          <stop
                            offset="95%"
                            stopColor="#2D4F1E"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="predictedGrad"
                          x1="0" y1="0"
                          x2="0" y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#E27D60"
                            stopOpacity={0.15}
                          />
                          <stop
                            offset="95%"
                            stopColor="#E27D60"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#EDD9B0"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="date"
                        tick={{
                          fontFamily: 'DM Sans',
                          fontSize: 10,
                          fill: '#7A7A7A'
                        }}
                        axisLine={{
                          stroke: '#EDD9B0'
                        }}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />

                      <YAxis
                        domain={yDomain}
                        allowDataOverflow={false}
                        tickCount={6}
                        tickFormatter={v =>
                          `₹${v}`
                        }
                        tick={{
                          fontFamily: 'DM Sans',
                          fontSize: 10,
                          fill: '#7A7A7A'
                        }}
                        axisLine={false}
                        tickLine={false}
                        width={55}
                      />

                      <Tooltip
                        content={({
                          active, payload, label
                        }) => {
                          if (!active ||
                            !payload ||
                            !payload.length) {
                            return null
                          }
                          return (
                            <div style={{
                              background: '#1A2E12',
                              borderRadius: 10,
                              padding: '10px 14px',
                              border:
                                '1px solid #2D4F1E',
                              boxShadow:
                                '0 4px 16px ' +
                                'rgba(0,0,0,0.25)'
                            }}>
                              <div style={{
                                fontFamily: 'DM Sans',
                                fontSize: 11,
                                color: '#B0A898',
                                marginBottom: 6
                              }}>
                                {label}
                              </div>
                              {payload.map((p, i) => {
                                if (p.value == null || isNaN(p.value)) {
                                  return null
                                }
                                return (
                                  <div key={i}>
                                    <span style={{
                                      fontFamily:
                                        'DM Sans',
                                      fontWeight: 700,
                                      fontSize: 14,
                                      color: p.color
                                    }}>
                                      ₹{Number(p.value)
                                        .toFixed(2)}/kg
                                    </span>
                                    <span style={{
                                      fontFamily:
                                        'DM Sans',
                                      fontSize: 10,
                                      color: '#B0A898',
                                      marginLeft: 6
                                    }}>
                                      ₹{Math.round(
                                        Number(p.value)
                                        * 100
                                      )}/qtl
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        }}
                      />

                      <Legend
                        wrapperStyle={{
                          fontFamily: 'DM Sans',
                          fontSize: 12,
                          paddingTop: 8
                        }}
                      />

                      {/* Today reference line — dynamic */}
                      {chartData.find(d => d.isToday) && (
                        <ReferenceLine
                          x={chartData.find(d => d.isToday)?.date}
                          stroke="#E27D60"
                          strokeDasharray="4 4"
                          label={{
                            value: 'Today',
                            position:
                              'insideTopLeft',
                            fontFamily: 'DM Sans',
                            fontSize: 9,
                            fill: '#E27D60'
                          }}
                        />
                      )}

                      {/* Historical area */}
                      <Area
                        type="monotone"
                        dataKey="actual"
                        name="Actual/Current"
                        stroke="#2D4F1E"
                        strokeWidth={2}
                        fill="url(#actualGrad)"
                        dot={(props) => {
                          const { cx, cy, payload } =
                            props
                          if (!payload.actual) {
                            return null
                          }
                          return (
                            <circle
                              key={`dot-${cx}-${cy}`}
                              cx={cx}
                              cy={cy}
                              r={payload.isToday ? 5 : 3}
                              fill={
                                payload.isToday
                                  ? '#E27D60'
                                  : '#2D4F1E'
                              }
                              stroke="white"
                              strokeWidth={1}
                            />
                          )
                        }}
                        activeDot={{ r: 6 }}
                        connectNulls={false}
                      />

                      {/* ML Predicted line */}
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        name="ML Predicted"
                        stroke="#E27D60"
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        dot={{
                          fill: '#E27D60',
                          r: 4,
                          stroke: 'white',
                          strokeWidth: 1
                        }}
                        activeDot={{ r: 6 }}
                        connectNulls={false}
                      />

                    </ComposedChart>
                  </ResponsiveContainer>
                )}

                <div style={{
                  display: 'flex',
                  gap: 16,
                  marginTop: 8,
                  justifyContent: 'center'
                }}>
                  {[
                    {
                      color: '#2D4F1E',
                      label: 'Actual/Current'
                    },
                    {
                      color: '#E27D60',
                      label: 'ML Predicted'
                    },
                    {
                      color: '#E27D60',
                      style: 'dashed',
                      label: 'Current Price'
                    }
                  ].map(l => (
                    <div key={l.label} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5
                    }}>
                      <div style={{
                        width: 20, height: 2,
                        background: l.color,
                        borderTop: l.style ===
                          'dashed'
                          ? `2px dashed ${l.color}`
                          : 'none'
                      }} />
                      <span style={{
                        fontFamily: 'DM Sans',
                        fontSize: 11,
                        color: '#7A7A7A'
                      }}>
                        {l.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: 40,
                color: '#7A7A7A',
                fontFamily: 'DM Sans'
              }}>
                Select a commodity to see
                ML predictions
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div>
            {history.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 40,
                color: '#7A7A7A',
                fontFamily: 'DM Sans'
              }}>
                No historical data available
              </div>
            ) : (
              <div>
                <div style={{
                  fontFamily: 'DM Sans',
                  fontWeight: 700,
                  fontSize: 13,
                  color: '#2D4F1E',
                  marginBottom: 16
                }}>
                  Price History (Jan–Mar 2026)
                  — {commodity}
                </div>
                <ResponsiveContainer
                  width="100%"
                  height={220}
                >
                  <BarChart
                    data={history}
                    margin={{
                      top: 5, right: 5,
                      bottom: 5, left: 0
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#EDD9B0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{
                        fontFamily: 'DM Sans',
                        fontSize: 10,
                        fill: '#7A7A7A'
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fontFamily: 'DM Sans',
                        fontSize: 10,
                        fill: '#7A7A7A'
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={
                        v => `₹${v}`
                      }
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null
                        return (
                          <div style={{
                            background: '#1A2E12',
                            borderRadius: 10,
                            padding: '10px 14px',
                            border: '1px solid #2D4F1E',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
                          }}>
                            <div style={{
                              fontFamily: 'DM Sans',
                              fontSize: 11,
                              color: '#B0A898',
                              marginBottom: 6
                            }}>
                              {label}
                            </div>
                            {payload.map((p, i) => {
                              if (p.value == null || isNaN(p.value)) return null
                              return (
                                <div key={i}>
                                  <span style={{
                                    fontFamily: 'DM Sans',
                                    fontWeight: 700,
                                    fontSize: 14,
                                    color: '#4CAF50'
                                  }}>
                                    ₹{Number(p.value).toFixed(2)}/kg
                                  </span>
                                  <span style={{
                                    fontFamily: 'DM Sans',
                                    fontSize: 10,
                                    color: '#B0A898',
                                    marginLeft: 6
                                  }}>
                                    ₹{Math.round(Number(p.value) * 100)}/qtl
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )
                      }}
                    />
                    <Bar
                      dataKey="modal"
                      fill="#2D4F1E"
                      radius={[4, 4, 0, 0]}
                      opacity={0.85}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg) }
          to { transform: rotate(360deg) }
        }
        @keyframes shimmer {
          0% { background-position: 200% center }
          100% { background-position: -200% center }
        }
      `}</style>
    </div>
  )
}

export default MandiRates
