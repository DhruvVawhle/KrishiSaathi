import React, { useState, useEffect }
  from 'react'
import { motion, AnimatePresence }
  from 'framer-motion'
import {
  ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
  BarChart, Bar
} from 'recharts'
import {
  TrendingUp, TrendingDown,
  Minus, RefreshCw,
  AlertTriangle, CheckCircle,
  BarChart3, Leaf, IndianRupee,
  ArrowUp, ArrowDown
} from 'lucide-react'

const INDIAN_STATES = [
  { value: '', label: 'All States' },
  { value: 'Andhra Pradesh',
    label: 'Andhra Pradesh' },
  { value: 'Arunachal Pradesh',
    label: 'Arunachal Pradesh' },
  { value: 'Assam',
    label: 'Assam' },
  { value: 'Bihar',
    label: 'Bihar' },
  { value: 'Chhattisgarh',
    label: 'Chhattisgarh' },
  { value: 'Goa',
    label: 'Goa' },
  { value: 'Gujarat',
    label: 'Gujarat' },
  { value: 'Haryana',
    label: 'Haryana' },
  { value: 'Himachal Pradesh',
    label: 'Himachal Pradesh' },
  { value: 'Jharkhand',
    label: 'Jharkhand' },
  { value: 'Karnataka',
    label: 'Karnataka' },
  { value: 'Kerala',
    label: 'Kerala' },
  { value: 'Madhya Pradesh',
    label: 'Madhya Pradesh' },
  { value: 'Maharashtra',
    label: 'Maharashtra' },
  { value: 'Manipur',
    label: 'Manipur' },
  { value: 'Meghalaya',
    label: 'Meghalaya' },
  { value: 'Mizoram',
    label: 'Mizoram' },
  { value: 'Nagaland',
    label: 'Nagaland' },
  { value: 'Odisha',
    label: 'Odisha' },
  { value: 'Punjab',
    label: 'Punjab' },
  { value: 'Rajasthan',
    label: 'Rajasthan' },
  { value: 'Sikkim',
    label: 'Sikkim' },
  { value: 'Tamil Nadu',
    label: 'Tamil Nadu' },
  { value: 'Telangana',
    label: 'Telangana' },
  { value: 'Tripura',
    label: 'Tripura' },
  { value: 'Uttar Pradesh',
    label: 'Uttar Pradesh' },
  { value: 'Uttarakhand',
    label: 'Uttarakhand' },
  { value: 'West Bengal',
    label: 'West Bengal' },
  { value: 'Andaman and Nicobar Islands',
    label: 'Andaman & Nicobar Islands' },
  { value: 'Chandigarh',
    label: 'Chandigarh' },
  { value: 'Dadra and Nagar Haveli',
    label: 'Dadra & Nagar Haveli' },
  { value: 'Daman and Diu',
    label: 'Daman & Diu' },
  { value: 'Delhi',
    label: 'Delhi' },
  { value: 'Jammu and Kashmir',
    label: 'Jammu & Kashmir' },
  { value: 'Ladakh',
    label: 'Ladakh' },
  { value: 'Lakshadweep',
    label: 'Lakshadweep' },
  { value: 'Puducherry',
    label: 'Puducherry' },
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
    value: 'Tomato',
    label: 'Tomato',
    hindi: 'टमाटर',
    marathi: 'टोमॅटो',
    tamil: 'தக்காளி',
    telugu: 'టమాటా',
    local: ['tamatar', 'tamato']
  },
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


