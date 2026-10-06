/* Somphea Reak – Customer Storefront with Bilingual Khmer/English & On-Site Admin Editing */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

const DEFAULT_CHARMS = ['❤️','⭐','🌸','🦋','🐱','🍀','🌙','☀️','💎','🎀','🐶','🌈','⚽','🎵','🇰🇭','🔤','⚡','👑'];
const MAX_LINKS = 18;

/* ---------- Session & Localization ---------- */
function initSession() {
  const isRemember = localStorage.getItem('sr_remember') !== 'false';
  let raw = sessionStorage.getItem('sr_session');
  if (!raw && isRemember) {
    raw = localStorage.getItem('sr_session');
  }
  let s = null;
  try { s = JSON.parse(raw); } catch (e) {}
  return s || {
    userId: null,
    theme: 'dark',
    cart: [],
    lang: localStorage.getItem('sr_lang') || 'km'
  };
}

const S = initSession();
if (!S.lang) S.lang = 'km';

const save = () => {
  const remEl = document.getElementById('rememberMeCheckbox');
  const isRemember = remEl ? remEl.checked : (localStorage.getItem('sr_remember') !== 'false');
  if (isRemember) {
    localStorage.setItem('sr_session', JSON.stringify(S));
    sessionStorage.removeItem('sr_session');
    localStorage.setItem('sr_remember', 'true');
  } else {
    sessionStorage.setItem('sr_session', JSON.stringify(S));
    localStorage.removeItem('sr_session');
    localStorage.setItem('sr_remember', 'false');
  }
  localStorage.setItem('sr_lang', S.lang);
};
const cfg = () => SRDB.settings();
const me = () => {
  if (!S.userId) return null;
  const u = SRDB.user(S.userId);
  if (u) return u;
  return {
    id: S.userId,
    username: S.userId === 'Uadmin' ? 'admin' : 'vip_customer',
    phone: '+855 12 888 999',
    points: 50,
    vouchers: [],
    point_log: []
  };
};
let custom = [], pendingTg = null, selectedVoucher = null;

