/**
 * Multi-Language Prompts & Clinical Translations
 * Supports frontline ANM and ASHA workers interviewing patients in regional languages.
 */

export interface TranslationPackage {
  languageName: string;
  nativeName: string;
  prompts: {
    chiefComplaintPrompt: string;
    onsetPrompt: string;
    durationPrompt: string;
    painScalePrompt: string;
    vitalsPrompt: string;
    voiceGuide: string;
  };
  commonComplaints: {
    label: string;
    value: string;
  }[];
}

export const REGIONAL_TRANSLATIONS: Record<string, TranslationPackage> = {
  en: {
    languageName: 'English',
    nativeName: 'English',
    prompts: {
      chiefComplaintPrompt: 'What is the main problem bringing the patient to the health centre today?',
      onsetPrompt: 'When did this problem start, and was it sudden or gradual?',
      durationPrompt: 'How many hours or days has this symptom lasted?',
      painScalePrompt: 'Is the pain mild, moderate, or unbearable/severe?',
      vitalsPrompt: 'Measure blood pressure, oxygen saturation (SpO₂), pulse rate, respiratory rate, and temperature.',
      voiceGuide: 'Speak clearly into the microphone. Frontline staff must review transcribed text before saving.'
    },
    commonComplaints: [
      { label: 'Chest pain & shortness of breath', value: 'Chest pain & shortness of breath' },
      { label: 'High fever with rigors/chills', value: 'High fever with rigors' },
      { label: 'Severe breathlessness / stridor', value: 'Severe breathlessness and audible stridor' },
      { label: 'Repeated vomiting & dizziness', value: 'Repeated vomiting & extreme dizziness' },
      { label: 'Mild cough and cold', value: 'Mild cough and cold' },
      { label: 'Acute abdominal pain', value: 'Severe acute abdominal pain' },
      { label: 'Snake bite / venomous sting', value: 'Snake bite / venomous bite on limb' },
      { label: 'Head injury / convulsion', value: 'Head trauma with active convulsion' }
    ]
  },
  hi: {
    languageName: 'Hindi',
    nativeName: 'हिन्दी',
    prompts: {
      chiefComplaintPrompt: 'मरीज को अस्पताल लाने की मुख्य तकलीफ क्या है? (जैसे छाती में दर्द, तेज बुखार, सांस फूलना)',
      onsetPrompt: 'यह तकलीफ कब शुरू हुई? क्या यह अचानक हुई या धीरे-धीरे बढ़ी?',
      durationPrompt: 'यह लक्षण कितने घंटे या दिनों से है?',
      painScalePrompt: 'दर्द कैसा है: हल्का, मध्यम, या बहुत तेज/असहनीय?',
      vitalsPrompt: 'रक्तचाप (BP), ऑक्सीजन (SpO₂), नाड़ी (Pulse), श्वसन दर और तापमान मापें।',
      voiceGuide: 'माइक्रोफोन में साफ बोलें। सेव करने से पहले स्वास्थ्य कार्यकर्ता द्वारा जांच अनिवार्य है।'
    },
    commonComplaints: [
      { label: 'छाती में दर्द व सांस फूलना', value: 'Chest pain & shortness of breath (छाती में दर्द व सांस फूलना)' },
      { label: 'कपकपी के साथ तेज बुखार', value: 'High fever with rigors (कपकपी के साथ तेज बुखार)' },
      { label: 'गंभीर सांस की तकलीफ / घबराहट', value: 'Severe breathlessness and audible stridor (गंभीर सांस की तकलीफ)' },
      { label: 'बार-बार उल्टी व चक्कर आना', value: 'Repeated vomiting & extreme dizziness (बार-बार उल्टी व चक्कर आना)' },
      { label: 'हल्की खांसी व जुकाम', value: 'Mild cough and cold (हल्की खांसी व जुकाम)' },
      { label: 'पेट में असहनीय दर्द', value: 'Severe acute abdominal pain (पेट में असहनीय दर्द)' },
      { label: 'सांप या जहरीले कीड़े का काटना', value: 'Snake bite / venomous bite on limb (सांप या जहरीले कीड़े का काटना)' },
      { label: 'सिर में चोट या बेहोशी/दौरा', value: 'Head trauma with active convulsion (सिर में चोट या दौरा)' }
    ]
  },
  mr: {
    languageName: 'Marathi',
    nativeName: 'मराठी',
    prompts: {
      chiefComplaintPrompt: 'रुग्णाला आज आरोग्य केंद्रात आणण्याचे मुख्य कारण काय आहे?',
      onsetPrompt: 'हा त्रास कधी सुरू झाला? अचानक झाला की हळूहळू वाढला?',
      durationPrompt: 'ही लक्षणे किती तासांपासून किंवा दिवसांपासून आहेत?',
      painScalePrompt: 'वेदना कशी आहे: हलकी, मध्यम की खूप तीव्र?',
      vitalsPrompt: 'रक्तदाब (BP), ऑक्सिजन (SpO₂), नाडी दर, श्वासोच्छ्वास दर आणि तापमान मोजा.',
      voiceGuide: 'मायक्रोफोनमध्ये स्पष्ट बोला. जतन करण्यापूर्वी कर्मचाऱ्यांनी मजकूर तपासणे आवश्यक आहे.'
    },
    commonComplaints: [
      { label: 'छातीत दुखणे आणि धाप लागणे', value: 'Chest pain & shortness of breath (छातीत दुखणे व धाप)' },
      { label: 'थंडी वाजून तीव्र ताप', value: 'High fever with rigors (थंडी वाजून तीव्र ताप)' },
      { label: 'श्वास घेण्यास तीव्र त्रास', value: 'Severe breathlessness and audible stridor (श्वास घेण्यास तीव्र त्रास)' },
      { label: 'वारंवार उलट्या आणि भोवळ येणे', value: 'Repeated vomiting & extreme dizziness (उलट्या व भोवळ)' },
      { label: 'साधा खोकला आणि सर्दी', value: 'Mild cough and cold (साधा खोकला आणि सर्दी)' },
      { label: 'तीव्र पोटदुखी', value: 'Severe acute abdominal pain (तीव्र पोटदुखी)' },
      { label: 'सर्पदंश किंवा विषारी दंश', value: 'Snake bite / venomous bite on limb (सर्पदंश)' },
      { label: 'डोक्याला मार किंवा फिट येणे', value: 'Head trauma with active convulsion (फिट येणे/दौरा)' }
    ]
  },
  ta: {
    languageName: 'Tamil',
    nativeName: 'தமிழ்',
    prompts: {
      chiefComplaintPrompt: 'நோயாளிக்கு இன்று உள்ள முதன்மையான உடல்நலப் பிரச்சனை என்ன?',
      onsetPrompt: 'இந்த பிரச்சனை எப்போது தொடங்கியது? திடீரென்றா அல்லது படிப்படியாகவா?',
      durationPrompt: 'இந்த அறிகுறிகள் எத்தனை மணிநேரம் அல்லது நாட்களாக நீடிக்கிறது?',
      painScalePrompt: 'வலி எவ்வாறு உள்ளது: லேசானதா, நடுத்தரமானதா அல்லது தாங்க முடியாததா?',
      vitalsPrompt: 'இரத்த அழுத்தம், ஆக்ஸிஜன் (SpO₂), நாடித்துடிப்பு, சுவாச விகிதம் மற்றும் வெப்பநிலையை அளவிடவும்.',
      voiceGuide: 'மைக்ரோஃபோனில் தெளிவாகப் பேசுங்கள். சேமிப்பதற்கு முன் ஊழியர்கள் சரிபார்க்க வேண்டும்.'
    },
    commonComplaints: [
      { label: 'நெஞ்சு வலி மற்றும் மூச்சுத் திணறல்', value: 'Chest pain & shortness of breath' },
      { label: 'நடுக்கத்துடன் கூடிய அதிக காய்ச்சல்', value: 'High fever with rigors' },
      { label: 'கடுமையான மூச்சுத் திணறல்', value: 'Severe breathlessness and audible stridor' },
      { label: 'தொடர் வாந்தி மற்றும் மயக்கம்', value: 'Repeated vomiting & extreme dizziness' },
      { label: 'லேசான இருமல் மற்றும் சளி', value: 'Mild cough and cold' },
      { label: 'கடுமையான வயிற்று வலி', value: 'Severe acute abdominal pain' },
      { label: 'பாம்பு கடி அல்லது விஷக்கடி', value: 'Snake bite / venomous bite on limb' },
      { label: 'தலையில் காயம் அல்லது வலிப்பு', value: 'Head trauma with active convulsion' }
    ]
  },
  te: {
    languageName: 'Telugu',
    nativeName: 'తెలుగు',
    prompts: {
      chiefComplaintPrompt: 'రోగిని ఈరోజు ఆరోగ్య కేంద్రానికి తీసుకురావడానికి ప్రధాన సమస్య ఏమిటి?',
      onsetPrompt: 'ఈ సమస్య ఎప్పుడు ప్రారంభమైంది? హఠాత్తుగా వచ్చిందా లేదా నెమ్మదిగా పెరిగిందా?',
      durationPrompt: 'ఈ లక్షణాలు ఎన్ని గంటలు లేదా రోజులుగా ఉన్నాయి?',
      painScalePrompt: 'నొప్పి ఎలా ఉంది: తేలికపాటి, మధ్యస్థ లేదా భరించలేని తీవ్రమైనదా?',
      vitalsPrompt: 'రక్తపోటు (BP), ఆక్సిజన్ (SpO₂), నాడి వేగం, శ్వాస రేటు మరియు ఉష్ణోగ్రతను కొలవండి.',
      voiceGuide: 'మైక్రోఫోన్‌లో స్పష్టంగా మాట్లాడండి. నమోదు చేయడానికి ముందు సిబ్బంది తనిఖీ చేయాలి.'
    },
    commonComplaints: [
      { label: 'ఛాతీ నొప్పి & ఆయాసం', value: 'Chest pain & shortness of breath' },
      { label: 'వణుకుతో కూడిన అధిక జ్వరం', value: 'High fever with rigors' },
      { label: 'తీవ్రమైన శ్వాసకోశ ఇబ్బంది', value: 'Severe breathlessness and audible stridor' },
      { label: 'నిరంతర వాంతులు & కళ్ళు తిరగడం', value: 'Repeated vomiting & extreme dizziness' },
      { label: 'తేలికపాటి దగ్గు మరియు జలుబు', value: 'Mild cough and cold' },
      { label: 'తీవ్రమైన కడుపు నొప్పి', value: 'Severe acute abdominal pain' },
      { label: 'పాము కాటు లేదా విషపు కాటు', value: 'Snake bite / venomous bite on limb' },
      { label: 'తల గాయం లేదా మూర్ఛ/ఫిట్స్', value: 'Head trauma with active convulsion' }
    ]
  },
  pa: {
    languageName: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    prompts: {
      chiefComplaintPrompt: 'ਮਰੀਜ਼ ਨੂੰ ਅੱਜ ਸਿਹਤ ਕੇਂਦਰ ਲਿਆਉਣ ਦੀ ਮੁੱਖ ਤਕਲੀਫ਼ ਕੀ ਹੈ? (ਜਿਵੇਂ ਛਾਤੀ ਵਿੱਚ ਦਰਦ, ਤੇਜ਼ ਬੁਖ਼ਾਰ, ਸਾਹ ਚੜ੍ਹਨਾ)',
      onsetPrompt: 'ਇਹ ਤਕਲੀਫ਼ ਕਦੋਂ ਸ਼ੁਰੂ ਹੋਈ? ਕੀ ਇਹ ਅਚਾਨਕ ਸ਼ੁਰੂ ਹੋਈ ਜਾਂ ਹੌਲੀ-ਹੌਲੀ ਵਧੀ?',
      durationPrompt: 'ਇਹ ਲੱਛਣ ਕਿੰਨੇ ਘੰਟਿਆਂ ਜਾਂ ਦਿਨਾਂ ਤੋਂ ਹਨ?',
      painScalePrompt: 'ਦਰਦ ਕਿਹੋ ਜਿਹਾ ਹੈ: ਹਲਕਾ, ਦਰਮਿਆਨਾ, ਜਾਂ ਬਹੁਤ ਤੇਜ਼/ਅਸਹਿਣਯੋਗ?',
      vitalsPrompt: 'ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ (BP), ਆਕਸੀਜਨ (SpO₂), ਨਬਜ਼ (Pulse), ਸਾਹ ਦੀ ਗਤੀ ਅਤੇ ਤਾਪਮਾਨ ਮਾਪੋ।',
      voiceGuide: 'ਮਾਈਕ੍ਰੋਫ਼ੋਨ ਵਿੱਚ ਸਾਫ਼ ਬੋਲੋ। ਸੇਵ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਸਿਹਤ ਕਰਮਚਾਰੀ ਵੱਲੋਂ ਜਾਂਚ ਲਾਜ਼ਮੀ ਹੈ।'
    },
    commonComplaints: [
      { label: 'ਛਾਤੀ ਵਿੱਚ ਦਰਦ ਅਤੇ ਸਾਹ ਚੜ੍ਹਨਾ', value: 'Chest pain & shortness of breath (ਛਾਤੀ ਵਿੱਚ ਦਰਦ ਅਤੇ ਸਾਹ ਚੜ੍ਹਨਾ)' },
      { label: 'ਕੰਬਣੀ ਨਾਲ ਤੇਜ਼ ਬੁਖ਼ਾਰ', value: 'High fever with rigors (ਕੰਬਣੀ ਨਾਲ ਤੇਜ਼ ਬੁਖ਼ਾਰ)' },
      { label: 'ਸਾਹ ਲੈਣ ਵਿੱਚ ਗੰਭੀਰ ਤਕਲੀਫ਼ / ਘਰਘਰਾਹਟ', value: 'Severe breathlessness and audible stridor (ਸਾਹ ਲੈਣ ਵਿੱਚ ਗੰਭੀਰ ਤਕਲੀਫ਼)' },
      { label: 'ਵਾਰ-ਵਾਰ ਉਲਟੀਆਂ ਅਤੇ ਚੱਕਰ ਆਉਣਾ', value: 'Repeated vomiting & extreme dizziness (ਵਾਰ-ਵਾਰ ਉਲਟੀਆਂ ਅਤੇ ਚੱਕਰ ਆਉਣਾ)' },
      { label: 'ਹਲਕੀ ਖੰਘ ਅਤੇ ਜ਼ੁਕਾਮ', value: 'Mild cough and cold (ਹਲਕੀ ਖੰਘ ਅਤੇ ਜ਼ੁਕਾਮ)' },
      { label: 'ਪੇਟ ਵਿੱਚ ਤੇਜ਼ ਦਰਦ', value: 'Severe acute abdominal pain (ਪੇਟ ਵਿੱਚ ਤੇਜ਼ ਦਰਦ)' },
      { label: 'ਸੱਪ ਜਾਂ ਜ਼ਹਿਰੀਲੇ ਜੀਵ ਦਾ ਡੰਗ', value: 'Snake bite / venomous bite on limb (ਸੱਪ ਜਾਂ ਜ਼ਹਿਰੀਲੇ ਜੀਵ ਦਾ ਡੰਗ)' },
      { label: 'ਸਿਰ ਵਿੱਚ ਸੱਟ ਜਾਂ ਦੌਰਾ ਪੈਣਾ', value: 'Head trauma with active convulsion (ਸਿਰ ਵਿੱਚ ਸੱਟ ਜਾਂ ਦੌਰਾ)' }
    ]
  },
  bn: {
    languageName: 'Bengali',
    nativeName: 'বাংলা',
    prompts: {
      chiefComplaintPrompt: 'রোগীর প্রধান সমস্যা বা উপসর্গ কী যার জন্য স্বাস্থ্যকেন্দ্রে এসেছেন?',
      onsetPrompt: 'এই সমস্যা কখন শুরু হয়েছিল? হঠাৎ করে নাকি ধীরে ধীরে?',
      durationPrompt: 'উপসর্গগুলি কত ঘণ্টা বা কত দিন ধরে চলছে?',
      painScalePrompt: 'ব্যথা কেমন: মৃদু, মাঝারি, নাকি তীব্র/অসহ্য?',
      vitalsPrompt: 'রক্তচাপ, অক্সিজেন (SpO₂), পালস রেট, শ্বাসপ্রশ্বাসের গতি এবং তাপমাত্রা পরিমাপ করুন।',
      voiceGuide: 'মাইক্রোফোনে স্পষ্ট করে বলুন। সংরক্ষণ করার আগে কর্মীকে যাচাই করতে হবে।'
    },
    commonComplaints: [
      { label: 'বুকে ব্যথা ও শ্বাসকষ্ট', value: 'Chest pain & shortness of breath' },
      { label: 'কাঁপুনি দিয়ে তীব্র জ্বর', value: 'High fever with rigors' },
      { label: 'চরম শ্বাসকষ্ট ও স্ট্রিডর', value: 'Severe breathlessness and audible stridor' },
      { label: 'বারবার বমি ও মাথা ঘোরা', value: 'Repeated vomiting & extreme dizziness' },
      { label: 'হালকা কাশি ও সর্দি', value: 'Mild cough and cold' },
      { label: 'তীব্র পেট ব্যথা', value: 'Severe acute abdominal pain' },
      { label: 'সাপের কামড় বা বিষাক্ত কামড়', value: 'Snake bite / venomous bite on limb' },
      { label: 'মাথায় আঘাত বা খিঁচুনি', value: 'Head trauma with active convulsion' }
    ]
  }
};