// Safe render — never crashes on objects
const safeRender = (value, fallback = '') => {
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
  farmerProducts = []
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
  const [prediction, setPrediction]
    = useState(null)
  const [comparison, setComparison]
    = useState(null)
  const [history, setHistory] = useState([])
  const [allRates, setAllRates] = useState([])
  const [loading, setLoading] = useState(false)
  const [predLoading, setPredLoading]
    = useState(false)
  const [source, setSource] = useState('')
  const [activeTab, setActiveTab]
    = useState('rates')
  const [error, setError] = useState(null)

  // Add state for search
  const [commoditySearch, setCommoditySearch]
    = useState('')
  const [searchResults, setSearchResults]
    = useState([])
  const [showSearchDropdown, setShowSearchDropdown]
    = useState(false)

  // Custom tooltip for charts
  const CustomChartTooltip = ({
    active, payload, label
  }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: '#1A2E12',
        border: 'none',
        borderRadius: 10,
        padding: '10px 14px',
        fontFamily: 'DM Sans'
      }}>
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: 11,
          margin: '0 0 4px'
        }}>
          {label}
        </p>
        {payload.map((p, i) => {
          const isLiquid = commodity.toLowerCase().includes('milk') || commodity.toLowerCase().includes('oil')
          const unit = isLiquid ? 'L' : 'kg'
          const valQtl = p.payload?.price_qtl || (p.value * 100)
          return (
            <div key={i} style={{ marginTop: 4 }}>
              <p style={{
                color: p.color || 'white',
                fontSize: 14,
                fontWeight: 800,
                margin: 0
              }}>
                ₹{p.value}/{unit}
                {p.payload?.type === 'predicted' ? ' (est.)' : ''}
              </p>
              <p style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 10,
                fontWeight: 600,
                margin: 0
              }}>
                ₹{Math.round(valQtl)}/qtl
              </p>
            </div>
          )
        })}
      </div>
    )
  }

  // Handle search input change
  const handleSearchChange = (e) => {
    const val = e.target.value
    setCommoditySearch(val)

    if (val.trim().length > 0) {
      const results = searchCommodity(val)
      setSearchResults(results)
      setShowSearchDropdown(true)
    } else {
      setSearchResults([])
      setShowSearchDropdown(false)
    }
  }

  // Handle selecting from search results
  const handleSelectFromSearch = (item) => {
    setSelectedCommodity(item.value)
    setCommoditySearch(item.label)
    setShowSearchDropdown(false)
  }

  const isLiquid = commodity.toLowerCase().includes('milk') || commodity.toLowerCase().includes('oil')
  const unit = isLiquid ? 'L' : 'kg'

  useEffect(() => {
    // Load latest data immediately when page opens
    fetchAll()
  }, [])

  useEffect(() => {
    if (commodity || state) {
      fetchAll()
    }
  }, [commodity, state])

  const fetchAll = async () => {
    setLoading(true)
    setError('')
    
    console.log(
      '[MandiRates] fetchAll triggered',
      { commodity, state }
    )

    try {
      const API_KEY =
        '579b464db66ec23bdd000001' +
        'b7d45cb5d72243dd58f4c958c5478779'

      const RESOURCE_ID =
        '9ef84268-d588-465a-a308-a864a43d0070'

      // More records when no filter
      const limit =
        (!commodity &&
         !state)
          ? 100 : 50

      // Build URL — only add filters
      // when actually selected
      let url =
        `https://api.data.gov.in/resource/` +
        `${RESOURCE_ID}` +
        `?api-key=${API_KEY}` +
        `&format=json` +
        `&limit=${limit}` +
        `&offset=0`

      if (commodity &&
          commodity.trim() !== '') {
        url +=
          `&filters[commodity]=` +
          encodeURIComponent(
            commodity
          )
      }

      if (state &&
          state.trim() !== '') {
        url +=
          `&filters[state]=` +
          encodeURIComponent(state)
      }

      console.log(
        '[MandiRates] Fetching:',
        url.replace(API_KEY, 'KEY')
      )

      const controller = new AbortController()
      const timeout = setTimeout(
        () => controller.abort(), 10000
      )

      const response = await fetch(url, {
        signal: controller.signal
      })
      clearTimeout(timeout)

      if (!response.ok) {
        throw new Error(
          `API error: ${response.status}`
        )
      }

      const data = await response.json()

      console.log(
        '[MandiRates] Total records:',
        data.total || 0
      )
      console.log(
        '[MandiRates] Got records:',
        (data.records || []).length
      )

      if (!data.records ||
          data.records.length === 0) {
        setRates([])
        setError(
          commodity || state
            ? `No data found. Try All States or different commodity.`
            : `No data available right now. Try again.`
        )
        setLoading(false)
        return
      }

      // Parse and normalize records
      const parsed = data.records
        .map(r => ({
          commodity: r.commodity
            || r.Commodity || '',
          market: r.market
            || r.Market || '',
          district: r.district
            || r.District || '',
          state: r.state
            || r.State || '',
          variety: r.variety
            || r.Variety || 'Other',
          minPrice: parseFloat(
            r.min_price
            || r.Min_Price
            || r.minimum_price
            || 0
          ),
          modalPrice: parseFloat(
            r.modal_price
            || r.Modal_Price
            || r.modal_x0020_price
            || 0
          ),
          maxPrice: parseFloat(
            r.max_price
            || r.Max_Price
            || r.maximum_price
            || 0
          ),
          arrivalDate: r.arrival_date
            || r.Arrival_Date
            || r.date
            || new Date()
              .toLocaleDateString('en-IN')
        }))
        .filter(r => r.modalPrice > 0)

      console.log(
        '[MandiRates] Valid records:',
        parsed.length
      )

      // Set records for table
      setRates(parsed)
      setSource('live')

      // Calculate summary cards
      if (parsed.length > 0) {
        const prices = parsed.map(
          r => r.modalPrice
        )
        const minP = Math.min(
          ...parsed.map(r => r.minPrice)
            .filter(p => p > 0)
        )
        const maxP = Math.max(
          ...parsed.map(r => r.maxPrice)
            .filter(p => p > 0)
        )
        const avgModal = Math.round(
          prices.reduce((a, b) => a + b, 0)
          / prices.length * 10
        ) / 10

        setMinPrice(minP)
        setModalPrice(avgModal)
        setMaxPrice(maxP)

        // Try to fetch prediction and history for the selected commodity
        if (commodity) {
          fetchPrediction(commodity, avgModal)
          fetchHistory(commodity, state)
        }
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        setError(
          'Request timed out. Check connection.'
        )
      } else {
        setError(
          'Failed to fetch rates. ' +
          err.message
        )
      }
      console.error(
        '[MandiRates] Error:', err.message
      )
    } finally {
      setLoading(false)
    }
  }

  const fetchPrediction = async (
    comm, price
  ) => {
    if (!comm || !price) return
    setPredLoading(true)
    try {
      // API expects price in KG
      const kgPrice = price > 100 ? price / 100 : price
      
      const res = await fetch(
        `/api/mandi/predict?commodity=${comm}&current_price=${kgPrice}&state=${state || ''}`
      )
      const data = await res.json()
      if (data.success) {
        setPrediction(data)
        // DEBUG — shows exact API response
        console.log(
          '[Forecast Debug] Full response:',
          JSON.stringify(data, null, 2)
        )
        console.log(
          '[Forecast Debug] predictions:',
          data.predictions,
          'type:',
          typeof data.predictions,
          'isArray:',
          Array.isArray(data.predictions)
        )
        console.log(
          '[Forecast Debug] predictions[0]:',
          data.predictions?.[0],
          'type:',
          typeof data.predictions?.[0]
        )
      }
    } catch (err) {
      console.error('Prediction error:', err)
    } finally {
      setPredLoading(false)
    }
  }

  const fetchHistory = async (comm, st) => {
    if (!comm) return
    try {
      const res = await fetch(
        `/api/mandi/history?commodity=${comm}&state=${st || ''}`
      )
      const data = await res.json()
      if (data.success && Array.isArray(data.history)) {
        // Map modal_price to modal for the BarChart
        const mapped = data.history.map(h => ({
          ...h,
          modal: h.modal_price || h.modalPrice || 0,
          date: h.date?.slice(0, 5) || ''
        }))
        setHistory(mapped)
      }
    } catch (err) {
      console.error('History error:', err)
    }
  }

  const handleCompare = async () => {
    if (!farmerPrice) return
    
    const validPrice = validatePrice(
      farmerPrice
    )

    if (farmerPrice &&
        !validPrice) {
      setError(
        'Please enter a valid price' +
        ' greater than ₹0'
      )
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
      const res = await fetch(
        `/api/mandi/compare?commodity=${englishCommodity}&farmer_price=${farmerPrice}&state=${state}`
      )
      const data = await res.json()
      
      if (data && data.mandi_modal) {
        const yourPrice = parseFloat(farmerPrice)
        const modalPrice = data.mandi_modal
        
        // Fix the difference calc by comparing same units
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
      }

      setComparison(data)
    } catch (err) {
      console.error('Compare error:', err)
    }
  }

  const summary = rates.length ? {
    avg_modal: parseFloat(
      (rates.reduce(
        (s, r) => s + r.modal_price, 0
      ) / rates.length).toFixed(2)
    ),
    min: Math.min(...rates.map(r => r.min_price)),
    max: Math.max(...rates.map(r => r.max_price))
  } : null

  const forecastData = prediction

  const buildChartData = () => {
    if (!forecastData) return []

    console.log(
      '[buildChartData] forecastData keys:',
      Object.keys(forecastData)
    )

    const points = []

    // ── SAFE NUMBER PARSER ──────────
    // Handles all edge cases that
    // cause NaN
    const safeNum = (val) => {
      if (val === null ||
          val === undefined) return null

      // Handle array → take first item
      if (Array.isArray(val)) {
        return safeNum(val[0])
      }

      // Handle object → try common keys
      if (typeof val === 'object') {
        const p = val.price
               || val.value
               || val.modal_price
               || val.price_kg
               || val.modal_kg
               || null
        return safeNum(p)
      }

      const n = parseFloat(String(val))
      if (isNaN(n) || !isFinite(n)) {
        return null
      }
      return n
    }

    // ── SAFE KG CONVERTER ──────────
    // Detects qtl vs kg automatically
    const toKg = (val) => {
      const n = safeNum(val)
      if (n === null) return null
      if (n <= 0) return null
      // If > 100 assume qtl
      // divide by 100 to get kg
      const kg = n > 100 ? n / 100 : n
      return Math.round(kg * 100) / 100
    }

    // ── HISTORICAL DATA ─────────────
    const histSources = [
      forecastData.history,
      forecastData.historical_data,
      forecastData.trend_data,
      forecastData.series,
      forecastData.data,
      forecastData.historical_chart
    ]

    const history = histSources.find(
      s => Array.isArray(s) && s.length > 0
    ) || []

    console.log(
      '[buildChartData] history points:',
      history.length
    )

    history.forEach((item, i) => {
      const raw =
        item.price
        || item.modal_price
        || item.price_kg
        || item.modal_kg
        || item.value
        || item.MandiWholeSalePrice
        || null

      const kg = toKg(raw)
      if (!kg) return

      const rawDate =
        item.date
        || item.month
        || item.CalendarDay
        || item.period
        || ''

      let dateLabel = String(rawDate)
      try {
        if (rawDate.includes('-')) {
          const parts = rawDate.split('-')
          const months = [
            'Jan','Feb','Mar','Apr',
            'May','Jun','Jul','Aug',
            'Sep','Oct','Nov','Dec'
          ]
          if (parts.length >= 2) {
            const m = months[
              parseInt(parts[1]) - 1
            ]
            const yr = parts[0].slice(-2)
            dateLabel = m
              ? `${m} '${yr}` : rawDate
          }
        }
      } catch {}

      points.push({
        date: dateLabel || `P${i+1}`,
        actual: kg,
        predicted: null,
        type: 'historical'
      })
    })

    // ── TODAY BRIDGE POINT ──────────
    const todayRaw =
      forecastData?.today_mandi?.price_kg
      || forecastData?.current_price
      || forecastData?.today_price
      || null

    const todayKg = toKg(todayRaw)

    if (todayKg) {
      points.push({
        date: '21 Mar',
        actual: todayKg,
        predicted: todayKg,
        type: 'today',
        isToday: true
      })
    }

    // ── ML PREDICTIONS ──────────────
    // THIS IS WHERE NaN WAS HAPPENING
    // predictions can be:
    //   [1300, 1350, 1400] numbers
    //   ["1300", "1350"] strings
    //   [{price:1300}, ...] objects
    //   null or undefined

    const predSources = [
      forecastData.predictions,
      forecastData.forecast,
      forecastData.predicted_prices,
      forecastData.next_7_days
    ]

    const rawPredictions = predSources.find(
      s => Array.isArray(s) && s.length > 0
    )

    console.log(
      '[buildChartData] raw predictions:',
      rawPredictions,
      'length:',
      rawPredictions?.length
    )

    if (!rawPredictions ||
        rawPredictions.length === 0) {
      console.warn(
        '[buildChartData] NO predictions found!',
        'forecastData keys:',
        Object.keys(forecastData)
      )
    }

    const baseDate = new Date('2026-03-21')

    ;(rawPredictions || [])
      .slice(0, 7)
      .forEach((item, i) => {
        // Safe extract price from
        // whatever format it is
        const kg = toKg(item)

        console.log(
          `[buildChartData] pred[${i}]:`,
          item,
          '→ kg:',
          kg
        )

        if (!kg) {
          console.warn(
            `[buildChartData] pred[${i}]`,
            'converted to null/NaN,',
            'raw value:', item
          )
          return
        }

        const d = new Date(baseDate)
        d.setDate(
          baseDate.getDate() + i + 1
        )

        const dateLabel =
          d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
          })

        points.push({
          date: dateLabel,
          actual: null,
          predicted: kg,
          type: 'forecast'
        })
      })

    console.log(
      '[buildChartData] Total points:',
      points.length,
      'Historical:', points.filter(
        p => p.type === 'historical'
      ).length,
      'Forecast:', points.filter(
        p => p.type === 'forecast'
      ).length
    )

    return points
  }

  const chartData = buildChartData()

  const fixRecommendationMessage = (msg) => {
    if (!msg) return msg
    // Replace prices > 100 in message
    // with /100 converted version
    return msg.replace(
      /₹(\d+(?:\.\d+)?)/g,
      (match, price) => {
        const num = parseFloat(price)
        if (num > 100) {
          return `₹${(num/100).toFixed(2)}`
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
        .map(p => p.actual || p.predicted)
        .filter(Boolean)
      console.log(
        '[Chart Debug]',
        'Points:', chartData.length,
        'Min price:', Math.min(...prices),
        'Max price:', Math.max(...prices),
        'First:', chartData[0],
        'Last:', chartData[
          chartData.length - 1
        ]
      )
    }
  }, [chartData])

  const TABS = [
    { id: 'rates', label: '📋 Live Rates' },
    { id: 'prediction', label: '🔮 ML Forecast' },
    { id: 'history', label: '📈 Price History' }
  ]

  const toKg = (qtlPrice) => {
    if (!qtlPrice || qtlPrice <= 0)
      return 0
    // API gives ₹/quintal
    // 1 quintal = 100 kg
    const kg = qtlPrice / 100
    // Round to 2 decimal places
    return Math.round(kg * 100) / 100
  }

  const formatKg = (qtlPrice) => {
    const kg = toKg(qtlPrice)
    if (kg === 0) return '0'
    // Show clean number
    // 13.00 → 13
    // 10.87 → 10.87
    // 12.46 → 12.46
    return kg % 1 === 0
      ? String(kg)
      : kg.toFixed(2)
  }

  // Search commodity by any language
  const searchCommodity = (query) => {
    if (!query || query.trim() === '') {
      return []
    }

    const q = query.toLowerCase().trim()

    // Get current state language
    const stateConfig =
      STATE_LANGUAGE_MAP[state]
      || STATE_LANGUAGE_MAP['default']
    const stateLang = stateConfig.lang

    return COMMODITIES
      .filter(c => {
        if (!c.value) return false

        // Check state language FIRST
        const stateMatch =
          (c[stateLang] || '')
            .toLowerCase()
            .includes(q)

        // Check all other fields
        const otherMatch = (
          c.value.toLowerCase().includes(q)
          || c.label.toLowerCase().includes(q)
          || (c.hindi || '').toLowerCase()
              .includes(q)
          || (c.marathi || '').toLowerCase()
              .includes(q)
          || (c.tamil || '').toLowerCase()
              .includes(q)
          || (c.telugu || '').toLowerCase()
              .includes(q)
          || (c.kannada || '').toLowerCase()
              .includes(q)
          || (c.bengali || '').toLowerCase()
              .includes(q)
          || (c.gujarati || '').toLowerCase()
              .includes(q)
          || (c.punjabi || '').toLowerCase()
              .includes(q)
          || (c.local || []).some(
              l => l.toLowerCase()
                .includes(q)
            )
        )

        return stateMatch || otherMatch
      })
      .sort((a, b) => {
        // Sort state language matches first
        const aMatch =
          (a[stateLang] || '')
            .toLowerCase()
            .includes(q)
        const bMatch =
          (b[stateLang] || '')
            .toLowerCase()
            .includes(q)

        if (aMatch && !bMatch) return -1
        if (!aMatch && bMatch) return 1
        return 0
      })
  }

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
  const getCommodityDisplayLabel = (c) => {
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
  const getSearchPlaceholder = () => {
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
            onClick={fetchAll}
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

        {/* Commodity */}
        <div style={{ flex: '1 1 150px' }}>
          {/* Search Input JSX */}
          <div style={{
            position: 'relative',
            marginBottom: 8
          }}>
            <input
              type="text"
              placeholder={`🔍 Search in ${
                getLanguageLabel()
              } — ${getSearchPlaceholder()}`}
              value={commoditySearch}
              onChange={handleSearchChange}
              onFocus={() => {
                if (commoditySearch.trim()) {
                  setShowSearchDropdown(true)
                }
              }}
              onBlur={() => {
                // Delay to allow click
                setTimeout(() => {
                  setShowSearchDropdown(false)
                }, 200)
              }}
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                borderRadius: 10,
                border: '1.5px solid #EDD9B0',
                background: '#FDFAF4',
                fontFamily: 'DM Sans',
                fontSize: 13,
                color: '#4A4A4A',
                boxSizing: 'border-box'
              }}
            />

            {/* Search icon */}
            <span style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 14,
              pointerEvents: 'none'
            }}>
              🔍
            </span>

            {/* Show selected state language first */}
            <div style={{
              display: 'flex',
              gap: 4,
              flexWrap: 'wrap',
              marginTop: 6
            }}>
              {/* Current state language badge */}
              {state &&
               STATE_LANGUAGE_MAP[state] && (
                <span style={{
                  fontFamily: 'DM Sans',
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#2D4F1E',
                  background: 'rgba(45,79,30,0.10)',
                  padding: '2px 8px',
                  borderRadius: 999,
                  border: '1px solid rgba(45,79,30,0.20)'
                }}>
                  ✓ {
                    STATE_LANGUAGE_MAP[state]
                      .label
                  }
                </span>
              )}

              {/* Other language tags */}
              {[
                { code: 'hi', label: 'हिंदी' },
                { code: 'mr', label: 'मराठी' },
                { code: 'ta', label: 'தமிழ்' },
                { code: 'te', label: 'తెలుగు' },
                { code: 'kn', label: 'ಕನ್ನಡ' },
                { code: 'bn', label: 'বাংলা' },
                { code: 'gu', label: 'ગુજરાતી' },
                { code: 'pa', label: 'ਪੰਜਾਬੀ' },
              ].filter(l => {
                // Hide current state language
                // from other tags
                const stateConfig =
                  STATE_LANGUAGE_MAP[state]
                if (!stateConfig) return true
                const currentLabel =
                  stateConfig.label
                return l.label !== currentLabel
              }).map(l => (
                <span key={l.code} style={{
                  fontFamily: 'DM Sans',
                  fontSize: 9,
                  color: '#7A7A7A',
                  background: '#F5E6CC',
                  padding: '2px 6px',
                  borderRadius: 999,
                  border: '1px solid #EDD9B0'
                }}>
                  {l.label}
                </span>
              ))}
            </div>

            {/* Search results dropdown */}
            {showSearchDropdown &&
             searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#FDFAF4',
                border: '1.5px solid #EDD9B0',
                borderRadius: 10,
                boxShadow:
                  '0 8px 24px rgba(45,79,30,0.12)',
                zIndex: 1000,
                maxHeight: 200,
                overflowY: 'auto',
                marginTop: 4
              }}>
                {searchResults.map((item, i) => (
                  <div
                    key={`${item.value}-${i}`}
                    onClick={() =>
                      handleSelectFromSearch(item)
                    }
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderBottom:
                        i < searchResults.length - 1
                          ? '1px solid #EDD9B0'
                          : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style
                        .background = '#F5E6CC'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style
                        .background = 'transparent'
                    }}
                  >
                    <div>
                      {/* English name */}
                      <div style={{
                        fontFamily: 'DM Sans',
                        fontWeight: 700,
                        fontSize: 13,
                        color: '#2D4F1E'
                      }}>
                        {item.label}
                      </div>

                      {/* Local name — highlighted */}
                      {getLocalName(item) && (
                        <div style={{
                          fontFamily: 'DM Sans',
                          fontSize: 12,
                          color: '#2D4F1E',
                          fontWeight: 600,
                          marginTop: 2
                        }}>
                          {getLocalName(item)}
                          {STATE_LANGUAGE_MAP[state] && (
                            <span style={{
                              fontSize: 9,
                              color: '#7A7A7A',
                              marginLeft: 4,
                              fontWeight: 400
                            }}>
                              ({STATE_LANGUAGE_MAP[state].label})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Other language names */}
                      <div style={{
                        fontFamily: 'DM Sans',
                        fontSize: 10,
                        color: '#B0A898',
                        marginTop: 1
                      }}>
                        {[
                          item.hindi,
                          item.marathi,
                          item.tamil
                        ]
                        .filter(Boolean)
                        .filter(n => n !== getLocalName(item))
                        .slice(0, 2)
                        .join(' • ')}
                      </div>
                    </div>

                    {/* Local name tag */}
                    {item.local &&
                     item.local.length > 0 && (
                      <span style={{
                        fontFamily: 'DM Sans',
                        fontSize: 9,
                        color: '#B0A898',
                        background: '#F5E6CC',
                        padding: '2px 6px',
                        borderRadius: 999,
                        flexShrink: 0,
                        marginLeft: 8
                      }}>
                        {item.local[0]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* No results message */}
            {showSearchDropdown &&
             commoditySearch.trim() &&
             searchResults.length === 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#FDFAF4',
                border: '1.5px solid #EDD9B0',
                borderRadius: 10,
                padding: '12px 14px',
                zIndex: 1000,
                marginTop: 4
              }}>
                <p style={{
                  fontFamily: 'DM Sans',
                  fontSize: 12,
                  color: '#7A7A7A',
                  margin: 0
                }}>
                  No match found for
                  "{commoditySearch}".
                  Try English name or
                  select from dropdown below.
                </p>
              </div>
            )}
          </div>
          
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
            Commodity
          </label>
          <select
            value={commodity}
            onChange={e => {
              setCommodity(e.target.value)
              setCommoditySearch(
                e.target.value
              )
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
            {COMMODITIES.map((c, i) => (
              <option
                key={`${c.value}-${i}`}
                value={c.value}
              >
                {getCommodityDisplayLabel(c)}
              </option>
            ))}
          </select>
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
          <select
            value={state}
            onChange={e =>
              setState(e.target.value)
            }
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
          </select>
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
            Your Selling Price (₹/{commodity.toLowerCase().includes('milk') || commodity.toLowerCase().includes('oil') ? 'L' : 'kg'})
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
                if (e.key === 'Enter') handleCompare()
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
              label: 'Minimum Price',
              value: minPrice,
              sub: 'Lowest in market',
              color: '#FF5252',
              bg: 'rgba(255,82,82,0.07)',
              icon: ArrowDown
            },
            {
              label: 'Modal Price',
              value: modalPrice,
              sub: 'Most traded rate',
              color: '#2D4F1E',
              bg: 'rgba(45,79,30,0.07)',
              icon: Minus
            },
            {
              label: 'Maximum Price',
              value: maxPrice,
              sub: 'Highest in market',
              color: '#4CAF50',
              bg: 'rgba(76,175,80,0.07)',
              icon: ArrowUp
            }
          ].map(card => {
            const Icon = card.icon
            const isLiquid = commodity.toLowerCase().includes('milk') || commodity.toLowerCase().includes('oil')
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
                  Your ₹{comparison.farmer_price}/{unit} vs Mandi ₹{(comparison.mandi_modal / 100).toFixed(2)}/{unit} (₹{Math.round(comparison.mandi_modal)}/qtl)
                  {' '}({comparison.diff_percent > 0 ? '+' : ''}{comparison.diff_percent}%)
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
            {loading ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                fontFamily: 'DM Sans'
              }}>
                <div style={{
                  fontSize: 32,
                  marginBottom: 12
                }}>
                  🌾
                </div>
                <p style={{
                  color: '#7A7A7A',
                  fontSize: 14,
                  fontWeight: 600
                }}>
                  Loading live mandi rates...
                </p>
              </div>

            ) : error ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                fontFamily: 'DM Sans'
              }}>
                <div style={{ fontSize: 32 }}>
                  📊
                </div>
                <p style={{
                  color: '#4A4A4A',
                  fontWeight: 700,
                  fontSize: 15,
                  margin: '12px 0 8px'
                }}>
                  No rates found
                </p>
                <p style={{
                  color: '#7A7A7A',
                  fontSize: 13,
                  margin: '0 0 16px'
                }}>
                  {error}
                </p>
                <button
                  onClick={() => {
                    setCommodity('Tomato')
                    setState('Maharashtra')
                    setTimeout(fetchAll, 100)
                  }}
                  style={{
                    padding: '8px 20px',
                    background: '#2D4F1E',
                    border: 'none',
                    borderRadius: 10,
                    color: 'white',
                    fontFamily: 'DM Sans',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Try Tomato in Maharashtra
                </button>
              </div>

            ) : rates && rates.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontFamily: 'DM Sans'
                }}>
                  <thead>
                    <tr style={{
                      background: '#F5E6CC',
                      borderBottom: '2px solid #EDD9B0'
                    }}>
                      {[
                        'MARKET',
                        'DISTRICT',
                        'STATE',
                        'VARIETY',
                        'MIN ₹',
                        'MODAL ₹',
                        'MAX ₹',
                        'DATE'
                      ].map(h => (
                        <th key={h} style={{
                          padding: '10px 14px',
                          textAlign: 'left',
                          fontFamily: 'DM Sans',
                          fontWeight: 700,
                          fontSize: 11,
                          color: '#7A7A7A',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          whiteSpace: 'nowrap'
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rates.map((r, i) => (
                      <tr key={i} style={{
                        borderBottom:
                          '1px solid #EDD9B0',
                        background: i % 2 === 0
                          ? '#FDFAF4'
                          : '#F9F4EC'
                      }}>
                        <td style={{
                          padding: '12px 14px',
                          fontFamily: 'DM Sans',
                          fontWeight: 700,
                          fontSize: 13,
                          color: '#2D4F1E'
                        }}>
                          {r.market || '-'}
                        </td>
                        <td style={{
                          padding: '12px 14px',
                          fontFamily: 'DM Sans',
                          fontSize: 12,
                          color: '#4A4A4A'
                        }}>
                          {r.district || '-'}
                        </td>
                        <td style={{
                          padding: '12px 14px',
                          fontFamily: 'DM Sans',
                          fontSize: 12,
                          color: '#4A4A4A'
                        }}>
                          {r.state || '-'}
                        </td>
                        <td style={{
                          padding: '12px 14px',
                          fontFamily: 'DM Sans',
                          fontSize: 12,
                          color: '#7A7A7A'
                        }}>
                          {r.variety || 'Other'}
                        </td>
                        <td style={{
                          padding: '12px 14px',
                          fontFamily: 'DM Sans',
                          fontWeight: 600,
                          fontSize: 13,
                          color: '#FF5252'
                        }}>
                          <div>
                            ₹{(r.minPrice / 100)
                              .toFixed(2)}/kg
                          </div>
                          <div style={{
                            fontSize: 10,
                            color: '#B0A898',
                            fontWeight: 400
                          }}>
                            ₹{r.minPrice}/qtl
                          </div>
                        </td>
                        <td style={{
                          padding: '12px 14px',
                          fontFamily: 'DM Sans',
                          fontWeight: 800,
                          fontSize: 14,
                          color: '#2D4F1E'
                        }}>
                          <div>
                            ₹{(r.modalPrice / 100)
                              .toFixed(2)}/kg
                          </div>
                          <div style={{
                            fontSize: 10,
                            color: '#B0A898',
                            fontWeight: 400
                          }}>
                            ₹{r.modalPrice}/qtl
                          </div>
                        </td>
                        <td style={{
                          padding: '12px 14px',
                          fontFamily: 'DM Sans',
                          fontWeight: 600,
                          fontSize: 13,
                          color: '#4CAF50'
                        }}>
                          <div>
                            ₹{(r.maxPrice / 100)
                              .toFixed(2)}/kg
                          </div>
                          <div style={{
                            fontSize: 10,
                            color: '#B0A898',
                            fontWeight: 400
                          }}>
                            ₹{r.maxPrice}/qtl
                          </div>
                        </td>
                        <td style={{
                          padding: '12px 14px',
                          fontFamily: 'DM Sans',
                          fontSize: 12,
                          color: '#7A7A7A',
                          whiteSpace: 'nowrap'
                        }}>
                          {r.arrivalDate || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Records count footer */}
                <div style={{
                  padding: '10px 14px',
                  fontFamily: 'DM Sans',
                  fontSize: 11,
                  color: '#B0A898',
                  borderTop: '1px solid #EDD9B0',
                  textAlign: 'right'
                }}>
                  Showing {rates.length} markets
                  {commodity
                    ? ` for ${commodity}`
                    : ' (All Commodities)'}
                  {state
                    ? ` in ${state}`
                    : ' across India'}
                  {' '}• Source: data.gov.in
                  (AGMARKNET)
                </div>
              </div>

            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                fontFamily: 'DM Sans'
              }}>
                <div style={{ fontSize: 32 }}>
                  🌾
                </div>
                <p style={{
                  color: '#7A7A7A',
                  fontSize: 13,
                  marginTop: 12
                }}>
                  Select commodity and state,
                  then click Compare
                </p>
              </div>
            )}
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
                border: `1px solid ${
                  (typeof prediction.model === 'object' && prediction.model?.is_arima)
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
                        domain={([min, max]) => {
                          const pad = (max - min) * 0.20
                          return [
                            Math.max(0,
                              Math.floor(min - pad)
                            ),
                            Math.ceil(max + pad)
                          ]
                        }}
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

                      {/* Today reference line */}
                      <ReferenceLine
                        x="21 Mar"
                        stroke="#EDD9B0"
                        strokeDasharray="4 4"
                        label={{
                          value: 'Today',
                          position:
                            'insideTopLeft',
                          fontFamily: 'DM Sans',
                          fontSize: 9,
                          fill: '#B0A898'
                        }}
                      />

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
                    { color: '#2D4F1E',
                      label: 'Actual/Current' },
                    { color: '#E27D60',
                      label: 'ML Predicted' },
                    { color: '#E27D60',
                      style: 'dashed',
                      label: 'Current Price' }
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
                      content={
                        <CustomChartTooltip />
                      }
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