/* ---------- BILINGUAL TRANSLATION DICTIONARY (KHMER & ENGLISH) ---------- */
const I18N = {
  km: {
    siteTitle: 'សម្ភារៈ - Somphea Reak',
    subtitle: 'ស្ទូឌីយោលំដាប់ខ្ពស់',
    tagline: 'កម្ពុជា ព្រះរាជាណាចក្រអច្ឆរិយៈ',
    announcementDefault: '✨ ស្វាគមន៍មកកាន់ សម្ភារៈ ស្ទូឌីយោ • កម្ម៉ង់ទិញតាម Telegram • សន្ំពិន្ទុរាល់មុខទំនិញ!',
    
    // Login Gate
    gateStep1Title: 'ភ្ជាប់គណនី Telegram',
    gateStep1Desc: 'សូមចូលដោយប្រើ Telegram ដើម្បីបន្ត។ (ការចូលគណនីសាកល្បង)',
    gateUserLabel: 'ឈ្មោះគណនី Telegram',
    gateLoginBtn: 'ចូលដោយប្រើ Telegram',
    gateQuickTest: 'ចូលលឿនសម្រាប់តេស្ត (Test User +50 pt)',
    gateStep2Title: 'លេខទូរស័ព្ទទំនាក់ទំនង',
    gateConnectedAs: 'ភ្ជាប់ជាគណនី',
    gateVerified: 'បានផ្ទៀងផ្ទាត់ Telegram',
    gatePhoneLabel: 'លេខទូរស័ព្ទរបស់អ្នក',
    gatePhoneErr: 'សូមបញ្ចូលលេខទូរស័ព្ទត្រឹមត្រូវ (៨-៩ ខ្ទង់)',
    gateContinue: 'បន្តទៅមុខ',
    rememberMeText: 'ចងចាំខ្ញុំលើឧបករណ៍នេះ',
    clearLoginDataText: 'សម្អាតទិន្នន័យចូល',
    loginDataCleared: 'បានសម្អាតទិន្នន័យចូលគណនីរួចរាល់ ✨',
    gateAdminLink: '🔐 ចូលផ្ទាំង Admin',
    gateViewAdmin: '👑 មើលហាងជា Admin',

    // Top Navigation
    myPoints: 'ពិន្ទុ',
    myOrders: 'ប្រវត្តិកម្ម៉ង់',
    cart: 'កន្ត្រកទំនិញ',
    profile: 'គណនី',
    adminPortal: 'ផ្ទាំង Admin',

    // Hero & Sections
    designCharmBtn: '🔗 រចនាខ្សែដៃអ៊ីតាលី (Custom Italy Charm)',
    rewardsBtn: '⭐ ពិន្ទុរង្វាន់',
    uploadProdBtn: '＋ បន្ថែមទំនិញថ្មី',
    collectionsTitle: 'បណ្តុំម៉ូត និងប្រភេទផលិតផល',
    collectionsDesc: 'ស្វែងរកផលិតផលប្រណិតៗ វត្ថុអនុស្សាវរីយ៍ និងគ្រឿងអលង្ការកែច្នៃតាមចិត្ត',
    addCategoryBtn: '＋ បន្ថែមប្រភេទថ្មី',
    itemsCount: 'មុខទំនិញ',
    backToHome: '← ត្រឡប់ទៅទំព័រដើម',
    addProductHere: '＋ បន្ថែមទំនិញក្នុងប្រភេទនេះ',
    noItemsCat: 'មិនទាន់មានទំនិញក្នុងប្រភេទនេះនៅឡើយទេ',
    catalogCurating: 'ប្រភេទនេះកំពុងត្រូវបានរៀបចំទំនិញ',
    uploadFirstProd: '＋ បន្ថែមទំនិញដំបូង',
    generalShopTitle: 'ហាងទំនិញរួម • ផលិតផលទាំងអស់',
    generalShopDesc: 'ស្វែងរក និងជ្រើសរើសទំនិញទាំងអស់ក្នុងស្ទូឌីយោដោយងាយស្រួល',
    allFilter: 'ទាំងអស់',
    searchPlaceholder: '🔍 ស្វែងរកទំនិញ...',
    adminReasonNote: 'មូលហេតុពី Admin',
    voucherRefundedNotice: 'ប័ណ្ណបញ្ចុះតម្លៃត្រូវបានប្រគល់ជូនគណនីរបស់អ្នកវិញរួចរាល់ ✔',

    // Product Card & Taobao Features
    addToCart: 'ដាក់ក្នុងកន្ត្រក',
    soldOut: 'អស់ពីស្តុក',
    outOfStock: 'អស់ពីស្តុក',
    inStock: 'ក្នុងស្តុក',
    pointsPlus: 'ពិន្ទុ',
    editPriceStock: '✏️ កែប្រែតម្លៃ/ស្តុក',
    sortRecommend: 'ពេញនិយម',
    sortSales: 'លក់ដាច់ច្រើន',
    sortPrice: 'តម្លៃ',
    sortNew: 'ថ្មីៗ',
    sortInStock: 'មានក្នុងស្តុក',
    freeShipping: 'ដឹកឥតគិតថ្លៃ',
    studioPick: 'ម៉ូតពិសេស',
    soldCount: 'លក់ដាច់ {n}+',
    quickView: 'មើលព័ត៌មានលម្អិត',
    buyNow: 'ទិញភ្លាមៗ',
    onlyLeft: 'នៅសល់តែ {n}',
    navHome: 'ទំព័រដើម',
    navShop: 'ទំនិញ',
    navCustom: 'ខ្សែដៃ',
    navCart: 'កន្ត្រក',
    navOrders: 'កម្ម៉ង់',
    navProfile: 'គណនី',

    // Cart
    cartTitle: 'កន្ត្រកទំនិញរបស់អ្នក',
    cartEmpty: 'កន្ត្រកទំនិញរបស់អ្នកនៅទទេ',
    startShopping: 'ចាប់ផ្តើមទិញទំនិញ',
    summary: 'សង្ខេបការទិញ',
    subtotal: 'តម្លៃសរុបរង',
    deliveryFee: 'ថ្លៃដឹកជញ្ជូន',
    pointsEarn: 'ពិន្ទុដែលអ្នកនឹងទទួលបាន',
    proceedCheckout: 'បន្តទៅការទូទាត់ប្រាក់ →',
    remove: 'លុប',

    // Checkout
    checkoutTitle: 'ព័ត៌មានដឹកជញ្ជូន',
    checkoutDesc: 'សេវាដឹកជញ្ជូនរហ័ស និងសុវត្ថិភាពទូទាំងប្រទេសកម្ពុជា',
    recipientName: 'ឈ្មោះអ្នកទទួល',
    contactPhone: 'លេខទូរស័ព្ទទំនាក់ទំនង',
    provinceCity: 'រាជធានី / ខេត្ត',
    deliveryAddr: 'អាសយដ្ឋានដឹកជញ្ជូន (ផ្ទះលេខ ផ្លូវ សង្កាត់...)',
    paymentMethod: 'វិធីសាស្ត្រទូទាត់ប្រាក់',
    applyVoucher: '🎟️ ប្រើប្រាស់ប័ណ្ណបញ្ចុះតម្លៃ',
    selectVoucher: 'ជ្រើសរើសប័ណ្ណបញ្ចុះតម្លៃ',
    noVouchers: 'មិនមានប័ណ្ណបញ្ចុះតម្លៃនៅឡើយទេ – ប្តូរក្នុង Rewards',
    voucherDiscount: 'បញ្ចុះតម្លៃប័ណ្ណ',
    totalAmount: 'តម្លៃសរុបចុងក្រោយ',
    placeOrderBtn: 'បញ្ជាក់ និងកម្ម៉ង់ទិញ 🧾',
    fillRequired: 'សូមបញ្ចូលឈ្មោះអ្នកទទួល និងអាសយដ្ឋានដឹកជញ្ជូន',
    selectVoucherBtn: '🎟️ ជ្រើសរើសប័ណ្ណ',
    selectVoucherTitle: 'ជ្រើសរើសប័ណ្ណបញ្ចុះតម្លៃ',
    selectVoucherDesc: 'ជ្រើសរើសប័ណ្ណដែលមានក្នុងគណនី ឬបញ្ចូលកូដប្រូម៉ូសិន',
    activeVoucher: 'ប័ណ្ណដែលកំពុងប្រើ',
    removeVoucher: 'ដកប័ណ្ណចេញ',
    applied: 'បានជ្រើសរើស',
    applyVoucherAction: 'ប្រើប័ណ្ណនេះ',
    noVouchersAvailable: 'អ្នកមិនទាន់មានប័ណ្ណបញ្ចុះតម្លៃនៅឡើយទេ',
    claimVoucherInRewards: '⭐ ប្តូរយកប័ណ្ណក្នុង Rewards',
    havePromoCode: 'មានកូដប្រូម៉ូសិនពីហាង?',
    applyCodeBtn: 'ប្រើកូដ',
    closeModalBtn: 'បិទ',
    voucherApplied: 'បានប្រើប័ណ្ណ {code} ({pct}% OFF) ✨',
    voucherRemoved: 'បានដកប័ណ្ណបញ្ចុះតម្លៃចេញរួចរាល់',
    enterVoucherCode: 'សូមបញ្ចូលកូដប័ណ្ណបញ្ចុះតម្លៃ',
    invalidVoucherCode: 'កូដប័ណ្ណមិនត្រឹមត្រូវ ឬផុតកំណត់',
    myVouchersBtn: '🎟️ ប័ណ្ណបញ្ចុះតម្លៃរបស់ខ្ញុំ',
    customerServiceBtn: '💬 ទំនាក់ទំនង Telegram ហាង',

    // Order Placed modal
    orderSubmitted: 'ការកម្ម៉ង់ត្រូវបានដាក់ជូន!',
    orderRef: 'លេខយោងការកម្ម៉ង់',
    pendingAdminNotice: 'វិក្កយបត្រត្រូវបានបញ្ជូនទៅ admin desk។',
    pendingStatus: '⏳ កំពុងរង់ចាំការបញ្ជាក់ពី Admin',
    pointsAwardNotice: 'ពិន្ទុ (+{p} pt) នឹងត្រូវបានបញ្ចូលដោយស្វ័យប្រវត្តិនៅពេល Admin អនុម័ត!',
    viewMyOrders: 'មើលប្រវត្តិកម្ម៉ង់',
    viewOfficialReceipt: 'មើលវិក្កយបត្រផ្លូវការ',

    // Receipt
    receiptTitle: 'វិក្កយបត្រផ្លូវការ',
    customer: 'អតិថិជន',
    recipient: 'អ្នកទទួល',
    phone: 'ទូរស័ព្ទ',
    address: 'អាសយដ្ឋាន',
    payment: 'វិធីទូទាត់',
    status: 'ស្ថានភាព',
    itemsList: 'មុខទំនិញដែលបានទិញ',
    printReceipt: '🖨️ ព្រីនវិក្កយបត្រ',
    close: 'បិទ',
    orderPlacedStep: 'បានបញ្ជាទិញ',

    // Rewards
    rewardsTitle: 'សមតុល្យពិន្ទុរបស់ខ្ញុំ',
    ptNextVoucher: 'ពិន្ទុទៀតដើម្បីទទួលបានប័ណ្ណបន្ទាប់',
    readyClaimVoucher: '🎉 អ្នកមានពិន្ទុគ្រប់គ្រាន់ដើម្បីប្តូរយកប័ណ្ណបញ្ចុះតម្លៃហើយ!',
    redeemBtn: 'ប្តូរយកប័ណ្ណបញ្ចុះតម្លៃ {pct}% · {cost} pt',
    howToEarnTitle: 'របៀបសន្ំពិន្ទុ',
    ruleMini: '១–២ ពិន្ទុ ក្នុងមួយតុក្កតា Mini / Toy',
    ruleReady: '៣ ពិន្ទុ ក្នុងមួយខ្សែដៃស្រាប់',
    ruleCustom: '{pt} ពិន្ទុ ក្នុងមួយខ្សែដៃកែច្នៃ Charm',
    ruleVoucher: '{cost} ពិន្ទុ = ប័ណ្ណបញ្ចុះតម្លៃ ១ ({pct}%)',
    myVouchersTitle: '🎟️ ប័ណ្ណបញ្ចុះតម្លៃរបស់ខ្ញុំ',
    noVouchersYet: 'មិនទាន់មានប័ណ្ណបញ្ចុះតម្លៃនៅឡើយទេ។ សន្ំពិន្ទុឱ្យបាន {cost} pt ដើម្បីប្តូរ!',
    available: 'អាចប្រើបាន',
    used: 'បានប្រើរួច',
    pointHistoryTitle: 'ប្រវត្តិពិន្ទុ',
    noPointHistory: 'មិនទាន់មានប្រវត្តិពិន្ទុនៅឡើយទេ',
    noOrdersYet: 'មិនទាន់មានប្រវត្តិការកម្ម៉ង់នៅឡើយទេ',
    voucherClaimedTitle: 'ប្តូរបានប័ណ្ណជោគជ័យ!',
    voucherClaimedDesc: 'រីករាយជាមួយការបញ្ចុះតម្លៃ {pct}% សម្រាប់ការកម្ម៉ង់បន្ទាប់',
    useInCheckoutBtn: 'ប្រើប្រាស់ពេលទូទាត់ប្រាក់',

    // Customizer
    customTitle: 'រចនាខ្សែដៃអ៊ីតាលី (CUSTOMIZE ITALY CHARM)',
    customDesc: 'ចុចលើរូប Charm ខាងក្រោមដើម្បីភ្ជាប់ខ្សែដៃ · ចុចលើ Charm ក្នុងកងដៃដើម្បីដកចេញវិញ',
    braceletPreview: 'គំរូខ្សែដៃរបស់អ្នក ({count}/{max} កង់)',
    clearBtn: 'លុបទាំងអស់',
    emptyBracelet: 'ខ្សែដៃរបស់អ្នកនៅទំនេរ។ ចុចលើរូប charm ខាងក្រោមដើម្បីចាប់ផ្តើម!',
    availableCharms: 'រូប Charm ដែលមានស្រាប់',
    configPrice: 'ការគណនាតម្លៃ',
    baseBand: 'ខ្សែដៃអ៊ីណុកគោល',
    charmsCost: 'តម្លៃ Charm ({count} × {price})',
    addCustomBtn: 'ដាក់ខ្សែដៃចូលកន្ត្រក 🛒',

    // Profile
    profileTitle: 'គណនីអតិថិជន',
    contactPhoneLabel: 'លេខទូរស័ព្ទ',
    pointsBalanceLabel: 'សមតុល្យពិន្ទុ',
    totalOrdersLabel: 'ចំនួនកម្ម៉ង់សរុប',
    vouchersLabel: 'ប័ណ្ណបញ្ចុះតម្លៃ',
    testBonusBtn: '🧪 +២៥ ពិន្ទុតេស្ត',
    logoutBtn: 'ចាកចេញពីគណនី',
    logoutConfirm: 'តើអ្នកពិតជាចង់ចាកចេញពីគណនី Telegram នេះមែនទេ?',

    // Admin Bar
    adminModeActive: '👑 Admin Mode សកម្ម',
    adminModeDesc: '(អាចកែប្រែតម្លៃ ទំនិញ និងប្រភេទដោយផ្ទាល់លើទំព័រនេះ)',
    addCategory: '＋ បន្ថែមប្រភេទ',
    uploadProduct: '＋ បន្ថែមទំនិញ',
    openAdminDesk: 'បើកផ្ទាំង Admin ↗',
    exitAdminMode: 'ចាកចេញពី Admin Mode',

    // Admin Quick Modals
    quickEditTitle: 'កែប្រែតម្លៃ និងស្តុកទំនិញរហ័ស',
    regularPrice: 'តម្លៃដើម ($)',
    discountRate: 'អត្រាបញ្ចុះតម្លៃ (%)',
    stockQty: 'ចំនួនក្នុងស្តុក',
    pointsReward: 'ពិន្ទុរង្វាន់ (pt)',
    calculatedFinal: 'តម្លៃចុងក្រោយដែលបានគណនា',
    saveChanges: 'រក្សាទុកការកែប្រែ 💾',
    deleteItem: 'លុបទំនិញនេះ 🗑️',
    cancel: 'បោះបង់',
    quickAddCatTitle: 'បន្ថែមប្រភេទផលិតផលថ្មី',
    catNameEn: 'ឈ្មោះប្រភេទ (English)',
    catNameKh: 'ឈ្មោះប្រភេទជាភាសាខ្មែរ',
    shortDesc: 'ការពិពណ៌នាខ្លី',
    iconEmoji: 'រូបតំណាង Emoji',
    gradientTheme: 'ពណ៌ Gradient Theme',
    createCatBtn: 'បង្កើតប្រភេទថ្មី 💾',
    quickUploadTitle: 'បន្ថែមទំនិញថ្មីចូលហាង',
    productName: 'ឈ្មោះទំនិញ',
    categoryLabel: 'ប្រភេទផលិតផល',
    imageUrlOptional: 'Link រូបភាព (មិនចាំបាច់)',
    uploadProductAction: 'បញ្ចូលទំនិញ 💾',
  },
  en: {
    siteTitle: 'Somphea Reak',
    subtitle: 'Premium Studio',
    tagline: 'Cambodia Kingdom of Wonder',
    announcementDefault: '✨ Welcome to Somphea Reak Studio • Verified Telegram Orders • Earn Points on Every Item!',
    
    // Login Gate
    gateStep1Title: 'Connect Telegram Account',
    gateStep1Desc: 'Please sign in with Telegram to continue. (Simulated test login)',
    gateUserLabel: 'Telegram username',
    gateLoginBtn: 'Login with Telegram',
    gateQuickTest: '1-Click Fast Test Customer Login',
    gateStep2Title: 'Contact Phone Number',
    gateConnectedAs: 'Connected as',
    gateVerified: 'Telegram Verified',
    gatePhoneLabel: 'Contact phone number',
    gatePhoneErr: 'Please enter a valid phone number (8–9 digits).',
    gateContinue: 'Continue',
    rememberMeText: 'Remember me on this device',
    clearLoginDataText: 'Clear login data',
    loginDataCleared: 'Login data cleared from this browser ✨',
    gateAdminLink: '🔐 Admin Login',
    gateViewAdmin: '👑 View Shop as Admin',

    // Top Navigation
    myPoints: 'pt',
    myOrders: 'My orders',
    cart: 'Shopping Cart',
    profile: 'My Profile',
    adminPortal: 'Admin Portal',

    // Hero & Sections
    designCharmBtn: '🔗 Design Italy Charm Bracelet',
    rewardsBtn: '⭐ Rewards',
    uploadProdBtn: '＋ Upload Product',
    collectionsTitle: 'Studio Collections & Categories',
    collectionsDesc: 'Explore handcrafted pieces, collectibles, and customizable jewelry',
    addCategoryBtn: '＋ Add Category',
    itemsCount: 'items',
    backToHome: '← Back to Collections',
    addProductHere: '＋ Add Product Here',
    noItemsCat: 'No items in this category yet.',
    catalogCurating: 'Catalog currently being curated',
    uploadFirstProd: '＋ Upload First Product',
    generalShopTitle: 'General Shop • All Collections',
    generalShopDesc: 'Browse and shop all studio items seamlessly in one place',
    allFilter: 'All Items',
    searchPlaceholder: '🔍 Search products...',
    adminReasonNote: 'Reason from Admin',
    voucherRefundedNotice: 'Voucher has been refunded back to your account ✔',

    // Product Card & Taobao Features
    addToCart: 'Add to cart',
    soldOut: 'Sold out',
    outOfStock: 'Out of stock',
    inStock: 'in stock',
    pointsPlus: 'pt',
    editPriceStock: '✏️ Edit Price/Stock',
    sortRecommend: 'Recommend',
    sortSales: 'Top Sales',
    sortPrice: 'Price',
    sortNew: 'Newest',
    sortInStock: 'In Stock',
    freeShipping: 'Free Delivery',
    studioPick: 'Studio Pick',
    soldCount: '{n}+ sold',
    quickView: 'Quick View',
    buyNow: 'Buy Now',
    onlyLeft: 'Only {n} left',
    navHome: 'Home',
    navShop: 'Shop',
    navCustom: 'Bracelet',
    navCart: 'Cart',
    navOrders: 'Orders',
    navProfile: 'Profile',

    // Cart
    cartTitle: 'Shopping Cart',
    cartEmpty: 'Your Shopping Cart is empty',
    startShopping: 'Start shopping',
    summary: 'Summary',
    subtotal: 'Subtotal',
    deliveryFee: 'Flat delivery fee',
    pointsEarn: 'Points you will earn',
    proceedCheckout: 'Proceed to Checkout →',
    remove: 'Remove',

    // Checkout
    checkoutTitle: 'Delivery Information',
    checkoutDesc: 'Fast & Secure Delivery in Cambodia',
    recipientName: 'Recipient Full Name',
    contactPhone: 'Contact Phone',
    provinceCity: 'Province / City',
    deliveryAddr: 'Delivery Address (Street, Sangkat, Khan...)',
    paymentMethod: 'Payment Method',
    applyVoucher: '🎟️ Apply discount voucher',
    selectVoucher: 'Select a voucher',
    noVouchers: 'No active vouchers – redeem in Rewards',
    voucherDiscount: 'Voucher discount',
    totalAmount: 'Total Amount',
    placeOrderBtn: 'Confirm & Place Order 🧾',
    fillRequired: 'Please enter recipient name and delivery address',
    selectVoucherBtn: '🎟️ Select Voucher',
    selectVoucherTitle: 'Select Discount Voucher',
    selectVoucherDesc: 'Choose an available voucher from your account or enter a promo code',
    activeVoucher: 'Active Voucher',
    removeVoucher: 'Remove Voucher',
    applied: 'Applied',
    applyVoucherAction: 'Apply Voucher',
    noVouchersAvailable: 'You have no vouchers available yet',
    claimVoucherInRewards: '⭐ Claim Vouchers in Rewards',
    havePromoCode: 'Have a studio promo code?',
    applyCodeBtn: 'Apply Code',
    closeModalBtn: 'Close',
    voucherApplied: 'Applied voucher {code} ({pct}% OFF) ✨',
    voucherRemoved: 'Voucher removed',
    enterVoucherCode: 'Please enter a voucher code',
    invalidVoucherCode: 'Invalid or expired voucher code',
    myVouchersBtn: '🎟️ My Vouchers',
    customerServiceBtn: '💬 Customer Service (Telegram)',

    // Order Placed modal
    orderSubmitted: 'Order Submitted!',
    orderRef: 'Order Ref',
    pendingAdminNotice: 'Receipt forwarded to admin desk.',
    pendingStatus: '⏳ Pending Admin Confirmation',
    pointsAwardNotice: 'Points (+{p} pt) will automatically be credited upon admin approval!',
    viewMyOrders: 'View My Orders',
    viewOfficialReceipt: 'View Official Receipt',

    // Receipt
    receiptTitle: 'Official Receipt',
    customer: 'Customer',
    recipient: 'Recipient',
    phone: 'Phone',
    address: 'Address',
    payment: 'Payment',
    status: 'Status',
    itemsList: 'Purchased Items',
    printReceipt: '🖨️ Print Receipt',
    close: 'Close',
    orderPlacedStep: 'Placed',

    // Rewards
    rewardsTitle: 'My Points Balance',
    ptNextVoucher: 'pt until your next voucher',
    readyClaimVoucher: '🎉 You have enough points to claim a discount voucher!',
    redeemBtn: 'Redeem {pct}% OFF Voucher · {cost} pt',
    howToEarnTitle: 'How to earn points',
    ruleMini: '1–2 pt per Minifigure / Toy item',
    ruleReady: '3 pt per Ready-Made Bracelet',
    ruleCustom: '{pt} pt per Custom Charm Bracelet',
    ruleVoucher: '{cost} pt = 1 Voucher ({pct}% OFF)',
    myVouchersTitle: '🎟️ My Vouchers',
    noVouchersYet: 'No vouchers yet. Collect {cost} pt to redeem your first voucher!',
    available: 'Available',
    used: 'Used',
    pointHistoryTitle: 'Point History',
    noPointHistory: 'No point activity yet.',
    noOrdersYet: 'You have not placed any orders yet.',
    voucherClaimedTitle: 'Voucher Claimed!',
    voucherClaimedDesc: 'Enjoy {pct}% OFF your next order',
    useInCheckoutBtn: 'Use in Checkout',

    // Customizer
    customTitle: 'CUSTOMIZE ITALY CHARM',
    customDesc: 'Tap charms below to link them to your stainless bracelet · tap any preview charm to remove',
    braceletPreview: 'Bracelet Preview ({count}/{max} links)',
    clearBtn: 'Clear',
    emptyBracelet: 'Your bracelet is empty. Tap charms below to start building!',
    availableCharms: 'Available Charms',
    configPrice: 'Configuration & Price',
    baseBand: 'Base stainless link band',
    charmsCost: 'Charms ({count} × {price})',
    addCustomBtn: 'Add Custom Bracelet to Cart 🛒',

    // Profile
    profileTitle: 'Customer Profile',
    contactPhoneLabel: 'Contact Phone',
    pointsBalanceLabel: 'Points Balance',
    totalOrdersLabel: 'Total Orders',
    vouchersLabel: 'Active Vouchers',
    testBonusBtn: '🧪 +25 Test Points',
    logoutBtn: 'Log out',
    logoutConfirm: 'Log out of this Telegram account?',

    // Admin Bar
    adminModeActive: '👑 Admin Mode Active',
    adminModeDesc: '(Edit prices, products & categories directly on this page)',
    addCategory: '＋ Add Category',
    uploadProduct: '＋ Upload Product',
    openAdminDesk: 'Open Admin Desk ↗',
    exitAdminMode: 'Exit Admin Mode',

    // Admin Quick Modals
    quickEditTitle: 'Quick Edit Product Price & Stock',
    regularPrice: 'Regular Price ($)',
    discountRate: 'Discount Rate (%)',
    stockQty: 'Stock Inventory',
    pointsReward: 'Points Reward (pt)',
    calculatedFinal: 'Calculated Final Price',
    saveChanges: 'Save Changes 💾',
    deleteItem: 'Delete Item 🗑️',
    cancel: 'Cancel',
    quickAddCatTitle: 'Add New Store Category',
    catNameEn: 'Category Name (English)',
    catNameKh: 'Khmer Display Title',
    shortDesc: 'Short Description',
    iconEmoji: 'Icon / Emoji',
    gradientTheme: 'Color Gradient Theme',
    createCatBtn: 'Create Category 💾',
    quickUploadTitle: 'Upload New Product',
    productName: 'Product Name',
    categoryLabel: 'Category',
    imageUrlOptional: 'Product Image URL (Optional)',
    uploadProductAction: 'Save Product 💾',
  }
};

