// ===== MODULE: data.js (data loading, parsing, embedded dataset) =====



        /** @type {string} */
        const ANALYTICS_KEY = "cc-usage-analytics";

        /** @type {string} */
        const PREFS_KEY = "cc-preferences";

        /** @type {string} */
        const INSTALL_DISMISSED_KEY = "cc-install-dismissed";

        /** @type {string} */
        const INSTALLED_KEY = "cc-installed";

        /** @type {string} */
        const IOS_TIP_DISMISSED_KEY = "cc-ios-tip-dismissed";

        /** @type {number} */
        const SEARCH_DEBOUNCE_MS = 200;

        /** @type {number} */
        /** @type {number} */
        const VIRTUAL_OVERSCAN = 4;

        // ===== MODULE: utils.js (DOM and general utilities) =====
        const DOMUtils = {
            /** @param {string} id @returns {HTMLElement|null} */
            get: (id) => document.getElementById(id),
            /** @param {HTMLElement|null} el */
            hide: (el) => { if (el) el.classList.add("hidden"); },
            /** @param {HTMLElement|null} el */
            show: (el) => { if (el) el.classList.remove("hidden"); },
            /** @param {HTMLElement|null} el @param {boolean} force */
            toggle: (el, force) => { if (el) el.classList.toggle("hidden", !force); },
            /** @param {HTMLElement|null} el @param {string} text */
            text: (el, text) => { if (el) el.textContent = text; },
            /** @param {HTMLElement|null} el @param {string} html */
            html: (el, html) => { if (el) el.innerHTML = html; }
        };
        const DEFAULT_VIRTUAL_ROW_HEIGHT = 228;

        /** @type {string} */
        const ALL_FILTER = "All";

        /** @type {string} */
        const DEFAULT_ICON = "map-pin";

        /** @type {Object.<string, string>} */
        const CATEGORY_ICONS = {
            admission_cell: "clipboard-list",
            gate: "door-open",
            building: "building-2",
            department: "graduation-cap",
            hostel: "home",
            parking: "car",
            food_court: "utensils",
            canteen: "utensils",
            stationery: "pencil",
            sports: "dumbbell",
            landmark: "map-pin"
        };

        /** @type {{institution:string, version:string, total_locations:number}} */
        let datasetMeta = { institution: "Sandip University", version: "", total_locations: 0 };

        /** @type {Array<Object>} */
        let allLocations = [];

        /** @type {Array<string>} */
        let searchIndex = [];

        /** @type {Array<string>} */
        let categories = [ALL_FILTER];

        /** @type {Array<number>} */
        let filteredIndexes = [];

        /** @type {string} */
        let currentFilter = ALL_FILTER;

        /** @type {string} */
        let currentQuery = "";

        /** @type {string} */
        let currentLang = "en";

        /** @type {HTMLElement | null} */
        let lastFocusedElement = null;

        /** @type {HTMLElement | null} */
        let deferredInstallPrompt = null;

        /** @type {number | null} */
        let toastTimeoutId = null;

        /** @type {number | null} */
        let offlineHideTimeoutId = null;

        /** @type {number | null} */
        let virtualRenderFrameId = null;

        /** @type {number} */
        let firstLaunchPending = false;

        /**
         * @type {{
         *   start:number, end:number, total:number,
         *   estimatedRowHeight:number,
         *   rowHeights:Array<number|null>,
         *   lastMeasuredCols:number|null,
         *   lastSignature:string
         * }}
         *
         * rowHeights holds the *real measured* height of each row once it has been
         * rendered at least once. estimatedRowHeight is a rolling average of all
         * measured rows, used only as a best guess for rows that haven't been
         * rendered yet. This replaces the old "lock one average forever" approach,
         * which drifted badly on lists with variable-height cards and caused
         * scrolling to snap toward the end of the list.
         */
        const virtualState = {
            start: 0,
            end: 0,
            total: 0,
            estimatedRowHeight: DEFAULT_VIRTUAL_ROW_HEIGHT,
            rowHeights: [],
            lastMeasuredCols: null,
            lastSignature: ""
        };

        /** @type {ResizeObserver | null} */
        let headerResizeObserver = null;

        // ---------- i18n module ----------

        /**
         * Translation dictionary for all supported UI strings.
         * Pure data only, no DOM access.
         */
        const TRANSLATIONS = {
            en: {
                appTitle: "SANDIP UNIVERSITY",
                appSubtitle: "CAMPUS NAVIGATION",
                searchPlaceholder: "Search building, department, hostel...",
                filterAll: "All",
                filterLabel: "Filters",
                categoryLabels: {
                    admission_cell: "Admission Cell",
                    gate: "Gate",
                    building: "Building",
                    department: "Department",
                    hostel: "Hostel",
                    parking: "Parking",
                    food_court: "Food Court",
                    canteen: "Canteen",
                    stationery: "Stationery",
                    sports: "Sports",
                    landmark: "Landmark",
                    sections: "Sections",
                    uncategorized: "Uncategorized"
                },
                viewDetails: "View Details",
                navigate: "Navigate",
                navigateToLocation: "Navigate to Location",
                copyLink: "Copy Link",
                linkCopied: "Link copied!",
                copyFailed: "Couldn't copy link",
                copyUnsupported: "Copy not supported",
                locationNotAvailable: "Location not available",
                coordinatesNotAvailable: "Coordinates not available",
                noDescription: "No description available.",
                noKeywords: "No keywords available",
                noAliases: "No aliases available",
                noCourses: "No courses listed",
                fieldParent: "Parent",
                fieldParentTopLevel: "None (Top Level)",
                fieldDescription: "Description",
                fieldKeywords: "Keywords",
                fieldAliases: "Aliases",
                fieldSchool: "School",
                fieldParentBuilding: "Parent Building",
                fieldCoursesOffered: "Courses Offered",
                fieldCoordinates: "Coordinates",
                notSpecified: "Not specified",
                unnamedLocation: "Unnamed Location",
                emptyStateText: "No matching locations found",
                offlineBannerText: "You're offline - showing saved data",
                installBannerTitle: "Save to Mobile Screen (Works Offline)",
                installBannerSubtitle: "Add to your home screen for quick, offline access.",
                installBannerBtn: "Add to Screen",
                iosInstallTipTitle: "Save to Mobile Screen (Works Offline)",
                iosInstallTipSubtitle: 'Tap the Share icon, then "Add to Home Screen".',
                langPickerTitle: "Choose your language",
                langPickerSubtitle: "भाषा चुनें · भाषा निवडा",
                langPickerNote: "You can change language anytime from the globe icon.",
                closeDetails: "Close details",
                recentSearchesLabel: "Recent searches",
                clearRecent: "Clear recent",
                share: "Share",
                shareFallbackCopied: "Link copied - Web Share not supported on this browser",
                swipeNavigateHint: "Swipe left for quick Navigate",
                aboutRowLabel: "About",
                aboutRowSubtitle: "Dataset metadata and local-only usage stats",
                aboutPanelTitle: "Dataset details",
                institutionLabel: "Institution",
                versionLabel: "Version",
                totalLocationsLabel: "Total locations",
                localAnalyticsLabel: "Local-only analytics",
                localAnalyticsNote: "Counts are stored only in this browser's localStorage. Nothing is transmitted anywhere.",
                mostViewedLabel: "Most viewed",
                topSearchesLabel: "Top searches",
                usageEmpty: "No local usage yet.",
                dataLoadErrorTitle: "Unable to load campus data",
                dataLoadErrorText: "The app could not load either the online dataset or the embedded fallback.",
                retry: "Retry",
                openDatasetDetails: "Open dataset details",
                closeDatasetDetails: "Close dataset details"
                ,
                resetData: "Reset app data",
                resetDataConfirm: "Reset app data? This will clear saved preferences and local statistics.",
                resetDataDone: "App data cleared",
                privacyNote: "Privacy: location, searches and view counts stay only on this device.",
                onboardingTitle: "Welcome to CampusCompass!",
                onboardingSubtitle: "Your Easy Campus Guide",
                howToUseTitle: "How to Use the App:",
                step1Title: "Search or Browse Venues",
                step1Desc: "Type any room, lab, office name, or tap a category icon (like Washrooms or Canteen) to filter lists instantly.",
                step2Title: "Get Direct Route Directions",
                step2Desc: "Tap the red <strong>\"Show Route on Google Maps\"</strong> button on any card to navigate directly to that spot.",
                step3Title: "Works Offline Automatically",
                step3Desc: "This campus directory is stored on your device. You can look up locations even when you have poor network coverage.",
                faqSectionTitle: "Frequently Asked Questions (FAQs):",
                faq1Q: "Does it work without internet?",
                faq1A: "Yes! The search and directory details are fully offline. Active internet is only needed when checking live routes on external Google Maps.",
                faq2Q: "How do I search for washrooms/canteens?",
                faq2A: "Simply scroll down to the bottom categories panel and tap the icon matching what you need. Or type words like \"washroom\" in the search box.",
                faq3Q: "How do I add this app to my phone screen?",
                faq3A: "Tap the \"Add to Screen\" button that pops up at the bottom of the screen. On iPhone, tap the \"Share\" icon in Safari, scroll down and tap \"Add to Home Screen\".",
                onboardingStartBtn: "Let's Explore the Campus! 🚀",
                closeOnboarding: "Close user guide"
            },
            hi: {
                appTitle: "संदीप विश्वविद्यालय",
                appSubtitle: "कैंपस नेविगेशन",
                searchPlaceholder: "भवन, विभाग, छात्रावास खोजें...",
                filterAll: "सभी",
                filterLabel: "फ़िल्टर",
                categoryLabels: {
                    admission_cell: "प्रवेश प्रकोष्ठ",
                    gate: "प्रवेश द्वार",
                    building: "भवन",
                    department: "विभाग",
                    hostel: "छात्रावास",
                    parking: "पार्किंग",
                    food_court: "फूड कोर्ट",
                    canteen: "कैंटीन",
                    stationery: "स्टेशनरी",
                    sports: "खेल",
                    landmark: "स्थल चिह्न",
                    sections: "अनुभाग",
                    uncategorized: "अवर्गीकृत"
                },
                viewDetails: "विवरण देखें",
                navigate: "दिशा-निर्देश",
                navigateToLocation: "स्थान तक नेविगेट करें",
                copyLink: "लिंक कॉपी करें",
                linkCopied: "लिंक कॉपी हो गया!",
                copyFailed: "लिंक कॉपी नहीं हो सका",
                copyUnsupported: "कॉपी समर्थित नहीं है",
                locationNotAvailable: "स्थान उपलब्ध नहीं है",
                coordinatesNotAvailable: "निर्देशांक उपलब्ध नहीं",
                noDescription: "कोई विवरण उपलब्ध नहीं है।",
                noKeywords: "कोई कीवर्ड उपलब्ध नहीं",
                noAliases: "कोई उपनाम उपलब्ध नहीं",
                noCourses: "कोई पाठ्यक्रम सूचीबद्ध नहीं",
                fieldParent: "मूल",
                fieldParentTopLevel: "कोई नहीं (शीर्ष स्तर)",
                fieldDescription: "विवरण",
                fieldKeywords: "कीवर्ड",
                fieldAliases: "उपनाम",
                fieldSchool: "स्कूल",
                fieldParentBuilding: "मूल भवन",
                fieldCoursesOffered: "प्रस्तावित पाठ्यक्रम",
                fieldCoordinates: "निर्देशांक",
                notSpecified: "निर्दिष्ट नहीं",
                unnamedLocation: "अज्ञात स्थान",
                emptyStateText: "कोई मिलान स्थान नहीं मिला",
                offlineBannerText: "आप ऑफ़लाइन हैं - सहेजा गया डेटा दिखाया जा रहा है",
                installBannerTitle: "मोबाइल स्क्रीन पर सहेजें (ऑफ़लाइन कार्य करता है)",
                installBannerSubtitle: "त्वरित, ऑफ़लाइन एक्सेस के लिए होम स्क्रीन पर जोड़ें।",
                installBannerBtn: "स्क्रीन पर जोड़ें",
                iosInstallTipTitle: "मोबाइल स्क्रीन पर सहेजें (ऑफ़लाइन कार्य करता है)",
                iosInstallTipSubtitle: 'शेयर आइकन टैप करें, फिर "होम स्क्रीन पर जोड़ें" चुनें।',
                langPickerTitle: "अपनी भाषा चुनें",
                langPickerSubtitle: "Choose your language · भाषा निवडा",
                langPickerNote: "आप ग्लोब आइकन से कभी भी भाषा बदल सकते हैं।",
                closeDetails: "विवरण बंद करें",
                recentSearchesLabel: "हाल की खोजें",
                clearRecent: "हाल की साफ़ करें",
                share: "साझा करें",
                shareFallbackCopied: "लिंक कॉपी हो गया - इस ब्राउज़र पर Web Share समर्थित नहीं है",
                swipeNavigateHint: "त्वरित नेविगेट के लिए बाईं ओर स्वाइप करें",
                aboutRowLabel: "परिचय",
                aboutRowSubtitle: "डेटासेट मेटाडेटा और केवल स्थानीय उपयोग आंकड़े",
                aboutPanelTitle: "डेटासेट विवरण",
                institutionLabel: "संस्था",
                versionLabel: "संस्करण",
                totalLocationsLabel: "कुल स्थान",
                localAnalyticsLabel: "केवल स्थानीय आंकड़े",
                localAnalyticsNote: "गिनती केवल इस ब्राउज़र के localStorage में रहती है। कुछ भी बाहर नहीं भेजा जाता।",
                mostViewedLabel: "सबसे अधिक देखे गए",
                topSearchesLabel: "शीर्ष खोजें",
                usageEmpty: "अभी कोई स्थानीय उपयोग नहीं है।",
                dataLoadErrorTitle: "कैंपस डेटा लोड नहीं हो सका",
                dataLoadErrorText: "ऐप ऑनलाइन डेटासेट या एम्बेडेड फॉलबैक, दोनों में से कोई भी लोड नहीं कर सका।",
                retry: "पुनः प्रयास",
                openDatasetDetails: "डेटासेट विवरण खोलें",
                closeDatasetDetails: "डेटासेट विवरण बंद करें"
                ,
                resetData: "ऐप डेटा रीसेट करें",
                resetDataConfirm: "ऐप डेटा रीसेट करें? इससे सहेजी गई प्राथमिकताएँ और स्थानीय आँकड़े हट जाएंगे।",
                resetDataDone: "ऐप डेटा साफ़ किया गया",
                privacyNote: "गोपनीयता: स्थान, खोजें और दृश्य गिनती केवल इस डिवाइस पर रहती हैं।",
                onboardingTitle: "कैंपसकंपास में आपका स्वागत है!",
                onboardingSubtitle: "आपका आसान कैंपस गाइड",
                howToUseTitle: "ऐप का उपयोग कैसे करें:",
                step1Title: "स्थान खोजें या ब्राउज़ करें",
                step1Desc: "किसी भी कमरे, लैब, कार्यालय का नाम टाइप करें, या सूचियों को तुरंत फ़िल्टर करने के लिए श्रेणी आइकन (जैसे शौचालय या कैंटीन) पर टैप करें।",
                step2Title: "सीधा मार्ग निर्देश प्राप्त करें",
                step2Desc: "उस स्थान पर सीधे नेविगेट करने के लिए किसी भी कार्ड पर लाल <strong>\"गूगल मैप्स पर मार्ग दिखाएं\"</strong> बटन पर टैप करें।",
                step3Title: "ऑफ़लाइन स्वचालित रूप से कार्य करता है",
                step3Desc: "यह परिसर निर्देशिका आपके डिवाइस पर सहेजी गई है। खराब नेटवर्क कवरेज होने पर भी आप स्थानों को देख सकते हैं।",
                faqSectionTitle: "अक्सर पूछे जाने वाले प्रश्न (FAQs):",
                faq1Q: "क्या यह बिना इंटरनेट के काम करता है?",
                faq1A: "हाँ! खोज और निर्देशिका विवरण पूरी तरह से ऑफ़लाइन हैं। लाइव रूट देखने के लिए केवल बाहरी गूगल मैप्स का उपयोग करते समय सक्रिय इंटरनेट की आवश्यकता होती है।",
                faq2Q: "मैं शौचालय/कैंटीन कैसे खोजूं?",
                faq2A: "बस नीचे दिए गए श्रेणी पैनल पर स्क्रॉल करें और अपनी आवश्यकता से मेल खाने वाले आइकन पर टैप करें। या खोज बॉक्स में \"शौचालय\" जैसे शब्द टाइप करें।",
                faq3Q: "मैं इस ऐप को अपने फोन स्क्रीन पर कैसे जोड़ूं?",
                faq3A: "नेविगेट कर स्क्रीन के नीचे दिखाई देने वाले \"स्क्रीन पर जोड़ें\" बटन पर टैप करें। आईफोन पर, सफारी में \"शेयर\" आइकन पर टैप करें, नीचे स्क्रॉल करें और \"होम स्क्रीन पर जोड़ें\" पर टैप करें।",
                onboardingStartBtn: "आइए कैंपस का चक्कर लगाएं! 🚀",
                closeOnboarding: "मार्गदर्शিকা बंद करें"
            },
            mr: {
                appTitle: "संदीप विद्यापीठ",
                appSubtitle: "कॅम्पस नेव्हिगेशन",
                searchPlaceholder: "इमारत, विभाग, वसतिगृह शोधा...",
                filterAll: "सर्व",
                filterLabel: "फिल्टर",
                categoryLabels: {
                    admission_cell: "प्रवेश कक्ष",
                    gate: "प्रवेशद्वार",
                    building: "इमारत",
                    department: "विभाग",
                    hostel: "वसतिगृह",
                    parking: "पार्किंग",
                    food_court: "फूड कोर्ट",
                    canteen: "कॅन्टीन",
                    stationery: "स्टेशनरी",
                    sports: "क्रीडा",
                    landmark: "खूणस्थान",
                    sections: "विभाग",
                    uncategorized: "अवर्गीकृत"
                },
                viewDetails: "तपशील पहा",
                navigate: "मार्गदर्शन",
                navigateToLocation: "स्थानाकडे मार्गदर्शन करा",
                copyLink: "लिंक कॉपी करा",
                linkCopied: "लिंक कॉपी झाली!",
                copyFailed: "लिंक कॉपी करता आली नाही",
                copyUnsupported: "कॉपी समर्थित नाही",
                locationNotAvailable: "स्थान उपलब्ध नाही",
                coordinatesNotAvailable: "निर्देशांक उपलब्ध नाहीत",
                noDescription: "कोणतेही वर्णन उपलब्ध नाही.",
                noKeywords: "कोणतेही कीवर्ड उपलब्ध नाहीत",
                noAliases: "कोणतीही उपनावे उपलब्ध नाहीत",
                noCourses: "कोणतेही अभ्यासक्रम सूचीबद्ध नाहीत",
                fieldParent: "मूळ",
                fieldParentTopLevel: "काहीही नाही (सर्वोच्च स्तर)",
                fieldDescription: "वर्णन",
                fieldKeywords: "कीवर्ड",
                fieldAliases: "उपनावे",
                fieldSchool: "स्कूल",
                fieldParentBuilding: "मूळ इमारत",
                fieldCoursesOffered: "दिले जाणारे अभ्यासक्रम",
                fieldCoordinates: "निर्देशांक",
                notSpecified: "नमूद केलेले नाही",
                unnamedLocation: "अनामित स्थान",
                emptyStateText: "जुळणारी स्थाने आढळली नाहीत",
                offlineBannerText: "तुम्ही ऑफलाइन आहात - जतन केलेला डेटा दाखवत आहे",
                installBannerTitle: "मोबाईल स्क्रीनवर जतन करा (ऑफलाईन काम करते)",
                installBannerSubtitle: "जलद, ऑफलाइन प्रवेशासाठी होम स्क्रीनवर जोडा.",
                installBannerBtn: "स्क्रीनवर जोडा",
                iosInstallTipTitle: "मोबाईल स्क्रीनवर जतन करा (ऑफलाईन काम करते)",
                iosInstallTipSubtitle: 'शेअर आयकॉनवर टॅप करा, नंतर "होम स्क्रीनवर जोडा" निवडा।',
                langPickerTitle: "तुमची भाषा निवडा",
                langPickerSubtitle: "Choose your language · भाषा चुनें",
                langPickerNote: "तुम्ही ग्लोब आयकॉनवरून कधीही भाषा बदलू शकता।",
                closeDetails: "तपशील बंद करा",
                recentSearchesLabel: "अलीकडील शोध",
                clearRecent: "अलीकडील साफ करा",
                share: "शेअर",
                shareFallbackCopied: "लिंक कॉपी झाली - या ब्राउझरवर Web Share समर्थित नाही",
                swipeNavigateHint: "जलद नेव्हिगेटसाठी डावीकडे स्वाइप करा",
                aboutRowLabel: "माहिती",
                aboutRowSubtitle: "डेटासेट मेटाडेटा आणि फक्त स्थानिक वापर आकडे",
                aboutPanelTitle: "डेटासेट तपशील",
                institutionLabel: "संस्था",
                versionLabel: "आवृत्ती",
                totalLocationsLabel: "एकूण स्थाने",
                localAnalyticsLabel: "फक्त स्थानिक आकडे",
                localAnalyticsNote: "मोजणी फक्त या ब्राउझरच्या localStorage मध्ये राहते. काहीही बाहेर पाठवले जात नाही.",
                mostViewedLabel: "सर्वाधिक पाहिलेले",
                topSearchesLabel: "शीर्ष शोध",
                usageEmpty: "अजून कोणताही स्थानिक वापर नाही.",
                dataLoadErrorTitle: "कॅम्पस डेटा लोड होऊ शकला नाही",
                dataLoadErrorText: "अॅप ऑनलाइन डेटासेट किंवा एम्बेडेड फॉलबॅक, दोन्हींपैकी काहीही लोड करू शकले नाही.",
                retry: "पुन्हा प्रयत्न करा",
                openDatasetDetails: "डेटासेट तपशील उघडा",
                closeDatasetDetails: "डेटासेट तपशील बंद करा"
                ,
                resetData: "अॅप डेटा रीसेट करा",
                resetDataConfirm: "अॅप डेटा रीसेट करायचा? यामुळे साठवलेल्या प्राधान्ये आणि स्थानिक आकडे हटतील.",
                resetDataDone: "अॅप डेटा साफ केले",
                privacyNote: "गोपनीयता: स्थान, शोध आणि दृश्यमान मोजमाप फक्त या उपकरणावर राहतात.",
                onboardingTitle: "कॅम्पसकंपासमध्ये आपले स्वागत आहे!",
                onboardingSubtitle: "तुमचा सोपा कॅम्पस मार्गदर्शक",
                howToUseTitle: "अॅप कसे वापरावे:",
                step1Title: "स्थान शोधा किंवा ब्राउझ करा",
                step1Desc: "कोणत्याही खोलीचे, लॅबचे, कार्यालयाचे नाव टाईप करा किंवा यादी त्वरित फिल्टर करण्यासाठी श्रेणी आयकॉनवर (जसे की शौचालय किंवा कॅन्टीन) टॅप करा.",
                step2Title: "थेट मार्ग दिशा मिळवा",
                step2Desc: "त्या जागेवर थेट नेव्हिगेट करण्यासाठी कोणत्याही कार्डवरील लाल <strong>\"Google नकाशे वर मार्ग दाखवा\"</strong> बटणावर टॅप करा.",
                step3Title: "ऑफलाईन स्वयंचलितपणे काम करते",
                step3Desc: "ही कॅम्पस निर्देशिका तुमच्या डिव्हाइसवर साठवली आहे. खराब नेटवर्क कव्हरेज असतानाही तुम्ही स्थाने शोधू शकता.",
                faqSectionTitle: "वारंवार विचारले जाणारे प्रश्न (FAQs):",
                faq1Q: "हे इंटरनेटशिवाय काम करते का?",
                faq1A: "होय! शोध आणि निर्देशिका तपशील पूर्णपणे ऑफलाइन आहेत. केवळ बाह्य Google नकाशे वर थेट मार्ग तपासताना सक्रिय इंटरनेट आवश्यक आहे.",
                faq2Q: "मी शौचालय/कॅन्टीन कसे शोधू?",
                faq2A: "फक्त खाली दिलेल्या श्रेणी पॅनेलवर स्क्रॉल करा आणि तुम्हाला हव्या असलेल्या आयकॉनवर टॅप करा. किंवा शोध बॉक्समध्ये \"शौचालय\" सारखे शब्द टाईप करा.",
                faq3Q: "मी हे अॅप माझ्या फोन स्क्रीनवर कसे जोडू?",
                faq3A: "स्क्रीनच्या तळाशी पॉप अप होणाऱ्या \"स्क्रीनवर जोडा\" बटणावर टॅप करा. आयफोनवर, सफारी मधील \"शेअर\" आयकॉनवर टॅप करा, खाली स्क्रॉल करा आणि \"होम स्क्रीनवर जोडा\" टॅप करा.",
                onboardingStartBtn: "चला कॅम्पस फिरूया! 🚀",
                closeOnboarding: "मार्गदर्शक बंद करा"
            },
            mai: {
                appTitle: "संदीप विश्वविद्यालय",
                appSubtitle: "परिसर नेविगेशन",
                searchPlaceholder: "भवन, विभाग, छात्रावास खोजू...",
                filterAll: "सब",
                filterLabel: "फ़िल्टर",
                categoryLabels: {
                    admission_cell: "प्रवेश कक्ष",
                    gate: "गेट",
                    building: "भवन",
                    department: "विभाग",
                    hostel: "छात्रावास",
                    parking: "पार्किंग",
                    food_court: "फूड कोर्ट",
                    canteen: "कैंटीन",
                    stationery: "स्टेशनरी",
                    sports: "खेल",
                    landmark: "सीमाचिह्न",
                    sections: "खंड",
                    uncategorized: "अवर्गीकृत"
                },
                viewDetails: "विवरण देखू",
                navigate: "नेविगेट करू",
                navigateToLocation: "स्थान पर नेविगेट करू",
                copyLink: "लिंक कॉपी करू",
                linkCopied: "लिंक कॉपी भेल!",
                copyFailed: "लिंक कॉपी नहि भ सकल",
                copyUnsupported: "कॉपी समर्थित नहि अछि",
                locationNotAvailable: "स्थान उपलब्ध नहि अछि",
                coordinatesNotAvailable: "कोऑर्डिनेट उपलब्ध नहि अछि",
                noDescription: "कोनो विवरण उपलब्ध नहि अछि।",
                noKeywords: "कोनो कीवर्ड उपलब्ध नहि अछि",
                noAliases: "कोनो उपनाम उपलब्ध नहि अछि",
                noCourses: "कोनो पाठ्यक्रम सूचीबद्ध नहि अछि",
                fieldParent: "मूल",
                fieldParentTopLevel: "किछु नहि (शीर्ष स्तर)",
                fieldDescription: "विवरण",
                fieldKeywords: "कीवर्ड",
                fieldAliases: "उपनाम",
                fieldSchool: "स्कूल",
                fieldParentBuilding: "मूल भवन",
                fieldCoordinates: "कोऑर्डिनेट",
                fieldCategory: "श्रेणी",
                fieldCourses: "पाठ्यक्रम",
                emptyStateText: "कोनो मेल खायत स्थान नहि भेटल",
                offlineBannerText: "अहाँ ऑफलाइन छी — सहेजल गेल डेटा देखा रहल अछि",
                installBannerTitle: "कैंपसकंपास इंस्टॉल करू",
                installBannerSubtitle: "त्वरित, ऑफलाइन पहुंच लेल अपन होम स्क्रीन मे जोड़ू।",
                installBannerBtn: "इंस्टॉल करू",
                iosInstallTipTitle: "ई ऐप इंस्टॉल करू",
                iosInstallTipSubtitle: 'शेयर आइकन पर टैप करू, फेर "होम स्क्रीन मे जोड़ू" पर टैप करू।',
                langPickerTitle: "अपन भाषा चुनू",
                langPickerSubtitle: "अपन भाषा चुनू",
                langPickerNote: "अहाँ ग्लोब आइकन सँ कोनो भी समय भाषा बदलि सकैत छी।",
                closeDetails: "विवरण बंद करू",
                recentSearchesLabel: "हालक खोज",
                clearRecent: "हालक साफ करू",
                share: "साझा करू",
                shareFallbackCopied: "लिंक कॉपी भेल - एहि ब्राउज़र पर वेब शेयर समर्थित नहि अछि",
                swipeNavigateHint: "त्वरित नेविगेट लेल बामा दिस स्वाइप करू",
                aboutRowLabel: "परिचय",
                aboutRowSubtitle: "डेटासेट मेटाडेटा आ केवल स्थानीय उपयोगक आंकड़े",
                aboutPanelTitle: "डेटासेट विवरण",
                institutionLabel: "संस्था",
                versionLabel: "संस्करण",
                totalLocationsLabel: "कुल स्थान",
                localAnalyticsLabel: "केवल स्थानीय आंकड़े",
                localAnalyticsNote: "गिनती केवल एहि ब्राउज़र क localStorage मे रहैत अछि। कतहु किछु नहि भेजल जाइत अछि।",
                mostViewedLabel: "सबसँ बेसी देखल गेल",
                topSearchesLabel: "शीर्ष खोज",
                usageEmpty: "अखन कोनो स्थानीय उपयोग नहि अछि।",
                dataLoadErrorTitle: "कैंपस डेटा लोड नहि भ सकल",
                dataLoadErrorText: "ऐप ऑनलाइन डेटासेट आ एम्बेडेड फॉलबैक, दुनू लोड करय मे विफल रहल।",
                retry: "पुनः प्रयास करू",
                openDatasetDetails: "डेटासेट विवरण खोलू",
                closeDatasetDetails: "डेटासेट विवरण बंद करू",
                resetData: "ऐप डेटा रीसेट करू",
                resetDataConfirm: "ऐप डेटा रीसेट करू? अहि सँ सहेजल गेल पसंद आ स्थानीय आंकड़े साफ़ भ जायत।",
                resetDataDone: "ऐप डेटा साफ भेल",
                privacyNote: "गोपनीयता: स्थान, खोज आ दृश्य गणना केवल एहि डिवाइस पर रहैत अछि।",
                onboardingTitle: "कैंपसकंपास में अपन स्वागत अछि!",
                onboardingSubtitle: "अपन सुलभ कैंपस गाइड",
                howToUseTitle: "ऐप क उपयोग कोना करी:",
                step1Title: "स्थान खोजू या ब्राउज़ करू",
                step1Desc: "कोनो कोठरी, लैब, कार्यालयक नाम टाइप करू, या सूची के तुरंत फ़िल्टर करबाक लेल श्रेणी आइकन (जेना शौचालय या कैंटीन) पर टैप करू।",
                step2Title: "सीधा रास्ताक निर्देश पाबू",
                step2Desc: "ओहि स्थान पर सोझे जेबाक लेल कोनो कार्ड पर लाल <strong>\"गूगल मैप्स पर रास्ता देखाउ\"</strong> बटन पर टैप करू।",
                step3Title: "ऑफ़लाइन स्वचालित रूप सं काज करैत अछि",
                step3Desc: "ई परिसर निर्देशिका अपन डिवाइस पर सहेजल गेल अछि। खराब नेटवर्क रहला पर सेहो अहाँ स्थान सभ देख सकैत छी।",
                faqSectionTitle: "अक्सर पुछल जाए वाला प्रश्न (FAQs):",
                faq1Q: "की ई बिना इंटरनेट के काज करैत अछि?",
                faq1A: "हाँ! खोज आ निर्देशिका विवरण पूर्ण रूप सं ऑफ़लाइन अछि। लाइव रूट देखबाक लेल केवल बाहरी गूगल मैप्सक उपयोग करबाक समय इंटरनेटक आवश्यकता होइत अछि।",
                faq2Q: "हम शौचालय/कैंटीन कोना खोजी?",
                faq2A: "बस नीचां देल गेल श्रेणी पैनल पर स्क्रॉल करू आ अपन आवश्यकताक आइकन पर टैप करू। या खोज बॉक्स में \"शौचालय\" जेहन शब्द टाइप करू।",
                faq3Q: "हम एहि ऐप के अपन phone screen पर कोना जोड़ी?",
                faq3A: "स्क्रीन के नीचां देखाबय वाला \"स्क्रीन पर जोड़ू\" बटन पर टैप करू। आईफोन पर, सफारी में \"शेयर\" आइकन पर टैप करू, नीचां स्क्रॉल करू आ \"होम स्क्रीन पर जोड़ू\" पर टैप करू।",
                onboardingStartBtn: "आउ कैंपसक चक्कर लगाई! 🚀",
                closeOnboarding: "मार्गदर्शिका बंद करू"
            },
            te: {
                appTitle: "సందీప్ యూనివర్సిటీ",
                appSubtitle: "క్యాంపస్ నావిగేషన్",
                searchPlaceholder: "భవనం, విభాగం, హాస్టల్ కోసం వెతకండి...",
                filterAll: "అన్నీ",
                filterLabel: "ఫిల్టర్లు",
                categoryLabels: {
                    admission_cell: "అడ్మిషన్ సెల్",
                    gate: "గేట్",
                    building: "భవనం",
                    department: "విభాగం",
                    hostel: "హాస్టల్",
                    parking: "పార్కింగ్",
                    food_court: "ఫుడ్ కోర్ట్",
                    canteen: "క్యాంటీన్",
                    stationery: "స్టేషనరీ",
                    sports: "క్రీడలు",
                    landmark: "ల్యాండ్‌మార్క్",
                    sections: "సెక్షన్లు",
                    uncategorized: "వర్గీకరించబడనివి"
                },
                viewDetails: "వివరాలు చూడండి",
                navigate: "నావిగేట్ చేయండి",
                navigateToLocation: "ప్రదేశానికి నావిగేట్ చేయండి",
                copyLink: "లింక్‌ని కాపీ చేయండి",
                linkCopied: "లింక్ కాపీ చేయబడింది!",
                copyFailed: "లింక్‌ని కాపీ చేయడం సాధ్యపడలేదు",
                copyUnsupported: "కాపీకి మద్దతు లేదు",
                locationNotAvailable: "ప్రదేశం అందుబాటులో లేదు",
                coordinatesNotAvailable: "కోఆర్డినేట్‌లు అందుబాటులో లేవు",
                noDescription: "వివరణ అందుబాటులో లేదు.",
                noKeywords: "కీవర్డ్‌లు అందుబాటులో లేవు",
                noAliases: "మారుపేర్లు అందుబాటులో లేవు",
                noCourses: "కోర్సులు ఏవీ జాబితా చేయబడలేదు",
                fieldParent: "మూలం",
                fieldParentTopLevel: "ఏదీ లేదు (అత్యున్నత స్థాయి)",
                fieldDescription: "వివరణ",
                fieldKeywords: "కీవర్డ్‌లు",
                fieldAliases: "మారుపేర్లు",
                fieldSchool: "పాఠశాల",
                fieldParentBuilding: "ప్రధాన భవనం",
                fieldCoordinates: "కోఆర్డినేట్‌లు",
                fieldCategory: "వర్గం",
                fieldCourses: "కోర్సులు",
                emptyStateText: "సరిపోలే ప్రదేశాలు ఏవీ కనుగొనబడలేదు",
                offlineBannerText: "మీరు ఆఫ్‌లైన్‌లో ఉన్నారు — సేవ్ చేసిన డేటా చూపబడుతోంది",
                installBannerTitle: "క్యాంపస్‌కంపాస్‌ని ఇన్‌స్టాల్ చేయండి",
                installBannerSubtitle: "వేగవంతమైన, ఆఫ్‌లైన్ యాక్సెస్ కోసం మీ హోమ్ స్క్రీన్‌కు జోడించండి.",
                installBannerBtn: "ఇన్‌స్టాల్ చేయండి",
                iosInstallTipTitle: "ఈ యాప్‌ని ఇన్‌స్టాల్ చేయండి",
                iosInstallTipSubtitle: 'షేర్ చిహ్నాన్ని నొక్కి, ఆపై "హోమ్ స్క్రీన్‌కు జోడించు" నొక్కండి.',
                langPickerTitle: "మీ భాషను ఎంచుకోండి",
                langPickerSubtitle: "మీ భాషను ఎంచుకోండి",
                langPickerNote: "గ్లోబ్ చిహ్నం నుండి మీరు దీన్ని ఎప్పుడైనా మార్చవచ్చు.",
                closeDetails: "వివరాలను మూసివేయండి",
                recentSearchesLabel: "ఇటీవలి శోధనలు",
                clearRecent: "ఇటీవలివి క్లియర్ చేయండి",
                share: "షేర్ చేయండి",
                shareFallbackCopied: "లింక్ కాపీ చేయబడింది - ఈ బ్రౌజర్‌లో వెబ్ షేర్‌కు మద్దతు లేదు",
                swipeNavigateHint: "త్వరిత నావిగేషన్ కోసం ఎడమవైపుకు స్వైప్ చేయండి",
                aboutRowLabel: "గురించి",
                aboutRowSubtitle: "డేటాసెట్ మెటాడేటా మరియు స్థానిక వినియోగ గణాంకాలు మాత్రమే",
                aboutPanelTitle: "డేటాసెట్ వివరాలు",
                institutionLabel: "సంస్థ",
                versionLabel: "వెర్షన్",
                totalLocationsLabel: "మొత్తం ప్రదేశాలు",
                localAnalyticsLabel: "స్థానిక విశ్లేషణలు మాత్రమే",
                localAnalyticsNote: "గణాంకాలు ఈ బ్రౌజర్ localStorageలో మాత్రమే నిల్వ చేయబడతాయి. మరెక్కడికీ పంపబడవు.",
                mostViewedLabel: "ఎక్కువగా చూసినవి",
                topSearchesLabel: "అగ్ర శోధనలు",
                usageEmpty: "ఇంకా స్థానిక వినియోగం లేదు.",
                dataLoadErrorTitle: "క్యాంపస్ డేటాను లోడ్ చేయడం సాధ్యపడలేదు",
                dataLoadErrorText: "ఆన్‌లైన్ డేటాసెట్ మరియు పొందుపరిచిన ఫాల్‌బ్యాక్ రెండింటినీ యాప్ లోడ్ చేయలేకపోయింది.",
                retry: "మళ్లీ ప్రయత్నించండి",
                openDatasetDetails: "డేటాసెట్ వివరాలను తెరవండి",
                closeDatasetDetails: "డేటాసెట్ వివరాలను మూసివేయండి",
                resetData: "యాప్ డేటాను రీసెట్ చేయండి",
                resetDataConfirm: "యాప్ డేటాను రీసెట్ చేయాలా? ఇది సేవ్ చేసిన ప్రాధాన్యతలు మరియు స్థానిక గణాంకాలను క్లియర్ చేస్తుంది.",
                resetDataDone: "యాప్ డేటా క్లియర్ చేయబడింది",
                privacyNote: "గోప్యత: స్థానాలు, శోధనలు మరియు వీక్షణల గణనలు ఈ పరికరంలో మాత్రమే ఉంటాయి.",
                onboardingTitle: "క్యాంపస్‌కంపాస్‌కు స్వాగతం!",
                onboardingSubtitle: "మీ సులభమైన క్యాంపస్ గైడ్",
                howToUseTitle: "యాప్‌ను ఎలా ఉపయోగించాలి:",
                step1Title: "స్థానాలను వెతకండి లేదా బ్రౌజ్ చేయండి",
                step1Desc: "ఏదైనా గది, ల్యాబ్ లేదా కార్యాలయం పేరు టైప్ చేయండి, లేదా కేటగిరీ ఐకాన్ (టాయిలెట్లు లేదా క్యాంటీన్ వంటివి) పై నొక్కి జాబితాను ఫిల్టర్ చేయండి.",
                step2Title: "నేరుగా రూట్ దిశలను పొందండి",
                step2Desc: "ఆ స్థానానికి నేరుగా వెళ్లడానికి ఏదైనా కార్డ్‌పై ఉన్న ఎర్రటి <strong>\"Google మ్యాప్స్‌లో రూట్ చూపించు\"</strong> బటన్ పై నొక్కండి.",
                step3Title: "ఆఫ్‌లైన్‌లో స్వయంచాలకంగా పనిచేస్తుంది",
                step3Desc: "ఈ క్యాంపస్ డైరెక్టరీ మీ పరికరంలోనే సేవ్ చేయబడుతుంది. మొబైల్ నెట్‌వర్క్ సరిగ్గా లేకపోయినా మీరు స్థానాలను వెతకవచ్చు.",
                faqSectionTitle: "తరచుగా అడిగే ప్రశ్నలు (FAQs):",
                faq1Q: "ఇది ఇంటర్నెట్ లేకుండా పనిచేస్తుందా?",
                faq1A: "అవును! శోధన మరియు డైరెక్టరీ వివరాలు పూర్తిగా ఆఫ్‌లైన్‌లో లభిస్తాయి. కేవలం Google మ్యాప్స్ ద్వారా లైవ్ రూట్లను చూడటానికి మాత్రమే ఇంటర్నెట్ అవసరం.",
                faq2Q: "నేను టాయిలెట్లు/క్యాంటీన్లను ఎలా వెతకాలి?",
                faq2A: "స్క్రీన్ కింద ఉన్న కేటగిరీల ప్యానెల్ కు స్క్రోல் చేసి, మీకు కావలసిన ఐకాన్‌ను నొక్కండి లేదా సెర్చ్ బాక్స్‌లో \"washroom\" అని టైప్ చేయండి.",
                faq3Q: "ఈ యాప్‌ను నా ఫోన్ స్క్రీన్‌కు ఎలా జోడించాలి?",
                faq3A: "స్క్రీన్ కింద కనిపించే \"Add to Screen\" బటన్‌ను నొక్కండి. ఐఫోన్‌లో అయితే, సఫారీ బ్రౌజర్‌లోని \"Share\" ఐకాన్‌ను నొక్కి, కిందకు స్క్రోల్ చేసి \"Add to Home Screen\" ఎంచుకోండి.",
                onboardingStartBtn: "క్యాంపస్‌ను అన్వేషిద్దాం! 🚀",
                closeOnboarding: "యూజర్ గైడ్‌ను మూసివేయి"
            },
            ta: {
                appTitle: "சந்திப் பல்கலைக்கழகம்",
                appSubtitle: "வளாக வழிகாட்டல்",
                searchPlaceholder: "கட்டடம், துறை, விடுதியைத் தேடுக...",
                filterAll: "அனைத்தும்",
                filterLabel: "வடிகட்டிகள்",
                categoryLabels: {
                    admission_cell: "சேர்க்கை பிரிவு",
                    gate: "நுழைவாயில்",
                    building: "கட்டடம்",
                    department: "துறை",
                    hostel: "விடுதி",
                    parking: "வாகன நிறுத்துமிடம்",
                    food_court: "உணவுக் கூடம்",
                    canteen: "உணவகம்",
                    stationery: "எழுதுபொருள்",
                    sports: "விளையாட்டு",
                    landmark: "அடையாளம்",
                    sections: "பிரிவுகள்",
                    uncategorized: "வகைப்படுத்தப்படாதவை"
                },
                viewDetails: "விவரங்களைக் காண்",
                navigate: "வழிசெலுத்து",
                navigateToLocation: "இடத்திற்குச் செல்",
                copyLink: "இணைப்பை நகலெடு",
                linkCopied: "இணைப்பு நகலெடுக்கப்பட்டது!",
                copyFailed: "இணைப்பை நகலெடுக்க முடியவில்லை",
                copyUnsupported: "நகலெடுப்பது ஆதரிக்கப்படவில்லை",
                locationNotAvailable: "இடம் கிடைக்கவில்லை",
                coordinatesNotAvailable: "ஆயத்தொலைவுகள் கிடைக்கவில்லை",
                noDescription: "விவரம் எதுவும் கிடைக்கவில்லை.",
                noKeywords: "முக்கிய வார்த்தைகள் எதுவும் கிடைக்கவில்லை",
                noAliases: "மாற்றுப் பெயர்கள் எதுவும் கிடைக்கவில்லை",
                noCourses: "படிப்புகள் எதுவும் பட்டியலிடப்படவில்லை",
                fieldParent: "மூலம்",
                fieldParentTopLevel: "எதுவுமில்லை (உயர் நிலை)",
                fieldDescription: "விவரம்",
                fieldKeywords: "முக்கிய வார்த்தைகள்",
                fieldAliases: "மாற்றுப் பெயர்கள்",
                fieldSchool: "பள்ளி",
                fieldParentBuilding: "பிரதான கட்டடம்",
                fieldCoordinates: "ஆயத்தொலைவுகள்",
                fieldCategory: "வகை",
                fieldCourses: "படிப்புகள்",
                emptyStateText: "பொருத்தமான இடங்கள் எதுவும் கிடைக்கவில்லை",
                offlineBannerText: "நீங்கள் ஆஃப்லைனில் உள்ளீர்கள் — சேமிக்கப்பட்ட தரவு காட்டப்படுகிறது",
                installBannerTitle: "கேம்பஸ்காம்பஸ் நிறுவவும்",
                installBannerSubtitle: "விரைவான, ஆஃப்லைன் அணுகலுக்கு உங்கள் முகப்புத் திரையில் சேர்க்கவும்.",
                installBannerBtn: "நிறுவு",
                iosInstallTipTitle: "இந்தச் செயலியை நிறுவவும்",
                iosInstallTipSubtitle: 'பகிர் ஐகானைத் தட்டி, "முகப்புத் திரையில் சேர்" என்பதைத் தட்டவும்.',
                langPickerTitle: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
                langPickerSubtitle: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
                langPickerNote: "குளோப் ஐகானிலிருந்து எப்போது வேண்டுமானாலும் மொழியை மாற்றலாம்.",
                closeDetails: "விவரங்களை மூடு",
                recentSearchesLabel: "சமீபத்திய தேடல்கள்",
                clearRecent: "சமீபத்தியதை அழி",
                share: "பகிர்",
                shareFallbackCopied: "இணைப்பு நகலெடுக்கப்பட்டது - இந்த உலாவியில் Web Share ஆதரிக்கப்படவில்லை",
                swipeNavigateHint: "விரைவாக வழிசெலுத்த இடதுபுறமாக ஸ்வைப் செய்யவும்",
                aboutRowLabel: "பற்றி",
                aboutRowSubtitle: "தரவுத்தொகுப்பு மெட்டாடேட்டா மற்றும் உள்ளூர் பயன்பாட்டு புள்ளிவிவரங்கள்",
                aboutPanelTitle: "தரவுத்தொகுப்பு விவரங்கள்",
                institutionLabel: "நிறுவனம்",
                versionLabel: "பதிப்பு",
                totalLocationsLabel: "மொத்த இடங்கள்",
                localAnalyticsLabel: "உள்ளூர் பகுப்பாய்வு",
                localAnalyticsNote: "எண்ணிக்கைகள் இந்த உலாவியின் localStorage இல் மட்டுமே சேமிக்கப்படும். எங்கும் பகிரப்படாது.",
                mostViewedLabel: "அதிகம் பார்க்கப்பட்டவை",
                topSearchesLabel: "சிறந்த தேடல்கள்",
                usageEmpty: "உள்ளூர் பயன்பாடு எதுவும் இன்னும் இல்லை.",
                dataLoadErrorTitle: "வளாகத் தரவை ஏற்ற முடியவில்லை",
                dataLoadErrorText: "ஆன்லைன் தரவுத்தொகுப்பு மற்றும் உள்ளமைக்கப்பட்ட தரவு இரண்டையும் செயலால் ஏற்ற முடியவில்லை.",
                retry: "மீண்டும் முயற்சிக்கவும்",
                openDatasetDetails: "தரவுத்தொகுப்பு விவரங்களைத் திற",
                closeDatasetDetails: "தரவுத்தொகுப்பு விவரங்களை மூடு",
                resetData: "பயன்பாட்டுத் தரவை மீட்டமை",
                resetDataConfirm: "பயன்பாட்டுத் தரவை மீட்டமைக்கவா? இது சேமிக்கப்பட்ட விருப்பத்தேர்வுகள் மற்றும் உள்ளூர் புள்ளிவிவரங்களை அழிக்கும்.",
                resetDataDone: "பயன்பாட்டுத் தரவு அழிக்கப்பட்டது",
                privacyNote: "தனியுரிமை: இருப்பிடம், தேடல்கள் மற்றும் பார்வை எண்ணிக்கைகள் இந்தச் சாதனத்தில் மட்டுமே இருக்கும்.",
                onboardingTitle: "கேம்பஸ்காம்பஸ்-க்கு உங்களை வரவேற்கிறோம்!",
                onboardingSubtitle: "உங்களது எளிய கேம்பஸ் வழிகாட்டி",
                howToUseTitle: "செயலியை எவ்வாறு பயன்படுத்துவது:",
                step1Title: "இடங்களைத் தேடவும் அல்லது உலாவவும்",
                step1Desc: "ஏதேனும் அறை, ஆய்வகம் அல்லது அலுவலகப் பெயரை தட்டச்சு செய்யவும், அல்லது வகைகளின் ஐகான்களை (கழிப்பறைகள் அல்லது உணவகம்) தட்டி வடிகட்டவும்.",
                step2Title: "நேரடி வழித் திசைகளைப் பெறுக",
                step2Desc: "அந்த இடத்திற்குச் செல்ல ஏதேனும் கார்டில் உள்ள சிவப்பு நிற <strong>\"கூகுள் மேப்பில் வழியைக் காட்டு\"</strong> பொத்தானைத் தட்டவும்.",
                step3Title: "ஆஃப்லைனில் தானாகவே இயங்கும்",
                step3Desc: "இந்தத் தகவல்கள் அனைத்தும் உங்கள் சாதனத்திலேயே சேமிக்கப்படும். மொபைல் சிக்னல் இல்லாத போதும் நீங்கள் இடங்களைத் தேடலாம்.",
                faqSectionTitle: "அடிக்கடி கேட்கப்படும் கேள்விகள் (FAQs):",
                faq1Q: "இது இணையம் இல்லாமல் வேலை செய்யுமா?",
                faq1A: "ஆம்! தேடல் மற்றும் இருப்பிட விபரங்கள் அனைத்தும் முழுமையாக ஆஃப்லைனில் இயங்கும். கூகுள் மேப்பில் நேரடி வழியைக் காண மட்டுமே இணையம் தேவை.",
                faq2Q: "கழிப்பறைகள்/உணவகங்களை நான் எப்படித் தேடுவது?",
                faq2A: "கீழே உள்ள பிரிவுகள் பேனலுக்குச் சென்று உங்களுக்குத் தேவையான ஐகானைத் தட்டவும் அல்லது தேடல் பெட்டியில் \"washroom\" என்று தட்டச்சு செய்யவும்.",
                faq3Q: "இந்த செயலியை எனது மொபைல் திரையில் எவ்வாறு சேர்ப்பது?",
                faq3A: "திரையின் கீழே தோன்றும் \"Add to Screen\" பொத்தானைத் தட்டவும். ஐபோனில், சஃபாரி உலாவியின் \"Share\" ஐகானைத் தட்டி, கீழே நகர்த்தி \"Add to Home Screen\" என்பதைத் தேர்ந்தெடுக்கவும்.",
                onboardingStartBtn: "கேம்பஸை சுற்றிப் பார்ப்போம்! 🚀",
                closeOnboarding: "வழிகாட்டியை மூடு"
            },
            pt: {
                appTitle: "UNIVERSIDADE SANDIP",
                appSubtitle: "NAVEGAÇÃO DO CAMPUS",
                searchPlaceholder: "Pesquisar prédio, departamento, albergue...",
                filterAll: "Todos",
                filterLabel: "Filtros",
                categoryLabels: {
                    admission_cell: "Célula de Admissão",
                    gate: "Portão",
                    building: "Prédio",
                    department: "Departamento",
                    hostel: "Albergue",
                    parking: "Estacionamento",
                    food_court: "Praça de Alimentação",
                    canteen: "Cantina",
                    stationery: "Papelaria",
                    sports: "Esportes",
                    landmark: "Ponto de Referência",
                    sections: "Seções",
                    uncategorized: "Sem Categoria"
                },
                viewDetails: "Ver Detalhes",
                navigate: "Navegar",
                navigateToLocation: "Navegar para o Local",
                copyLink: "Copiar Link",
                linkCopied: "Link copiado!",
                copyFailed: "Não foi possível copiar o link",
                copyUnsupported: "Cópia não suportada",
                locationNotAvailable: "Local não disponível",
                coordinatesNotAvailable: "Coordenadas não disponíveis",
                noDescription: "Nenhuma descrição disponível.",
                noKeywords: "Nenhuma palavra-chave disponível",
                noAliases: "Nenhum apelido disponível",
                noCourses: "Nenhum curso listado",
                fieldParent: "Pai",
                fieldParentTopLevel: "Nenhum (Nível Superior)",
                fieldDescription: "Descrição",
                fieldKeywords: "Palavras-chave",
                fieldAliases: "Apelidos",
                fieldSchool: "Escola",
                fieldParentBuilding: "Prédio Principal",
                fieldCoordinates: "Coordenadas",
                fieldCategory: "Categoria",
                fieldCourses: "Cursos",
                emptyStateText: "Nenhum local correspondente encontrado",
                offlineBannerText: "Você está offline — mostrando dados salvos",
                installBannerTitle: "Instalar CampusCompass",
                installBannerSubtitle: "Adicione à sua tela inicial para acesso rápido e offline.",
                installBannerBtn: "Instalar",
                iosInstallTipTitle: "Instale este aplicativo",
                iosInstallTipSubtitle: 'Toque no ícone Compartilhar e depois em "Adicionar à Tela de Início".',
                langPickerTitle: "Escolha seu idioma",
                langPickerSubtitle: "Escolha seu idioma",
                langPickerNote: "Você pode alterar o idioma a qualquer momento no ícone do globo.",
                closeDetails: "Fechar detalhes",
                recentSearchesLabel: "Pesquisas recentes",
                clearRecent: "Limpar recentes",
                share: "Compartilhar",
                shareFallbackCopied: "Link copiado - Web Share não suportado neste navegador",
                swipeNavigateHint: "Deslize para a esquerda para navegar rapidamente",
                aboutRowLabel: "Sobre",
                aboutRowSubtitle: "Metadados do conjunto de dados e estatísticas de uso apenas local",
                aboutPanelTitle: "Detalhes do conjunto de dados",
                institutionLabel: "Instituição",
                versionLabel: "Versão",
                totalLocationsLabel: "Total de locais",
                localAnalyticsLabel: "Análise apenas local",
                localAnalyticsNote: "As contagens são armazenadas apenas no localStorage deste navegador. Nada é transmitido para nenhum lugar.",
                mostViewedLabel: "Mais visualizados",
                topSearchesLabel: "Principais pesquisas",
                usageEmpty: "Sem uso local ainda.",
                dataLoadErrorTitle: "Não foi possível carregar os dados do campus",
                dataLoadErrorText: "O aplicativo falhou ao carregar tanto o conjunto de dados online quanto o fallback incorporado.",
                retry: "Tentar novamente",
                openDatasetDetails: "Abrir detalhes do conjunto de dados",
                closeDatasetDetails: "Fechar detalhes do conjunto de dados",
                resetData: "Redefinir dados do aplicativo",
                resetDataConfirm: "Redefinir dados do aplicativo? Isso limpará as preferências salvas e as estatísticas locais.",
                resetDataDone: "Dados do aplicativo limpos",
                privacyNote: "Privacidade: localização, pesquisas e contagens de visualizações permanecem apenas neste dispositivo.",
                onboardingTitle: "Bem-vindo ao CampusCompass!",
                onboardingSubtitle: "Seu Guia Rápido de Campus",
                howToUseTitle: "Como usar o aplicativo:",
                step1Title: "Pesquisar ou Explorar Locais",
                step1Desc: "Digite o nome de qualquer sala, laboratório ou escritório, ou toque em um ícone de categoria (como banheiros ou refeitório) para filtrar instantaneamente.",
                step2Title: "Obter Direções de Rota Direta",
                step2Desc: "Toque no botão vermelho <strong>\"Mostrar rota no Google Maps\"</strong> em qualquer cartão para navegar diretamente para o local.",
                step3Title: "Funciona Offline Automaticamente",
                step3Desc: "Este diretório de campus é armazenado no seu dispositivo. Você pode pesquisar locais mesmo sem cobertura de rede móvel.",
                faqSectionTitle: "Perguntas Frequentes (FAQs):",
                faq1Q: "Funciona sem internet?",
                faq1A: "Sim! A pesquisa e os detalhes do diretório são totalmente offline. A internet ativa só é necessária ao verificar rotas ao vivo no Google Maps externo.",
                faq2Q: "Como pesquiso banheiros/refeitório?",
                faq2A: "Basta rolar até o painel de categorias na parte inferior e tocar no ícone desejado. Ou digite palavras como \"banheiro\" na caixa de pesquisa.",
                faq3Q: "Como adiciono este aplicativo à tela do meu celular?",
                faq3A: "Toque no botão \"Adicionar à tela\" que aparece na parte inferior da tela. No iPhone, toque no ícone \"Compartilhar\" no Safari, role para baixo e toque em \"Adicionar à Tela Inicial\".",
                onboardingStartBtn: "Vamos Explorar o Campus! 🚀",
                closeOnboarding: "Fechar guia do usuário"
            }
        };

        /** @type {string[]} */
        const SUPPORTED_LANGS = ["en", "hi", "mr", "mai", "te", "ta", "pt"];
        const RTL_LANGUAGES = ["ar", "he", "ur", "fa"]; // Configured for future RTL scaling

        /** @type {number} */
        const RECENT_SEARCH_LIMIT = 5;

        /** @type {string} */
        const PREFERENCES_RECENTS_KEY = "recentSearches";

        /** @type {string} */
        const PREFERENCES_THEME_KEY = "theme";

        /** @type {string} */
        const PLACEHOLDER_OG_IMAGE = "./og-image-placeholder.jpg";

        /** @type {string} */
        const PLACEHOLDER_CANONICAL = "https://example.com/campuscompass";

        /** @type {string} */
        const CARD_SWIPE_OPEN_CLASS = "quick-reveal";

        /** @type {string} */
        const EMPTY_SELECTION_KEY = "__empty__";

        /** @type {{views: Record<string, number>, filters: Record<string, number>, searches: Record<string, number>}} */
        const defaultAnalytics = { views: {}, filters: {}, searches: {} };

        /** @type {Array<string>} */
        let recentSearches = [];

        /** @type {boolean} */
        let searchInputFocused = false;

        /** @type {string} */
        let lastRecordedSearchQuery = "";

        /** @type {HTMLElement | null} */
        let langPickerTrigger = null;

        /**
         * Return the storage key that should identify a location for analytics.
         * Pure function: no DOM access.
         * @param {Object} location
         * @returns {string}
         */
        function getLocationStorageKey(location) {
            if (!location) return EMPTY_SELECTION_KEY;
            return String(location.id || location.name || location.category || EMPTY_SELECTION_KEY);
        }

        /**
         * Read a preference array from the saved preferences blob.
         * Pure function: no DOM access beyond loadPreferences.
         * @param {string} key
         * @returns {Array<string>}
         */
        function readPreferenceArray(key) {
            const prefs = loadPreferences();
            const mapping = {
                [PREFERENCES_RECENTS_KEY]: 'recentSearches'
            };
            const prop = mapping[key] || key;
            const value = prefs[prop];
            return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
        }

        /**
         * Persist a preference array with de-duplication and a max length.
         * @param {string} key
         * @param {Array<string>} values
         * @param {number} [limit=Infinity]
         * @returns {void}
         */
        function writePreferenceArray(key, values, limit = Infinity) {
            const uniqueValues = [];
            values.forEach((value) => {
                if (typeof value === "string" && value && !uniqueValues.includes(value)) {
                    uniqueValues.push(value);
                }
            });
            const mapping = {
                [PREFERENCES_RECENTS_KEY]: 'recentSearches'
            };
            const prop = mapping[key] || key;
            savePreferences({ [prop]: uniqueValues.slice(0, limit) });
        }

        /**
         * Get the current recent search list.
         * @returns {Array<string>}
         */
        function getRecentSearches() {
            return readPreferenceArray(PREFERENCES_RECENTS_KEY);
        }

        /**
         * Persist the recent search list.
         * @param {Array<string>} values
         * @returns {void}
         */
        function setRecentSearches(values) {
            recentSearches = Array.isArray(values) ? values.slice(0, RECENT_SEARCH_LIMIT) : [];
            writePreferenceArray(PREFERENCES_RECENTS_KEY, recentSearches, RECENT_SEARCH_LIMIT);
        }

        /**
         * Add a query to the recent search history.
         * @param {string} query
         * @returns {void}
         */
        function addRecentSearch(query) {
            const trimmed = String(query || "").trim();
            if (!trimmed) return;
            const normalized = normalizeText(trimmed);
            const deduped = recentSearches.filter((item) => normalizeText(item) !== normalized);
            deduped.unshift(trimmed);
            setRecentSearches(deduped);
            renderRecentSearches();
        }

        /**
         * Clear the recent search history.
         * @returns {void}
         */
        function clearRecentSearches() {
            setRecentSearches([]);
            renderRecentSearches();
            showToast(t("clearRecent"));
        }

        /**
         * Set the current query to a recent search and run it immediately.
         * @param {string} query
         * @returns {void}
         */
        function applyRecentSearch(query) {
            const searchInput = getEl("searchInput");
            if (searchInput) {
                searchInput.value = query;
                currentQuery = normalizeText(query);
                searchInput.focus();
            } else {
                currentQuery = normalizeText(query);
            }
            applyFiltersAndSearch(true);
            renderRecentSearches();
        }

        /**
         * Clear the active search query.
         * @returns {void}
         */
        function clearSearchQuery() {
            const searchInput = getEl("searchInput");
            if (searchInput) searchInput.value = "";
            currentQuery = "";
            applyFiltersAndSearch(true);
            renderRecentSearches();
        }

        /**
         * Compare two numeric values and fall back to index order.
         * Pure function: no DOM access.
         * @param {number} left
         * @param {number} right
         * @param {number} leftIndex
         * @param {number} rightIndex
         * @returns {number}
         */
        function compareWithIndexFallback(left, right, leftIndex, rightIndex) {
            if (left < right) return -1;
            if (left > right) return 1;
            return leftIndex - rightIndex;
        }

        /**
         * Resolve the active display order for the filtered indexes.
         * Pure function: no DOM access.
         * @param {Array<number>} indexes
         * @returns {Array<number>}
         */
        function sortFilteredIndexes(indexes) {
            return indexes.slice();
        }

        /**
         * Read the persisted preferences blob.
         * @returns {Record<string, unknown>}
         */
        const PREFS_SCHEMA_VERSION = 1;

        function makeDefaultPreferences() {
            return {
                version: PREFS_SCHEMA_VERSION,
                theme: null,
                language: null,
                recentSearches: [],
                viewedCounts: {},
            };
        }

        function migratePreferences(old) {
            // Older shapes: plain object with keys, or simple arrays. Make best-effort mapping.
            if (!old || typeof old !== 'object') return makeDefaultPreferences();
            const base = makeDefaultPreferences();
            if (typeof old.version === 'number') {
                return Object.assign({}, base, old);
            }
            // possible legacy keys
            if (Array.isArray(old)) {
                return base;
            }
            // map known legacy keys
            base.theme = old.theme || old.ccTheme || base.theme;
            base.language = old.language || old.lang || base.language;
            base.recentSearches = Array.isArray(old.recentSearches) ? old.recentSearches : (Array.isArray(old[PREFERENCES_RECENTS_KEY]) ? old[PREFERENCES_RECENTS_KEY] : base.recentSearches);
            base.viewedCounts = old.viewedCounts || old.views || base.viewedCounts;
            return base;
        }

        function loadPreferences() {
            try {
                const raw = localStorage.getItem(PREFS_KEY);
                if (!raw) return makeDefaultPreferences();
                const parsed = sanitizeObject(JSON.parse(raw));
                if (!parsed || typeof parsed !== 'object') return makeDefaultPreferences();
                if (typeof parsed.version === 'number' && parsed.version === PREFS_SCHEMA_VERSION) return parsed;
                // migrate
                const migrated = migratePreferences(parsed);
                try { localStorage.setItem(PREFS_KEY, JSON.stringify(migrated)); } catch (e) { /* ignore */ }
                return migrated;
            } catch (error) {
                return makeDefaultPreferences();
            }
        }

        /**
         * Merge and persist a small preferences patch.
         * @param {Record<string, unknown>} patch
         * @returns {void}
         */
        function savePreferences(patch) {
            try {
                const current = loadPreferences();
                const merged = Object.assign({}, current, patch, { version: PREFS_SCHEMA_VERSION });
                localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
            } catch (error) {
                // localStorage unavailable.
            }
        }

        /**
         * Resolve a translation key from the active language with English fallback.
         * Pure function: no DOM access, no mutation.
         * @param {string} key
         * @param {string} [lang=currentLang]
         * @returns {string}
         */
        function t(key, lang = currentLang) {
            const resolve = (candidateLang) => {
                const dict = TRANSLATIONS[candidateLang];
                if (!dict) return undefined;
                return key.split(".").reduce((value, part) => (value && value[part] !== undefined ? value[part] : undefined), dict);
            };
            const viaLang = resolve(lang);
            if (viaLang !== undefined) return viaLang;
            const viaEnglish = resolve("en");
            if (viaEnglish !== undefined) return viaEnglish;
            return key;
        }

        /**
         * Helper to dynamically translate location texts (names, parents, descriptions)
         * based on standard phrases mapping to Hindi/Marathi/etc.
         * Falls back to original text.
         * @param {string|null|undefined} text
         * @param {string} lang
         * @returns {string}
         */
        function getTranslatedContent(text, lang = currentLang) {
            if (!text) return "";
            if (lang === "en") return text;

            // Simple dictionary for complete matching phrases (high precision)
            const exactMatches = {
                hi: {
                    "O Building": "ओ बिल्डिंग",
                    "Y Building": "वाई बिल्डिंग",
                    "S Building": "एस बिल्डिंग",
                    "SOS Building": "एसओएस बिल्डिंग",
                    "SITRC": "एसआईटीआरसी (SITRC)",
                    "SIEM": "एसआईईएम (SIEM)",
                    "SIPS": "एसआईपीएस (SIPS)",
                    "Sandip Polytechnic": "संदीप पॉलिटेक्निक",
                    "School of Design (SOD)": "स्कूल ऑफ डिजाइन (SOD)",
                    "School of Engineering & Technology (SOET)": "स्कूल ऑफ इंजीनियरिंग एंड टेक्नोलॉजी (SOET)",
                    "School of Computer Science & Engineering (SOCSE)": "स्कूल ऑफ कंप्यूटर साइंस & इंजीनियरिंग (SOCSE)",
                    "School of Commerce & Management Studies (SOCMS)": "स्कूल ऑफ कॉमर्स एंड मैनेजमेंट स्टडीज (SOCMS)",
                    "School of Pharmaceutical Sciences (SOPS)": "स्कूल ऑफ फार्मास्युटिकल साइंसेज (SOPS)",
                    "School of Law (SOL)": "स्कूल ऑफ लॉ (SOL)",
                    "School of Science (SOS)": "स्कूल ऑफ साइंस (SOS)",
                    "School of Computer Science Applications (SOCSA)": "स्कूल ऑफ कंप्यूटर साइंस एप्लीकेशन्स (SOCSA)"
                },
                mr: {
                    "O Building": "ओ इमारत",
                    "Y Building": "वाय इमारत",
                    "S Building": "एस इमारत",
                    "SOS Building": "एसओएस इमारत",
                    "SITRC": "एसआयटीआरसी (SITRC)",
                    "SIEM": "एसआयईएम (SIEM)",
                    "SIPS": "एसआयपीएस (SIPS)",
                    "Sandip Polytechnic": "संदीप पॉलिटेक्निक",
                    "School of Design (SOD)": "स्कूल ऑफ डिझाईन (SOD)",
                    "School of Engineering & Technology (SOET)": "स्कूल ऑफ इंजिनिअरिंग अँड टेक्नॉलॉजी (SOET)",
                    "School of Computer Science & Engineering (SOCSE)": "स्कूल ऑफ कॉम्प्युटर सायन्स अँड इंजिनिअरिंग (SOCSE)",
                    "School of Commerce & Management Studies (SOCMS)": "स्कूल ऑफ कॉमर्स अँड मॅनेजमेंट स्टडीज (SOCMS)",
                    "School of Pharmaceutical Sciences (SOPS)": "स्कूल ऑफ फार्मास्युटिकल सायन्स (SOPS)",
                    "School of Law (SOL)": "स्कूल ऑफ लॉ (SOL)",
                    "School of Science (SOS)": "स्कूल ऑफ सायन्स (SOS)",
                    "School of Computer Science Applications (SOCSA)": "स्कूल ऑफ कॉम्प्युटर सायन्स ॲप्लिकेशन्स (SOCSA)"
                }
            };

            // If there's an exact match in the dictionary, return it
            if (exactMatches[lang] && exactMatches[lang][text]) {
                return exactMatches[lang][text];
            }

            // Word/phrase replacements for dynamic translations
            let result = text;
            if (lang === "hi") {
                const replacements = [
                    [/Sandip University/g, "संदीप विश्वविद्यालय"],
                    [/Sandip Institute of Technology & Research Centre/g, "संदीप इंस्टीट्यूट ऑफ टेक्नोलॉजी एंड रिसर्च सेंटर"],
                    [/Sandip Institute of Engineering & Management/g, "संदीप इंस्टीट्यूट ऑफ इंजीनियरिंग एंड मैनेजमेंट"],
                    [/Sandip Institute of Pharmaceutical Sciences/g, "संदीप इंस्टीट्यूट ऑफ फार्मास्युटिकल साइंसेज"],
                    [/Sandip Polytechnic/g, "संदीप पॉलिटेक्निक"],
                    [/Admission Cell/g, "प्रवेश प्रकोष्ठ"],
                    [/Department of Computer Science Applications/g, "कंप्यूटर एप्लीकेशन विभाग"],
                    [/Department of Computer Engineering/g, "कंप्यूटर इंजीनियरिंग विभाग"],
                    [/Department of Mechanical Engineering/g, "मैकेनिकल इंजीनियरिंग विभाग"],
                    [/Department of Civil Engineering/g, "सिविल इंजीनियरिंग विभाग"],
                    [/Department of Electrical Engineering/g, "इलेक्ट्रिकल इंजीनियरिंग विभाग"],
                    [/Department of Electronics & Telecommunication Engineering/g, "इलेक्ट्रॉनिक्स और दूरसंचार इंजीनियरिंग विभाग"],
                    [/Department of Artificial Intelligence & Data Science/g, "आर्टिफिशियल इंटेलिजेंस और डेटा साइंस विभाग"],
                    [/Department of Computer Science & Engineering/g, "कंप्यूटर Science और इंजीनियरिंग विभाग"],
                    [/Department of Information Technology/g, "सूचना प्रौद्योगिकी विभाग"],
                    [/Department of Business Administration/g, "व्यवसाय प्रशासन विभाग"],
                    [/Department of Commerce/g, "वाणिज्य विभाग"],
                    [/Department of Pharmacy/g, "फार्मेसी विभाग"],
                    [/Department of Law/g, "कानून विभाग"],
                    [/Department of Physics/g, "भौतिकी विभाग"],
                    [/Department of Chemistry/g, "रसायन विज्ञान विभाग"],
                    [/Department of Mathematics/g, "गणित विभाग"],
                    [/Department of Fashion Design/g, "फैशन डिजाइन विभाग"],
                    [/Department of Interior Design/g, "इंटीरियर डिजाइन विभाग"],
                    [/Department of/g, "विभाग:"],
                    [/Admin Block/g, "प्रशासनिक ब्लॉक"],
                    [/Accounts Section/g, "लेखा अनुभाग"],
                    [/Student Section/g, "छात्र अनुभाग"],
                    [/Account Section/g, "लेखा अनुभाग"],
                    [/Amphitheatre/g, "एम्फीथिएटर"],
                    [/Food Court/g, "फ़ूड कोर्ट"],
                    [/Central Canteen/g, "केंद्रीय कैंटीन"],
                    [/Canteen/g, "कैंटीन"],
                    [/Sports Ground/g, "खेल का मैदान"],
                    [/Sports Complex/g, "खेल परिसर"],
                    [/Cricket Turf/g, "क्रिकेट टर्फ"],
                    [/Stationery/g, "स्टेशनरी"],
                    [/Clock Tower/g, "घंटाघर"],
                    [/Foundation Fountain/g, "फाउंडेशन फव्वारा"],
                    [/Foundation Gate/g, "फाउंडेशन गेट"],
                    [/University Gate/g, "विश्वविद्यालय गेट"],
                    [/Gate/g, "गेट"],
                    [/Boys Hostel/g, "लड़कों का छात्रावास"],
                    [/Girls Hostel/g, "लड़कियों का छात्रावास"],
                    [/Hostel/g, "छात्रावास"],
                    [/Bus Parking/g, "बस पार्किंग"],
                    [/Parking/g, "पार्किंग"],
                    [/Junior College/g, "जूनियर कॉलेज"],
                    [/Neelam Sagar Dam/g, "नीलम सागर बांध"],
                    [/School of/g, "स्कूल ऑफ"],
                    [/Engineering & Technology/g, "इंजीनियरिंग एंड टेक्नोलॉजी"],
                    [/Computer Science & Engineering/g, "कंप्यूटर साइंस एंड इंजीनियरिंग"],
                    [/Commerce & Management Studies/g, "कॉमर्स एंड मैनेजमेंट स्टडीज"],
                    [/Pharmaceutical Sciences/g, "फर्मास्युटिकल साइंसेज"],
                    [/Law/g, "लॉ"],
                    [/Science/g, "साइंस"],
                    [/Design/g, "डिजाइन"],
                    [/Computer Applications/g, "कंप्यूटर एप्लीकेशन्स"]
                ];
                for (const [pattern, repl] of replacements) {
                    result = result.replace(pattern, repl);
                }
            } else if (lang === "mr") {
                const replacements = [
                    [/Sandip University/g, "संदीप विद्यापीठ"],
                    [/Sandip Institute of Technology & Research Centre/g, "संदीप इन्स्टिट्यूट ऑफ टेक्नॉलॉजी अँड रिसर्च सेंटर"],
                    [/Sandip Institute of Engineering & Management/g, "संदीप इन्स्टिट्यूट ऑफ इंजिनिअरिंग अँड मॅनेजमेंट"],
                    [/Sandip Institute of Pharmaceutical Sciences/g, "संदीप इन्स्टिट्यूट ऑफ फार्मास्युटिकल सायन्सेस"],
                    [/Sandip Polytechnic/g, "संदीप पॉलिटेक्निक"],
                    [/Admission Cell/g, "प्रवेश कक्ष"],
                    [/Department of Computer Science Applications/g, "कॉम्प्युटर सायन्स ॲप्लिकेशन्स विभाग"],
                    [/Department of Computer Engineering/g, "कॉम्प्युटर इंजिनिअरिंग विभाग"],
                    [/Department of Mechanical Engineering/g, "मेकॅनिकल इंजिनिअरिंग विभाग"],
                    [/Department of Civil Engineering/g, "सिव्हिल इंजिनिअरिंग विभाग"],
                    [/Department of Electrical Engineering/g, "इलेक्ट्रिकल इंजिनिअरिंग विभाग"],
                    [/Department of Electronics & Telecommunication Engineering/g, "इलेक्ट्रॉनिक्स आणि टेलिकम्युनिकेशन इंजिनिअरिंग विभाग"],
                    [/Department of Artificial Intelligence & Data Science/g, "आर्टिफिशियल इंटेलिजन्स आणि डेटा सायन्स विभाग"],
                    [/Department of Computer Science & Engineering/g, "कॉम्प्युटर सायन्स आणि इंजिनिअरिंग विभाग"],
                    [/Department of Information Technology/g, "माहिती तंत्रज्ञान विभाग"],
                    [/Department of Business Administration/g, "व्यवसाय प्रशासन विभाग"],
                    [/Department of Commerce/g, "वाणिज्य विभाग"],
                    [/Department of Pharmacy/g, "फार्मसी विभाग"],
                    [/Department of Law/g, "कायदा विभाग"],
                    [/Department of Physics/g, "भौतिकशास्त्र विभाग"],
                    [/Department of Chemistry/g, "रसायनशास्त्र विभाग"],
                    [/Department of Mathematics/g, "गणित विभाग"],
                    [/Department of Fashion Design/g, "फॅशन डिझाईन विभाग"],
                    [/Department of Interior Design/g, "इंटिरियर डिझाईन विभाग"],
                    [/Department of/g, "विभाग:"],
                    [/Admin Block/g, "प्रशासकीय ब्लॉक"],
                    [/Accounts Section/g, "लेखा विभाग"],
                    [/Student Section/g, "विद्यार्थी विभाग"],
                    [/Account Section/g, "लेखा विभाग"],
                    [/Amphitheatre/g, "अ‍ॅम्फीथिएटर"],
                    [/Food Court/g, "फूड कोर्ट"],
                    [/Central Canteen/g, "मध्यवर्ती कॅन्टीन"],
                    [/Canteen/g, "कॅन्टीन"],
                    [/Sports Ground/g, "क्रीडा मैदान"],
                    [/Sports Complex/g, "क्रीडा संकुल"],
                    [/Cricket Turf/g, "क्रिकेट टर्फ"],
                    [/Stationery/g, "स्टेशनरी"],
                    [/Clock Tower/g, "घड्याळ टॉवर"],
                    [/Foundation Fountain/g, "फाउंडेशन कारंजे"],
                    [/Foundation Gate/g, "फाउंडेशन गेट"],
                    [/University Gate/g, "विद्यापीठ गेट"],
                    [/Gate/g, "गेट"],
                    [/Boys Hostel/g, "मुलांचे वसतिगृह"],
                    [/Girls Hostel/g, "मुलींचे वसतिगृह"],
                    [/Hostel/g, "वसतिगृह"],
                    [/Bus Parking/g, "बस पार्किंग"],
                    [/Parking/g, "पार्किंग"],
                    [/Junior College/g, "ज्युनिअर कॉलेज"],
                    [/Neelam Sagar Dam/g, "नीलम सागर धरण"],
                    [/School of/g, "स्कूल ऑफ"],
                    [/Engineering & Technology/g, "इंजिनिअरिंग अँड टेक्नॉलॉजी"],
                    [/Computer Science & Engineering/g, "कॉम्प्युटर सायन्स अँड इंजिनिअरिंग"],
                    [/Commerce & Management Studies/g, "कॉमर्स अँड मॅनेजमेंट स्टडीज"],
                    [/Pharmaceutical Sciences/g, "फर्मास्युटिकल सायन्सेस"],
                    [/Law/g, "कायदा"],
                    [/Science/g, "सायन्स"],
                    [/Design/g, "डिझाईन"],
                    [/Computer Applications/g, "कॉम्प्युटर ॲप्लिकेशन्स"]
                ];
                for (const [pattern, repl] of replacements) {
                    result = result.replace(pattern, repl);
                }
            }

            return result;
        }

        // ===== MODULE: search.js (search index, debounce, filter logic) =====

        /**
         * Escape HTML for safe text injection into template strings.
         * Pure function: no DOM access.
         * @param {unknown} value
         * @returns {string}
         */
        function escapeHtml(value) {
            return String(value ?? "").replace(/[&<>'"]/g, (match) => {
                switch (match) {
                    case "&": return "&amp;";
                    case "<": return "&lt;";
                    case ">": return "&gt;";
                    case '"': return "&quot;";
                    case "'": return "&#39;";
                    default: return match;
                }
            });
        }

        /**
         * Sanitize a parsed JSON object to prevent prototype pollution.
         * Recursively removes __proto__, constructor, and prototype keys.
         * @param {unknown} obj
         * @returns {unknown}
         */
        function sanitizeObject(obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            if (Array.isArray(obj)) return obj.map(sanitizeObject);
            const clean = {};
            for (const key of Object.keys(obj)) {
                if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
                clean[key] = sanitizeObject(obj[key]);
            }
            return clean;
        }

        /**
         * Safely encode a value via JSON.stringify for embedding inside
         * a single-quoted HTML attribute (e.g. onclick='fn(${safeJsonAttr(val)})').
         * Prevents attribute breakout via unescaped quotes or HTML entities.
         * @param {unknown} value
         * @returns {string}
         */
        function safeJsonAttr(value) {
            return JSON.stringify(value)
                .replace(/&/g, '&amp;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        /**
         * Normalize text for deterministic, case-insensitive search.
         * Pure function: no DOM access.
         * @param {unknown} value
         * @returns {string}
         */
        function normalizeText(value) {
            return String(value ?? "").trim().toLowerCase();
        }

        /**
         * Build a single searchable string for a location.
         * Pure function: no DOM access.
         * @param {Object} location
         * @returns {string}
         */
        function buildSearchIndexEntry(location) {
            const name = location && location.name;
            const parent = location && location.parent;
            const school = location && location.school;

            const parts = [
                name,
                location && location.category,
                parent,
                school,
                getTranslatedContent(name, "hi"),
                getTranslatedContent(name, "mr"),
                getTranslatedContent(parent, "hi"),
                getTranslatedContent(parent, "mr"),
                getTranslatedContent(school, "hi"),
                getTranslatedContent(school, "mr"),
                ...(Array.isArray(location && location.aliases) ? location.aliases : []),
                ...(Array.isArray(location && location.keywords) ? location.keywords : []),
                ...(Array.isArray(location && location.courses) ? location.courses : [])
            ].filter(Boolean);
            return normalizeText(parts.join(" "));
        }

        /**
         * Build the search index for the currently loaded dataset.
         * @returns {void}
         */
        function buildSearchIndex() {
            searchIndex = allLocations.map((location) => buildSearchIndexEntry(location));
        }

        /**
         * Build the category list from loaded locations.
         * @returns {void}
         */
        function buildCategoryList() {
            const found = new Set();
            allLocations.forEach((location) => {
                if (location && location.category) found.add(location.category);
            });
            categories = [ALL_FILTER, ...Array.from(found).sort()];
        }

        /**
         * Determine whether a location matches the active filter/query.
         * Pure function: no DOM access.
         * @param {Object} location
         * @param {string} searchEntry
         * @param {string} query
         * @param {string} filter
         * @returns {boolean}
         */
        function matchesLocation(location, searchEntry, query, filter) {
            if (filter !== ALL_FILTER && location.category !== filter) {
                return false;
            }
            if (!query) return true;
            return searchEntry.includes(query);
        }

        /**
         * Filter the dataset to matching indexes.
         * Pure function: no DOM access.
         * @param {Array<Object>} locations
         * @param {Array<string>} indexList
         * @param {string} query
         * @param {string} filter
         * @returns {Array<number>}
         */
        function filterLocationIndexes(locations, indexList, query, filter) {
            const matching = [];
            for (let index = 0; index < locations.length; index += 1) {
                if (matchesLocation(locations[index], indexList[index] || "", query, filter)) {
                    matching.push(index);
                }
            }
            return matching;
        }

        /**
         * Debounce a function call by wait milliseconds.
         * Pure utility: no DOM access.
         * @param {Function} fn
         * @param {number} wait
         * @returns {Function}
         */
        function debounce(fn, wait) {
            let timeoutId = null;
            return function debounced(...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => fn.apply(this, args), wait);
            };
        }

        // ===== MODULE: render.js (cards, modal, skeleton, virtualization) =====

        /**
         * Convenience DOM lookup.
         * DOM-coupled helper: reads the document, no mutation.
         * @param {string} id
         * @returns {HTMLElement | null}
         */
        function getEl(id) {
            return document.getElementById(id);
        }

        /**
         * Simple haptic-style feedback on supported devices.
         * DOM-coupled helper: uses navigator only.
         * @returns {void}
         */
        function hapticTap() {
            if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
                navigator.vibrate(10);
            }
        }

        /**
         * Check whether the user prefers reduced motion.
         * DOM-coupled helper: reads matchMedia only.
         * @returns {boolean}
         */
        function prefersReducedMotion() {
            return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
        }

        /**
         * Keep the theme toggle glyphs in sync with the html.dark class.
         * DOM-coupled helper: mutates the icon visibility in the document.
         * @returns {void}
         */
        function applyThemeIcons() {
            const isDark = document.documentElement.classList.contains("dark");
            DOMUtils.toggle(DOMUtils.get("themeIconSun"), !isDark);
            DOMUtils.toggle(DOMUtils.get("themeIconMoon"), isDark);
        }

        /**
         * Toggle the global theme and persist the preference.
         * DOM-coupled helper: mutates document state and localStorage.
         * @returns {void}
         */
        function toggleTheme() {
            hapticTap();
            const isDark = document.documentElement.classList.toggle("dark");
            try {
                localStorage.setItem("cc-theme", isDark ? "dark" : "light");
            } catch (error) {
                // localStorage unavailable.
            }
            applyThemeIcons();
            initIconsForRoot(getEl("themeToggleBtn"));
        }

        /**
         * Load the embedded JSON dataset from the page.
         * @returns {Object | null}
         */
        function loadEmbeddedData() {
            try {
                const script = getEl("campusDataEmbedded");
                if (!script || !script.textContent.trim()) return null;
                return sanitizeObject(JSON.parse(script.textContent));
            } catch (error) {
                console.error("Failed to parse embedded campus dataset:", error);
                return null;
            }
        }

        /**
         * Extract a normalized locations array from any supported payload shape.
         * Pure function: no DOM access.
         * @param {unknown} payload
         * @returns {Array<Object>}
         */
        function extractLocations(payload) {
            if (!payload) return [];
            if (Array.isArray(payload)) return payload;
            if (Array.isArray(payload.locations)) return payload.locations;
            return [];
        }

        /**
         * Extract dataset metadata from payloads, preferring the embedded JSON.
         * Pure function: no DOM access.
         * @param {Object | null} embeddedPayload
         * @param {Object | null} fallbackPayload
         * @param {Array<Object>} locations
         * @returns {{institution:string, version:string, total_locations:number}}
         */
        function extractDatasetMeta(embeddedPayload, fallbackPayload, locations) {
            const source = embeddedPayload || fallbackPayload || {};
            return {
                institution: source.institution || "Sandip University",
                version: String(source.version || ""),
                total_locations: Number(source.total_locations != null ? source.total_locations : locations.length) || locations.length
            };
        }

        /**
         * Render text into the translation-aware static chrome.
         * DOM-coupled helper: writes textContent/attributes only.
         * @returns {void}
         */
        function applyLanguageToStaticText() {
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (key) el.innerHTML = t(key);
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                if (key) el.setAttribute('placeholder', t(key));
            });
            document.querySelectorAll('[data-i18n-aria]').forEach(el => {
                const key = el.getAttribute('data-i18n-aria');
                if (key) el.setAttribute('aria-label', t(key));
            });

            // Handle RTL layouts seamlessly
            if (RTL_LANGUAGES.includes(currentLang)) {
                document.documentElement.setAttribute("dir", "rtl");
            } else {
                document.documentElement.setAttribute("dir", "ltr");
            }
        }

        /**
         * Mark the language picker open and optionally focus the first option.
         * DOM-coupled helper: shows the overlay.
         * @param {boolean} [focusFirstOption=false]
         * @returns {void}
         */
        function openLangPicker(focusFirstOption = false) {
            const overlay = getEl("langPickerOverlay");
            if (!overlay) return;
            window.history.pushState({ langPickerOpen: true }, "");
            document.documentElement.classList.add("no-scroll");
            langPickerTrigger = document.activeElement;
            overlay.classList.add("picker-shown");
            requestAnimationFrame(() => {
                overlay.classList.add("picker-visible");
                if (focusFirstOption) {
                    const firstCard = overlay.querySelector(".lang-card");
                    if (firstCard && typeof firstCard.focus === "function") firstCard.focus();
                }
            });
            initIconsForRoot(overlay);
        }

        /**
         * Close the language picker overlay.
         * DOM-coupled helper: hides the overlay.
         * @returns {void}
         */
        function closeLangPicker(triggerHistoryBack = true) {
            const overlay = getEl("langPickerOverlay");
            if (!overlay) return;
            overlay.classList.remove("picker-visible");
            const finish = () => {
                overlay.classList.remove("picker-shown");
                document.documentElement.classList.remove("no-scroll");
                if (langPickerTrigger && typeof langPickerTrigger.focus === "function") {
                    langPickerTrigger.focus();
                    langPickerTrigger = null;
                }
            };
            if (triggerHistoryBack && window.history.state && window.history.state.langPickerOpen) {
                window.history.back();
            }
            if (prefersReducedMotion()) {
                finish();
            } else {
                setTimeout(finish, 280);
            }
        }

        /**
         * Initialize the active language from saved preferences.
         * @returns {boolean}
         */
        function initLanguage() {
            const prefs = loadPreferences();
            const saved = prefs.language;
            if (saved && SUPPORTED_LANGS.includes(saved)) {
                currentLang = saved;
                document.documentElement.setAttribute("lang", currentLang);
                applyLanguageToStaticText();
                return true;
            }
            currentLang = "en";
            document.documentElement.setAttribute("lang", "en");
            return false;
        }

        /**
         * Switch the active language and rerender translated chrome.
         * DOM-coupled helper: updates document state.
         * @param {string} lang
         * @returns {void}
         */
        function selectLanguage(lang) {
            hapticTap();
            if (!SUPPORTED_LANGS.includes(lang)) lang = "en";
            currentLang = lang;
            document.documentElement.setAttribute("lang", lang);
            savePreferences({ language: lang });
            applyLanguageToStaticText();

            if (allLocations.length > 0) {
                renderFilters();
                applyFiltersAndSearch(true);
            }

            const modal = getEl("detailModal");
            if (modal && !modal.classList.contains("hidden")) closeModal();
            closeLangPicker();

            if (firstLaunchPending) {
                firstLaunchPending = false;
                openOnboarding();
            }
        }

        /**
         * General-purpose icon hydration scoped to a root element.
         * DOM-coupled helper: delegates to Lucide for the subtree only.
         * @param {HTMLElement | null} root
         * @returns {void}
         */
        function initIconsForRoot(root) {
            if (root && typeof lucide !== "undefined" && typeof lucide.createIcons === "function") {
                lucide.createIcons({ root: root });
            }
        }

        /**
         * Format a category label in the current language.
         * Pure function: no DOM access.
         * @param {string} category
         * @param {string} [lang=currentLang]
         * @returns {string}
         */
        function formatCategoryLabel(category, lang = currentLang) {
            if (!category) return t("categoryLabels.uncategorized", lang);
            const dict = TRANSLATIONS[lang] && TRANSLATIONS[lang].categoryLabels;
            const english = TRANSLATIONS.en.categoryLabels;
            if (dict && dict[category]) return dict[category];
            if (english[category]) return english[category];
            return category.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
        }

        /**
         * Render the category filter pills.
         * DOM-coupled helper: writes filter markup.
         * @returns {void}
         */
        function renderFilters() {
            const container = getEl("filterContainer");
            if (!container) return;

            const legendHtml = `<legend class="sr-only">${escapeHtml(t("filterLabel"))}</legend>`;
            const chipsHtml = categories.map((category) => {
                const icon = category === ALL_FILTER ? "layout-grid" : (CATEGORY_ICONS[category] || DEFAULT_ICON);
                const isActive = currentFilter === category;
                const label = category === ALL_FILTER ? t("filterAll") : formatCategoryLabel(category);
                return `
                    <button data-filter="${escapeHtml(category)}" aria-pressed="${isActive}"
                        class="filter-chip tap-shrink inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border whitespace-nowrap transition-all
                        ${isActive ? "filter-chip-active bg-slate-900 text-white border-slate-900" : "bg-white filter-chip-inactive text-slate-500 border-slate-200"}"
                        style="min-height:44px;">
                        <i data-lucide="${icon}" class="w-3.5 h-3.5"></i>
                        <span>${escapeHtml(label)}</span>
                    </button>
                `;
            }).join("");
            container.innerHTML = legendHtml + chipsHtml;
            initIconsForRoot(container);
        }

        /**
         * Render the recent search chips below the search box.
         * DOM-coupled helper: writes the recent search area only.
         * @returns {void}
         */
        function renderRecentSearches() {
            const wrap = getEl("recentSearchesWrap");
            const searchInput = getEl("searchInput");
            if (!wrap || !searchInput) return;

            const visible = searchInputFocused && currentQuery === "";
            wrap.setAttribute("data-visible", String(visible));

            if (!visible) {
                wrap.innerHTML = "";
                return;
            }

            const items = recentSearches.slice(0, RECENT_SEARCH_LIMIT);
            const chips = items.map((query) => `
                <button class="recent-chip tap-shrink" data-recent-query="${escapeHtml(query)}" aria-label="${escapeHtml(query)}">
                    <i data-lucide="history" class="w-3.5 h-3.5"></i>
                    <span>${escapeHtml(query)}</span>
                </button>
            `).join("");
            const clearButton = items.length > 0
                ? `<button class="clear-recent-btn tap-shrink" data-action="clear-recent" aria-label="${escapeHtml(t("clearRecent"))}">${escapeHtml(t("clearRecent"))}</button>`
                : `<p class="text-xs font-medium text-slate-500 italic">${escapeHtml(t("usageEmpty"))}</p>`;

            wrap.innerHTML = `
                <div class="flex items-center justify-between gap-4">
                    <p class="text-[10px] uppercase tracking-[0.22em] font-black text-slate-500">${escapeHtml(t("recentSearchesLabel"))}</p>
                    ${clearButton}
                </div>
                <div class="flex flex-wrap gap-2">${chips || `<p class="text-xs font-medium text-slate-500 italic">${escapeHtml(t("usageEmpty"))}</p>`}</div>
            `;
            initIconsForRoot(wrap);
        }

        /**
         * Persist a filter usage count locally.
         * Local-only analytics: never transmitted anywhere.
         * @param {string} filter
         * @returns {void}
         */
        function recordFilterUsage(filter) {
            const stats = loadAnalytics();
            const key = filter || ALL_FILTER;
            stats.filters[key] = (stats.filters[key] || 0) + 1;
            saveAnalytics(stats);
        }

        /**
         * Persist a location view count locally.
         * Local-only analytics: never transmitted anywhere.
         * @param {Object} location
         * @returns {void}
         */
        function recordLocationView(location) {
            const stats = loadAnalytics();
            const key = String((location && location.id) || (location && location.name) || "unknown");
            stats.views[key] = (stats.views[key] || 0) + 1;
            saveAnalytics(stats);
            renderAboutPanel();
        }

        /**
         * Persist a search term count locally.
         * Local-only analytics: never transmitted anywhere.
         * @param {string} query
         * @returns {void}
         */
        function recordSearchUsage(query) {
            const normalized = normalizeText(query);
            if (!normalized) {
                lastRecordedSearchQuery = "";
                return;
            }
            if (normalized === lastRecordedSearchQuery) return;
            lastRecordedSearchQuery = normalized;
            const stats = loadAnalytics();
            stats.searches[normalized] = (stats.searches[normalized] || 0) + 1;
            saveAnalytics(stats);
            addRecentSearch(query);
        }

        /**
         * Read the local-only analytics object.
         * @returns {{views: Record<string, number>, filters: Record<string, number>, searches: Record<string, number>}}
         */
        function loadAnalytics() {
            try {
                const raw = localStorage.getItem(ANALYTICS_KEY);
                return raw ? sanitizeObject(JSON.parse(raw)) : Object.assign({}, defaultAnalytics);
            } catch (error) {
                return Object.assign({}, defaultAnalytics);
            }
        }

        /**
         * Save the local-only analytics object.
         * @param {{views: Record<string, number>, filters: Record<string, number>, searches: Record<string, number>}} stats
         * @returns {void}
         */
        function saveAnalytics(stats) {
            try {
                localStorage.setItem(ANALYTICS_KEY, JSON.stringify(stats));
            } catch (error) {
                // localStorage unavailable.
            }
        }

        /**
         * Pick the most viewed locations for the About panel.
         * Pure function: no DOM access.
         * @param {Array<Object>} locations
         * @param {{views: Record<string, number>}} stats
         * @param {number} [limit=3]
         * @returns {Array<{location:Object,count:number}>}
         */
        function getMostViewedLocations(locations, stats, limit = 3) {
            const locationByKey = new Map();
            locations.forEach((location) => {
                const key = String((location && location.id) || (location && location.name) || "unknown");
                locationByKey.set(key, location);
            });
            return Object.entries(stats.views || {})
                .map(([key, count]) => ({ location: locationByKey.get(key), count: Number(count) || 0 }))
                .filter((entry) => entry.location)
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);
        }

        /**
         * Pick the top searched terms for the About panel.
         * Pure function: no DOM access.
         * @param {{searches: Record<string, number>}} stats
         * @param {number} [limit=3]
         * @returns {Array<{term:string,count:number}>}
         */
        function getTopSearches(stats, limit = 3) {
            return Object.entries(stats.searches || {})
                .map(([term, count]) => ({ term, count: Number(count) || 0 }))
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);
        }

        /**
         * Render the About panel content.
         * DOM-coupled helper: updates a hidden/visible panel in the page.
         * @returns {void}
         */
        function renderAboutPanel() {
            const panel = getEl("aboutPanel");
            const institutionPill = getEl("aboutInstitutionPill");
            const versionPill = getEl("aboutVersionPill");
            const totalPill = getEl("aboutTotalPill");
            const mostViewedList = getEl("mostViewedList");
            const topSearchesList = getEl("topSearchesList");

            if (!panel || !institutionPill || !versionPill || !totalPill || !mostViewedList || !topSearchesList) return;

            institutionPill.textContent = `${t("institutionLabel")}: ${datasetMeta.institution || "-"}`;
            versionPill.textContent = `${t("versionLabel")}: ${datasetMeta.version || "-"}`;
            totalPill.textContent = `${t("totalLocationsLabel")}: ${datasetMeta.total_locations || 0}`;

            const stats = loadAnalytics();
            const mostViewed = getMostViewedLocations(allLocations, stats, 3);
            const topSearches = getTopSearches(stats, 3);

            mostViewedList.innerHTML = mostViewed.length
                ? mostViewed.map((entry) => {
                    const locationName = entry.location.name || t("unnamedLocation");
                    return `<div class="flex items-center justify-between gap-4 rounded-2xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
                        <span class="min-w-0 truncate">${escapeHtml(locationName)}</span>
                        <span class="shrink-0">${entry.count}</span>
                    </div>`;
                }).join("")
                : `<p class="text-xs font-medium text-slate-500 italic">${escapeHtml(t("usageEmpty"))}</p>`;

            topSearchesList.innerHTML = topSearches.length
                ? topSearches.map((entry) => {
                    return `<div class="flex items-center justify-between gap-4 rounded-2xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
                        <span class="min-w-0 truncate">${escapeHtml(entry.term)}</span>
                        <span class="shrink-0">${entry.count}</span>
                    </div>`;
                }).join("")
                : `<p class="text-xs font-medium text-slate-500 italic">${escapeHtml(t("usageEmpty"))}</p>`;

            // Add privacy note and reset button
            const privacyNote = document.createElement('div');
            privacyNote.className = 'text-xs text-slate-500 mt-4';
            privacyNote.textContent = t('privacyNote');
            const resetBtn = document.createElement('button');
            resetBtn.className = 'clear-recent-btn tap-shrink mt-4';
            resetBtn.textContent = t('resetData');
            resetBtn.onclick = () => {
                if (!confirm(t('resetDataConfirm'))) return;
                resetAppData();
            };
            // Avoid duplicate nodes
            const existingPrivacy = panel.querySelector('.cc-privacy-note');
            if (!existingPrivacy) {
                privacyNote.classList.add('cc-privacy-note');
                panel.appendChild(privacyNote);
                panel.appendChild(resetBtn);
            }
            initIconsForRoot(panel);
        }

        /**
         * Toggle the About panel visibility.
         * DOM-coupled helper: reads/writes element state.
         * @returns {void}
         */
        function toggleAboutPanel() {
            const panel = getEl("aboutPanel");
            const button = getEl("aboutToggleBtn");
            if (!panel || !button) return;
            const isHidden = panel.classList.toggle("hidden");
            button.setAttribute("aria-expanded", String(!isHidden));
            button.setAttribute("aria-label", isHidden ? t("openDatasetDetails") : t("closeDatasetDetails"));
            if (!isHidden) renderAboutPanel();
        }

        /**
         * Reset stored preferences and clear caches where possible.
         * DOM-coupled helper: clears localStorage and tries to clear service worker cache.
         */
        async function resetAppData() {
            try {
                localStorage.removeItem(PREFS_KEY);
                localStorage.removeItem(ANALYTICS_KEY);
                // clear caches for this app shell
                if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                    try {
                        const keys = await caches.keys();
                        await Promise.all(keys.filter(k => k.startsWith('campuscompass-shell-')).map(k => caches.delete(k)));
                    } catch (e) { /* ignore */ }
                }
                // reload to ensure a clean slate
                showToast(t('resetDataDone'));
                setTimeout(() => window.location.reload(), 700);
            } catch (e) {
                console.warn('Failed to reset data', e);
                showToast(t('copyFailed'));
            }
        }

        /**
         * Check whether a URL is safe to navigate to (HTTPS only).
         * Blocks javascript:, data:, and non-HTTPS protocols.
         * @param {unknown} url
         * @returns {boolean}
         */
        function isSafeUrl(url) {
            if (typeof url !== 'string' || url.length === 0) return false;
            try {
                const parsed = new URL(url, window.location.href);
                return parsed.protocol === 'https:';
            } catch (e) {
                return false;
            }
        }

        /**
         * Resolve the best available Google Maps URL for a location.
         * SECURITY: Validates that any URL from the dataset is HTTPS.
         * Pure function: no DOM access.
         * @param {Object} location
         * @returns {string | null}
         */
        function getMapUrl(location) {
            if (location && location.google_maps_walking_link) {
                const link = String(location.google_maps_walking_link);
                if (isSafeUrl(link)) return link;
                // Reject non-HTTPS links (blocks javascript:, data:, http:, etc.)
                return null;
            }
            const coordinates = location && location.coordinates;
            if (coordinates && coordinates.latitude != null && coordinates.longitude != null) {
                const lat = Number(coordinates.latitude);
                const lng = Number(coordinates.longitude);
                if (!isFinite(lat) || !isFinite(lng)) return null;
                return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
            }
            return null;
        }

        /**
         * Open an external navigation URL.
         * SECURITY: Only allows HTTPS URLs to prevent open redirect attacks.
         * DOM-coupled helper: triggers browser navigation.
         * @param {string | null} url
         * @returns {void}
         */
        function navigateToLocation(url) {
            hapticTap();
            if (url && isSafeUrl(url)) {
                try {
                    // Use a temporary anchor to ensure rel attributes for security
                    const a = document.createElement('a');
                    a.href = url;
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    return;
                } catch (e) {
                    try { window.open(url, '_blank'); } catch (e2) { /* fallback */ }
                    return;
                }
            }
            showToast(t("locationNotAvailable"));
        }

        /**
         * Copy a map URL to the clipboard.
         * DOM-coupled helper: uses clipboard and toast UI.
         * @param {string | null} url
         * @returns {void}
         */
        function copyMapLink(url, successMessage = null) {
            hapticTap();
            if (!url) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url)
                    .then(() => showToast(successMessage || t("linkCopied")))
                    .catch(() => showToast(t("copyFailed")));
            } else {
                showToast(t("copyUnsupported"));
            }
        }

        /**
         * Share a location using the Web Share API, with clipboard fallback.
         * DOM-coupled helper: uses browser share/clipboard APIs and toasts.
         * @param {Object} location
         * @param {string} url
         * @returns {void}
         */
        function shareLocation(locationName, url) {
            hapticTap();
            if (!url) return;
            const sharePayload = {
                title: locationName || t("unnamedLocation"),
                text: locationName || t("unnamedLocation"),
                url
            };
            if (navigator.share) {
                navigator.share(sharePayload).catch(() => {
                    copyMapLink(url, t("shareFallbackCopied"));
                });
            } else {
                copyMapLink(url, t("shareFallbackCopied"));
            }
        }

        /**
         * Render an array of chips or a fallback line.
         * DOM-coupled helper: returns HTML only.
         * @param {Array<string>} items
         * @param {string} emptyLabel
         * @returns {string}
         */
        function renderChipList(items, emptyLabel) {
            if (!Array.isArray(items) || items.length === 0) {
                return `<p class="text-xs font-medium text-slate-500 italic">${escapeHtml(emptyLabel)}</p>`;
            }
            return `<div class="flex flex-wrap gap-2">${items.map((item) => `<span class="chip bg-slate-100 text-slate-600 text-[11px] font-bold px-4 py-2 rounded-full">${escapeHtml(item)}</span>`).join("")}</div>`;
        }

        /**
         * Render the coordinate block for a location.
         * DOM-coupled helper: returns HTML only.
         * @param {Object} location
         * @returns {string}
         */
        function renderCoordinates(location) {
            const coordinates = location && location.coordinates;
            const mapUrl = getMapUrl(location);
            const coordsText = (coordinates && coordinates.latitude != null && coordinates.longitude != null)
                ? `${coordinates.latitude}, ${coordinates.longitude}`
                : t("coordinatesNotAvailable");

            return `
                <p class="text-xs font-bold text-slate-700 mb-4">${escapeHtml(coordsText)}</p>
                <div class="modal-footer-sticky">
                    <button class="share-btn tap-shrink" aria-label="${escapeHtml(t("share"))}" ${mapUrl ? "" : "disabled"}>
                        <i data-lucide="share-2" class="w-4 h-4"></i>
                    </button>
                    <button class="copy-link-btn tap-shrink" aria-label="${escapeHtml(t("copyLink"))}" ${mapUrl ? "" : "disabled"}>
                        <i data-lucide="clipboard" class="w-4 h-4"></i>
                    </button>
                    <button class="navigate-btn tap-shrink" aria-label="${escapeHtml(t("navigateToLocation"))}" ${mapUrl ? "" : "disabled"}>
                        <i data-lucide="map-pin" class="w-4 h-4"></i>
                        <span>${escapeHtml(t("navigateToLocation"))}</span>
                    </button>
                </div>
                ${!mapUrl ? `<p class="text-[11px] font-semibold text-slate-500 italic mt-2 text-center">${escapeHtml(t("locationNotAvailable"))}</p>` : ""}
            `;
        }

        /**
         * Render breadcrumb markup for department locations.
         * DOM-coupled helper: returns HTML only.
         * @param {Object} location
         * @returns {string}
         */
        function renderBreadcrumb(location) {
            const rawCrumbs = [location.school, location.parent, location.name || t("unnamedLocation")].filter(Boolean);
            const crumbs = rawCrumbs.map(crumb => getTranslatedContent(crumb, currentLang));
            if (crumbs.length <= 1) return "";
            return `
                <nav aria-label="Breadcrumb" class="breadcrumb text-[11px] font-bold text-slate-500">
                    ${crumbs.map((crumb, index) => `
                        ${index > 0 ? '<i data-lucide="chevron-right" class="w-3 h-3"></i>' : ""}
                        <span class="${index === crumbs.length - 1 ? "text-red-600" : ""}">${escapeHtml(crumb)}</span>
                    `).join("")}
                </nav>
            `;
        }

        function getCardHeader(location, locationName, icon) {
            // Deprecated helper: card header is now rendered inline inside renderCard to support flex layouts
            return "";
        }

        function renderCard(location, originalIndex) {
            const locationId = getLocationStorageKey(location);
            const description = location.description && location.description.trim() !== "" ? location.description : t("noDescription");
            const mapUrl = getMapUrl(location);
            
            // Apply language translations
            const locationName = getTranslatedContent(location.name || t("unnamedLocation"), currentLang);
            const translatedDescription = getTranslatedContent(description, currentLang);
            const parentName = getTranslatedContent(location.parent, currentLang);

            const buildingText = parentName || "Campus Grounds";
            const categoryIcon = CATEGORY_ICONS[location.category] || DEFAULT_ICON;
            const categoryLabel = formatCategoryLabel(location.category);

            // Keyword Service Chips (compact, elegant, rounded-lg, wrap naturally)
            let keywordChipsHtml = "";
            if (location.keywords && location.keywords.length > 0) {
                const chips = location.keywords.slice(0, 4).map(kw => `
                    <span class="card-keyword-chip inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-slate-650 dark:text-slate-400 border border-slate-200/60 dark:border-white/5 bg-slate-50/20 dark:bg-slate-900/10 rounded-lg transition-all duration-200">
                        <i data-lucide="check-circle" class="w-3 h-3 text-red-655 dark:text-red-500 flex-shrink-0"></i>
                        <span>${escapeHtml(kw)}</span>
                    </span>
                `).join("");
                
                keywordChipsHtml = `
                <div class="flex flex-wrap gap-1.5 mt-4 w-full">
                    ${chips}
                </div>
                `;
            }

            return `
                <li class="card-shell card tap-shrink bg-white rounded-3xl p-5 relative overflow-hidden cursor-pointer focus-within:ring-2 focus-within:ring-red-500 flex flex-col min-h-[250px]"
                    data-location-id="${escapeHtml(locationId)}" data-original-index="${originalIndex}"
                    data-category="${escapeHtml(location.category)}">

                    <button class="card-details-trigger absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 text-left" 
                        aria-label="${escapeHtml(t("viewDetails"))} ${escapeHtml(locationName)}"></button>

                    <div class="card-main flex-1 flex flex-col justify-between">
                        <div>
                            <!-- Header Row (Title + Badge) -->
                            <div class="flex items-start justify-between gap-4 w-full">
                                <div class="min-w-0">
                                    <h2 class="card-title text-lg font-black text-slate-900 dark:text-white leading-tight">${escapeHtml(locationName)}</h2>
                                </div>
                                <span class="card-category-badge inline-block px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border border-red-500/20 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-955/20 whitespace-nowrap self-start">
                                    ${escapeHtml(formatCategoryLabel(location.category))}
                                </span>
                            </div>

                            <!-- Sub-header Parent Row -->
                            <div class="flex items-center gap-2 mt-2 text-slate-500 dark:text-slate-400">
                                <i data-lucide="map-pin" class="w-3.5 h-3.5 text-red-600 dark:text-red-500"></i>
                                <span class="text-xs font-semibold">${escapeHtml(buildingText)}</span>
                                <span class="text-xs text-slate-300 dark:text-slate-700">|</span>
                                <span class="text-xs font-bold text-slate-400 dark:text-slate-500">SU</span>
                            </div>

                            <!-- Info Bar -->
                            <div class="card-info-bar mt-4 flex items-center justify-between border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl p-3 text-xs w-full gap-2">
                                <!-- Location Column -->
                                <div class="flex items-center gap-2 min-w-0 flex-1">
                                    <div class="w-7 h-7 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
                                        <i data-lucide="map-pin" class="w-3.5 h-3.5 text-red-655 dark:text-red-500"></i>
                                    </div>
                                    <div class="min-w-0">
                                        <p class="font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">${escapeHtml(buildingText)}</p>
                                    </div>
                                </div>
                                
                                <div class="w-px h-6 bg-slate-200/60 dark:bg-white/5 flex-shrink-0"></div>
                                
                                <!-- Category Column -->
                                <div class="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                                    <i data-lucide="${categoryIcon}" class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0"></i>
                                    <span class="font-semibold text-slate-650 dark:text-slate-400 text-[11px] truncate">${escapeHtml(categoryLabel)}</span>
                                </div>
                            </div>

                            <!-- Description (Up to 4 lines) -->
                            <p class="card-description mt-3.5 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-4">
                                ${escapeHtml(translatedDescription)}
                            </p>

                            <!-- Keyword Chips -->
                            ${keywordChipsHtml}
                        </div>

                        <!-- Action Bar -->
                        <div class="card-action-bar flex items-center gap-3 pt-4 mt-6 border-t border-slate-100 dark:border-white/5 w-full">
                            <!-- View Details button -->
                            <button class="card-action-btn-outline tap-shrink flex-1 flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 font-black text-xs relative z-20"
                                    style="min-height:44px;"
                                    aria-label="${escapeHtml(t("viewDetails"))} ${escapeHtml(locationName)}">
                                <div class="flex items-center gap-2">
                                    <i data-lucide="info" class="w-4 h-4"></i>
                                    <span>${escapeHtml(t("viewDetails"))}</span>
                                </div>
                                <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                            </button>
                            
                            <!-- Navigate button -->
                            <button class="card-action-btn-primary tap-shrink flex-1 flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black text-xs relative z-20"
                                    style="min-height:44px;"
                                    ${mapUrl ? "" : "disabled"}
                                    data-map-url="${escapeHtml(mapUrl || '')}">
                                <div class="flex items-center gap-2">
                                    <i data-lucide="navigation" class="w-4 h-4"></i>
                                    <span>${escapeHtml(t("navigate"))}</span>
                                </div>
                                <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                    </div>
                </li>
            `;
        }

        /**
         * Prepare the display order for the current filtered results.
         * @param {Array<number>} indexes
         * @returns {Array<number>}
         */
        function getDisplayIndexes(indexes) {
            return sortFilteredIndexes(indexes);
        }

        /**
         * Decide the empty state copy.
         * @returns {string}
         */
        function getEmptyStateCopy() {
            return t("emptyStateText");
        }

        /**
         * Handle opening a card from click or keyboard.
         * @param {Event} event
         * @param {number} index
         * @param {string} locationId
         * @returns {void}
         */
        function handleCardActivate(event, index, locationId) {
            if (event && event.type === "keydown") {
                const key = event.key;
                if (key !== "Enter" && key !== " ") return;
                event.preventDefault();
            }

            if (event && event.target instanceof HTMLElement && event.target.closest("button")) {
                if (!event.target.closest(".card-details-trigger")) {
                    return;
                }
            }

            openModal(index);
        }

        /**
         * Ensure the rowHeights cache has an entry (possibly null/unmeasured)
         * for every row in the current list, without discarding heights we
         * already know for rows that still exist.
         * @param {number} totalRows
         * @returns {void}
         */
        function ensureRowHeightsCapacity(totalRows) {
            if (virtualState.rowHeights.length < totalRows) {
                for (let i = virtualState.rowHeights.length; i < totalRows; i++) {
                    virtualState.rowHeights.push(null);
                }
            } else if (virtualState.rowHeights.length > totalRows) {
                virtualState.rowHeights.length = totalRows;
            }
        }

        /**
         * Measure the currently rendered cards and record the REAL height of
         * each visible row (cards are not uniform height, so this is per-row,
         * not a single global constant). Also refreshes the rolling-average
         * estimate used for rows we haven't rendered/measured yet.
         * DOM-coupled helper: reads rendered cards only.
         * @returns {void}
         */
        function refineVirtualEstimate() {
            const list = getEl("locationList");
            if (!list) return;
            const cards = Array.from(list.querySelectorAll(".card-shell"));
            if (!cards.length) return;
            const cols = Math.max(1, getVirtualCols());

            if (virtualState.lastMeasuredCols !== cols) {
                // Column count changed (responsive breakpoint) - row groupings
                // shifted, so previously cached row heights no longer line up
                // with the right cards. Start the cache over.
                virtualState.rowHeights = [];
                virtualState.lastMeasuredCols = cols;
            }

            const rowGap = Number.parseFloat(window.getComputedStyle(list).rowGap) || 16;
            const startRow = Math.floor(virtualState.start / cols);

            for (let i = 0; i < cards.length; i += cols) {
                const rowCards = cards.slice(i, i + cols);
                const rowHeight = Math.max(...rowCards.map((card) => card.getBoundingClientRect().height));
                if (rowHeight > 0) {
                    const rowIndex = startRow + Math.floor(i / cols);
                    virtualState.rowHeights[rowIndex] = rowHeight + rowGap;
                }
            }

            const measured = virtualState.rowHeights.filter((h) => h != null);
            if (measured.length) {
                virtualState.estimatedRowHeight = Math.round(
                    measured.reduce((sum, h) => sum + h, 0) / measured.length
                );
            }
        }

        /**
         * Build cumulative pixel offsets for the start of every row, using
         * real measured heights where we have them and the rolling-average
         * estimate elsewhere. offsets[i] = pixel offset of the top of row i;
         * offsets[totalRows] = total content height.
         * @param {number} totalRows
         * @returns {Array<number>}
         */
        function getCumulativeRowOffsets(totalRows) {
            const offsets = new Array(totalRows + 1);
            offsets[0] = 0;
            for (let row = 0; row < totalRows; row++) {
                const height = virtualState.rowHeights[row] != null
                    ? virtualState.rowHeights[row]
                    : virtualState.estimatedRowHeight;
                offsets[row + 1] = offsets[row] + height;
            }
            return offsets;
        }

        /**
         * Binary search: the greatest row index whose offset is <= targetOffset.
         * @param {Array<number>} offsets
         * @param {number} targetOffset
         * @returns {number}
         */
        function findRowForOffset(offsets, targetOffset) {
            let lo = 0;
            let hi = offsets.length - 1;
            while (lo < hi) {
                const mid = Math.ceil((lo + hi) / 2);
                if (offsets[mid] <= targetOffset) {
                    lo = mid;
                } else {
                    hi = mid - 1;
                }
            }
            return lo;
        }

        function syncLayoutMetrics() {
            const header = getEl("pageHeader");
            if (!header) return;
            const headerHeight = Math.ceil(header.getBoundingClientRect().height);
            document.documentElement.style.setProperty("--cc-header-height", `${headerHeight}px`);
        }

        function wireLayoutMetrics() {
            syncLayoutMetrics();
            if (typeof ResizeObserver !== "undefined" && !headerResizeObserver) {
                const header = getEl("pageHeader");
                if (header) {
                    headerResizeObserver = new ResizeObserver(() => {
                        syncLayoutMetrics();
                    });
                    headerResizeObserver.observe(header);
                }
            }
            window.addEventListener("resize", syncLayoutMetrics);
        }

        function getVirtualCols() {
            const list = getEl("locationList");
            if (!list) return 1;
            const gridCols = window.getComputedStyle(list).gridTemplateColumns;
            if (!gridCols || gridCols === "none") return 1;
            return Math.max(1, gridCols.split(' ').length);
        }

        /**
         * Compute the current virtualized row range for the scroll position,
         * using real per-row offsets rather than assuming every row is the
         * same height. Pure function given the offsets table: no DOM access.
         * @param {number} totalRows
         * @param {Array<number>} offsets cumulative row offsets, length totalRows+1
         * @param {number} scrollTop
         * @param {number} viewportHeight
         * @returns {{startRow:number,endRow:number}}
         */
        function getVirtualRowWindow(totalRows, offsets, scrollTop, viewportHeight) {
            const centerRow = findRowForOffset(offsets, scrollTop);
            const startRow = Math.max(0, centerRow - VIRTUAL_OVERSCAN);

            const bottomTarget = scrollTop + viewportHeight;
            let endRow = centerRow;
            while (endRow < totalRows && offsets[endRow] < bottomTarget) {
                endRow++;
            }
            endRow = Math.min(totalRows, endRow + VIRTUAL_OVERSCAN);

            return { startRow, endRow };
        }

        /**
         * Render the current virtualized list window.
         * DOM-coupled helper: updates spacer heights and visible card nodes.
         * @param {boolean} [resetScroll=false]
         * @returns {void}
         */
        function renderVirtualizedList(resetScroll = false) {
            const list = getEl("locationList");
            const topSpacer = getEl("listSpacerTop");
            const bottomSpacer = getEl("listSpacerBottom");
            const emptyState = getEl("emptyState");
            if (!list || !topSpacer || !bottomSpacer || !emptyState) return;

            const displayIndexes = getDisplayIndexes(filteredIndexes);
            const total = displayIndexes.length;
            virtualState.total = total;
            const emptyText = getEl("emptyStateText");
            if (emptyText) emptyText.textContent = getEmptyStateCopy();

            if (total === 0) {
                list.innerHTML = "";
                topSpacer.style.height = "0px";
                bottomSpacer.style.height = "0px";
                emptyState.classList.remove("hidden");
                return;
            }

            emptyState.classList.add("hidden");

            if (resetScroll) {
                window.scrollTo({ top: 0, behavior: "instant" });
                // The list content is changing (new filter/search results), so
                // previously measured row heights no longer correspond to the
                // right items. Start the height cache fresh to avoid stale
                // offsets from the old result set.
                virtualState.rowHeights = [];
                virtualState.lastMeasuredCols = null;
                const mainContent = getEl("mainContent");
                if (mainContent) {
                    mainContent.classList.add("animate-entrance");
                }
            }

            const cols = getVirtualCols();
            const mainContent = getEl("mainContent");
            const contentTop = mainContent ? mainContent.offsetTop : 0;
            const virtualScrollTop = Math.max(0, window.scrollY - contentTop);
            const viewportHeight = Math.max(1, window.innerHeight);

            const totalRows = Math.ceil(total / cols);
            ensureRowHeightsCapacity(totalRows);
            const offsets = getCumulativeRowOffsets(totalRows);

            const { startRow, endRow } = getVirtualRowWindow(totalRows, offsets, virtualScrollTop, viewportHeight);
            const start = Math.min(total, startRow * cols);
            const end = Math.min(total, endRow * cols);

            const signature = `${start}:${end}:${total}:${cols}:${Math.round(virtualState.estimatedRowHeight)}`;
            if (signature === virtualState.lastSignature) return;
            virtualState.start = start;
            virtualState.end = end;
            virtualState.lastSignature = signature;

            topSpacer.style.height = `${offsets[startRow]}px`;
            bottomSpacer.style.height = `${Math.max(0, offsets[totalRows] - offsets[endRow])}px`;

            list.innerHTML = displayIndexes.slice(start, end).map((originalIndex) => renderCard(allLocations[originalIndex], originalIndex)).join("");
            initIconsForRoot(list);
            refineVirtualEstimate();
            initIconsForRoot(getEl("aboutPanel"));
        }

        function getModalDepartmentSection(location) {
            if (location.category !== "department") return "";
            const translatedSchool = getTranslatedContent(location.school || location.parent || t("notSpecified"), currentLang);
            const translatedParent = getTranslatedContent(location.parent || t("notSpecified"), currentLang);
            return `
                <div class="mt-4">
                    <p class="text-[10px] uppercase font-bold text-slate-500 mb-2">${escapeHtml(t("fieldSchool"))}</p>
                    <p class="text-sm font-bold text-slate-700 mb-4">${escapeHtml(translatedSchool)}</p>
                    <p class="text-[10px] uppercase font-bold text-slate-500 mb-2">${escapeHtml(t("fieldParentBuilding"))}</p>
                    <p class="text-sm font-bold text-slate-700 mb-4">${escapeHtml(translatedParent)}</p>
                    <p class="text-[10px] uppercase font-bold text-slate-500 mb-2">${escapeHtml(t("fieldCoursesOffered"))}</p>
                    ${renderChipList(location.courses, t("noCourses"))}
                </div>
            `;
        }

        function getModalHeaderActions(location, locationId, icon) {
            const translatedName = getTranslatedContent(location.name || t("unnamedLocation"), currentLang);
            return `
                <div class="modal-header-actions mb-4 pr-8">
                    <div class="modal-header-meta" id="modalTitleRegion">
                        <div class="flex items-center gap-3 mb-3 min-w-0">
                            <div class="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                                <i data-lucide="${icon}" class="w-5 h-5 text-red-600"></i>
                            </div>
                            <h2 class="text-xl font-extrabold text-black dark:text-slate-200 break-words leading-tight">${escapeHtml(translatedName)}</h2>
                        </div>
                        <span class="inline-block bg-red-50 text-red-700 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tight">
                            ${escapeHtml(formatCategoryLabel(location.category))}
                        </span>
                    </div>
                </div>
            `;
        }

        function getModalBody(location) {
            const parentName = getTranslatedContent(location.parent || t("fieldParentTopLevel"), currentLang);
            const description = location.description && location.description.trim() !== "" ? location.description : t("noDescription");
            const translatedDescription = getTranslatedContent(description, currentLang);
            return `
                <p class="text-[10px] uppercase font-bold text-slate-500 mb-2">${escapeHtml(t("fieldParent"))}</p>
                <p class="text-sm font-bold text-slate-700 mb-4">${escapeHtml(parentName)}</p>
                <p class="text-[10px] uppercase font-bold text-slate-500 mb-2">${escapeHtml(t("fieldDescription"))}</p>
                <p class="text-sm font-medium text-slate-600 mb-4">${escapeHtml(translatedDescription)}</p>
                <p class="text-[10px] uppercase font-bold text-slate-500 mb-2">${escapeHtml(t("fieldKeywords"))}</p>
                <div class="mb-4">${renderChipList(location.keywords, t("noKeywords"))}</div>
                <p class="text-[10px] uppercase font-bold text-slate-500 mb-2">${escapeHtml(t("fieldAliases"))}</p>
                <div class="mb-4">${renderChipList(location.aliases, t("noAliases"))}</div>
                ${getModalDepartmentSection(location)}
                <p class="text-[10px] uppercase font-bold text-slate-500 mb-2 mt-8">${escapeHtml(t("fieldCoordinates"))}</p>
                ${renderCoordinates(location)}
            `;
        }

        /**
         * Open the detail modal for a specific location index.
         * DOM-coupled helper: mutates modal visibility and scroll.
         * @param {number} index
         * @returns {void}
         */
        function openModal(index) {
            const location = allLocations[index];
            if (!location) return;
            
            const locationId = getLocationStorageKey(location);
            lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            recordLocationView(location);

            const modalContent = DOMUtils.get("modalContent");
            if (!modalContent) return;

            const icon = CATEGORY_ICONS[location.category] || DEFAULT_ICON;
            const breadcrumb = location.category === "department" ? renderBreadcrumb(location) : "";

            modalContent.innerHTML = `
                ${breadcrumb}
                ${getModalHeaderActions(location, locationId, icon)}
                ${getModalBody(location)}
            `;

            const mapUrl = getMapUrl(location);
            if (mapUrl) {
                const navigateBtn = modalContent.querySelector(".navigate-btn");
                if (navigateBtn) {
                    navigateBtn.addEventListener("click", () => navigateToLocation(mapUrl));
                }
                const shareBtn = modalContent.querySelector(".share-btn");
                if (shareBtn) {
                    const locationNameTranslated = getTranslatedContent(location.name || t("unnamedLocation"), currentLang);
                    shareBtn.addEventListener("click", () => shareLocation(locationNameTranslated, mapUrl));
                }
                const copyLinkBtn = modalContent.querySelector(".copy-link-btn");
                if (copyLinkBtn) {
                    copyLinkBtn.addEventListener("click", () => copyMapLink(mapUrl));
                }
            }

            const modal = DOMUtils.get("detailModal");
            if (!modal) return;
            window.history.pushState({ modalOpen: true }, "");
            document.documentElement.classList.add("no-scroll");
            DOMUtils.show(modal);
            modal.classList.add("flex");
            initIconsForRoot(modalContent);

            const scrollBody = getEl("modalScrollBody");
            if (scrollBody) scrollBody.scrollTop = 0;

            requestAnimationFrame(() => {
                modal.classList.add("modal-visible", "modal-overlay-active");
            });

            const closeBtn = getEl("modalCloseBtn");
            if (closeBtn) closeBtn.focus();
        }

        /**
         * Close the detail modal and restore prior focus.
         * DOM-coupled helper: updates modal visibility.
         * @returns {void}
         */
        function closeModal(triggerHistoryBack = true) {
            const modal = getEl("detailModal");
            if (!modal) return;
            const panel = getEl("modalPanel");
            const finish = () => {
                DOMUtils.hide(modal);
                modal.classList.remove("flex");
                document.documentElement.classList.remove("no-scroll");
                if (panel) panel.style.transform = "";
                if (lastFocusedElement && typeof lastFocusedElement.focus === "function" && document.contains(lastFocusedElement)) {
                    lastFocusedElement.focus();
                } else {
                    const searchInput = getEl("searchInput");
                    if (searchInput) searchInput.focus();
                }
            };
            modal.classList.remove("modal-visible", "modal-overlay-active");
            if (triggerHistoryBack && window.history.state && window.history.state.modalOpen) {
                window.history.back();
            }
            if (prefersReducedMotion()) {
                finish();
            } else {
                setTimeout(finish, 220);
            }
        }

        /**
         * Opens the onboarding and FAQ modal.
         * @returns {void}
         */
        function openOnboarding() {
            const modal = getEl("onboardingModal");
            if (!modal) return;
            document.documentElement.classList.add("no-scroll");
            DOMUtils.show(modal);
            modal.classList.add("flex");
            
            const scrollBody = getEl("onboardingScrollBody");
            if (scrollBody) scrollBody.scrollTop = 0;

            requestAnimationFrame(() => {
                modal.classList.add("modal-visible", "modal-overlay-active");
            });

            // Set focus to start button
            const startBtn = getEl("onboardingStartBtn");
            if (startBtn) startBtn.focus();
        }

        /**
         * Close the onboarding and FAQ modal.
         * @returns {void}
         */
        function closeOnboarding() {
            const modal = getEl("onboardingModal");
            if (!modal) return;
            hapticTap();
            const finish = () => {
                DOMUtils.hide(modal);
                modal.classList.remove("flex");
                document.documentElement.classList.remove("no-scroll");
                const searchInput = getEl("searchInput");
                if (searchInput) searchInput.focus();
            };
            modal.classList.remove("modal-visible", "modal-overlay-active");
            if (prefersReducedMotion()) {
                finish();
            } else {
                setTimeout(finish, 220);
            }
        }

        /**
         * Opens the contact admission cell modal.
         * @returns {void}
         */
        function openContactPopup() {
            const modal = getEl("contactModal");
            if (!modal) return;
            document.documentElement.classList.add("no-scroll");
            DOMUtils.show(modal);
            modal.classList.add("flex");
            initIconsForRoot(modal);
            
            const scrollBody = getEl("contactScrollBody");
            if (scrollBody) scrollBody.scrollTop = 0;

            requestAnimationFrame(() => {
                modal.classList.add("modal-visible", "modal-overlay-active");
            });

            const closeBtn = getEl("contactCloseBtn");
            if (closeBtn) closeBtn.focus();
        }

        /**
         * Close the contact admission cell modal.
         * @returns {void}
         */
        function closeContactPopup() {
            const modal = getEl("contactModal");
            if (!modal) return;
            hapticTap();
            const finish = () => {
                DOMUtils.hide(modal);
                modal.classList.remove("flex");
                document.documentElement.classList.remove("no-scroll");
                const searchInput = getEl("searchInput");
                if (searchInput) searchInput.focus();
            };
            modal.classList.remove("modal-visible", "modal-overlay-active");
            if (prefersReducedMotion()) {
                finish();
            } else {
                setTimeout(finish, 220);
            }
        }

        /**
         * Initialize contact modal events.
         * @returns {void}
         */
        function initContact() {
            const modal = getEl("contactModal");
            if (!modal) return;

            const closeBtn = getEl("contactCloseBtn");
            if (closeBtn) closeBtn.addEventListener("click", closeContactPopup);

            const toggleBtn = getEl("contactToggleBtn");
            if (toggleBtn) {
                toggleBtn.addEventListener("click", openContactPopup);
            }

            // Collapsible SIEM branches toggle
            const siemToggleBtn = getEl("siemBranchesToggleBtn");
            const siemList = getEl("siemBranchesList");
            if (siemToggleBtn && siemList) {
                siemToggleBtn.addEventListener("click", () => {
                    hapticTap();
                    const isCollapsed = siemList.classList.contains("hidden");
                    if (isCollapsed) {
                        siemList.classList.remove("hidden");
                        siemToggleBtn.textContent = "Collapse branches";
                        siemToggleBtn.setAttribute("aria-expanded", "true");
                    } else {
                        siemList.classList.add("hidden");
                        siemToggleBtn.textContent = "View all branches";
                        siemToggleBtn.setAttribute("aria-expanded", "false");
                    }
                });
            }

            // Backdrop click close
            modal.addEventListener("click", (e) => {
                if (e.target === modal) {
                    closeContactPopup();
                }
            });

            // Escape key dismiss
            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape" && !modal.classList.contains("hidden")) {
                    closeContactPopup();
                }
            });
        }

        /**
         * Initialize onboarding modal events.
         * @returns {void}
         */
        function initOnboarding() {
            const modal = getEl("onboardingModal");
            if (!modal) return;

            const closeBtn = getEl("onboardingCloseBtn");
            if (closeBtn) closeBtn.addEventListener("click", closeOnboarding);

            const startBtn = getEl("onboardingStartBtn");
            if (startBtn) startBtn.addEventListener("click", closeOnboarding);

            // FAQ toggle click handlers
            const faqItems = modal.querySelectorAll(".faq-item");
            faqItems.forEach((item, index) => {
                const header = item.querySelector("h4");
                if (header) {
                    header.setAttribute("tabindex", "0");
                    header.setAttribute("role", "button");
                    
                    const toggleFaq = () => {
                        hapticTap();
                        const isOpen = item.classList.contains("faq-open");
                        faqItems.forEach(i => i.classList.remove("faq-open"));
                        if (!isOpen) {
                            item.classList.add("faq-open");
                        }
                    };

                    header.addEventListener("click", toggleFaq);
                    header.addEventListener("keydown", (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleFaq();
                        }
                    });
                }
            });

            // Backdrop click close
            modal.addEventListener("click", (e) => {
                if (e.target === modal) {
                    closeOnboarding();
                }
            });

            // Escape key dismiss
            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape" && !modal.classList.contains("hidden")) {
                    closeOnboarding();
                }
            });
        }

        /**
         * Show a short toast message.
         * DOM-coupled helper: mutates the toast banner.
         * @param {string} message
         * @returns {void}
         */
        function showToast(message) {
            const toast = getEl("toast");
            if (!toast) return;
            toast.textContent = message;
            toast.classList.add("toast-visible");
            clearTimeout(toastTimeoutId);
            toastTimeoutId = setTimeout(() => {
                toast.classList.remove("toast-visible");
            }, 1800);
        }

        // ===== MODULE: pwa.js (service worker registration, install prompt, offline banner) =====

        /**
         * Detect standalone display mode.
         * Pure-ish browser helper: no DOM mutation.
         * @returns {boolean}
         */
        function isStandaloneDisplay() {
            return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
        }

        /**
         * Detect iOS devices.
         * Pure-ish browser helper: no DOM mutation.
         * @returns {boolean}
         */
        function isIos() {
            return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
        }

        /**
         * Safe localStorage read helper.
         * @param {string} key
         * @returns {string | null}
         */
        function safeGetItem(key) {
            try {
                return localStorage.getItem(key);
            } catch (error) {
                return null;
            }
        }

        /**
         * Safe localStorage write helper.
         * @param {string} key
         * @param {string} value
         * @returns {void}
         */
        function safeSetItem(key, value) {
            try {
                localStorage.setItem(key, value);
            } catch (error) {
                // localStorage unavailable.
            }
        }

        /**
         * Update the offline banner according to navigator.onLine.
         * DOM-coupled helper: mutates the status banner.
         * @returns {void}
         */
        function updateOnlineStatus() {
            const banner = getEl("offlineBanner");
            if (!banner) return;
            clearTimeout(offlineHideTimeoutId);
            if (!navigator.onLine) {
                banner.classList.add("banner-visible");
            } else {
                banner.classList.remove("banner-visible");
            }
        }

        /**
         * Show the Android/Chrome install banner when the prompt is available.
         * @param {BeforeInstallPromptEvent} event
         * @returns {void}
         */
        function onBeforeInstallPrompt(event) {
            event.preventDefault();
            deferredInstallPrompt = event;
            if (isStandaloneDisplay() || safeGetItem(INSTALLED_KEY) === "true" || safeGetItem(INSTALL_DISMISSED_KEY) === "true") {
                return;
            }
            const banner = getEl("installBanner");
            if (banner) banner.classList.add("banner-shown");
        }

        /**
         * Trigger the deferred install prompt.
         * DOM-coupled helper: interacts with the browser prompt.
         * @returns {void}
         */
        function handleInstallClick() {
            hapticTap();
            const banner = getEl("installBanner");
            if (!banner) return;
            if (!deferredInstallPrompt) {
                banner.classList.remove("banner-shown");
                return;
            }
            deferredInstallPrompt.prompt();
            deferredInstallPrompt.userChoice.finally(() => {
                deferredInstallPrompt = null;
                banner.classList.remove("banner-shown");
            });
        }

        /**
         * Dismiss the install banner and remember that choice.
         * @returns {void}
         */
        function dismissInstallBanner() {
            hapticTap();
            const banner = getEl("installBanner");
            if (banner) banner.classList.remove("banner-shown");
            safeSetItem(INSTALL_DISMISSED_KEY, "true");
        }

        /**
         * Remember that the app was installed.
         * @returns {void}
         */
        function onAppInstalled() {
            safeSetItem(INSTALLED_KEY, "true");
            const banner = getEl("installBanner");
            if (banner) banner.classList.remove("banner-shown");
        }

        /**
         * Show the iOS add-to-home tip when appropriate.
         * @returns {void}
         */
        function maybeShowIosInstallTip() {
            if (!isIos()) return;
            if (isStandaloneDisplay()) return;
            if (safeGetItem(IOS_TIP_DISMISSED_KEY) === "true") return;
            const tip = getEl("iosInstallTip");
            if (tip) tip.classList.add("banner-shown");
        }

        /**
         * Dismiss the iOS add-to-home tip.
         * @returns {void}
         */
        function dismissIosInstallTip() {
            hapticTap();
            const tip = getEl("iosInstallTip");
            if (tip) tip.classList.remove("banner-shown");
            safeSetItem(IOS_TIP_DISMISSED_KEY, "true");
        }

        /**
         * Register the service worker for offline support.
         * @returns {void}
         */
        function registerServiceWorker() {
            if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
                if ("serviceWorker" in navigator) {
                    navigator.serviceWorker.getRegistrations().then((registrations) => {
                        for (const registration of registrations) {
                            registration.unregister().then(() => {
                                console.log("Developer Mode: SW unregistered successfully.");
                            });
                        }
                    });
                }
                return;
            }
            if ("serviceWorker" in navigator) {
                window.addEventListener("load", () => {
                    navigator.serviceWorker.register("sw.js").catch((error) => {
                        console.warn("Service worker registration failed:", error);
                    });
                });
            }
        }

        // ===== MODULE: app.js (init, event wiring, state) =====

        /**
         * Render the error banner and expose retry.
         * DOM-coupled helper: toggles the visible failure state.
         * @param {boolean} visible
         * @returns {void}
         */
        function setDataErrorVisible(visible) {
            DOMUtils.toggle(DOMUtils.get("dataErrorBanner"), visible);
            DOMUtils.toggle(DOMUtils.get("loader"), !visible);
        }

        /**
         * Retry the dataset load flow.
         * @returns {Promise<void>}
         */
        async function retryLoadData() {
            await loadData();
        }

        /**
         * Load the campus dataset, preferring the external file and falling back to the embedded JSON.
         * @returns {Promise<void>}
         */
        async function loadData() {
            setDataErrorVisible(false);

            const embeddedPayload = loadEmbeddedData();
            allLocations = extractLocations(embeddedPayload);
            datasetMeta = extractDatasetMeta(embeddedPayload, null, allLocations);

            if (allLocations.length === 0) {
                console.error("No campus locations could be loaded from the embedded source.");
                setDataErrorVisible(true);
                renderAboutPanel();
                return;
            }

            buildSearchIndex();
            buildCategoryList();
            renderFilters();
            applyFiltersAndSearch(true);
            renderAboutPanel();
            initIconsForRoot(document.body);
            getEl("loader")?.classList.add("hidden");
            // Ensure recent searches UI is populated after data availability.
            recentSearches = getRecentSearches();
            renderRecentSearches();
        }

        /**
         * Initialize the search/filter state and render the current slice.
         * @param {boolean} [resetScroll=true]
         * @returns {void}
         */
        function applyFiltersAndSearch(resetScroll = true) {
            const query = currentQuery;
            filteredIndexes = filterLocationIndexes(allLocations, searchIndex, query, currentFilter);
            recordSearchUsage(query);
            updateSearchResultsCount(filteredIndexes.length);
            renderVirtualizedList(resetScroll);
        }

        /**
         * Update an accessible search result count indicator.
         * DOM-coupled helper: updates aria-live region.
         * @param {number} count
         */
        function updateSearchResultsCount(count) {
            const id = 'searchResultCount';
            let el = document.getElementById(id);
            if (!el) {
                el = document.createElement('div');
                el.id = id;
                el.setAttribute('aria-live', 'polite');
                el.style.position = 'absolute';
                el.style.left = '-9999px';
                el.style.width = '1px';
                el.style.height = '1px';
                el.style.overflow = 'hidden';
                document.body.appendChild(el);
            }
            el.textContent = `${count} ${t('emptyStateText')}`;
        }

        /**
         * Apply a filter pill selection.
         * @param {string} category
         * @returns {void}
         */
        function setFilter(category) {
            currentFilter = category;
            recordFilterUsage(category);
            renderFilters();
            applyFiltersAndSearch(true);
            renderAboutPanel();
        }

        /**
         * React to search box input with a 200ms debounce.
         * @param {InputEvent} event
         * @returns {void}
         */
        function handleSearchInput(event) {
            currentQuery = normalizeText(event.target.value);
            debouncedApplyAll();
            // Toggle clear button visibility
            const clearBtn = getEl("searchClearBtn");
            if (clearBtn) {
                clearBtn.classList.toggle("visible", event.target.value.length > 0);
            }
        }

        /**
         * Clear the search input and reset results.
         * @returns {void}
         */
        function clearSearch() {
            const searchInput = getEl("searchInput");
            if (searchInput) {
                searchInput.value = "";
                searchInput.focus();
            }
            currentQuery = "";
            debouncedApplyAll();
            const clearBtn = getEl("searchClearBtn");
            if (clearBtn) clearBtn.classList.remove("visible");
        }

        /**
         * Rerender the virtualized list after a debounced search input.
         * @returns {void}
         */
        function debouncedApplyAllHandler() {
            applyFiltersAndSearch(true);
        }

        /**
         * Schedule a virtual list refresh on the next animation frame.
         * @returns {void}
         */
        function scheduleVirtualRender() {
            if (virtualRenderFrameId !== null) return;
            virtualRenderFrameId = window.requestAnimationFrame(() => {
                virtualRenderFrameId = null;
                renderVirtualizedList(false);
            });
        }

        /**
         * Wire the scroll and keyboard handlers for virtualized list.
         * @returns {void}
         */
        function wireListViewport() {
            window.addEventListener("scroll", () => {
                const mainContent = getEl("mainContent");
                if (mainContent && mainContent.classList.contains("animate-entrance")) {
                    mainContent.classList.remove("animate-entrance");
                }
                scheduleVirtualRender();
            }, { passive: true });
            window.addEventListener("resize", scheduleVirtualRender);
        }

        /**
         * Handle keydown for modal focus trapping and escape closure.
         * @param {KeyboardEvent} event
         * @returns {void}
         */
        function handleGlobalKeydown(event) {
            const detailModal = getEl("detailModal");
            const langOverlay = getEl("langPickerOverlay");
            const contactModal = getEl("contactModal");
            
            let activeModal = null;
            let activePanel = null;
            
            if (detailModal && !detailModal.classList.contains("hidden")) {
                activeModal = detailModal;
                activePanel = getEl("modalPanel");
            } else if (contactModal && !contactModal.classList.contains("hidden")) {
                activeModal = contactModal;
                activePanel = getEl("contactPanel");
            } else if (langOverlay && langOverlay.classList.contains("picker-shown")) {
                activeModal = langOverlay;
                activePanel = langOverlay.querySelector(".lang-picker-inner");
            }

            if (!activeModal || !activePanel) return;

            if (event.key === "Escape") {
                event.preventDefault();
                if (activeModal === detailModal) closeModal();
                if (activeModal === contactModal) closeContactPopup();
                if (activeModal === langOverlay) closeLangPicker();
                return;
            }

            if (event.key === "Tab") {
                const focusable = activePanel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (!activePanel.contains(document.activeElement)) {
                    event.preventDefault();
                    first.focus();
                    return;
                }

                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        }

        /**
         * Render the full-screen language picker options dynamically.
         * Prevents repetitive markup inside index.html.
         * @returns {void}
         */
        function renderLanguagePicker() {
            const container = getEl("langCardsContainer");
            if (!container) return;
            const langs = [
                { code: 'en', native: 'English', english: 'English' },
                { code: 'hi', native: 'हिंदी', english: 'Hindi' },
                { code: 'mr', native: 'मराठी', english: 'Marathi' },
                { code: 'mai', native: 'मैथिली', english: 'Maithili' },
                { code: 'te', native: 'తెలుగు', english: 'Telugu' },
                { code: 'ta', native: 'தமிழ்', english: 'Tamil' },
                { code: 'pt', native: 'Português', english: 'Portuguese' }
            ];
            container.innerHTML = langs.map(l => `
                <button class="lang-card tap-shrink" data-lang="${l.code}" aria-label="${escapeHtml(l.english)}">
                    <span>
                        <span class="lang-card-native">${escapeHtml(l.native)}</span>
                        <span class="lang-card-sub block">${escapeHtml(l.english)}</span>
                    </span>
                    <i data-lucide="chevron-right" class="w-5 h-5 opacity-70"></i>
                </button>
            `).join('');
            initIconsForRoot(container);
        }

        /**
         * Render loader skeleton cards dynamically.
         * Prevents repetitive markup inside index.html.
         * @returns {void}
         */
        function renderLoaderSkeletons() {
            const loader = getEl("loader");
            if (!loader) return;
            const skeletonHTML = `
                <div class="skeleton-card" aria-hidden="true">
                    <div class="skeleton-line h-4 w-2/3 mb-3"></div>
                    <div class="skeleton-line h-3 w-1/3 mb-4"></div>
                    <div class="skeleton-line h-3 w-full mb-2"></div>
                    <div class="skeleton-line h-3 w-4/5 mb-4"></div>
                    <div class="flex justify-between">
                        <div class="skeleton-line h-3 w-1/4"></div>
                        <div class="skeleton-line h-6 w-20 rounded-full"></div>
                    </div>
                </div>
            `;
            loader.innerHTML = Array(4).fill(skeletonHTML).join('');
        }

        /**
         * Initialize non-data UI and event wiring.
         * @returns {void}
         */
        function initUI() {
            renderLanguagePicker();
            renderLoaderSkeletons();
            applyThemeIcons();
            applyLanguageToStaticText();
            wireLayoutMetrics();
            renderFilters();
            renderAboutPanel();
            initIconsForRoot(document.body);
            wireListViewport();
            // Render recent searches if any and wire the recent search area
            recentSearches = getRecentSearches();
            renderRecentSearches();
        }

        /**
         * Set the app title and start the data flow.
         * @returns {void}
         */
        function bootApp() {
            updateOnlineStatus();
            maybeShowIosInstallTip();
            loadData();
        }

        /**
         * Initialize the search box and modal close handlers.
         * @returns {void}
         */
        function wireInteractiveHandlers() {
            const searchInput = getEl("searchInput");
            if (searchInput) {
                searchInput.addEventListener("input", handleSearchInput);
            }

            const modal = getEl("detailModal");
            if (modal) {
                modal.addEventListener("click", (event) => {
                    if (event.target === modal) closeModal();
                });
            }

            document.addEventListener("keydown", handleGlobalKeydown);
            window.addEventListener("online", updateOnlineStatus);
            window.addEventListener("offline", updateOnlineStatus);
            window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
            window.addEventListener("appinstalled", onAppInstalled);
            window.addEventListener("popstate", (event) => {
                const detailModal = getEl("detailModal");
                const langOverlay = getEl("langPickerOverlay");
                if (detailModal && detailModal.classList.contains("modal-overlay-active")) {
                    closeModal(false);
                }
                if (langOverlay && langOverlay.classList.contains("picker-visible")) {
                    closeLangPicker(false);
                }
            });

            window.addEventListener("scroll", handleScrollForTopBtn, { passive: true });

            // Bind static buttons programmatically to satisfy CSP (no inline onclick)
            const langToggleBtn = getEl("langToggleBtn");
            if (langToggleBtn) {
                langToggleBtn.addEventListener("click", () => openLangPicker(true));
            }
            const themeToggleBtn = getEl("themeToggleBtn");
            if (themeToggleBtn) {
                themeToggleBtn.addEventListener("click", toggleTheme);
            }
            const searchClearBtn = getEl("searchClearBtn");
            if (searchClearBtn) {
                searchClearBtn.addEventListener("click", clearSearch);
            }
            const retryLoadBtn = getEl("retryLoadBtn");
            if (retryLoadBtn) {
                retryLoadBtn.addEventListener("click", retryLoadData);
            }
            const aboutToggleBtn = getEl("aboutToggleBtn");
            if (aboutToggleBtn) {
                aboutToggleBtn.addEventListener("click", toggleAboutPanel);
            }
            const modalCloseBtn = getEl("modalCloseBtn");
            if (modalCloseBtn) {
                modalCloseBtn.addEventListener("click", closeModal);
            }
            const goToTopBtn = getEl("goToTopBtn");
            if (goToTopBtn) {
                goToTopBtn.addEventListener("click", scrollToTop);
            }
            const installBannerBtn = getEl("installBannerBtn");
            if (installBannerBtn) {
                installBannerBtn.addEventListener("click", handleInstallClick);
            }
            const installBannerDismissBtn = getEl("installBannerDismissBtn");
            if (installBannerDismissBtn) {
                installBannerDismissBtn.addEventListener("click", dismissInstallBanner);
            }
            const iosInstallTipDismissBtn = getEl("iosInstallTipDismissBtn");
            if (iosInstallTipDismissBtn) {
                iosInstallTipDismissBtn.addEventListener("click", dismissIosInstallTip);
            }

            // Event delegation for dynamic controls
            const filterContainer = getEl("filterContainer");
            if (filterContainer) {
                filterContainer.addEventListener("click", (event) => {
                    const btn = event.target.closest("button");
                    if (btn && btn.dataset.filter) {
                        setFilter(btn.dataset.filter);
                    }
                });
            }

            const recentWrap = getEl("recentSearchesWrap");
            if (recentWrap) {
                recentWrap.addEventListener("click", (event) => {
                    const btn = event.target.closest("button");
                    if (!btn) return;
                    if (btn.dataset.recentQuery) {
                        applyRecentSearch(btn.dataset.recentQuery);
                    } else if (btn.dataset.action === "clear-recent") {
                        clearRecentSearches();
                    }
                });
            }

            const langCardsContainer = getEl("langCardsContainer");
            if (langCardsContainer) {
                langCardsContainer.addEventListener("click", (event) => {
                    const card = event.target.closest(".lang-card");
                    if (card && card.dataset.lang) {
                        selectLanguage(card.dataset.lang);
                    }
                });
            }

            const locationList = getEl("locationList");
            if (locationList) {
                locationList.addEventListener("click", (event) => {
                    const target = event.target;
                    const cardShell = target.closest(".card-shell");
                    if (!cardShell) return;

                    const quickNav = target.closest(".quick-nav-btn") || target.closest(".navigate-btn-small");
                    if (quickNav) {
                        event.stopPropagation();
                        const locationId = cardShell.dataset.locationId;
                        const location = allLocations.find(l => getLocationStorageKey(l) === locationId);
                        if (location) {
                            const mapUrl = getMapUrl(location);
                            navigateToLocation(mapUrl);
                        }
                        return;
                    }

                    const originalIndex = parseInt(cardShell.dataset.originalIndex, 10);
                    const locationId = cardShell.dataset.locationId;
                    handleCardActivate(event, originalIndex, locationId);
                });

                locationList.addEventListener("keydown", (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        const cardShell = event.target.closest(".card-shell");
                        if (cardShell && document.activeElement === cardShell) {
                            event.preventDefault();
                            const originalIndex = parseInt(cardShell.dataset.originalIndex, 10);
                            const locationId = cardShell.dataset.locationId;
                            handleCardActivate(event, originalIndex, locationId);
                        }
                    }
                });
            }
        }

        /**
         * Toggles visibility of the Go To Top button based on scroll position.
         */
        function handleScrollForTopBtn() {
            const btn = getEl("goToTopBtn");
            if (!btn) return;
            if (window.scrollY > 300) {
                btn.classList.add("visible");
            } else {
                btn.classList.remove("visible");
            }
        }

        /**
         * Scrolls the window to the top smoothly.
         */
        function scrollToTop() {
            hapticTap();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }

        /**
         * Initialize the app when DOM content is available.
         * @returns {void}
         */
        function initApp() {
            firstLaunchPending = !initLanguage();
            // Load persisted UX preferences (recent searches)
            recentSearches = getRecentSearches();
            initUI();
            wireInteractiveHandlers();
            initOnboarding();
            initContact();
            debouncedApplyAll = debounce(debouncedApplyAllHandler, SEARCH_DEBOUNCE_MS);
            if (firstLaunchPending) {
                openLangPicker(true);
            } else {
                openOnboarding();
            }
        }

        /**
         * Debounced search application placeholder, assigned during init.
         * @type {Function}
         */
        let debouncedApplyAll = () => {};

        document.addEventListener("DOMContentLoaded", initApp);
        registerServiceWorker();
        window.addEventListener("load", bootApp);

        // Expose the inline event handlers already present in the HTML.
        window.openLangPicker = openLangPicker;
        window.closeLangPicker = closeLangPicker;
        window.selectLanguage = selectLanguage;
        window.toggleTheme = toggleTheme;
        window.showToast = showToast;
        window.getMapUrl = getMapUrl;
        window.navigateToLocation = navigateToLocation;
        window.copyMapLink = copyMapLink;
        window.openModal = openModal;
        window.closeModal = closeModal;
        window.openContactPopup = openContactPopup;
        window.closeContactPopup = closeContactPopup;
        window.setFilter = setFilter;
        window.handleInstallClick = handleInstallClick;
        window.dismissInstallBanner = dismissInstallBanner;
        window.dismissIosInstallTip = dismissIosInstallTip;
        window.retryLoadData = retryLoadData;
        window.toggleAboutPanel = toggleAboutPanel;
        window.loadData = loadData;
        window["scrollToTop"] = scrollToTop;
        window.clearSearch = clearSearch;