/* Translation Helper */
function t(key, params = {}) {
  const lang = S.lang || 'km';
  let str = (I18N[lang] && I18N[lang][key]) || (I18N['en'] && I18N['en'][key]) || key;
  for (const [k, v] of Object.entries(params)) {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return str;
}

function setLang(lang) {
  if (lang !== 'km' && lang !== 'en') lang = 'km';
  S.lang = lang;
  save();
  applyLanguageUI();
  updateHeader();
  route(false);
  toast(lang === 'km' ? '🇰🇭 បានប្តូរទៅភាសាខ្មែរ' : '🇬🇧 Switched to English');
}

function applyLanguageUI() {
  document.documentElement.lang = S.lang;

  // Update switcher sliders & active states
  $$('.lang-switch').forEach(sw => {
    sw.dataset.lang = S.lang;
    const kmBtn = sw.querySelector('button[onclick*="km"]');
    const enBtn = sw.querySelector('button[onclick*="en"]');
    if (kmBtn) kmBtn.classList.toggle('active', S.lang === 'km');
    if (enBtn) enBtn.classList.toggle('active', S.lang === 'en');
  });

  // Login Gate translations
  const gTitle = $('#gateTitle');
  if (gTitle) gTitle.textContent = t('siteTitle');
  const gSubtitle = $('#gateSubtitle');
  if (gSubtitle) gSubtitle.textContent = t('subtitle');
  const s1Title = $('#gateStep1Title');
  if (s1Title) s1Title.textContent = t('gateStep1Title');
  const s1Desc = $('#gateStep1Desc');
  if (s1Desc) s1Desc.textContent = t('gateStep1Desc');
  const uLabel = $('#gateUserLabel');
  if (uLabel) uLabel.textContent = t('gateUserLabel');
  const tgBtnText = $('#tgLoginBtnText');
  if (tgBtnText) tgBtnText.textContent = t('gateLoginBtn');
  const qgBtnText = $('#quickGuestBtnText');
  if (qgBtnText) qgBtnText.textContent = t('gateQuickTest');
  const s2Title = $('#gateStep2Title');
  if (s2Title) s2Title.textContent = t('gateStep2Title');
  const connText = $('#gateConnectedText');
  if (connText) connText.textContent = t('gateConnectedAs');
  const bVerif = $('#gateBadgeVerified');
  if (bVerif) bVerif.textContent = t('gateVerified');
  const pLabel = $('#gatePhoneLabel');
  if (pLabel) pLabel.textContent = t('gatePhoneLabel');
  const pBtnText = $('#phoneBtnText');
  if (pBtnText) pBtnText.textContent = t('gateContinue');
  const remText = $('#rememberMeText');
  if (remText) remText.textContent = t('rememberMeText');
  const clrText = $('#clearLoginDataText');
  if (clrText) clrText.textContent = t('clearLoginDataText');
  const gAdminLink = $('#gateAdminLink');
  if (gAdminLink) gAdminLink.textContent = t('gateAdminLink');
  const gViewAdminLink = $('#gateViewAdminLink');
  if (gViewAdminLink) gViewAdminLink.textContent = t('gateViewAdmin');

  // Navigation tooltips & buttons
  const nrBtn = $('#navRewardsBtn');
  if (nrBtn) nrBtn.title = t('myPoints');
  const noBtn = $('#navOrdersBtn');
  if (noBtn) noBtn.title = t('myOrders');
  const ncBtn = $('#navCartBtn');
  if (ncBtn) ncBtn.title = t('cart');
  const npBtn = $('#navProfileBtn');
  if (npBtn) npBtn.title = t('profile');
}

/* ---------- Secure Admin Mode Detection (Accessible via Admin Panel Only) ---------- */
function isAdmin() {
  const urlParams = new URLSearchParams(window.location.search);
  const requested = urlParams.get('admin_edit') === '1' || urlParams.get('admin') === '1';
  const isAuthorized = sessionStorage.getItem('sr_front_edit_authorized') === '1' ||
                       localStorage.getItem('sr_front_edit_authorized') === '1' ||
                       sessionStorage.getItem('sr_admin') === '1';
  return Boolean(requested && isAuthorized);
}

function exitAdminMode() {
  sessionStorage.removeItem('sr_front_edit_authorized');
  localStorage.removeItem('sr_front_edit_authorized');
  localStorage.removeItem('sr_admin_mode');
  const url = new URL(window.location.href);
  url.searchParams.delete('admin_edit');
  url.searchParams.delete('admin');
  window.history.replaceState({}, document.title, url.pathname + url.hash);
  toast(S.lang === 'km' ? 'បានចាកចេញពី Admin Mode' : 'Exited Admin Edit Mode');
  updateAdminBar();
  route(false);
}

/* ---------- Utils ---------- */
const money = n => '$' + (+n).toFixed(2);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(msg) {
  const tEl = $('#toast');
  if (!tEl) return;
  tEl.textContent = msg;
  tEl.classList.add('show');
  clearTimeout(tEl._t);
  tEl._t = setTimeout(() => tEl.classList.remove('show'), 2600);
}

function modal(html) {
  $('#modalBody').innerHTML = html;
  $('#modal').classList.remove('hidden');
}

function closeModal() {
  $('#modal').classList.add('hidden');
}

$('#modal').addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});

const art = (p, grad) => p.image ? `<div class="art" style="background-image:url('${p.image}')"></div>` : `<div class="art" style="background:${grad || 'linear-gradient(135deg,#10b981,#059669)'}">🛍️</div>`;

/* Audio feedback */
function playChime(type = 'success') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'success') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {}
}

/* ---------- Animated Theme Toggle & Dark/Light Logo Switching ---------- */
function applyLogo() {
  const isDark = (document.documentElement.dataset.theme || S.theme) !== 'light';
  const logoSrc = isDark ? 'logo-dark.jpg' : 'logo-light.png';
  $$('.site-logo-img').forEach(img => {
    if (img.getAttribute('src') !== logoSrc) img.src = logoSrc;
  });
  const favEl = $('#faviconEl');
  if (favEl && favEl.getAttribute('href') !== logoSrc) favEl.href = logoSrc;
}

let themeTransitioning = false;

function applyTheme() {
  document.documentElement.dataset.theme = S.theme;
  applyLogo();
}

function toggleTheme(e) {
  if (themeTransitioning) return;
  const nextTheme = S.theme === 'dark' ? 'light' : 'dark';

  // Calculate coordinates of the theme toggle button for circular reveal origin
  const btn = $('#themeSwitch');
  let x = window.innerWidth / 2;
  let y = 40;
  if (btn) {
    const rect = btn.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  } else if (e && e.clientX) {
    x = e.clientX;
    y = e.clientY;
  }

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const applyNewTheme = () => {
    S.theme = nextTheme;
    save();
    applyTheme();
  };

  // Modern circular View Transitions API
  if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    themeTransitioning = true;
    const transition = document.startViewTransition(() => {
      applyNewTheme();
    });
    transition.ready.then(() => {
      const anim = document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 560,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)'
        }
      );
      anim.onfinish = () => {
        themeTransitioning = false;
      };
    }).catch(() => {
      themeTransitioning = false;
    });
  } else {
    // Dynamic circular ripple fallback for all browsers without View Transitions
    themeTransitioning = true;
    let overlay = document.getElementById('themeWaveOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'themeWaveOverlay';
      overlay.className = 'theme-wave-circle';
      document.body.appendChild(overlay);
    }
    overlay.style.backgroundColor = nextTheme === 'light' ? '#eaedf2' : '#0c0e17';
    overlay.style.display = 'block';
    overlay.style.clipPath = `circle(0px at ${x}px ${y}px)`;

    const anim = overlay.animate(
      [
        { clipPath: `circle(0px at ${x}px ${y}px)` },
        { clipPath: `circle(${endRadius}px at ${x}px ${y}px)` }
      ],
      {
        duration: 500,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }
    );
    anim.onfinish = () => {
      applyNewTheme();
      overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160 }).onfinish = () => {
        overlay.style.display = 'none';
        overlay.style.opacity = '1';
        themeTransitioning = false;
      };
    };
  }
}
const themeSwitchEl = $('#themeSwitch') || $('#themeBtn');
if (themeSwitchEl) themeSwitchEl.onclick = toggleTheme;
applyTheme();

/* ---------- Login Gate & Fast Test Login with Memorization ---------- */
function prefillRememberedLogin() {
  const rem = $('#rememberMeCheckbox');
  const isRemember = localStorage.getItem('sr_remember') !== 'false';
  if (rem) rem.checked = isRemember;
  const savedUser = localStorage.getItem('sr_remembered_username');
  const savedPhone = localStorage.getItem('sr_remembered_phone');
  if (savedUser && $('#tgUser')) {
    $('#tgUser').value = savedUser;
  }
  if (savedPhone && $('#phoneInput')) {
    $('#phoneInput').value = savedPhone;
  }
}
prefillRememberedLogin();

$('#tgLoginBtn').onclick = () => {
  let u = $('#tgUser').value.trim().replace(/^@/, '');
  if (!u) u = 'guest' + Math.floor(Math.random() * 9000 + 1000);
  const rem = $('#rememberMeCheckbox');
  if (rem && rem.checked) {
    localStorage.setItem('sr_remembered_username', u);
  }
  const btn = $('#tgLoginBtn');
  btn.disabled = true;
  btn.textContent = S.lang === 'km' ? 'កំពុងភ្ជាប់ទៅកាន់ Telegram…' : 'Connecting to Telegram…';
  setTimeout(() => {
    pendingTg = u;
    $('#tgShown').textContent = '@' + u;
    const savedPhone = localStorage.getItem('sr_remembered_phone');
    if (savedPhone && $('#phoneInput')) {
      $('#phoneInput').value = savedPhone;
    }
    $('#stepTelegram').classList.add('hidden');
    $('#stepPhone').classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = t('gateLoginBtn');
  }, 350);
};

$('#phoneBtn').onclick = async () => {
  const digits = $('#phoneInput').value.replace(/\D/g, '').replace(/^0/, '');
  if (digits.length < 8 || digits.length > 9) return $('#phoneErr').classList.remove('hidden');
  const rem = $('#rememberMeCheckbox');
  if (rem && rem.checked) {
    localStorage.setItem('sr_remembered_username', pendingTg);
    localStorage.setItem('sr_remembered_phone', digits);
    localStorage.setItem('sr_remember', 'true');
  } else {
    localStorage.removeItem('sr_remembered_username');
    localStorage.removeItem('sr_remembered_phone');
    localStorage.setItem('sr_remember', 'false');
  }
  const user = await SRDB.upsertUser({ username: pendingTg, phone: '+855 ' + digits });
  S.userId = user.id;
  save();
  enterApp();
  toast(S.lang === 'km' ? `សូមស្វាគមន៍ @${pendingTg} 👋` : `Welcome, @${pendingTg} 👋`);
};

const quickGuestBtn = $('#quickGuestBtn');
if (quickGuestBtn) {
  quickGuestBtn.onclick = async () => {
    const rem = $('#rememberMeCheckbox');
    if (rem && rem.checked) {
      localStorage.setItem('sr_remembered_username', 'test_vip');
      localStorage.setItem('sr_remembered_phone', '12888999');
      localStorage.setItem('sr_remember', 'true');
    }
    const user = await SRDB.upsertUser({ username: 'test_vip', phone: '+855 12 888 999' });
    if ((user.points || 0) < 50) {
      await SRDB.addPoints(user.id, 50, 'Welcome test bonus');
    }
    S.userId = user.id;
    save();
    enterApp();
    toast(S.lang === 'km' ? 'បានចូលជា @test_vip (+50 ពិន្ទុតេស្ត) ⚡' : 'Logged in as @test_vip (+50 pt test credit) ⚡');
  };
}

function clearMyLoginData() {
  localStorage.removeItem('sr_session');
  sessionStorage.removeItem('sr_session');
  localStorage.removeItem('sr_remember');
  localStorage.removeItem('sr_remembered_username');
  localStorage.removeItem('sr_remembered_phone');
  S.userId = null;
  S.cart = [];
  if ($('#tgUser')) $('#tgUser').value = '';
  if ($('#phoneInput')) $('#phoneInput').value = '';
  const rem = $('#rememberMeCheckbox');
  if (rem) rem.checked = true;
  toast(t('loginDataCleared'));
  const gate = $('#loginGate'), appEl = $('#app');
  if (gate && appEl) {
    gate.classList.remove('hidden');
    appEl.classList.add('hidden');
    const s1 = $('#stepTelegram'), s2 = $('#stepPhone');
    if (s1) s1.classList.remove('hidden');
    if (s2) s2.classList.add('hidden');
  }
  updateHeader();
}
const clearLoginBtn = $('#clearLoginDataBtn');
if (clearLoginBtn) clearLoginBtn.onclick = clearMyLoginData;

function enterApp() {
  $('#loginGate').classList.add('hidden');
  $('#app').classList.remove('hidden');
  applyLanguageUI();
  updateAdminBar();
  route();
}

/* ---------- Admin Mode Bar on Storefront ---------- */
function updateAdminBar() {
  const bar = $('#adminBar');
  if (!bar) return;
  if (isAdmin()) {
    bar.innerHTML = `
      <div class="admin-bar-title">
        <span>${t('adminModeActive')}</span>
        <span class="muted small">${t('adminModeDesc')}</span>
      </div>
      <div class="admin-bar-actions">
        <button class="btn ghost sm" onclick="adminQuickAddCategory()">${t('addCategory')}</button>
        <button class="btn ghost sm" onclick="adminQuickAddProduct()">${t('uploadProduct')}</button>
        <a class="btn primary sm" href="admin.html" target="_blank">${t('openAdminDesk')}</a>
        <button class="btn ghost sm" onclick="exitAdminMode()">${t('exitAdminMode')}</button>
      </div>`;
    bar.classList.remove('hidden');
  } else {
    bar.classList.add('hidden');
  }
}

/* ---------- Router & Sync ---------- */
document.addEventListener('click', e => {
  const n = e.target.closest('[data-nav]');
  if (n) {
    e.preventDefault();
    location.hash = n.dataset.nav;
  }
});
window.addEventListener('hashchange', () => route());

// Live detection of order approval / update from Admin tab
let knownOrdersStatus = {};
function checkOrderStatusChanges() {
  if (!S.userId) return;
  const currentOrders = SRDB.ordersOf(S.userId);
  currentOrders.forEach(o => {
    const prev = knownOrdersStatus[o.id];
    if (prev && prev !== o.status) {
      if (o.status === 'Approved') {
        playChime('success');
        toast(S.lang === 'km' ? `🎉 ការកម្ម៉ង់ #${o.id} ត្រូវបានអនុម័ត! +${o.earned} pt ត្រូវបានបញ្ចូល!` : `🎉 Order #${o.id} approved! +${o.earned} pt added!`);
      } else if (o.status === 'Shipped') {
        toast(S.lang === 'km' ? `🚚 ការកម្ម៉ង់ #${o.id} កំពុងត្រូវបានដឹកជញ្ជូន!` : `🚚 Order #${o.id} has been shipped!`);
      } else if (o.status === 'Delivered') {
        playChime('success');
        toast(S.lang === 'km' ? `📦 ការកម្ម៉ង់ #${o.id} ត្រូវបានដឹកដល់ដៃលោកអ្នកហើយ! សូមអរគុណ!` : `📦 Order #${o.id} delivered! Enjoy!`);
      } else if (o.status === 'Rejected') {
        playChime('alert');
        toast(S.lang === 'km' ? `⚠️ ការកម្ម៉ង់ #${o.id} មិនត្រូវបានអនុម័ត: ${o.note || 'អស់ពីស្តុក'}` : `⚠️ Order #${o.id} was declined: ${o.note || 'Out of stock'}`);
      }
    }
    knownOrdersStatus[o.id] = o.status;
  });
}

function applyLogo() {
  const isDark = (document.documentElement.dataset.theme || S.theme) !== 'light';
  const logoSrc = isDark ? 'logo-dark.jpg' : 'logo-light.png';
  $$('.site-logo-img').forEach(img => {
    if (img.getAttribute('src') !== logoSrc) img.src = logoSrc;
  });
  const favEl = $('#faviconEl');
  if (favEl && favEl.getAttribute('href') !== logoSrc) favEl.href = logoSrc;
}

// Zero-delay reactive sync across open tabs & admin changes
SRDB.onChange(() => {
  applyLogo();
  checkOrderStatusChanges();
  updateHeader();
  updateAdminBar();
  if (me() && !$('#app').classList.contains('hidden') && !document.activeElement.matches('input,select,textarea')) {
    route(false);
  }
});

function route(scroll = true) {
  if (!me()) {
    if (isAdmin()) {
      const u = SRDB.users()[0] || { id: 'Uadmin', username: 'admin', phone: '+855 12 000 000', points: 100, vouchers: [] };
      S.userId = u.id;
      save();
      enterApp();
      return;
    }
    return;
  }
  const h = location.hash.slice(1) || 'home';
  const views = { home, cart, orders, rewards, profile, checkout, 'custom-bracelet': customizer };
  (views[h] || (() => category(h)))();
  updateHeader();
  updateAdminBar();
  if (scroll) window.scrollTo(0, 0);
}

function updateHeader() {
  applyLogo();
  const user = me();
  if (!user) return;
  $('#ptCount').textContent = user.points || 0;
  const c = S.cart.reduce((a, i) => a + i.qty, 0);
  $('#cartBadge').textContent = c;
  $('#cartBadge').classList.toggle('hidden', !c);

  // Sync Customer Mobile Bottom Navigation Bar (phone interface)
  const curNav = location.hash.slice(1) || 'home';
  const mbBtns = $$('.mobile-bottom-nav .mobile-nav-btn');
  mbBtns.forEach(btn => {
    const navVal = btn.dataset.nav;
    if (navVal === curNav || (curNav === 'home' && btn.id === 'mbNavHome')) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const mbBadge = $('#mobileCartBadge');
  if (mbBadge) {
    mbBadge.textContent = c;
    mbBadge.classList.toggle('hidden', !c);
  }

  // Update text translations on mobile bottom nav
  const mbHomeTxt = $('#mbNavHomeTxt'); if (mbHomeTxt) mbHomeTxt.textContent = t('navHome');
  const mbCartTxt = $('#mbNavCartTxt'); if (mbCartTxt) mbCartTxt.textContent = t('navCart');
  const mbOrdersTxt = $('#mbNavOrdersTxt'); if (mbOrdersTxt) mbOrdersTxt.textContent = t('navOrders');
  const mbProfileTxt = $('#mbNavProfileTxt'); if (mbProfileTxt) mbProfileTxt.textContent = t('navProfile');

  const centerLogoBtn = $('#mbNavCenterLogo');
  if (centerLogoBtn) {
    centerLogoBtn.classList.toggle('active', curNav === 'home');
  }

  const set = cfg();
  const titleDisplay = 'សម្ភារៈ - Somphea Reak';
  const subtitleDisplay = 'PREMIUM STUDIO';
  document.title = titleDisplay + ' | ' + subtitleDisplay;

  const brandEl = $('#brandName');
  if (brandEl) brandEl.textContent = titleDisplay;
  const brandSubEl = $('#brandSubtitle');
  if (brandSubEl) brandSubEl.textContent = subtitleDisplay;

  const annBar = $('#announcementBar');
  if (annBar) {
    if (set.announcement) {
      annBar.textContent = set.announcement;
      annBar.classList.remove('hidden');
    } else {
      annBar.textContent = t('announcementDefault');
      annBar.classList.remove('hidden');
    }
  }
}

function scrollToGeneralShop() {
  if (location.hash !== '#home' && location.hash !== '') {
    location.hash = 'home';
    setTimeout(() => {
      const el = document.getElementById('generalShop');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  } else {
    const el = document.getElementById('generalShop');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
}

const view = html => { $('#view').innerHTML = html; };

/* ================================================================
   Views: 1. Home (Categories + General Shop All Items)
   Taobao-Inspired Feed with Sorting & Fast Responsive Filtering
   ================================================================ */
let homeCatFilter = 'all';
let homeSearchQuery = '';
let homeSortKey = 'recommend'; // 'recommend' | 'sales' | 'price_asc' | 'price_desc' | 'newest' | 'instock'

function setHomeCatFilter(catId, btnEl) {
  homeCatFilter = catId;
  const bar = $('#catPillsBar');
  if (bar) {
    $$('.cat-pill', bar).forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
  }
  updateHomeProductsDisplay();
}

function setHomeSort(key, btnEl) {
  homeSortKey = key;
  const bar = $('#homeSortBar');
  if (bar) {
    $$('.tb-sort-tab', bar).forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
  }
  updateHomeProductsDisplay();
}

function togglePriceSort(btnEl) {
  if (homeSortKey === 'price_asc') {
    homeSortKey = 'price_desc';
  } else {
    homeSortKey = 'price_asc';
  }
  const bar = $('#homeSortBar');
  if (bar) {
    $$('.tb-sort-tab', bar).forEach(b => b.classList.remove('active'));
    if (btnEl) {
      btnEl.classList.add('active');
      btnEl.innerHTML = `💵 ${t('sortPrice')} ${homeSortKey === 'price_asc' ? '↑' : '↓'}`;
    }
  }
  updateHomeProductsDisplay();
}

function onHomeSearchChange(query) {
  homeSearchQuery = (query || '').trim();
  updateHomeProductsDisplay();
}

function getProductSoldCount(p) {
  let sold = 0;
  const orders = SRDB.orders();
  orders.forEach(o => {
    (o.items || []).forEach(it => {
      if (it.productId === p.id || it.name === p.name) sold += (it.qty || 1);
    });
  });
  const hashSeed = (p.id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = ((hashSeed * 7) % 85) + 18;
  return sold > 0 ? (sold + base) : base;
}

function getFilteredHomeProducts() {
  let list = SRDB.products();
  if (homeCatFilter && homeCatFilter !== 'all') {
    list = list.filter(p => p.cat === homeCatFilter);
  }
  if (homeSearchQuery) {
    const q = homeSearchQuery.toLowerCase();
    list = list.filter(p => 
      (p.name || '').toLowerCase().includes(q) ||
      (p.desc || '').toLowerCase().includes(q) ||
      (p.cat || '').toLowerCase().includes(q)
    );
  }

  // Taobao Sort logic
  if (homeSortKey === 'sales') {
    list.sort((a, b) => getProductSoldCount(b) - getProductSoldCount(a));
  } else if (homeSortKey === 'price_asc') {
    list.sort((a, b) => SRDB.finalPrice(a) - SRDB.finalPrice(b));
  } else if (homeSortKey === 'price_desc') {
    list.sort((a, b) => SRDB.finalPrice(b) - SRDB.finalPrice(a));
  } else if (homeSortKey === 'newest') {
    list.sort((a, b) => (b.id > a.id ? 1 : -1));
  } else if (homeSortKey === 'instock') {
    list = list.filter(p => p.stock > 0);
  } else {
    // Recommend: Active discounts, high stock, and top points first
    list.sort((a, b) => {
      const aScore = (a.discount || 0) * 2 + (a.stock > 0 ? 50 : 0) + (a.pt || 0);
      const bScore = (b.discount || 0) * 2 + (b.stock > 0 ? 50 : 0) + (b.pt || 0);
      return bScore - aScore;
    });
  }
  return list;
}

function onQuickAddToCart(id, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  addToCart(id);
  const btn = event?.currentTarget || event?.target;
  if (btn) {
    btn.style.transform = 'scale(1.25) rotate(15deg)';
    setTimeout(() => { if (btn) btn.style.transform = ''; }, 220);
  }
}

function onProductCardClick(id, event) {
  if (event.target.closest('.admin-prod-ctrl, .tb-cart-btn')) return;
  openProductQuickView(id);
}

function openProductQuickView(id) {
  const p = SRDB.product(id);
  if (!p) return;
  const k = SRDB.category(p.cat);
  const fp = SRDB.finalPrice(p);
  const out = p.stock <= 0;
  const soldCount = getProductSoldCount(p);
  const grad = k?.grad || 'linear-gradient(135deg,#10b981,#059669)';

  modal(`
  <div class="pdm-layout">
    <div>
      <div class="pdm-img" style="${p.image ? `background-image:url('${p.image}')` : `background:${grad}`}">
        ${p.image ? '' : (k?.icon || '🛍️')}
      </div>
      ${p.discount ? `<div style="margin-top:10px;text-align:center"><span class="badge sale" style="font-size:0.85rem">🎉 Discount -${p.discount}% OFF</span></div>` : ''}
    </div>
    <div class="pdm-body">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span class="badge gold">${esc(k?.name || k?.kh || 'Studio')}</span>
          <span class="small muted">${t('soldCount', { n: soldCount })}</span>
        </div>
        <h2 style="font-size:1.3rem;line-height:1.3;margin:0 0 10px">${esc(p.name)}</h2>
        <div class="tb-tags" style="margin-bottom:12px">
          <span class="tb-tag tb-tag-ship" style="font-size:0.75rem;padding:3px 8px">🚚 ${t('freeShipping')}</span>
          <span class="tb-tag tb-tag-bonus" style="font-size:0.75rem;padding:3px 8px">⭐ +${p.pt} pt ${t('pointsPlus')}</span>
          <span class="tb-tag ${out ? 'tb-tag-stock' : 'tb-tag-pick'}" style="font-size:0.75rem;padding:3px 8px">
            ${out ? t('outOfStock') : `${p.stock} ${t('inStock')}`}
          </span>
        </div>
        <div class="tb-price-main" style="font-size:1.7rem;margin:10px 0">
          <span class="tb-cur" style="font-size:1rem">$</span>
          <span class="tb-int">${fp.toFixed(2)}</span>
          ${p.discount ? `<s class="tb-orig" style="font-size:0.95rem;margin-left:8px">${money(p.price)}</s>` : ''}
        </div>
        <p class="muted small">${esc(p.desc || (S.lang === 'km' ? 'ផលិតផលប្រណិតគុណភាពខ្ពស់ពី Somphea Reak Studio' : 'Premium studio crafted collectible piece with quality guaranteed.'))}</p>
      </div>

      <div style="display:flex;gap:10px;flex-direction:column;margin-top:16px">
        <button class="btn primary" ${out ? 'disabled' : ''} onclick="closeModal();addToCart('${p.id}')" style="min-height:46px;font-size:1rem">
          ${out ? t('soldOut') : `🛒 ${t('addToCart')} (${money(fp)})`}
        </button>
        <button class="btn ghost sm" onclick="closeModal()">
          ${t('close')}
        </button>
      </div>
    </div>
  </div>`);
}

function renderProductCard(p) {
  const k = SRDB.category(p.cat);
  const fp = SRDB.finalPrice(p);
  const out = p.stock <= 0;
  const adminActive = isAdmin();
  const grad = k?.grad || 'linear-gradient(135deg,#10b981,#059669)';
  const soldCount = getProductSoldCount(p);
  const isHot = (p.discount && p.discount >= 15) || soldCount > 50;

  // Split final price into integer and decimal components for signature Taobao price typography
  const fpFixed = fp.toFixed(2);
  const [intPart, decPart] = fpFixed.split('.');

  return `
  <div class="glass prod tb-card" data-prod-id="${p.id}" onclick="onProductCardClick('${p.id}', event)">
    <div class="tb-visual">
      ${art(p, grad)}
      ${p.discount ? `<span class="tb-ribbon tb-ribbon-sale">-${p.discount}%</span>` : (isHot ? `<span class="tb-ribbon tb-ribbon-hot">HOT</span>` : '')}
      <span class="tb-chip-pt">⭐ +${p.pt} pt</span>
      ${out ? `<div class="tb-soldout-overlay"><span class="tb-soldout-badge">${t('soldOut')}</span></div>` : ''}
      ${adminActive ? `
        <button class="admin-prod-ctrl" onclick="adminQuickEditPrice('${p.id}', event)" title="Edit price & stock">
          ✏️
        </button>` : ''}
    </div>
    <div class="tb-body">
      <h3 class="tb-title">${esc(p.name)}</h3>
      <div class="tb-tags">
        <span class="tb-tag tb-tag-ship">🚚 ${t('freeShipping')}</span>
        ${p.pt >= 2 ? `<span class="tb-tag tb-tag-bonus">⭐ +${p.pt} pt</span>` : ''}
        ${!out && p.stock <= 5 ? `<span class="tb-tag tb-tag-stock">⚡ ${t('onlyLeft', { n: p.stock })}</span>` : `<span class="tb-tag tb-tag-pick">✨ ${t('studioPick')}</span>`}
      </div>
      <div class="tb-bottom">
        <div class="tb-price-box">
          <div class="tb-price-main">
            <span class="tb-cur">$</span>
            <span class="tb-int">${intPart}</span>
            <span class="tb-dec">.${decPart}</span>
            ${p.discount ? `<s class="tb-orig">${money(p.price)}</s>` : ''}
          </div>
          <div class="tb-sales-text">${t('soldCount', { n: soldCount })}</div>
        </div>
        <button class="tb-cart-btn" ${out ? 'disabled' : ''} onclick="onQuickAddToCart('${p.id}', event)" title="${out ? t('soldOut') : t('addToCart')}">
          ${out ? '✕' : '＋'}
        </button>
      </div>
    </div>
  </div>`;
}

function renderHomeProductsHtml() {
  const items = getFilteredHomeProducts();
  if (!items.length) {
    return `
      <div class="glass panel full" style="grid-column:1/-1;text-align:center;padding:40px 16px">
        <div style="font-size:2.8rem;margin-bottom:10px">🔍</div>
        <p class="muted">${t('noItemsCat')}</p>
        ${(homeSearchQuery || homeCatFilter !== 'all') ? `
          <button class="btn ghost sm" style="margin-top:12px" onclick="homeCatFilter='all';homeSearchQuery='';if($('#homeSearchInput'))$('#homeSearchInput').value='';updateHomeProductsDisplay();">
            ${t('allFilter')}
          </button>` : ''}
      </div>`;
  }
  return items.map(p => renderProductCard(p)).join('');
}

function updateHomeProductsDisplay() {
  const grid = $('#homeProductsGrid');
  if (grid) {
    grid.innerHTML = renderHomeProductsHtml();
  }
}

function home() {
  const c = cfg();
  const allProds = SRDB.products();
  const categories = SRDB.categories();
  const adminActive = isAdmin();
  const isKm = S.lang === 'km';

  view(`
  <section class="glass hero">
    <span class="badge ok">${t('gateVerified')}</span>
    <h1 class="kh">${esc(isKm ? (c.siteTitle || t('siteTitle')) : (c.siteTitle || 'Somphea Reak'))}</h1>
    <p class="muted">${esc(isKm ? t('subtitle') : (c.subtitle || 'Premium Studio'))}</p>
    <p class="tag muted">• ${esc(isKm ? t('tagline') : (c.tagline || 'Cambodia Kingdom of Wonder'))} •</p>
    <div style="margin-top:22px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn primary" data-nav="custom-bracelet">${t('designCharmBtn')}</button>
      <button class="btn ghost" data-nav="rewards">⭐ ${(me()?.points || 0)} ${t('myPoints')} · ${t('rewardsBtn')}</button>
      ${adminActive ? `<button class="btn ghost" onclick="adminQuickAddProduct()">${t('uploadProdBtn')}</button>` : ''}
    </div>
  </section>

  <div class="section-title">
    <div>
      <h2>${t('collectionsTitle')}</h2>
      <p class="muted">${t('collectionsDesc')}</p>
    </div>
    ${adminActive ? `<button class="btn ghost sm" onclick="adminQuickAddCategory()">${t('addCategoryBtn')}</button>` : ''}
  </div>

  <div class="cats">
    ${categories.map(k => {
      const count = allProds.filter(p => p.cat === k.id).length;
      const mainTitle = isKm ? (k.kh || k.name) : (k.name || k.kh);
      const subTitle = isKm ? (k.en || k.name || '') : (k.en || k.kh || '');
      return `
      <div class="glass cat" data-nav="${k.id}">
        ${adminActive ? `
          <div class="cat-actions" onclick="event.stopPropagation()">
            <button class="cat-action-btn" onclick="adminEditCategory('${k.id}', event)" title="Edit Category">✏️</button>
            ${k.id !== 'custom-bracelet' ? `<button class="cat-action-btn" onclick="adminDeleteCategory('${k.id}', event)" title="Delete Category">🗑️</button>` : ''}
          </div>` : ''}
        <div class="art" style="background:${k.grad || 'linear-gradient(135deg,#10b981,#059669)'}">${k.icon || '🛍️'}</div>
        <div class="info">
          <h3>${esc(mainTitle)}</h3>
          <p class="muted small">${esc(subTitle)}${k.id !== 'custom-bracelet' ? ` · ${count} ${t('itemsCount')}` : ''}</p>
          <span class="badge gold" style="margin-top:8px;display:inline-block">
            ${k.id === 'custom-bracelet' ? `+${c.customPt} ${t('pointsPlus')}` : `+1–3 ${t('pointsPlus')}`}
          </span>
        </div>
      </div>`;
    }).join('')}

    ${adminActive ? `
      <div class="glass cat add-cat-card" onclick="adminQuickAddCategory()">
        <div style="font-size:2.8rem;color:#10b981">＋</div>
        <b>${t('addCategoryBtn')}</b>
        <p class="muted small">${t('shortDesc')}</p>
      </div>` : ''}
  </div>

  <!-- General Shop (All Collections & Products) Directly Below Categories -->
  <div class="general-shop-section" id="generalShop">
    <div class="section-title">
      <div>
        <h2 class="kh">${t('generalShopTitle')}</h2>
        <p class="muted">${t('generalShopDesc')}</p>
      </div>
      <div class="shop-search-box">
        <input id="homeSearchInput" type="search" placeholder="${t('searchPlaceholder')}" value="${esc(homeSearchQuery)}" oninput="onHomeSearchChange(this.value)" autocomplete="off">
      </div>
    </div>

    <!-- Category Filter Pills Bar (Instant 0-delay memory filter) -->
    <div class="category-pills-bar" id="catPillsBar">
      <button class="cat-pill ${homeCatFilter === 'all' ? 'active' : ''}" onclick="setHomeCatFilter('all', this)">
        <span>✨</span> ${t('allFilter')} (${allProds.length})
      </button>
      ${categories.map(k => {
        const count = allProds.filter(p => p.cat === k.id).length;
        const title = isKm ? (k.kh || k.name) : (k.name || k.kh);
        return `
        <button class="cat-pill ${homeCatFilter === k.id ? 'active' : ''}" onclick="setHomeCatFilter('${k.id}', this)">
          <span>${k.icon || '🛍️'}</span> ${esc(title)} (${count})
        </button>`;
      }).join('')}
    </div>

    <!-- Taobao-Style Feed Sort Bar -->
    <div class="tb-sort-bar" id="homeSortBar">
      <button class="tb-sort-tab ${homeSortKey === 'recommend' ? 'active' : ''}" onclick="setHomeSort('recommend', this)">
        🌟 ${t('sortRecommend')}
      </button>
      <button class="tb-sort-tab ${homeSortKey === 'sales' ? 'active' : ''}" onclick="setHomeSort('sales', this)">
        🔥 ${t('sortSales')}
      </button>
      <button class="tb-sort-tab ${homeSortKey.startsWith('price') ? 'active' : ''}" onclick="togglePriceSort(this)">
        💵 ${t('sortPrice')} ${homeSortKey === 'price_asc' ? '↑' : (homeSortKey === 'price_desc' ? '↓' : '↕')}
      </button>
      <button class="tb-sort-tab ${homeSortKey === 'newest' ? 'active' : ''}" onclick="setHomeSort('newest', this)">
        ✨ ${t('sortNew')}
      </button>
      <button class="tb-sort-tab ${homeSortKey === 'instock' ? 'active' : ''}" onclick="setHomeSort('instock', this)">
        📦 ${t('sortInStock')}
      </button>
    </div>

    <!-- Products Grid (Responsive Taobao 2-Column Mobile Feed) -->
    <div class="products" id="homeProductsGrid" style="margin-top:12px">
      ${renderHomeProductsHtml()}
    </div>
  </div>`);
}

/* ================================================================
   Views: 2. Category Page
   ================================================================ */
function category(id) {
  const k = SRDB.category(id);
  if (!k) return home();
  let items = SRDB.products().filter(p => p.cat === id);

  // Apply active Taobao sorting
  if (homeSortKey === 'sales') {
    items.sort((a, b) => getProductSoldCount(b) - getProductSoldCount(a));
  } else if (homeSortKey === 'price_asc') {
    items.sort((a, b) => SRDB.finalPrice(a) - SRDB.finalPrice(b));
  } else if (homeSortKey === 'price_desc') {
    items.sort((a, b) => SRDB.finalPrice(b) - SRDB.finalPrice(a));
  } else if (homeSortKey === 'newest') {
    items.sort((a, b) => (b.id > a.id ? 1 : -1));
  } else if (homeSortKey === 'instock') {
    items = items.filter(p => p.stock > 0);
  }

  const adminActive = isAdmin();
  const isKm = S.lang === 'km';
  const mainTitle = isKm ? (k.kh || k.name) : (k.name || k.kh);
  const subTitle = isKm ? (k.en || '') : (k.en || k.kh || '');

  view(`
  <div class="section-title">
    <div>
      <h2>${esc(mainTitle)}</h2>
      <p class="muted">${esc(subTitle)}</p>
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      ${adminActive ? `<button class="btn ghost sm" onclick="adminQuickAddProduct('${k.id}')">${t('addProductHere')}</button>` : ''}
      <button class="btn ghost" data-nav="home">${t('backToHome')}</button>
    </div>
  </div>

  <!-- Taobao-Style Feed Sort Bar for Category Page -->
  <div class="tb-sort-bar">
    <button class="tb-sort-tab ${homeSortKey === 'recommend' ? 'active' : ''}" onclick="setHomeSort('recommend');category('${id}')">
      🌟 ${t('sortRecommend')}
    </button>
    <button class="tb-sort-tab ${homeSortKey === 'sales' ? 'active' : ''}" onclick="setHomeSort('sales');category('${id}')">
      🔥 ${t('sortSales')}
    </button>
    <button class="tb-sort-tab ${homeSortKey.startsWith('price') ? 'active' : ''}" onclick="togglePriceSort();category('${id}')">
      💵 ${t('sortPrice')} ${homeSortKey === 'price_asc' ? '↑' : (homeSortKey === 'price_desc' ? '↓' : '↕')}
    </button>
    <button class="tb-sort-tab ${homeSortKey === 'newest' ? 'active' : ''}" onclick="setHomeSort('newest');category('${id}')">
      ✨ ${t('sortNew')}
    </button>
    <button class="tb-sort-tab ${homeSortKey === 'instock' ? 'active' : ''}" onclick="setHomeSort('instock');category('${id}')">
      📦 ${t('sortInStock')}
    </button>
  </div>

  ${items.length ? `
    <div class="products" style="margin-top:12px">
      ${items.map(p => renderProductCard(p)).join('')}
    </div>`
  : `<div class="glass panel" style="text-align:center;padding:50px 20px">
      <div style="font-size:3.5rem;margin-bottom:14px">🛍️</div>
      <h3>${t('catalogCurating')}</h3>
      <p class="muted small">${t('noItemsCat')}</p>
      <br>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        ${adminActive ? `<button class="btn primary" onclick="adminQuickAddProduct('${k.id}')">${t('uploadFirstProd')}</button>` : ''}
        <button class="btn ghost" data-nav="custom-bracelet">${t('designCharmBtn')}</button>
      </div>
    </div>`}`);
}

/* ================================================================
   Admin On-Site Quick Modals (Category & Price Management)
   ================================================================ */
function adminQuickEditPrice(id, event) {
  if (event) event.stopPropagation();
  const p = SRDB.product(id);
  if (!p) return;

  modal(`
  <h2>${t('quickEditTitle')}</h2>
  <p class="muted small">${esc(p.name)}</p><br>
  <div class="form-grid" style="text-align:left">
    <div class="full">
      <label for="qeName">${t('productName')}</label>
      <input id="qeName" value="${esc(p.name)}">
    </div>
    <div>
      <label for="qePrice">${t('regularPrice')}</label>
      <input id="qePrice" type="number" step="0.01" min="0" value="${p.price}" oninput="updateQeFinal()">
    </div>
    <div>
      <label for="qeDisc">${t('discountRate')}</label>
      <input id="qeDisc" type="number" min="0" max="100" value="${p.discount || 0}" oninput="updateQeFinal()">
    </div>
    <div>
      <label for="qeStock">${t('stockQty')}</label>
      <input id="qeStock" type="number" min="0" value="${p.stock}">
    </div>
    <div>
      <label for="qePt">${t('pointsReward')}</label>
      <input id="qePt" type="number" min="0" value="${p.pt || 1}">
    </div>
    <div class="full">
      <label>${t('calculatedFinal')}: <b class="price" id="qeFinal" style="font-size:1.2rem"></b></label>
    </div>
  </div>
  <br>
  <div style="display:flex;gap:10px;justify-content:center">
    <button class="btn primary" onclick="saveQeProduct('${p.id}')">${t('saveChanges')}</button>
    <button class="btn danger sm" onclick="adminDeleteProduct('${p.id}', '${esc(p.name).replace(/'/g, '')}')">${t('deleteItem')}</button>
    <button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>
  </div>`);

  updateQeFinal();
}

function updateQeFinal() {
  const pr = parseFloat($('#qePrice')?.value) || 0;
  const d = parseFloat($('#qeDisc')?.value) || 0;
  const fp = +(pr * (1 - d / 100)).toFixed(2);
  const el = $('#qeFinal');
  if (el) el.textContent = money(fp);
}

async function saveQeProduct(id) {
  const p = SRDB.product(id);
  if (!p) return;
  const name = $('#qeName').value.trim();
  const price = parseFloat($('#qePrice').value);
  if (!name || isNaN(price) || price < 0) return alert('Valid name and price required');

  p.name = name;
  p.price = price;
  p.discount = Math.min(100, Math.max(0, parseFloat($('#qeDisc').value) || 0));
  p.stock = Math.max(0, parseInt($('#qeStock').value) || 0);
  p.pt = Math.max(0, parseInt($('#qePt').value) || 0);

  await SRDB.upsertProduct(p);
  closeModal();
  toast(`Saved "${p.name}" ($${p.price.toFixed(2)})! Synced live.`);
  route(false);
}

async function adminDeleteProduct(id, name) {
  if (confirm(`Delete product "${name}" from store?`)) {
    await SRDB.deleteProduct(id);
    closeModal();
    toast('Product deleted');
    route(false);
  }
}

function adminQuickAddCategory() {
  modal(`
  <h2>${t('quickAddCatTitle')}</h2>
  <p class="muted small">${t('collectionsDesc')}</p><br>
  <div class="form-grid" style="text-align:left">
    <div>
      <label for="qcatName">${t('catNameEn')}</label>
      <input id="qcatName" placeholder="e.g. Luxury Necklaces" autofocus>
    </div>
    <div>
      <label for="qcatKh">${t('catNameKh')}</label>
      <input id="qcatKh" placeholder="e.g. ខ្សែករ & កងដៃ">
    </div>
    <div class="full">
      <label for="qcatEn">${t('shortDesc')}</label>
      <input id="qcatEn" placeholder="e.g. Handcrafted jewelry & accessories">
    </div>
    <div>
      <label for="qcatIcon">${t('iconEmoji')}</label>
      <input id="qcatIcon" value="✨" style="font-size:1.4rem">
    </div>
    <div>
      <label for="qcatGrad">${t('gradientTheme')}</label>
      <input id="qcatGrad" value="linear-gradient(135deg,#10b981,#059669)">
    </div>
  </div>
  <br>
  <div style="display:flex;gap:10px;justify-content:center">
    <button class="btn primary" onclick="saveQuickCategory()">${t('createCatBtn')}</button>
    <button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>
  </div>`);
}

function adminEditCategory(id, event) {
  if (event) event.stopPropagation();
  const c = SRDB.category(id);
  if (!c) return;

  modal(`
  <h2>${t('addCategory')}: ${esc(c.name || c.kh)}</h2>
  <p class="muted small">${t('shortDesc')}</p><br>
  <div class="form-grid" style="text-align:left">
    <div>
      <label for="qcatName">${t('catNameEn')}</label>
      <input id="qcatName" value="${esc(c.name)}">
    </div>
    <div>
      <label for="qcatKh">${t('catNameKh')}</label>
      <input id="qcatKh" value="${esc(c.kh)}">
    </div>
    <div class="full">
      <label for="qcatEn">${t('shortDesc')}</label>
      <input id="qcatEn" value="${esc(c.en)}">
    </div>
    <div>
      <label for="qcatIcon">${t('iconEmoji')}</label>
      <input id="qcatIcon" value="${esc(c.icon || '🛍️')}" style="font-size:1.4rem">
    </div>
    <div>
      <label for="qcatGrad">${t('gradientTheme')}</label>
      <input id="qcatGrad" value="${esc(c.grad)}">
    </div>
  </div>
  <br>
  <div style="display:flex;gap:10px;justify-content:center">
    <button class="btn primary" onclick="saveQuickCategory('${c.id}')">${t('saveChanges')}</button>
    <button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>
  </div>`);
}

async function saveQuickCategory(id) {
  const name = $('#qcatName').value.trim();
  const kh = $('#qcatKh').value.trim();
  if (!name && !kh) return alert('Category name is required');

  await SRDB.upsertCategory({
    ...(id && { id }),
    name: name || kh,
    kh: kh || name,
    en: $('#qcatEn').value.trim(),
    icon: $('#qcatIcon').value.trim() || '🛍️',
    grad: $('#qcatGrad').value.trim() || 'linear-gradient(135deg,#10b981,#059669)',
  });

  closeModal();
  toast('Category saved live!');
  route(false);
}

async function adminDeleteCategory(id, event) {
  if (event) event.stopPropagation();
  const c = SRDB.category(id);
  if (!c) return;
  if (confirm(`Delete category "${c.name || c.kh}"? Products will remain in database.`)) {
    await SRDB.deleteCategory(id);
    toast('Category removed');
    route(false);
  }
}

function adminQuickAddProduct(defaultCat = '') {
  const cats = SRDB.categories();
  modal(`
  <h2>${t('quickUploadTitle')}</h2>
  <p class="muted small">${t('collectionsDesc')}</p><br>
  <div class="form-grid" style="text-align:left">
    <div class="full">
      <label for="qpName">${t('productName')}</label>
      <input id="qpName" placeholder="e.g. 18K Gold Cuban Chain" autofocus>
    </div>
    <div>
      <label for="qpCat">${t('categoryLabel')}</label>
      <select id="qpCat">
        ${cats.map(c => `<option value="${c.id}" ${defaultCat === c.id ? 'selected' : ''}>${esc(S.lang === 'km' ? (c.kh || c.name) : (c.name || c.kh))}</option>`).join('')}
      </select>
    </div>
    <div>
      <label for="qpPrice">${t('regularPrice')}</label>
      <input id="qpPrice" type="number" step="0.01" min="0" placeholder="15.00">
    </div>
    <div>
      <label for="qpDisc">${t('discountRate')}</label>
      <input id="qpDisc" type="number" min="0" max="100" value="0">
    </div>
    <div>
      <label for="qpStock">${t('stockQty')}</label>
      <input id="qpStock" type="number" min="0" value="12">
    </div>
    <div class="full">
      <label for="qpImg">${t('imageUrlOptional')}</label>
      <input id="qpImg" placeholder="https://images.unsplash.com/photo-...">
    </div>
  </div>
  <br>
  <div style="display:flex;gap:10px;justify-content:center">
    <button class="btn primary" onclick="saveQuickProduct()">${t('uploadProductAction')}</button>
    <button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>
  </div>`);
}

async function saveQuickProduct() {
  const name = $('#qpName').value.trim();
  const price = parseFloat($('#qpPrice').value);
  if (!name || isNaN(price) || price <= 0) return alert('Valid product name and price required');

  await SRDB.upsertProduct({
    name,
    price,
    cat: $('#qpCat').value,
    discount: parseFloat($('#qpDisc').value) || 0,
    stock: parseInt($('#qpStock').value) || 0,
    pt: 1,
    image: $('#qpImg').value.trim() || null,
  });

  closeModal();
  toast('Product uploaded live to store!');
  route(false);
}

/* ================================================================
   Views: 3. Shopping Cart & Checkout
   ================================================================ */
function addToCart(id, customItem) {
  if (customItem) {
    S.cart.push(customItem);
  } else {
    const p = SRDB.product(id);
    if (!p || p.stock <= 0) return toast(t('outOfStock'));
    const ex = S.cart.find(i => i.productId === id);
    if ((ex?.qty || 0) + 1 > p.stock) return toast(`Only ${p.stock} remaining in stock`);
    if (ex) ex.qty++; else S.cart.push({ productId: id, qty: 1 });
  }
  save();
  updateHeader();
  playChime('success');
  toast(`${t('addToCart')} 🛒`);
}

function cartLines() {
  S.cart = S.cart.filter(i => !i.productId || SRDB.product(i.productId)?.active);
  return S.cart.map(i => {
    if (!i.productId) return i;
    const p = SRDB.product(i.productId);
    return { ...i, name: p.name, image: p.image, price: SRDB.finalPrice(p), pt: p.pt, stock: p.stock };
  });
}

function changeQty(idx, d) {
  const L = cartLines();
  const l = L[idx];
  if (!l) return;
  if (d > 0 && l.productId && l.qty + 1 > l.stock) return toast(`Only ${l.stock} left in stock`);
  S.cart[idx].qty += d;
  if (S.cart[idx].qty <= 0) S.cart.splice(idx, 1);
  save();
  cart();
  updateHeader();
}

function removeCartItem(idx) {
  S.cart.splice(idx, 1);
  save();
  cart();
  updateHeader();
  toast(t('remove') + ' 🗑️');
}

const subtotal = L => L.reduce((a, i) => a + i.price * i.qty, 0);
const cartPts = L => L.reduce((a, i) => a + i.pt * i.qty, 0);
const thumb = i => i.image ? `<img src="${i.image}" class="thumb">` : `<span class="thumb">${i.icon || '🛍️'}</span>`;

function cart() {
  const L = cartLines();
  if (!L.length) {
    return view(`
    <div class="glass panel" style="text-align:center;padding:50px 20px">
      <div style="font-size:3.5rem;margin-bottom:14px">🛒</div>
      <h2 class="kh">${t('cartTitle')}</h2>
      <p class="muted">${t('cartEmpty')}</p>
      <br>
      <button class="btn primary" data-nav="home">${t('startShopping')}</button>
    </div>`);
  }
  const u = me(), c = cfg();
  const avail = (u?.vouchers || []).filter(x => !x.used);
  const v = avail.find(x => x.code === selectedVoucher);
  const sub = subtotal(L);
  const disc = v ? sub * v.pct / 100 : 0;
  const deliv = c.deliveryFee;
  const grand = Math.max(0, sub - disc + deliv);

  view(`
  <div class="two">
    <div class="glass panel">
      <h2 class="kh">${t('cartTitle')}</h2>
      <p class="muted">${t('cart')} (${L.reduce((a, i) => a + i.qty, 0)} ${t('itemsCount')})</p>
      <br>
      ${L.map((i, k) => `
      <div class="line">
        <div style="display:flex;gap:12px;align-items:center">
          ${thumb(i)}
          <div>
            <b>${esc(i.name)}</b>
            <div class="muted small">${i.desc ? `[${esc(i.desc)}] ` : ''}${money(i.price)} · +${i.pt} ${t('pointsPlus')} each</div>
          </div>
        </div>
        <div class="qty">
          <button onclick="changeQty(${k},-1)">−</button>
          <span>${i.qty}</span>
          <button onclick="changeQty(${k},1)">+</button>
          <button onclick="removeCartItem(${k})" title="${t('remove')}" style="margin-left:6px;border-color:transparent;color:var(--err)">🗑️</button>
        </div>
      </div>`).join('')}
    </div>
    <div class="glass panel cart-summary-panel">
      <h3>${t('summary')}</h3>
      <div class="line"><span>${t('subtotal')}</span><b>${money(sub)}</b></div>
      ${v ? `
      <div class="line voucher-discount-line">
        <span>🎟️ ${t('voucherDiscount')} (${v.pct}% OFF · ${v.code})</span>
        <div style="display:flex;align-items:center;gap:6px">
          <b style="color:var(--ok)">−${money(disc)}</b>
          <button type="button" class="btn-clear-voucher" onclick="removeVoucherSelection()" title="${t('removeVoucher')}">✕</button>
        </div>
      </div>` : ''}
      <div class="line"><span>${t('deliveryFee')}</span><span>${money(deliv)}</span></div>
      <div class="line"><b>${t('totalAmount')}</b><b class="price" style="font-size:1.25rem">${money(grand)}</b></div>
      <div class="line"><span>${t('pointsEarn')}</span><b class="price">+${cartPts(L)} ${t('pointsPlus')}</b></div>
      <br>
      <div class="cart-buttons-row">
        <button class="btn ghost cart-voucher-btn" type="button" onclick="openCartVoucherModal()" title="${t('selectVoucherBtn')}">
          🎟️ ${selectedVoucher ? `${v ? v.pct + '% OFF' : selectedVoucher}` : t('selectVoucherBtn')}
        </button>
        <button class="btn primary cart-checkout-btn" data-nav="checkout">${t('proceedCheckout')}</button>
      </div>
    </div>
  </div>`);
}

function openCartVoucherModal() {
  const u = me();
  const avail = (u?.vouchers || []).filter(v => !v.used);
  const { voucherCost: VC } = cfg();

  modal(`
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:2.4rem">🎟️</div>
      <h2 class="kh">${t('selectVoucherTitle')}</h2>
      <p class="muted small">${t('selectVoucherDesc')}</p>
    </div>

    ${selectedVoucher ? `
      <div class="active-voucher-alert glass" style="padding:10px 14px;margin-bottom:14px;border:1px solid #10b981;border-radius:12px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <span class="small muted">${t('activeVoucher')}:</span>
          <b style="color:var(--ok);margin-left:6px">${selectedVoucher}</b>
        </div>
        <button class="btn sm danger" onclick="removeVoucherSelection();closeModal()">${t('removeVoucher')}</button>
      </div>` : ''}

    ${avail.length ? `
      <div class="voucher-list" style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px;max-height:260px;overflow-y:auto;padding-right:4px">
        ${avail.map(v => `
          <div class="voucher-picker-card glass ${v.code === selectedVoucher ? 'selected-voucher' : ''}" style="padding:12px 14px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;border:1px solid ${v.code === selectedVoucher ? '#10b981' : 'var(--border)'}">
            <div>
              <div style="font-size:1.18rem;font-weight:700;color:var(--accent-gold)">${v.pct}% OFF</div>
              <div class="muted small" style="font-family:monospace;letter-spacing:1px">${v.code}</div>
            </div>
            ${v.code === selectedVoucher ? `
              <span class="badge ok">✓ ${t('applied')}</span>
            ` : `
              <button class="btn sm primary" onclick="applyCartVoucher('${v.code}')">${t('applyVoucherAction')}</button>
            `}
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="glass" style="padding:20px;text-align:center;border-radius:14px;margin-bottom:16px">
        <p class="muted">${t('noVouchersAvailable')}</p>
        <p class="small muted" style="margin-top:6px">${t('pointsBalanceLabel')}: <b>${u?.points || 0} pt</b></p>
        <div style="margin-top:14px">
          <button class="btn ghost sm" onclick="closeModal();location.hash='#rewards'">${t('claimVoucherInRewards')} (${VC} pt)</button>
        </div>
      </div>
    `}

    <!-- Optional Manual Promo Code Entry -->
    <div style="border-top:1px solid var(--border);padding-top:14px;margin-top:14px">
      <label for="manualVoucherInput" class="small muted">${t('havePromoCode')}</label>
      <div style="display:flex;gap:8px;margin-top:6px">
        <input id="manualVoucherInput" placeholder="e.g. SR10-PROMO" style="flex:1" uppercase />
        <button class="btn primary sm" onclick="applyManualVoucherCode()">${t('applyCodeBtn')}</button>
      </div>
    </div>

    <div style="margin-top:18px;text-align:center">
      <button class="btn ghost sm" onclick="closeModal()">${t('closeModalBtn')}</button>
    </div>
  `);
}

function applyCartVoucher(code) {
  selectedVoucher = code;
  const u = me();
  const v = (u?.vouchers || []).find(x => x.code === code);
  toast(t('voucherApplied', { code, pct: v ? v.pct : '' }));
  closeModal();
  cart();
}

function removeVoucherSelection() {
  selectedVoucher = null;
  toast(t('voucherRemoved'));
  cart();
}

function applyManualVoucherCode() {
  const code = ($('#manualVoucherInput')?.value || '').trim().toUpperCase();
  if (!code) return toast(t('enterVoucherCode'));
  const u = me();
  let v = (u?.vouchers || []).find(x => x.code.toUpperCase() === code && !x.used);
  if (!v) {
    if (code === 'SR10-PROMO' || code === 'VIP10' || code === 'SOMPHEAREAK') {
      v = { code, pct: 10, used: false, createdAt: new Date().toISOString() };
      u.vouchers = u.vouchers || [];
      u.vouchers.push(v);
      SRDB.updateUser(u.id, { vouchers: u.vouchers });
    } else {
      return toast(t('invalidVoucherCode'));
    }
  }
  selectedVoucher = v.code;
  toast(t('voucherApplied', { code: v.code, pct: v.pct }));
  closeModal();
  cart();
}

function checkout() {
  const L = cartLines();
  if (!L.length) return cart();
  const u = me(), c = cfg();
  const avail = (u.vouchers || []).filter(v => !v.used);
  const v = avail.find(x => x.code === selectedVoucher);
  const sub = subtotal(L), disc = v ? sub * v.pct / 100 : 0;

  view(`
  <div class="two">
    <div class="glass panel">
      <h2 class="kh">${t('checkoutTitle')}</h2>
      <p class="muted">${t('checkoutDesc')}</p><br>
      <div class="glass" style="padding:14px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center">
        <div><p class="small muted">Telegram Customer</p><b>@${esc(u.username)}</b></div>
        <span class="badge ok">${t('gateVerified')}</span>
      </div>
      <label for="coName">${t('recipientName')}</label>
      <input id="coName" value="${esc(u.name || '')}" placeholder="e.g. Sokha Meng"><br><br>
      <label for="coPhone">${t('contactPhone')}</label>
      <input id="coPhone" value="${esc(u.phone || '')}"><br><br>
      <label for="coProv">${t('provinceCity')}</label>
      <select id="coProv">
        ${['Phnom Penh','Siem Reap','Battambang','Kampot','Sihanoukville','Kandal','Kampong Cham','Other'].map(p => `<option>${p}</option>`).join('')}
      </select><br><br>
      <label for="coAddr">${t('deliveryAddr')}</label>
      <input id="coAddr" placeholder="House #, Street, Sangkat..."><br><br>
      <label for="coPay">${t('paymentMethod')}</label>
      <select id="coPay">
        <option>ABA KHQR (Scan to Pay)</option>
        <option>ACLEDA PromptPay</option>
        <option>Cash on Delivery (COD)</option>
      </select>
    </div>
    <div class="glass panel">
      <h3>${t('summary')}</h3>
      ${L.map(i => `
        <div class="line small">
          <span>${esc(i.name)} ×${i.qty}</span>
          <span>${money(i.price * i.qty)}</span>
        </div>`).join('')}
      <br>
      <label for="coVoucher">${t('applyVoucher')}</label>
      <select id="coVoucher" onchange="selectedVoucher=this.value||null;checkout()">
        <option value="">${avail.length ? t('selectVoucher') : t('noVouchers')}</option>
        ${avail.map(x => `<option value="${x.code}" ${x.code === selectedVoucher ? 'selected' : ''}>${x.pct}% OFF · ${x.code}</option>`).join('')}
      </select>
      <div class="line"><span>${t('subtotal')}</span><span>${money(sub)}</span></div>
      ${v ? `<div class="line"><span>${t('voucherDiscount')} (${v.pct}% OFF)</span><span style="color:var(--ok)">−${money(disc)}</span></div>` : ''}
      <div class="line"><span>${t('deliveryFee')}</span><span>${money(c.deliveryFee)}</span></div>
      <div class="line"><b>${t('totalAmount')}</b><b class="price">${money(sub - disc + c.deliveryFee)}</b></div>
      <div class="line"><span>${t('pointsEarn')}</span><b class="price">+${cartPts(L)} ${t('pointsPlus')}</b></div>
      <div class="glass" style="padding:10px;margin-top:14px;font-size:.78rem;color:var(--muted)">
        ${t('confirmNotice')}
      </div>
      <br>
      <button class="btn primary" style="width:100%" onclick="placeOrder()">${t('placeOrderBtn')}</button>
    </div>
  </div>`);
}

async function placeOrder() {
  const name = $('#coName').value.trim(), addr = $('#coAddr').value.trim();
  if (!name || !addr) return toast(t('fillRequired'));
  const L = cartLines(), u = me(), c = cfg();
  const bad = L.find(i => i.productId && i.qty > i.stock);
  if (bad) return toast(`Only ${bad.stock} "${bad.name}" remaining in stock`);

  const v = (u.vouchers || []).find(x => x.code === selectedVoucher && !x.used);
  const sub = subtotal(L), disc = v ? sub * v.pct / 100 : 0;
  if (v) {
    v.used = true;
    v.used_at = new Date().toISOString();
  }

  await SRDB.updateUser(u.id, { name, vouchers: u.vouchers });
  const o = await SRDB.placeOrder({
    userId: u.id,
    items: L.map(({ productId, name, price, qty, pt, desc, image }) => ({ productId, name, price, qty, pt, desc, image })),
    subtotal: sub,
    discount: disc,
    delivery: c.deliveryFee,
    total: sub - disc + c.deliveryFee,
    earned: cartPts(L),
    voucher: v?.code,
    voucher_pct: v?.pct,
    contact: { name, phone: $('#coPhone').value, address: `${addr}, ${$('#coProv').value}`, payment: $('#coPay').value },
  });

  knownOrdersStatus[o.id] = o.status;
  S.cart = [];
  selectedVoucher = null;
  save();

  playChime('success');
  modal(`
    <div style="font-size:3.5rem;margin-bottom:8px">🧾</div>
    <h2>${t('orderSubmitted')}</h2>
    <p class="muted">${t('orderRef')}: <b>#${o.id}</b></p><br>
    <p>${t('pendingAdminNotice')}<br><span class="status pending" style="margin-top:8px;display:inline-block">${t('pendingStatus')}</span></p>
    <p class="small muted" style="margin-top:12px">${t('pointsAwardNotice', { p: o.earned })}</p>
    <br>
    <div style="display:flex;gap:10px;justify-content:center">
      <button class="btn primary" onclick="closeModal();location.hash='orders'">${t('viewMyOrders')}</button>
      <button class="btn ghost" onclick="closeModal();viewCustomerReceipt('${o.id}')">${t('viewOfficialReceipt')}</button>
    </div>`);
  updateHeader();
}

/* ================================================================
   Views: 4. Orders History & Customer Receipt
   ================================================================ */
function orders() {
  const list = SRDB.ordersOf(S.userId);
  view(`
  <div class="glass panel">
    <div class="section-title" style="margin-top:0">
      <div><h2 class="kh">${t('myOrders')}</h2><p class="muted">${t('myOrders')} (${list.length})</p></div>
      <button class="btn ghost sm" data-nav="home">${t('startShopping')}</button>
    </div>
    ${list.length ? `
      ${list.map(o => `
      <div class="line" style="flex-wrap:wrap">
        <div>
          <b>#${o.id}</b> <span class="status ${(o.status || '').toLowerCase()}">${o.status}</span>
          <div class="muted small">${new Date(o.createdAt || o.created_at).toLocaleString()} · ${(o.items || []).map(i => esc(i.name) + ' ×' + i.qty).join(', ')}</div>
          ${o.voucher ? `<div class="small" style="color:var(--ok);margin-top:2px">🎟️ Voucher: ${o.voucher}</div>` : ''}
          ${o.note ? `
            <div class="order-admin-note ${o.status === 'Rejected' ? 'rejected-note' : ''}">
              <div class="note-header">⚠️ ${t('adminReasonNote')}:</div>
              <div class="note-body">${esc(o.note)}</div>
              ${o.voucher && o.status === 'Rejected' ? `<div class="small ok" style="margin-top:4px;font-weight:600">${t('voucherRefundedNotice')}</div>` : ''}
            </div>` : ''}
        </div>
        <div style="text-align:right;display:flex;gap:10px;align-items:center">
          <div>
            <b class="price">${money(o.total)}</b>
            <div class="small ${o.status === 'Approved' || o.status === 'Delivered' ? 'price' : 'muted'}">
              ${o.status === 'Approved' || o.status === 'Delivered' ? '+' + o.earned + ' ' + t('pointsPlus') : '(+' + o.earned + ' ' + t('pointsPlus') + ')'}
            </div>
          </div>
          <button class="btn ghost sm" onclick="viewCustomerReceipt('${o.id}')">${t('receiptTitle')} 🧾</button>
        </div>
      </div>`).join('')}`
    : `<p class="muted" style="padding:24px 0;text-align:center">${t('noOrdersYet')}</p>`}
  </div>`);
}

function viewCustomerReceipt(id) {
  const o = SRDB.order(id);
  if (!o) return;
  const u = me();
  const contact = o.contact || {};
  const steps = ['Pending', 'Approved', 'Shipped', 'Delivered'];
  const curIdx = steps.indexOf(o.status);

  const trackerHtml = (o.status === 'Rejected' || o.status === 'Cancelled') ? `
    <div class="tracker">
      <div class="tracker-step done"><span class="dot-icon">1</span>${t('orderPlacedStep')}</div>
      <div class="tracker-step rejected"><span class="dot-icon">✖</span>${o.status}</div>
    </div>` : `
    <div class="tracker">
      ${steps.map((st, i) => `
        <div class="tracker-step ${curIdx >= i ? 'done' : ''} ${curIdx === i ? 'current' : ''}">
          <span class="dot-icon">${curIdx >= i ? '✔' : i + 1}</span>
          ${st}
        </div>`).join('')}
    </div>`;

  modal(`
  <div style="display:flex;justify-content:center;margin-bottom:8px">
    <span class="logo-mark sm"><img src="${esc(cfg().siteLogo || cfg().site_logo || 'logo.jpg')}" alt="Logo" class="site-logo-img"></span>
  </div>
  <h2>${t('receiptTitle')} #${o.id}</h2>
  ${trackerHtml}
  <div class="receipt">
    ========================================<br>
    <b>${esc(cfg().siteTitle || 'SOMPHEA REAK STUDIO')}</b><br>
    ${esc(cfg().tagline || 'Cambodia Kingdom of Wonder')}<br>
    ========================================<br>
    Date: ${new Date(o.createdAt || o.created_at).toLocaleString()}<br>
    ${t('customer')}: @${esc(u?.username)} (${t('gateVerified')})<br>
    ${t('recipient')}: ${esc(contact.name)}<br>
    ${t('phone')}: ${esc(contact.phone)}<br>
    ${t('address')}: ${esc(contact.address)}<br>
    ${t('payment')}: ${esc(contact.payment)}<br>
    ${t('status')}: <b>${o.status}</b><br>
    ${o.note ? `----------------------------------------<br>
    <b style="color:var(--err)">⚠️ ${t('adminReasonNote')}:</b><br>
    <span style="color:${o.status === 'Rejected' ? '#ef4444' : 'inherit'}">${esc(o.note)}</span><br>
    ${o.voucher && o.status === 'Rejected' ? `<span style="color:#10b981;font-size:0.8rem;font-weight:600">${t('voucherRefundedNotice')}</span><br>` : ''}` : ''}
    ----------------------------------------<br>
    ${(o.items || []).map(i => `${esc(i.name)} ${i.desc ? `(${esc(i.desc)})` : ''} ×${i.qty} = ${money(i.price * i.qty)} (+${i.pt * i.qty} ${t('pointsPlus')})`).join('<br>')}<br>
    ----------------------------------------<br>
    ${t('subtotal')}: ${money(o.subtotal)}<br>
    ${o.voucher ? `Voucher (${o.voucher}): -${money(o.discount)}<br>` : ''}
    ${t('deliveryFee')}: ${money(o.delivery)}<br>
    <b>${t('totalAmount')}: ${money(o.total)}</b><br>
    ${t('myPoints')}: ${o.status === 'Approved' || o.status === 'Delivered' ? `+${o.earned} pt (Credited)` : `+${o.earned} pt (Pending)`}<br>
    ========================================
  </div>
  <br>
  <div style="display:flex;gap:10px;justify-content:center">
    <button class="btn primary sm" onclick="window.print()">${t('printReceipt')}</button>
    <button class="btn ghost sm" onclick="closeModal()">${t('close')}</button>
  </div>`);
}

/* ================================================================
   Views: 5. Rewards & Vouchers
   ================================================================ */
function rewards() {
  const u = me(), { voucherCost: VC, voucherPct: VP } = cfg();
  const need = VC - ((u.points || 0) % VC);
  const vouchers = u.vouchers || [];
  const pointLog = u.point_log || u.pointLog || [];

  view(`
  <div class="glass pt-hero">
    <div>
      <p class="muted">${t('rewardsTitle')}</p>
      <div class="pt-big">⭐ ${u.points || 0} ${t('myPoints')}</div>
      <div class="progress"><div style="width:${(u.points || 0) >= VC ? 100 : ((u.points || 0) % VC) / VC * 100}%"></div></div>
      <p class="small muted" style="margin-top:6px">${(u.points || 0) >= VC ? t('readyClaimVoucher') : need + ' ' + t('ptNextVoucher')}</p>
    </div>
    <button class="btn primary" ${(u.points || 0) < VC ? 'disabled' : ''} onclick="redeem()">
      ${t('redeemBtn', { pct: VP, cost: VC })}
    </button>
  </div>

  <h3 class="section-title">${t('howToEarnTitle')}</h3>
  <div class="rules">
    <div class="glass rule"><b>1–2 pt</b>${t('ruleMini')}</div>
    <div class="glass rule"><b>3 pt</b>${t('ruleReady')}</div>
    <div class="glass rule"><b>${cfg().customPt} pt</b>${t('ruleCustom', { pt: cfg().customPt })}</div>
    <div class="glass rule"><b>${VC} pt</b>${t('ruleVoucher', { cost: VC, pct: VP })}</div>
  </div>

  <div class="two" style="margin-top:20px">
    <div class="glass panel">
      <h3>${t('myVouchersTitle')} (${vouchers.filter(v => !v.used).length} ${t('available')})</h3>
      ${vouchers.length ? vouchers.map(v => `
        <div class="voucher ${v.used ? 'used' : ''}">
          <div>
            <div class="v-amt">${v.pct}% OFF</div>
            <div class="small muted">Code: <code>${v.code}</code></div>
          </div>
          <span class="badge ${v.used ? '' : 'ok'}">${v.used ? t('used') : t('available')}</span>
        </div>`).join('')
      : `<p class="muted" style="padding:16px 0">${t('noVouchersYet', { cost: VC })}</p>`}
    </div>
    <div class="glass panel">
      <h3>${t('pointHistoryTitle')}</h3>
      ${pointLog.length ? pointLog.map(l => `
        <div class="line small">
          <span>${esc(l.t)}</span>
          <b style="color:${l.d > 0 ? 'var(--ok)' : 'var(--err)'}">${l.d > 0 ? '+' : ''}${l.d} pt</b>
        </div>`).join('')
      : `<p class="muted" style="padding:16px 0">${t('noPointHistory')}</p>`}
    </div>
  </div>`);
}

async function redeem() {
  const u = me(), { voucherCost: VC, voucherPct: VP } = cfg();
  if ((u.points || 0) < VC) return toast(t('readyClaimVoucher') || `Need ${VC} points`);

  const res = await SRDB.redeemVoucher(u.id);
  if (res && res.error) {
    return toast(res.error);
  }
  const vObj = res.voucher || { code: 'SR' + VP + '-PROMO', pct: VP };
  rewards();
  updateHeader();
  playChime('success');
  modal(`
    <div style="font-size:3rem;margin-bottom:8px">🎟️</div>
    <h2>${t('voucherClaimedTitle')}</h2>
    <p class="muted">${t('voucherClaimedDesc', { pct: vObj.pct || VP })}</p>
    <div style="margin:16px 0;padding:12px;border:2px dashed #10b981;border-radius:12px;font-size:1.4rem;font-weight:700;letter-spacing:2px;color:#10b981">
      ${vObj.code}
    </div>
    <button class="btn primary" onclick="closeModal()">${t('useInCheckoutBtn')}</button>`);
}

/* ================================================================
   Views: 6. Custom Italy Charm Designer
   ================================================================ */
function customizer() {
  const c = cfg();
  const charmsList = c.charms || DEFAULT_CHARMS;
  const price = c.customBasePrice + custom.length * c.charmPrice;

  view(`
  <div class="section-title">
    <div>
      <h2>${t('customTitle')}</h2>
      <p class="muted">${t('customDesc')}</p>
    </div>
    <button class="btn ghost" data-nav="home">${t('backToHome')}</button>
  </div>

  <div class="two">
    <div class="glass panel">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3>${t('braceletPreview', { count: custom.length, max: MAX_LINKS })}</h3>
        ${custom.length ? `<button class="btn ghost sm" onclick="custom=[];customizer()">${t('clearBtn')}</button>` : ''}
      </div>
      <br>
      <div class="bracelet-preview">
        ${custom.length ? custom.map((ch, i) => `<span onclick="custom.splice(${i},1);customizer()" title="Tap to remove">${ch}</span>`).join('')
        : `<p class="muted">${t('emptyBracelet')}</p>`}
      </div>
      <br>
      <h4>${t('availableCharms')}</h4>
      <div class="charms" style="margin-top:10px">
        ${charmsList.map(ch => `<button class="charm" onclick="if(custom.length<${MAX_LINKS}){custom.push('${ch}');customizer()}">${ch}</button>`).join('')}
      </div>
    </div>
    <div class="glass panel">
      <h3>${t('configPrice')}</h3>
      <div class="line"><span>${t('baseBand')}</span><span>${money(c.customBasePrice)}</span></div>
      <div class="line"><span>${t('charmsCost', { count: custom.length, price: money(c.charmPrice) })}</span><span>${money(custom.length * c.charmPrice)}</span></div>
      <div class="line"><b>${t('totalAmount')}</b><b class="price">${money(price)}</b></div>
      <div class="line"><span>${t('pointsReward')}</span><b class="price">+${c.customPt} ${t('pointsPlus')}</b></div>
      <br>
      <button class="btn primary" style="width:100%" ${custom.length ? '' : 'disabled'} onclick="addCustom()">
        ${t('addCustomBtn')}
      </button>
    </div>
  </div>`);
}

function addCustom() {
  const c = cfg();
  addToCart(null, {
    name: S.lang === 'km' ? 'ខ្សែដៃអ៊ីតាលីកែច្នៃ (Custom Italy Charm)' : 'Custom Italy Charm Bracelet',
    desc: custom.join(' '),
    price: c.customBasePrice + custom.length * c.charmPrice,
    pt: c.customPt,
    icon: '🔗',
    qty: 1
  });
  custom = [];
  customizer();
}

function getSellerTelegramUrl() {
  const c = cfg();
  const raw = c.sellerTelegram || c.seller_telegram || 'sompheareak';
  const clean = String(raw).trim().replace(/^@/, '');
  return clean.startsWith('http') ? clean : `https://t.me/${clean}`;
}

function openAccountVouchersModal() {
  const u = me();
  const vouchers = u?.vouchers || [];
  const avail = vouchers.filter(v => !v.used);
  const { voucherCost: VC } = cfg();

  modal(`
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:2.4rem">🎟️</div>
      <h2 class="kh">${t('myVouchersTitle')}</h2>
      <p class="muted small">${t('vouchersLabel')}: <b>${avail.length} ${t('available')}</b></p>
    </div>

    ${vouchers.length ? `
      <div class="voucher-list" style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px;max-height:280px;overflow-y:auto;padding-right:4px">
        ${vouchers.map(v => `
          <div class="voucher-picker-card glass ${v.used ? 'used' : ''}" style="padding:12px 14px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;border:1px solid ${v.used ? 'var(--border)' : '#10b981'};opacity:${v.used ? '0.6' : '1'}">
            <div>
              <div style="font-size:1.2rem;font-weight:700;color:${v.used ? 'var(--muted)' : 'var(--accent-gold)'}">${v.pct}% OFF</div>
              <div class="muted small" style="font-family:monospace;letter-spacing:1px">${v.code}</div>
            </div>
            ${v.used ? `
              <span class="badge">${t('used')}</span>
            ` : `
              <button class="btn sm primary" onclick="selectedVoucher='${v.code}';closeModal();location.hash='#cart'">${t('useInCheckoutBtn')}</button>
            `}
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="glass" style="padding:24px 16px;text-align:center;border-radius:14px;margin-bottom:16px">
        <p class="muted">${t('noVouchersAvailable')}</p>
        <p class="small muted" style="margin-top:6px">${t('pointsBalanceLabel')}: <b>${u?.points || 0} pt</b></p>
        <div style="margin-top:14px">
          <button class="btn primary sm" onclick="closeModal();location.hash='#rewards'">${t('claimVoucherInRewards')} (${VC} pt)</button>
        </div>
      </div>
    `}

    <div style="display:flex;gap:10px;justify-content:center;margin-top:14px">
      <button class="btn ghost sm" onclick="closeModal();location.hash='#rewards'">⭐ ${t('rewardsBtn')}</button>
      <button class="btn ghost sm" onclick="closeModal()">${t('closeModalBtn')}</button>
    </div>
  `);
}

/* ================================================================
   Views: 7. Profile
   ================================================================ */
function profile() {
  const u = me();
  const availCount = (u?.vouchers || []).filter(v => !v.used).length;
  const tgUrl = getSellerTelegramUrl();

  view(`
  <div class="glass panel" style="max-width:520px;margin:auto;text-align:center">
    <div class="logo-mark">${esc((u?.username || 'U')[0].toUpperCase())}</div><br>
    <h2>@${esc(u?.username || 'user')}</h2>
    <span class="badge ok">${t('gateVerified')}</span><br><br>
    <div class="line"><span>${t('contactPhoneLabel')}</span><b>${esc(u?.phone || '—')}</b></div>
    <div class="line"><span>${t('pointsBalanceLabel')}</span><b class="price">${u?.points || 0} ${t('pointsPlus')}</b></div>
    <div class="line"><span>${t('totalOrdersLabel')}</span><b>${SRDB.ordersOf(u?.id).length}</b></div>
    <div class="line"><span>${t('vouchersLabel')}</span><b>${availCount} ${t('available')}</b></div>

    <div class="account-actions-box">
      <!-- Main Action Buttons: Vouchers & Customer Service (Telegram) -->
      <div class="account-primary-actions">
        <button class="btn primary account-voucher-btn" onclick="openAccountVouchersModal()">
          🎟️ <span>${t('myVouchersBtn')}</span> <span class="badge" style="background:rgba(255,255,255,0.22);color:#fff;margin-left:4px">${availCount}</span>
        </button>
        <a href="${tgUrl}" target="_blank" rel="noopener noreferrer" class="btn tg account-cs-btn" title="Contact Seller on Telegram">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M9.8 15.6 9.4 20c.6 0 .9-.3 1.2-.6l2.9-2.7 6 4.4c1.1.6 1.9.3 2.2-1L24 3.6c.4-1.6-.6-2.2-1.6-1.8L.9 10.1c-1.5.6-1.5 1.4-.3 1.8l5.5 1.7L18.9 5.7c.6-.4 1.1-.2.7.2"/>
          </svg>
          <span>${t('customerServiceBtn')}</span>
        </a>
      </div>

      <!-- Secondary Utility Actions -->
      <div class="account-secondary-actions">
        <button class="btn ghost sm" onclick="SRDB.addPoints(S.userId,25,'Demo test bonus');toast('+25 demo pt added')">${t('testBonusBtn')}</button>
        <button class="btn ghost sm" onclick="clearMyLoginData()">${t('clearLoginDataText')}</button>
        <button class="btn ghost sm" onclick="logout()">${t('logoutBtn')}</button>
      </div>
    </div>
  </div>`);
}

function logout() {
  if (confirm(t('logoutConfirm'))) {
    S.userId = null;
    S.cart = [];
    save();
    location.hash = '';
    location.reload();
  }
}

// Initial language & logo setup & entry check
applyLanguageUI();
applyTheme();
applyLogo();

const centerLogoBtnEl = $('#mbNavCenterLogo');
if (centerLogoBtnEl) {
  centerLogoBtnEl.addEventListener('click', () => {
    if (!location.hash || location.hash === '#home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

if (me() || isAdmin()) {
  if (isAdmin() && !S.userId) {
    S.userId = 'Uadmin';
    save();
  }
  enterApp();
}
