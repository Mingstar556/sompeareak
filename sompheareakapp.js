/* Somphea Reak – Customer Storefront with Bilingual Khmer/English */
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
    username: 'vip_customer',
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
    gateStep1Desc: 'សូមចូលដោយប្រើ Telegram ដើម្បីបន្ត។',
    gateUserLabel: 'ឈ្មោះគណនី Telegram',
    gateLoginBtn: 'ចូលដោយប្រើ Telegram',
    gateStep2Title: 'លេខទូរស័ព្ទទំនាក់ទំនង',
    gateConnectedAs: 'ភ្ជាប់ជាគណនី',
    gateVerified: 'បានផ្ទៀងផ្ទាត់ Telegram',
    gatePhoneLabel: 'លេខទូរស័ព្ទរបស់អ្នក',
    gatePhoneErr: 'សូមបញ្ចូលលេខទូរស័ព្ទត្រឹមត្រូវ (៨-៩ ខ្ទង់)',
    gateContinue: 'បន្តទៅមុខ',
    rememberMeText: 'ចងចាំខ្ញុំលើឧបករណ៍នេះ',
    clearLoginDataText: 'សម្អាតទិន្នន័យចូល',
    loginDataCleared: 'បានសម្អាតទិន្នន័យចូលគណនីរួចរាល់ ✨',
    clearFilter: 'សម្អាតការស្វែងរក',
    resultsFound: 'រកឃើញ {n} មុខទំនិញ',

    // Top Navigation
    myPoints: 'ពិន្ទុ',
    myOrders: 'ប្រវត្តិកម្ម៉ង់',
    cart: 'កន្ត្រកទំនិញ',
    profile: 'គណនី',

    // Hero & Sections
    designCharmBtn: '🔗 រចនាខ្សែដៃអ៊ីតាលី (Custom Italy Charm)',
    rewardsBtn: '⭐ ពិន្ទុរង្វាន់',
    collectionsTitle: 'បណ្តុំម៉ូត និងប្រភេទផលិតផល',
    collectionsDesc: 'ស្វែងរកផលិតផលប្រណិតៗ វត្ថុអនុស្សាវរីយ៍ និងគ្រឿងអលង្ការកែច្នៃតាមចិត្ត',
    itemsCount: 'មុខទំនិញ',
    backToHome: '← ត្រឡប់ទៅទំព័រដើម',
    noItemsCat: 'មិនទាន់មានទំនិញក្នុងប្រភេទនេះនៅឡើយទេ',
    catalogCurating: 'ប្រភេទនេះកំពុងត្រូវបានរៀបចំទំនិញ',
    generalShopTitle: 'ហាងទំនិញរួម • ផលិតផលទាំងអស់',
    generalShopDesc: 'ស្វែងរក និងជ្រើសរើសទំនិញទាំងអស់ក្នុងស្ទូឌីយោដោយងាយស្រួល',
    allFilter: 'ទាំងអស់',
    searchPlaceholder: '🔍 ស្វែងរកទំនិញ...',
    storeReasonNote: 'កំណត់សម្គាល់ពីហាង',
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
    pendingNotice: 'វិក្កយបត្រត្រូវបានបញ្ជូនទៅហាង។',
    pendingStatus: '⏳ កំពុងរង់ចាំការបញ្ជាក់ពីហាង',
    pointsAwardNotice: 'ពិន្ទុ (+{p} pt) នឹងត្រូវបានបញ្ចូលដោយស្វ័យប្រវត្តិនៅពេលការកម្ម៉ង់ត្រូវបានបញ្ជាក់!',
    viewMyOrders: 'មើលប្រវត្តិកម្ម៉ង់',
    viewOfficialReceipt: 'មើលវិក្កយបត្រផ្លូវការ',

    // Receipt
    receiptTitle: 'វិក្កយបត្រផ្លូវការ',
    customer: 'អតិថិជន',
    recipient: 'អ្នកទទួល',
    phone: 'ទូរស័ព្ទ',
    address: 'អាសយដ្ឋាន',
    payment: 'វិធីទូទាត់',
    payCod: '💵 ទូទាត់ពេលទំនិញដល់ដៃ (COD)',
    payKhqr: '📲 ABA KHQR (ស្កេនទូទាត់)',
    payCodDesc: 'ទូទាត់សាច់ប្រាក់ពេលបុគ្គលិកដឹកជញ្ជូនដល់ផ្ទះ (ផ្ដល់ជូនសម្រាប់រាជធានីភ្នំពេញប៉ុណ្ណោះ)',
    payKhqrDesc: 'ស្កេនទូទាត់រហ័ស និងសុវត្ថិភាពតាមរយៈ ABA KHQR ឬកម្មវិធី Bakong ទាំងអស់',
    provincePaymentNotice: '📍 សេវាទូទាត់ពេលទំនិញដល់ដៃ (COD) ផ្ដល់ជូនសម្រាប់តែរាជធានីភ្នំពេញប៉ុណ្ណោះ។ ការដឹកជញ្ជូនតាមបណ្ដាខេត្តតម្រូវឱ្យស្កេនទូទាត់ ABA KHQR ជាមុន។',
    codReceiptNotice: 'សូមរៀបចំសាច់ប្រាក់សម្រាប់ទូទាត់ជូនបុគ្គលិកដឹកជញ្ជូនពេលទំនិញទៅដល់ដៃ។',
    khqrReceiptNotice: 'សូមស្កេនទូទាត់តាម ABA KHQR ឬផ្ញើវិក្កយបត្រទៅកាន់ Telegram ហាងដើម្បីបញ្ជាក់ការកម្ម៉ង់។',
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

    cancel: 'បោះបង់',
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
    gateStep1Desc: 'Please sign in with Telegram to continue.',
    gateUserLabel: 'Telegram username',
    gateLoginBtn: 'Login with Telegram',
    gateStep2Title: 'Contact Phone Number',
    gateConnectedAs: 'Connected as',
    gateVerified: 'Telegram Verified',
    gatePhoneLabel: 'Contact phone number',
    gatePhoneErr: 'Please enter a valid phone number (8–9 digits).',
    gateContinue: 'Continue',
    rememberMeText: 'Remember me on this device',
    clearLoginDataText: 'Clear login data',
    loginDataCleared: 'Login data cleared from this browser ✨',
    clearFilter: 'Clear Search',
    resultsFound: 'Found {n} items',

    // Top Navigation
    myPoints: 'pt',
    myOrders: 'My orders',
    cart: 'Shopping Cart',
    profile: 'My Profile',

    // Hero & Sections
    designCharmBtn: '🔗 Design Italy Charm Bracelet',
    rewardsBtn: '⭐ Rewards',
    collectionsTitle: 'Studio Collections & Categories',
    collectionsDesc: 'Explore handcrafted pieces, collectibles, and customizable jewelry',
    itemsCount: 'items',
    backToHome: '← Back to Collections',
    noItemsCat: 'No items in this category yet.',
    catalogCurating: 'Catalog currently being curated',
    generalShopTitle: 'General Shop • All Collections',
    generalShopDesc: 'Browse and shop all studio items seamlessly in one place',
    allFilter: 'All Items',
    searchPlaceholder: '🔍 Search products...',
    storeReasonNote: 'Note from Store',
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
    pendingNotice: 'Receipt forwarded to store.',
    pendingStatus: '⏳ Pending Confirmation',
    pointsAwardNotice: 'Points (+{p} pt) will automatically be credited upon order confirmation!',
    viewMyOrders: 'View My Orders',
    viewOfficialReceipt: 'View Official Receipt',

    // Receipt
    receiptTitle: 'Official Receipt',
    customer: 'Customer',
    recipient: 'Recipient',
    phone: 'Phone',
    address: 'Address',
    payment: 'Payment',
    payCod: '💵 Cash on Delivery (COD)',
    payKhqr: '📲 ABA KHQR (Scan to Pay)',
    payCodDesc: 'Pay cash to courier when order arrives at your door (Phnom Penh only)',
    payKhqrDesc: 'Instant, secure QR payment via ABA KHQR or any Bakong banking app',
    provincePaymentNotice: '📍 Cash on Delivery (COD) is available only in Phnom Penh. Orders to provinces require ABA KHQR pre-payment.',
    codReceiptNotice: 'Please prepare cash payment for our delivery courier upon package arrival.',
    khqrReceiptNotice: 'Please scan ABA KHQR or forward your receipt to our Telegram store admin for confirmation.',
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

    cancel: 'Cancel',
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

let _appAudioCtx = null;
function getAppAudioContext() {
  if (!_appAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      _appAudioCtx = new AudioContextClass();
    }
  }
  if (_appAudioCtx && _appAudioCtx.state === 'suspended') {
    _appAudioCtx.resume().catch(() => {});
  }
  return _appAudioCtx;
}

['click', 'keydown', 'touchstart'].forEach(evt => {
  window.addEventListener(evt, () => {
    if (_appAudioCtx && _appAudioCtx.state === 'suspended') {
      _appAudioCtx.resume().catch(() => {});
    }
  }, { once: true, passive: true });
});

/* Audio feedback */
function playChime(type = 'success') {
  try {
    const ctx = getAppAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    if (type === 'success') {
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      osc.frequency.setValueAtTime(320, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
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
  if (rem) {
    rem.checked = isRemember;
    rem.onchange = () => {
      localStorage.setItem('sr_remember', rem.checked ? 'true' : 'false');
    };
  }
  const savedUser = localStorage.getItem('sr_remembered_username');
  const savedPhone = localStorage.getItem('sr_remembered_phone');
  if (savedUser && $('#tgUser')) {
    $('#tgUser').value = savedUser;
  }
  if (savedPhone && $('#phoneInput')) {
    $('#phoneInput').value = savedPhone;
  }
}

function tryAutoLoginRememberedUser() {
  const isRemember = localStorage.getItem('sr_remember') !== 'false';
  if (!isRemember) return false;
  if (S.userId) {
    enterApp();
    return true;
  }
  const savedUser = localStorage.getItem('sr_remembered_username');
  const savedPhone = localStorage.getItem('sr_remembered_phone');
  if (savedUser && savedPhone) {
    const existing = SRDB.users().find(u => u.username === savedUser || u.username === '@' + savedUser);
    if (existing) {
      S.userId = existing.id;
    } else {
      S.userId = 'u_' + savedUser;
    }
    save();
    enterApp();
    return true;
  }
  return false;
}

if ($('#tgUser')) {
  $('#tgUser').onkeydown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('#tgLoginBtn').click();
    }
  };
}

if ($('#phoneInput')) {
  $('#phoneInput').onkeydown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('#phoneBtn').click();
    }
  };
}

$('#tgLoginBtn').onclick = () => {
  let u = $('#tgUser').value.trim().replace(/^@/, '');
  if (!u) u = 'guest' + Math.floor(Math.random() * 9000 + 1000);
  const rem = $('#rememberMeCheckbox');
  if (rem && rem.checked) {
    localStorage.setItem('sr_remembered_username', u);
  }
  const btn = $('#tgLoginBtn');
  const btnText = $('#tgLoginBtnText');
  btn.disabled = true;
  if (btnText) {
    btnText.textContent = S.lang === 'km' ? 'កំពុងភ្ជាប់ទៅកាន់ Telegram…' : 'Connecting to Telegram…';
  } else {
    btn.textContent = S.lang === 'km' ? 'កំពុងភ្ជាប់ទៅកាន់ Telegram…' : 'Connecting to Telegram…';
  }
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
    if (btnText) {
      btnText.textContent = t('gateLoginBtn');
    } else {
      btn.textContent = t('gateLoginBtn');
    }
    if ($('#phoneInput')) {
      $('#phoneInput').focus();
    }
  }, 120);
};

$('#phoneBtn').onclick = async () => {
  const digits = $('#phoneInput').value.replace(/\D/g, '').replace(/^0/, '');
  if (digits.length < 8 || digits.length > 9) return $('#phoneErr').classList.remove('hidden');
  $('#phoneErr').classList.add('hidden');

  const btn = $('#phoneBtn');
  const btnText = $('#phoneBtnText');
  btn.disabled = true;
  if (btnText) btnText.textContent = S.lang === 'km' ? 'កំពុងចូល…' : 'Logging in…';

  try {
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
  } catch (err) {
    console.error('Login error:', err);
    toast(S.lang === 'km' ? 'មានបញ្ហាក្នុងការចូល សូមព្យាយាមម្តងទៀត' : 'Login failed, please try again');
  } finally {
    btn.disabled = false;
    if (btnText) btnText.textContent = t('gateContinue');
  }
};

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
  route();
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

// Live detection of order approval / update from store
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

// Zero-delay reactive sync across open tabs & live database changes
SRDB.onChange((detail = {}) => {
  const changed = detail.changed || {};
  if (changed.settings) {
    applyLogo();
  }
  if (changed.orders) {
    checkOrderStatusChanges();
  }
  updateHeader();

  // If user is actively typing or inside a modal, do not disrupt
  const isEditing = Boolean(document.activeElement && document.activeElement.matches('input,select,textarea'));
  const isModalOpen = !$('#modal').classList.contains('hidden');
  if (isEditing || isModalOpen) {
    return;
  }

  const h = location.hash.slice(1) || 'home';

  // NEVER disrupt customizer studio while customer is picking charms!
  if (h === 'custom-bracelet') {
    return;
  }

  // Only re-render if current route is affected by what actually changed
  const shouldRerender =
    detail.initial ||
    !detail.changed ||
    (h === 'orders' && changed.orders) ||
    (h === 'rewards' && (changed.users || changed.settings)) ||
    (h === 'profile' && changed.users) ||
    (h === 'cart' && (changed.products || changed.charms)) ||
    (h === 'home' && (changed.products || changed.categories || changed.settings)) ||
    (changed.products && !['orders', 'rewards', 'profile', 'checkout'].includes(h));

  if (me() && !$('#app').classList.contains('hidden') && shouldRerender) {
    route(false);
  }
});

function route(scroll = true) {
  if (!me()) return;
  const h = location.hash.slice(1) || 'home';
  const views = { home, cart, orders, rewards, profile, checkout, 'custom-bracelet': customizer };
  (views[h] || (() => category(h)))();
  updateHeader();
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
  const isKm = S.lang === 'km';
  const titleDisplay = set.siteTitle || set.site_title || (isKm ? 'សម្ភារៈ - Somphea Reak' : 'Somphea Reak');
  const subtitleDisplay = set.subtitle || 'PREMIUM STUDIO';
  document.title = titleDisplay + ' | ' + subtitleDisplay;

  const brandEl = $('#brandName');
  if (brandEl) brandEl.textContent = titleDisplay;
  const brandSubEl = $('#brandSubtitle');
  if (brandSubEl) brandSubEl.textContent = subtitleDisplay;

  const annBar = $('#announcementBar');
  if (annBar) {
    const annMsg = set.announcement || t('announcementDefault');
    annBar.innerHTML = `<span id="announcementText">${esc(annMsg)}</span>`;
    annBar.classList.remove('hidden');
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

function view(html) {
  const el = $('#view');
  if (el) el.innerHTML = html;
}

const CHARM_DEFAULT_COLORS = [
  { id: 'silver', nameKm: 'ប្រាក់ (Silver)', nameEn: 'Silver', dot: '#cbd5e1', border: '#94a3b8' },
  { id: 'black',  nameKm: 'ខ្មៅ (Black)',   nameEn: 'Black',  dot: '#1e293b', border: '#475569' },
  { id: 'orange', nameKm: 'ទឹកក្រូច (Orange)', nameEn: 'Orange', dot: '#ea580c', border: '#f97316' },
  { id: 'red',    nameKm: 'ក្រហម (Red)',    nameEn: 'Red',    dot: '#dc2626', border: '#ef4444' },
  { id: 'gold',   nameKm: 'មាស (Gold)',     nameEn: 'Gold',   dot: '#eab308', border: '#eab308' },
  { id: 'blue',   nameKm: 'ខៀវ (Blue)',     nameEn: 'Blue',   dot: '#2563eb', border: '#3b82f6' }
];

let studioSelectedColor = 'silver'; // Default metal finish: silver | black | orange | red | gold | blue

function renderCharmModelHtml(ch, options = {}) {
  const size = options.size || 'runway'; // 'hero' | 'runway' | 'grid' | 'zoom'
  const imgUrl = ch?.image || 'logo.jpg';
  const name = esc(ch?.name || 'Italy Charm');
  const modelNo = esc(ch?.model_no || 'MD-001');
  const titleAttr = options.title || `${name} (${modelNo})`;

  return `
    <div class="charm-png-wrap size-${size}" title="${titleAttr}">
      <img src="${imgUrl}" alt="${name}" class="charm-png-img" loading="lazy" onerror="this.src='logo.jpg'">
    </div>
  `;
}

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
  const clr = $('#homeSearchClearBtn');
  if (clr) clr.style.display = homeSearchQuery ? 'grid' : 'none';
  updateHomeProductsDisplay();
}

function clearHomeSearch() {
  homeSearchQuery = '';
  const inp = $('#homeSearchInput');
  if (inp) inp.value = '';
  const clr = $('#homeSearchClearBtn');
  if (clr) clr.style.display = 'none';
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
  if (event.target.closest('.tb-cart-btn')) return;
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
      ${p.active === 0 ? `<div style="position:absolute;bottom:6px;left:6px;background:rgba(239,68,68,0.9);color:#fff;font-size:0.62rem;font-weight:700;padding:2px 6px;border-radius:4px;z-index:4">Hidden / Inactive</div>` : ''}
      ${p.discount ? `<span class="tb-ribbon tb-ribbon-sale">-${p.discount}%</span>` : (isHot ? `<span class="tb-ribbon tb-ribbon-hot">HOT</span>` : '')}
      <span class="tb-chip-pt">⭐ +${p.pt} pt</span>
      ${out ? `<div class="tb-soldout-overlay"><span class="tb-soldout-badge">${t('soldOut')}</span></div>` : ''}
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
    </div>
  </section>

  <div class="section-title">
    <div>
      <h2>${t('collectionsTitle')}</h2>
      <p class="muted">${t('collectionsDesc')}</p>
    </div>
  </div>

  <div class="cats">
    ${categories.map(k => {
      const count = allProds.filter(p => p.cat === k.id).length;
      const mainTitle = isKm ? (k.kh || k.name) : (k.name || k.kh);
      const subTitle = isKm ? (k.en || k.name || '') : (k.en || k.kh || '');
      return `
      <div class="glass cat" data-nav="${k.id}">
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
  </div>

  <!-- Featured Italy Charm Studio Showcase Banner -->
  <div class="glass panel featured-charm-hero-banner" style="margin-top:20px;margin-bottom:28px;padding:22px 24px;border-radius:22px;background:linear-gradient(135deg, rgba(234,88,12,0.08) 0%, rgba(255,255,255,0.02) 100%);border:1px solid rgba(234,88,12,0.25)">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">
        <div style="cursor:pointer" onclick="location.hash='#custom-bracelet'" title="${isKm ? 'ចុចដើម្បីរចនាខ្សែដៃ' : 'Click to design bracelet'}">
          ${renderCharmModelHtml(SRDB.charms(true)[0] || { id: 'ch_0', name: 'Plain', image: 'logo.jpg' }, { size: 'hero', color: studioSelectedColor })}
        </div>
        <div>
          <div style="display:inline-flex;align-items:center;gap:6px;margin-bottom:6px">
            <span class="model-count-badge">✨ ${SRDB.charms(true).length}+ ${isKm ? 'ម៉ូតក្នុងហាង' : 'Shop Models Available'}</span>
            <span class="badge" style="background:rgba(255,255,255,0.08)">6 Finishes</span>
          </div>
          <h2 class="kh" style="margin:0 0 4px;font-size:1.45rem;color:#ea580c">
            ${isKm ? 'ស្ទូឌីយោរចនាខ្សែដៃអ៊ីតាលី (Custom Italy Charm)' : 'Custom Italy Charm Studio'}
          </h2>
          <p class="muted small" style="margin:0 0 10px;max-width:480px">
            ${isKm ? 'រចនាខ្សែដៃអ៊ីតាលីផ្ទាល់ខ្លួន • គំរូគ្រាប់ពិត 9mm ដែកអ៊ីណុក • ពណ៌លំនាំដើម ប្រាក់, មាស, ខ្មៅ, ទឹកក្រូច, ក្រហម, ខៀវ' : 'Modular 9mm Italian charm links with real stainless steel chassis • Available in Silver, Gold, Black, Orange, Red & Blue'}
          </p>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
            ${CHARM_DEFAULT_COLORS.map(c => `
              <span style="display:inline-flex;align-items:center;gap:4px;font-size:0.72rem;padding:3px 9px;border-radius:99px;background:rgba(255,255,255,0.04);border:1px solid var(--border)">
                <span class="charm-color-dot" style="width:10px;height:10px;background:${c.dot}"></span>
                ${isKm ? c.nameKm.split(' ')[0] : c.nameEn}
              </span>
            `).join('')}
          </div>
        </div>
      </div>
      <div>
        <button class="btn primary" data-nav="custom-bracelet" style="padding:12px 24px;font-size:0.95rem;box-shadow:0 6px 18px rgba(234,88,12,0.3)">
          🔗 ${isKm ? 'ចាប់ផ្តើមរចនាខ្សែដៃ' : 'Start Designing Bracelet ↗'}
        </button>
      </div>
    </div>
  </div>

  <!-- General Shop (All Collections & Products) Directly Below Categories -->
  <div class="general-shop-section" id="generalShop">
    <div class="section-title">
      <div>
        <h2 class="kh">${t('generalShopTitle')}</h2>
        <p class="muted">${t('generalShopDesc')}</p>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <div class="shop-search-box">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input id="homeSearchInput" type="search" placeholder="${t('searchPlaceholder')}" value="${esc(homeSearchQuery)}" oninput="onHomeSearchChange(this.value)" autocomplete="off">
            <button type="button" class="search-clear-btn" id="homeSearchClearBtn" onclick="clearHomeSearch()" title="Clear search" style="${homeSearchQuery ? 'display:grid' : 'display:none'}">✕</button>
          </div>
        </div>
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

  const isKm = S.lang === 'km';
  const mainTitle = isKm ? (k.kh || k.name) : (k.name || k.kh);
  const subTitle = isKm ? (k.en || '') : (k.en || k.kh || '');

  view(`
  <div class="section-title">
    <div>
      <h2>${esc(mainTitle)}</h2>
      <p class="muted">${esc(subTitle)}</p>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
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
        <button class="btn ghost" data-nav="custom-bracelet">${t('designCharmBtn')}</button>
      </div>
    </div>`}`);
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
            ${i.charms && i.charms.length ? `
            <div style="display:flex;gap:3px;margin-top:6px;overflow-x:auto;max-width:280px;padding-bottom:2px">
              ${i.charms.slice(0, 12).map(ch => `<img src="${ch.image || 'logo.jpg'}" style="width:22px;height:30px;object-fit:contain;border:1px solid rgba(148,163,184,0.3);border-radius:4px;background:rgba(255,255,255,0.06);padding:1px" title="${esc(ch.name)}">`).join('')}
              ${i.charms.length > 12 ? `<span class="muted small" style="align-self:center;font-size:0.65rem">+${i.charms.length - 12}</span>` : ''}
            </div>` : ''}
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

let checkoutFormState = {
  name: '',
  phone: '',
  prov: 'Phnom Penh',
  addr: '',
  payment: 'Cash on Delivery (COD)'
};

function isPhnomPenh(city) {
  if (!city) return false;
  const s = String(city).trim().toLowerCase();
  return s.includes('phnom penh') || s.includes('phom penh') || s.includes('ភ្នំពេញ');
}

function captureCheckoutForm() {
  const nameEl = $('#coName');
  const phoneEl = $('#coPhone');
  const provEl = $('#coProv');
  const addrEl = $('#coAddr');
  const payEl = $('#coPay');
  if (nameEl) checkoutFormState.name = nameEl.value;
  if (phoneEl) checkoutFormState.phone = phoneEl.value;
  if (provEl) checkoutFormState.prov = provEl.value;
  if (addrEl) checkoutFormState.addr = addrEl.value;
  if (payEl) checkoutFormState.payment = payEl.value;
}

function onDeliveryProvinceChanged(prov) {
  captureCheckoutForm();
  checkoutFormState.prov = prov;
  const isPP = isPhnomPenh(prov);
  const paySelect = $('#coPay');
  const noticeEl = $('#coPayNotice');

  if (!isPP) {
    checkoutFormState.payment = 'ABA KHQR (Scan to Pay)';
    if (paySelect) {
      paySelect.innerHTML = `<option value="ABA KHQR (Scan to Pay)" selected>📲 ABA KHQR (Scan to Pay) · ស្កេនទូទាត់ KHQR</option>`;
      paySelect.value = 'ABA KHQR (Scan to Pay)';
    }
    if (noticeEl) {
      noticeEl.style.display = 'block';
    }
  } else {
    const currentPay = checkoutFormState.payment || 'Cash on Delivery (COD)';
    const selectCod = currentPay.includes('COD');
    if (paySelect) {
      paySelect.innerHTML = `
        <option value="Cash on Delivery (COD)" ${selectCod ? 'selected' : ''}>💵 Cash on Delivery (COD) · ទូទាត់ពេលទំនិញដល់ដៃ</option>
        <option value="ABA KHQR (Scan to Pay)" ${!selectCod ? 'selected' : ''}>📲 ABA KHQR (Scan to Pay) · ស្កេនទូទាត់ KHQR</option>
      `;
      paySelect.value = selectCod ? 'Cash on Delivery (COD)' : 'ABA KHQR (Scan to Pay)';
      checkoutFormState.payment = paySelect.value;
    }
    if (noticeEl) {
      noticeEl.style.display = 'none';
    }
  }
}

function checkout() {
  const L = cartLines();
  if (!L.length) return cart();
  const u = me(), c = cfg();
  const avail = (u.vouchers || []).filter(v => !v.used);
  const v = avail.find(x => x.code === selectedVoucher);
  const sub = subtotal(L), disc = v ? sub * v.pct / 100 : 0;

  if (!checkoutFormState.name && u.name) checkoutFormState.name = u.name;
  if (!checkoutFormState.phone && u.phone) checkoutFormState.phone = u.phone;
  if (!checkoutFormState.prov) checkoutFormState.prov = 'Phnom Penh';

  const isPP = isPhnomPenh(checkoutFormState.prov);
  if (!isPP) {
    checkoutFormState.payment = 'ABA KHQR (Scan to Pay)';
  } else if (!checkoutFormState.payment) {
    checkoutFormState.payment = 'Cash on Delivery (COD)';
  }

  const provList = [
    'Phnom Penh', 'Kandal', 'Siem Reap', 'Battambang', 'Kampot',
    'Sihanoukville', 'Kampong Cham', 'Kampong Speu', 'Kampong Thom',
    'Kampong Chhnang', 'Kep', 'Koh Kong', 'Kratie', 'Mondulkiri',
    'Oddar Meanchey', 'Pailin', 'Preah Vihear', 'Prey Veng', 'Pursat',
    'Ratanakiri', 'Stung Treng', 'Svay Rieng', 'Takeo', 'Tboung Khmum', 'Other'
  ];

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
      <input id="coName" value="${esc(checkoutFormState.name)}" placeholder="e.g. Sokha Meng" oninput="checkoutFormState.name=this.value"><br><br>
      
      <label for="coPhone">${t('contactPhone')}</label>
      <input id="coPhone" value="${esc(checkoutFormState.phone)}" placeholder="e.g. 012 345 678" oninput="checkoutFormState.phone=this.value"><br><br>
      
      <label for="coProv">${t('provinceCity')}</label>
      <select id="coProv" onchange="onDeliveryProvinceChanged(this.value)">
        ${provList.map(p => `<option value="${p}" ${p.toLowerCase() === checkoutFormState.prov.toLowerCase() ? 'selected' : ''}>${p}</option>`).join('')}
      </select><br><br>
      
      <label for="coAddr">${t('deliveryAddr')}</label>
      <input id="coAddr" value="${esc(checkoutFormState.addr)}" placeholder="House #, Street, Sangkat..." oninput="checkoutFormState.addr=this.value"><br><br>
      
      <label for="coPay">${t('paymentMethod')}</label>
      <select id="coPay" onchange="checkoutFormState.payment=this.value">
        ${isPP ? `
          <option value="Cash on Delivery (COD)" ${checkoutFormState.payment.includes('COD') ? 'selected' : ''}>💵 Cash on Delivery (COD) · ទូទាត់ពេលទំនិញដល់ដៃ</option>
          <option value="ABA KHQR (Scan to Pay)" ${!checkoutFormState.payment.includes('COD') ? 'selected' : ''}>📲 ABA KHQR (Scan to Pay) · ស្កេនទូទាត់ KHQR</option>
        ` : `
          <option value="ABA KHQR (Scan to Pay)" selected>📲 ABA KHQR (Scan to Pay) · ស្កេនទូទាត់ KHQR</option>
        `}
      </select>
      <div id="coPayNotice" class="glass" style="display:${isPP ? 'none' : 'block'};padding:10px 12px;margin-top:10px;font-size:.82rem;color:var(--gold);border:1px solid rgba(212,175,55,0.35);border-radius:8px;background:rgba(212,175,55,0.06);line-height:1.4">
        ${t('provincePaymentNotice')}
      </div>
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
      <select id="coVoucher" onchange="captureCheckoutForm();selectedVoucher=this.value||null;checkout()">
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
  captureCheckoutForm();
  const name = ($('#coName')?.value || checkoutFormState.name || '').trim();
  const addr = ($('#coAddr')?.value || checkoutFormState.addr || '').trim();
  const phone = ($('#coPhone')?.value || checkoutFormState.phone || '').trim();
  const prov = ($('#coProv')?.value || checkoutFormState.prov || 'Phnom Penh').trim();
  let payment = ($('#coPay')?.value || checkoutFormState.payment || 'ABA KHQR (Scan to Pay)').trim();

  // Strict enforcement: if non-Phnom Penh, payment must be KHQR
  if (!isPhnomPenh(prov)) {
    payment = 'ABA KHQR (Scan to Pay)';
  }

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

  const paymentType = payment.includes('COD') ? 'COD' : 'KHQR';
  const fullAddress = `${addr}, ${prov}`;

  await SRDB.updateUser(u.id, { name, vouchers: u.vouchers });
  const o = await SRDB.placeOrder({
    userId: u.id,
    items: L.map(({ productId, name, price, qty, pt, desc, image, charms, code, pkg }) => ({ productId, name, price, qty, pt, desc, image, charms, code, pkg })),
    subtotal: sub,
    discount: disc,
    delivery: c.deliveryFee,
    total: sub - disc + c.deliveryFee,
    earned: cartPts(L),
    voucher: v?.code,
    voucher_pct: v?.pct,
    payment: payment,
    payment_type: paymentType,
    contact: {
      name,
      phone,
      address: fullAddress,
      province: prov,
      payment: payment,
      payment_type: paymentType
    },
  });

  knownOrdersStatus[o.id] = o.status;
  S.cart = [];
  selectedVoucher = null;
  checkoutFormState.addr = '';
  save();

  playChime('success');
  const isCod = paymentType === 'COD';
  const payBadge = isCod
    ? `<span class="badge warn" style="font-size:0.85rem">💵 Cash on Delivery (COD)</span>`
    : `<span class="badge ok" style="font-size:0.85rem">📲 ABA KHQR (Scan to Pay)</span>`;

  modal(`
    <div style="font-size:3.5rem;margin-bottom:8px">🧾</div>
    <h2>${t('orderSubmitted')}</h2>
    <p class="muted">${t('orderRef')}: <b>#${o.id}</b></p><br>
    <div class="glass" style="padding:14px;margin:10px 0 16px 0;text-align:left;font-size:0.88rem;border-radius:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span class="muted">${t('paymentMethod')}:</span>
        ${payBadge}
      </div>
      <div style="margin-bottom:4px"><b>${t('recipient')}:</b> ${esc(name)} · ${esc(phone)}</div>
      <div><b>${t('address')}:</b> ${esc(fullAddress)}</div>
      ${isCod ? `
        <div style="margin-top:10px;padding:8px 10px;background:rgba(234,179,8,0.12);border-radius:6px;font-size:0.8rem;color:var(--text)">
          💵 ${t('codReceiptNotice')}
        </div>` : `
        <div style="margin-top:10px;padding:8px 10px;background:rgba(16,185,129,0.12);border-radius:6px;font-size:0.8rem;color:var(--text)">
          📲 ${t('khqrReceiptNotice')}
        </div>`}
    </div>
    <p>${t('pendingNotice')}<br><span class="status pending" style="margin-top:8px;display:inline-block">${t('pendingStatus')}</span></p>
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
      ${list.map(o => {
        const contact = (typeof o.contact === 'string' ? JSON.parse(o.contact) : (o.contact || {})) || {};
        const payStr = contact.payment || o.payment || '';
        const isCod = payStr.includes('COD') || contact.payment_type === 'COD';
        const payBadge = payStr ? `<span class="badge ${isCod ? 'warn' : 'ok'}" style="font-size:0.75rem;margin-left:6px">${isCod ? '💵 COD' : '📲 ABA KHQR'}</span>` : '';
        return `
        <div class="line" style="flex-wrap:wrap">
          <div>
            <b>#${o.id}</b> <span class="status ${(o.status || '').toLowerCase()}">${o.status}</span> ${payBadge}
            <div class="muted small">${new Date(o.createdAt || o.created_at).toLocaleString()} · ${(o.items || []).map(i => esc(i.name) + ' ×' + i.qty).join(', ')}</div>
            ${o.voucher ? `<div class="small" style="color:var(--ok);margin-top:2px">🎟️ Voucher: ${o.voucher}</div>` : ''}
            ${o.note ? `
              <div class="order-store-note ${o.status === 'Rejected' ? 'rejected-note' : ''}">
                <div class="note-header">⚠️ ${t('storeReasonNote')}:</div>
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
        </div>`;
      }).join('')}`
    : `<p class="muted" style="padding:24px 0;text-align:center">${t('noOrdersYet')}</p>`}
  </div>`);
}

function viewCustomerReceipt(id) {
  const o = SRDB.order(id);
  if (!o) return;
  const u = me();
  const contact = (typeof o.contact === 'string' ? JSON.parse(o.contact) : (o.contact || {})) || {};
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

  const paymentStr = contact.payment || o.payment || (contact.payment_type === 'COD' ? 'Cash on Delivery (COD)' : 'ABA KHQR (Scan to Pay)');
  const isCod = paymentStr.includes('COD') || contact.payment_type === 'COD';
  const payLabel = isCod ? 'Cash on Delivery (COD)' : 'ABA KHQR (Scan to Pay)';

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
    ${t('payment')}: <b>${esc(payLabel)}</b><br>
    ${t('status')}: <b>${o.status}</b><br>
    ${isCod ? `
    ----------------------------------------<br>
    💵 <b>${t('payCod')}:</b><br>
    <span style="font-size:0.82rem;color:var(--text)">${t('codReceiptNotice')}</span><br>
    ` : `
    ----------------------------------------<br>
    📲 <b>${t('payKhqr')}:</b><br>
    <span style="font-size:0.82rem;color:var(--text)">${t('khqrReceiptNotice')}</span><br>
    `}
    ${o.note ? `----------------------------------------<br>
    <b style="color:var(--err)">⚠️ ${t('storeReasonNote')}:</b><br>
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
   Views: 6. Custom Italy Charm Designer & Studio
   ================================================================ */
let studioCharms = [];
let studioSelectedUids = [];
let studioCatFilter = 'all';
let studioSearchQuery = '';
let studioPkg = 'normal'; // 'normal' | 'premium'
let studioFocusedCharmId = null; // Charm actively previewed in inspection

let studioDragItem = null;
let studioDragStartX = 0;
let studioDragCurrentX = 0;
let studioDragStartIndex = -1;
let studioDragHasMoved = false;

function initStudioCharms() {
  try {
    const saved = localStorage.getItem('customCharms');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) {
        studioCharms = parsed.slice(0, 18).map(c => ({
          uid: c.uid || ('lk_' + Math.random().toString(36).substr(2, 9)),
          id: c.id || c.db_id || c.ui_id,
          name: c.name || 'Italy Charm',
          model_no: c.model_no || 'MD-001',
          color: c.color || 'Silver',
          category: c.category || (Array.isArray(c.categories) ? c.categories[0] : 'Plain'),
          price: parseFloat(c.price) || 0.75,
          price_khr: parseInt(c.price_khr) || Math.round((parseFloat(c.price) || 0.75) * 4000),
          image: c.image || 'logo.jpg',
          stock: c.stock !== undefined ? c.stock : 99
        }));
      }
    }
  } catch (e) {
    studioCharms = [];
  }
}

function saveStudioCharms() {
  try {
    localStorage.setItem('customCharms', JSON.stringify(studioCharms));
  } catch (e) {}
}

function setStudioColor(color) {
  studioSelectedColor = color.toLowerCase();
  document.querySelectorAll('.charm-color-chip').forEach(el => {
    el.classList.toggle('active', el.dataset.color === studioSelectedColor);
  });
  const colorObj = CHARM_DEFAULT_COLORS.find(c => c.id === studioSelectedColor) || CHARM_DEFAULT_COLORS[0];
  const lbl = $('#studioActiveColorLabel');
  if (lbl) lbl.textContent = S.lang === 'km' ? colorObj.nameKm.split(' ')[0] : colorObj.nameEn;
  if ($('#studioHeroStage')) renderStudioHeroStage();
  renderStudioRunway();
  renderStudioCatalog();
  toast(S.lang === 'km' ? `បានជ្រើសរើសពណ៌: ${color.toUpperCase()} ✨` : `Selected finish: ${color.toUpperCase()} ✨`);
}

function setStudioFocusedCharm(id) {
  studioFocusedCharmId = id;
  if ($('#studioHeroStage')) renderStudioHeroStage();
}

function renderStudioHeroStage() {
  const stage = $('#studioHeroStage');
  if (!stage) return;
  const all = SRDB.charms(true);
  const ch = (studioFocusedCharmId ? SRDB.charm(studioFocusedCharmId) : null) || all[0] || {
    id: 'ch_default',
    name: 'Plain Stainless Link',
    model_no: 'MD-001',
    category: 'Plain',
    price: 0.75,
    price_khr: 3000,
    image: 'https://res.cloudinary.com/dwwearehy/image/upload/v1775063355/x1dfa5orfmizgkgd6tgp.webp'
  };

  const isKm = S.lang === 'km';
  const khr = ch.price_khr || Math.round((ch.price || 0.75) * 4000);
  const colorObj = CHARM_DEFAULT_COLORS.find(c => c.id === studioSelectedColor) || CHARM_DEFAULT_COLORS[0];
  const colorName = isKm ? colorObj.nameKm : colorObj.nameEn;

  stage.innerHTML = `
    <!-- Left: Jeweler's 3D Display Pedestal -->
    <div class="charm-hero-pedestal" onclick="openStudioCharmZoom('${ch.id}')" title="${isKm ? 'ចុចដើម្បីពង្រីកពិនិត្យម៉ូត' : 'Click to inspect 3D model'}">
      ${renderCharmModelHtml(ch, { size: 'hero', color: studioSelectedColor })}
      <div style="margin-top:10px;text-align:center">
        <span class="muted small" style="font-size:0.72rem;display:flex;align-items:center;gap:4px;justify-content:center">
          🔍 ${isKm ? 'ចុចលើគ្រាប់ដើម្បីពង្រីក' : 'Click charm to zoom & inspect'}
        </span>
      </div>
    </div>

    <!-- Right: Model Details, Color Selector & Action -->
    <div style="flex:1;min-width:0;text-align:left">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
        <span class="model-count-badge" style="font-size:0.78rem">
          ✨ ${isKm ? 'ម៉ូតលេខ' : 'Model'} #${esc(ch.model_no || 'MD-001')}
        </span>
        <span class="badge" style="font-size:0.75rem">${esc(ch.category || 'Classic')}</span>
        <span class="badge ok" style="font-size:0.75rem">🟢 ${isKm ? 'មានក្នុងស្តុក' : 'In Stock'}</span>
      </div>

      <h3 style="margin:0 0 6px;font-size:1.3rem;color:var(--text)">${esc(ch.name)}</h3>
      
      <div style="display:flex;gap:12px;align-items:baseline;margin-bottom:10px">
        <span style="font-size:1.35rem;font-weight:800;color:#ea580c">${khr.toLocaleString()}៛</span>
        <span class="muted" style="font-size:0.9rem">(${money(ch.price || 0.75)})</span>
        <span class="muted small" style="font-size:0.75rem">· 9mm Modular 316L Stainless Steel</span>
      </div>

      <!-- Color Finishes Selector -->
      <div class="charm-color-selector-wrap">
        <div class="charm-color-selector-header">
          <span class="charm-color-selector-title">
            🎨 ${isKm ? 'ជ្រើសរើសពណ៌គ្រាប់ខ្សែដៃ' : 'Select Charm Finish / Color'}:
            <b style="color:#ea580c;text-transform:capitalize">${colorName}</b>
          </span>
          <span class="muted small" style="font-size:0.72rem">${isKm ? 'ពណ៌លំនាំដើមទាំង ៦ អាចជ្រើសរើសបាន' : '6 Default Metallic Finishes'}</span>
        </div>
        <div class="charm-color-swatches">
          ${CHARM_DEFAULT_COLORS.map(c => `
            <button type="button" 
                    class="charm-color-chip ${studioSelectedColor === c.id ? 'active' : ''}" 
                    data-color="${c.id}" 
                    style="--chip-border:${c.border}"
                    onclick="setStudioColor('${c.id}')"
                    title="${isKm ? c.nameKm : c.nameEn}">
              <span class="charm-color-dot" style="background:${c.dot}"></span>
              <span>${isKm ? c.nameKm.split(' ')[0] : c.nameEn}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Stage Actions -->
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:14px">
        <button type="button" class="btn primary sm" onclick="addStudioCharm('${ch.id}')" style="box-shadow:0 4px 14px rgba(234,88,12,0.3)">
          ＋ ${isKm ? 'បន្ថែមគ្រាប់នេះចូលខ្សែដៃ' : 'Add Model to Bracelet'}
        </button>
        <button type="button" class="btn ghost sm" onclick="addRandomStudioCharm()" title="${isKm ? 'ជ្រើសរើសគ្រាប់ចៃដន្យ' : 'Pick random model'}">
          🎲 ${isKm ? 'ម៉ូតចៃដន្យ' : 'Random Model'}
        </button>
      </div>
    </div>
  `;
}

function getStudioDesignCode() {
  if (!studioCharms.length) return '';
  const all = SRDB.charms(true);
  const hex = studioCharms.map(c => {
    let idx = all.findIndex(x => x.id === c.id || x.image === c.image);
    if (idx < 0) idx = 0;
    return idx.toString(36).padStart(2, '0');
  }).join('').toUpperCase();
  return hex.match(/.{1,4}/g)?.join('-') || hex;
}

function copyStudioDesignCode() {
  const code = getStudioDesignCode();
  if (!code) return toast(S.lang === 'km' ? 'សូមជ្រើសរើសត្បូងជាមុនសិន' : 'Add charms first to generate code');
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(code).then(() => {
      toast(S.lang === 'km' ? `បានចម្លងកូដរចនា: ${code} 📋` : `Design code copied: ${code} 📋`);
    }).catch(() => fallbackCopyStudioCode(code));
  } else {
    fallbackCopyStudioCode(code);
  }
}

function fallbackCopyStudioCode(code) {
  const ta = document.createElement('textarea');
  ta.value = code;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    toast(S.lang === 'km' ? `បានចម្លងកូដ: ${code} 📋` : `Code copied: ${code} 📋`);
  } catch (err) {
    prompt(S.lang === 'km' ? 'កូដរចនារបស់អ្នក:' : 'Your Design Code:', code);
  }
  document.body.removeChild(ta);
}

function loadStudioDesignCode() {
  const inp = $('#studioLoadCodeInput');
  if (!inp) return;
  const raw = inp.value.trim().replace(/-/g, '').toLowerCase();
  if (!raw || raw.length % 2 !== 0) {
    return toast(S.lang === 'km' ? 'កូដមិនត្រឹមត្រូវ (Invalid code)' : 'Invalid design code format');
  }
  const all = SRDB.charms(true);
  const newCharms = [];
  for (let i = 0; i < raw.length; i += 2) {
    const chunk = raw.substring(i, i + 2);
    const idx = parseInt(chunk, 36);
    const ch = all[idx];
    if (ch) {
      newCharms.push({
        uid: 'lk_' + Math.random().toString(36).substr(2, 9),
        id: ch.id,
        name: ch.name,
        model_no: ch.model_no || 'MD-001',
        color: ch.color || studioSelectedColor || 'silver',
        category: ch.category || 'Plain',
        price: parseFloat(ch.price) || 0.75,
        price_khr: parseInt(ch.price_khr) || Math.round((parseFloat(ch.price) || 0.75) * 4000),
        image: ch.image,
        stock: ch.stock !== undefined ? ch.stock : 99
      });
    }
  }
  if (newCharms.length) {
    studioCharms = newCharms;
    studioSelectedUids = [];
    saveStudioCharms();
    renderStudioRunway();
    inp.value = '';
    toast(S.lang === 'km' ? `បានដាក់កូដជោគជ័យ (${newCharms.length} គ្រាប់) 📥` : `Loaded ${newCharms.length} charms from code! 📥`);
    playChime('success');
  } else {
    toast(S.lang === 'km' ? 'រកមិនឃើញត្បូងតាមកូដនេះទេ' : 'No matching charms found for this code');
  }
}

function clearStudioBracelet() {
  if (!studioCharms.length) return;
  const isKm = S.lang === 'km';
  if (confirm(isKm ? 'តើអ្នកពិតជាចង់ជម្រះការរចនាខ្សែដៃនេះមែនទេ?' : 'Clear current bracelet design?')) {
    studioCharms = [];
    studioSelectedUids = [];
    saveStudioCharms();
    renderStudioRunway();
    toast(isKm ? 'បានជម្រះខ្សែដៃរួចរាល់ ↺' : 'Bracelet runway reset ↺');
  }
}

function duplicateStudioSelected() {
  if (!studioSelectedUids.length) return;
  const itemsToDup = studioCharms.filter(c => studioSelectedUids.includes(c.uid));
  if (studioCharms.length + itemsToDup.length > 18) {
    playChime('error');
    return toast(S.lang === 'km' ? 'កម្រិតអតិបរមា ១៨ គ្រាប់! (មិនអាចបន្ថែមទៀតទេ) ⚠️' : 'Cannot exceed 18 charms limit! ⚠️');
  }
  let maxIdx = -1;
  studioCharms.forEach((c, i) => { if (studioSelectedUids.includes(c.uid)) maxIdx = i; });
  const duplicated = itemsToDup.map(c => ({
    ...c,
    uid: 'lk_' + Math.random().toString(36).substr(2, 9)
  }));
  studioCharms.splice(maxIdx + 1, 0, ...duplicated);
  studioSelectedUids = duplicated.map(c => c.uid);
  saveStudioCharms();
  renderStudioRunway();
  toast(S.lang === 'km' ? `បានចម្លង ${duplicated.length} គ្រាប់ 📋` : `Duplicated ${duplicated.length} charm(s) 📋`);
  playChime('success');
}

function deleteStudioSelected() {
  if (!studioSelectedUids.length) return;
  const count = studioSelectedUids.length;
  studioCharms = studioCharms.filter(c => !studioSelectedUids.includes(c.uid));
  studioSelectedUids = [];
  saveStudioCharms();
  renderStudioRunway();
  toast(S.lang === 'km' ? `បានលុប ${count} គ្រាប់ 🗑️` : `Removed ${count} charm(s) 🗑️`);
}

function removeStudioCharm(uid, e) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  studioCharms = studioCharms.filter(c => c.uid !== uid);
  studioSelectedUids = studioSelectedUids.filter(id => id !== uid);
  saveStudioCharms();
  renderStudioRunway();
}

function toggleStudioLinkSelection(uid) {
  if (studioSelectedUids.includes(uid)) {
    studioSelectedUids = [];
  } else {
    studioSelectedUids = [uid];
  }
  renderStudioRunway();
}

function onStudioLinkPointerDown(e, uid, index) {
  if (e.target.closest('.link-remove-btn')) return;
  const slot = e.currentTarget;
  studioDragItem = slot;
  studioDragStartX = e.clientX;
  studioDragCurrentX = e.clientX;
  studioDragStartIndex = index;
  studioDragHasMoved = false;

  try { slot.setPointerCapture(e.pointerId); } catch (err) {}
  document.addEventListener('pointermove', onStudioLinkPointerMove);
  document.addEventListener('pointerup', onStudioLinkPointerUp);
}

function onStudioLinkPointerMove(e) {
  if (!studioDragItem) return;
  const deltaX = e.clientX - studioDragStartX;
  if (Math.abs(deltaX) > 8) studioDragHasMoved = true;

  if (studioDragHasMoved) {
    studioDragCurrentX = e.clientX;
    studioDragItem.classList.add('is-dragging');
    studioDragItem.style.transform = `translateX(${deltaX}px) scale(1.1)`;
    const itemWidth = studioDragItem.offsetWidth || 54;
    const indexShift = Math.round(deltaX / itemWidth);
    const newIndex = Math.max(0, Math.min(studioCharms.length - 1, studioDragStartIndex + indexShift));

    const slots = document.querySelectorAll('.bracelet-link-slot');
    slots.forEach((item, idx) => {
      if (item === studioDragItem) return;
      let shift = 0;
      if (studioDragStartIndex < newIndex) {
        if (idx > studioDragStartIndex && idx <= newIndex) shift = -100;
      } else if (studioDragStartIndex > newIndex) {
        if (idx < studioDragStartIndex && idx >= newIndex) shift = 100;
      }
      item.style.transform = `translateX(${shift}%)`;
    });
  }
}

function onStudioLinkPointerUp(e) {
  if (!studioDragItem) return;
  const uid = studioDragItem.getAttribute('data-uid');

  if (!studioDragHasMoved) {
    toggleStudioLinkSelection(uid);
  } else {
    const itemWidth = studioDragItem.offsetWidth || 54;
    const deltaX = studioDragCurrentX - studioDragStartX;
    const indexShift = Math.round(deltaX / itemWidth);
    const newIndex = Math.max(0, Math.min(studioCharms.length - 1, studioDragStartIndex + indexShift));

    if (newIndex !== studioDragStartIndex && newIndex >= 0 && newIndex < studioCharms.length) {
      const moved = studioCharms.splice(studioDragStartIndex, 1)[0];
      studioCharms.splice(newIndex, 0, moved);
      saveStudioCharms();
    }
  }

  studioDragItem.classList.remove('is-dragging');
  studioDragItem.style.transform = '';
  document.querySelectorAll('.bracelet-link-slot').forEach(item => { item.style.transform = ''; });

  studioDragItem = null;
  document.removeEventListener('pointermove', onStudioLinkPointerMove);
  document.removeEventListener('pointerup', onStudioLinkPointerUp);
  renderStudioRunway();
}

function scrollStudioRunway(delta) {
  const rw = $('#studioTrackRunway');
  if (rw) rw.scrollBy({ left: delta, behavior: 'smooth' });
}

function handleStudioPreviewScroll(el) {
  const thumb = $('#studioScrollThumb');
  if (!thumb || !el) return;
  const maxScroll = el.scrollWidth - el.clientWidth;
  if (maxScroll <= 0) {
    thumb.style.left = '0%';
    return;
  }
  const ratio = el.scrollLeft / maxScroll;
  const maxPercent = 65; // thumb width is 35%
  thumb.style.left = `${Math.min(maxPercent, Math.max(0, ratio * maxPercent))}%`;
}

function handleStudioBackgroundClick(e) {
  if (e.target.closest('.bracelet-link-slot') || e.target.closest('.link-remove-btn')) return;
  if (studioSelectedUids.length > 0) {
    studioSelectedUids = [];
    renderStudioRunway();
  }
}

function setStudioPkg(pkgType) {
  studioPkg = pkgType;
  document.querySelectorAll('.pkg-option-card').forEach(el => {
    el.classList.toggle('active', el.dataset.pkg === pkgType);
  });
  renderStudioRunway();
}

function addStudioCharm(id) {
  const ch = SRDB.charm(id);
  if (!ch) return;
  if (ch.stock !== undefined && ch.stock <= 0) {
    return toast(S.lang === 'km' ? 'គ្រាប់ត្បូងនេះអស់ពីស្តុកហើយ' : 'This charm is currently out of stock');
  }

  // LIMIT: Maximum 18 charms cannot add more!
  if (studioCharms.length >= 18) {
    playChime('error');
    return toast(S.lang === 'km' ? 'ខ្សែដៃអាចដាក់បានច្រើនបំផុត ១៨ គ្រាប់! (កម្រិតអតិបរមា) ⚠️' : 'Maximum 18 charms reached! Standard bracelet is 16–18 links. ⚠️');
  }

  setStudioFocusedCharm(ch.id);

  const newCharm = {
    uid: 'lk_' + Math.random().toString(36).substr(2, 9),
    id: ch.id,
    name: ch.name,
    model_no: ch.model_no || 'MD-001',
    color: ch.color || studioSelectedColor || 'silver',
    category: ch.category || 'Plain',
    price: parseFloat(ch.price) || 0.75,
    price_khr: parseInt(ch.price_khr) || Math.round((parseFloat(ch.price) || 0.75) * 4000),
    image: ch.image,
    stock: ch.stock !== undefined ? ch.stock : 99
  };
  studioCharms.push(newCharm);
  studioSelectedUids = [newCharm.uid];
  saveStudioCharms();
  renderStudioRunway();
  playChime('success');

  const count = studioCharms.length;
  if (count === 16) {
    toast(S.lang === 'km' ? '✨ គ្រប់ចំនួនអប្បបរមា ១៦ គ្រាប់ហើយ! អាចកុម្ម៉ង់បាន ឬថែមរហូតដល់ ១៨' : '✨ Minimum 16 links reached! Ready to wear or add up to 18.');
  } else if (count === 18) {
    toast(S.lang === 'km' ? '✨ ពេញអតិបរមា ១៨ គ្រាប់ហើយ!' : '✨ Maximum 18 links reached!');
  }

  setTimeout(() => {
    const rw = $('#studioTrackRunway');
    if (rw) rw.scrollTo({ left: rw.scrollWidth, behavior: 'smooth' });
  }, 40);
}

function addRandomStudioCharm() {
  const available = SRDB.charms().filter(c => (c.stock === undefined || c.stock > 0));
  if (!available.length) return toast(S.lang === 'km' ? 'មិនមានត្បូងក្នុងស្តុកទេ' : 'No charms available in stock');
  const pick = available[Math.floor(Math.random() * available.length)];
  addStudioCharm(pick.id);
  toast(S.lang === 'km' ? `បានបន្ថែម ${pick.name} (${pick.model_no || 'MD-001'}) 🎲` : `Added random: ${pick.name} 🎲`);
}

function openStudioCharmZoom(id) {
  const ch = SRDB.charm(id);
  if (!ch) return;
  const isKm = S.lang === 'km';
  const modal = $('#studioCharmZoomModal');
  if (!modal) return;
  const khr = ch.price_khr || Math.round((ch.price || 0.75) * 4000);

  const zoomBox = $('#studioZoomModelBox');
  if (zoomBox) {
    zoomBox.innerHTML = renderCharmModelHtml(ch, { size: 'zoom', color: studioSelectedColor });
  }
  $('#studioZoomName').textContent = ch.name;
  $('#studioZoomModelNo').textContent = `${isKm ? 'ម៉ូតលេខ' : 'Model'}: #${ch.model_no || 'MD-001'}`;
  $('#studioZoomCat').textContent = `${isKm ? 'ប្រភេទ' : 'Category'}: ${ch.category || 'Plain'}`;
  $('#studioZoomPrice').textContent = `${khr.toLocaleString()}៛ (${money(ch.price || 0.75)})`;
  
  const colorPills = $('#studioZoomColorPills');
  if (colorPills) {
    colorPills.innerHTML = CHARM_DEFAULT_COLORS.map(c => `
      <button type="button" class="studio-color-btn ${studioSelectedColor === c.id ? 'active' : ''}" 
              style="background:${c.dot};width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,0.6);cursor:pointer;padding:0" 
              onclick="setStudioColor('${c.id}'); if($('#studioZoomModelBox')) $('#studioZoomModelBox').innerHTML = renderCharmModelHtml(SRDB.charm('${ch.id}'), { size: 'zoom', color: '${c.id}' });" 
              title="${c.nameEn}">
      </button>
    `).join('');
  }

  $('#studioZoomAddBtn').onclick = () => {
    closeStudioCharmZoom();
    addStudioCharm(ch.id);
  };
  modal.style.display = 'flex';
}

function closeStudioCharmZoom() {
  const modal = $('#studioCharmZoomModal');
  if (modal) modal.style.display = 'none';
}

function onStudioCatFilter(cat) {
  studioCatFilter = cat;
  document.querySelectorAll('.charm-cat-pill').forEach(el => {
    el.classList.toggle('active', el.dataset.cat.toLowerCase() === cat.toLowerCase());
  });
  renderStudioCatalog();
}

function onStudioSearchInput(val) {
  studioSearchQuery = val.trim().toLowerCase();
  renderStudioCatalog();
}

function renderStudioCatalog() {
  const grid = $('#studioCharmsGrid');
  if (!grid) return;
  const all = SRDB.charms(true);
  const q = studioSearchQuery;
  const cat = studioCatFilter;

  const filtered = all.filter(ch => {
    if (ch.active === 0) return false;
    if (cat !== 'all') {
      const cCat = (ch.category || '').toLowerCase();
      if (!cCat.includes(cat.toLowerCase())) return false;
    }
    if (q) {
      const name = (ch.name || '').toLowerCase();
      const id = (ch.id || '').toLowerCase();
      const modelNo = (ch.model_no || '').toLowerCase();
      const cCat = (ch.category || '').toLowerCase();
      if (!name.includes(q) && !id.includes(q) && !modelNo.includes(q) && !cCat.includes(q)) return false;
    }
    return true;
  });

  if (!filtered.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:30px 10px;opacity:0.6">
        <div style="font-size:2rem;margin-bottom:6px">🔍</div>
        <p class="muted small">${S.lang === 'km' ? 'រកមិនឃើញម៉ូតគ្រាប់ត្បូងដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ' : 'No charm models match your search or filter'}</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(ch => {
    const isOut = (ch.stock !== undefined && ch.stock <= 0);
    const khr = ch.price_khr || Math.round((ch.price || 0.75) * 4000);
    const modelTag = esc(ch.model_no || 'MD-001');
    const isFocused = (studioFocusedCharmId === ch.id);
    return `
      <div class="charm-card-item ${isOut ? 'out-of-stock' : ''} ${isFocused ? 'selected' : ''}" 
           onclick="setStudioFocusedCharm('${ch.id}'); if(!${isOut}) addStudioCharm('${ch.id}');"
           title="${esc(ch.name)} (${modelTag})">
        <!-- Top Row: Model Tag & Stock -->
        <div style="width:100%;display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span class="charm-model-tag">${modelTag}</span>
          ${isOut ? `<span style="background:#ef4444;color:#fff;font-size:0.55rem;font-weight:800;padding:1px 4px;border-radius:4px">OUT</span>` : ''}
        </div>

        <!-- Zoom button -->
        <button type="button" onclick="event.stopPropagation();openStudioCharmZoom('${ch.id}')" 
                style="position:absolute;top:22px;right:6px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,0.5);border:none;color:#fff;font-size:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:4" title="Zoom">
          🔍
        </button>

        <!-- Center: Authentic Charm PNG Display -->
        <div class="charm-card-thumb">
          <img src="${ch.image || 'logo.jpg'}" alt="${esc(ch.name)}" class="charm-card-png" loading="lazy" onerror="this.src='logo.jpg'">
        </div>

        <span class="charm-card-title">${esc(ch.name)}</span>
        <span class="charm-card-price">${khr.toLocaleString()}៛</span>
      </div>`;
  }).join('');
}

function renderStudioRunway() {
  const c = cfg();
  const isKm = S.lang === 'km';
  const runway = $('#studioTrackRunway');
  if (!runway) return;

  const count = studioCharms.length;
  const charmsTotalUSD = studioCharms.reduce((sum, ch) => sum + (parseFloat(ch.price) || c.charmPrice || 0.75), 0);
  const charmsTotalKHR = studioCharms.reduce((sum, ch) => sum + (parseInt(ch.price_khr) || Math.round((parseFloat(ch.price) || 0.75) * 4000)), 0);

  const grandUSD = (c.customBasePrice || 0) + charmsTotalUSD;
  const grandKHR = Math.round((c.customBasePrice || 0) * 4000) + charmsTotalKHR;

  // Header Count & Price
  const countEl = $('#studioHeaderCount');
  if (countEl) countEl.textContent = count;

  const badgePrice = $('#studioHeaderPrice');
  if (badgePrice) badgePrice.textContent = `${grandKHR.toLocaleString()}៛`;

  // Dynamic Duplicate & Delete action buttons in top bar (Matching reference studio)
  const dupBtn = $('#studioDuplicateBtn');
  if (dupBtn) {
    if (studioSelectedUids.length > 0) {
      dupBtn.classList.remove('hidden');
      dupBtn.style.display = 'inline-flex';
    } else {
      dupBtn.classList.add('hidden');
      dupBtn.style.display = 'none';
    }
  }
  const delBtn = $('#studioDeleteBtn');
  if (delBtn) {
    if (studioSelectedUids.length > 0) {
      delBtn.classList.remove('hidden');
      delBtn.style.display = 'inline-flex';
    } else {
      delBtn.classList.add('hidden');
      delBtn.style.display = 'none';
    }
  }

  // Limit status badge (Min 16, Max 18)
  const limitStatusEl = $('#studioLimitStatus');
  if (limitStatusEl) {
    if (count === 0) {
      limitStatusEl.innerHTML = `
        <span class="limit-status-badge empty">
          📏 0 / 18 Links <span class="sub-text">(${isKm ? 'ទំហំស្តង់ដារ: ១៦ ដល់ ១៨ គ្រាប់' : '16–18 links required'})</span>
        </span>
      `;
    } else if (count < 16) {
      const needed = 16 - count;
      limitStatusEl.innerHTML = `
        <span class="limit-status-badge warning">
          ⚠️ ${count} / 16 Min Links <span class="sub-text">(${isKm ? `ត្រូវការថែម ${needed} គ្រាប់ទៀត` : `Add ${needed} more to fit`})</span>
        </span>
      `;
    } else if (count >= 16 && count < 18) {
      const canAdd = 18 - count;
      limitStatusEl.innerHTML = `
        <span class="limit-status-badge ok">
          🟢 ${count} / 18 Links <span class="sub-text">(${isKm ? `ទំហំស្តង់ដារ • អាចថែម ${canAdd}` : `Ready to wear! Can add ${canAdd}`})</span>
        </span>
      `;
    } else {
      limitStatusEl.innerHTML = `
        <span class="limit-status-badge max">
          ✨ 18 / 18 Links <span class="sub-text">(${isKm ? 'ពេញអតិបរមាហើយ' : 'Maximum reached'})</span>
        </span>
      `;
    }
  }

  // Runway Links Centered in Box
  const navBar = $('#studioNavIndicatorBar');
  if (count === 0) {
    if (navBar) {
      navBar.style.opacity = '0';
      navBar.style.pointerEvents = 'none';
    }
    runway.innerHTML = `
      <div class="empty-track-placeholder" onclick="$('#studioCharmsGrid')?.scrollIntoView({behavior:'smooth'})">
        <div class="starter-dummy-links">
          <div class="dummy-link">＋</div>
          <div class="dummy-link">＋</div>
          <div class="dummy-link">＋</div>
          <div class="dummy-link">＋</div>
        </div>
        <p style="font-weight:700;margin:0 0 4px;font-size:1rem;color:var(--text)">
          ✨ ${isKm ? 'ចាប់ផ្តើមរចនាខ្សែដៃរបស់អ្នក' : 'Start Designing Your Bracelet'}
        </p>
        <span class="muted small" style="font-size:0.82rem">
          ${isKm ? 'ចុចលើគ្រាប់ត្បូងខាងក្រោមដើម្បីដាក់ចូលខ្សែដៃ (កម្រិត ១៦ ដល់ ១៨ គ្រាប់)' : 'Click any charm below to add (16 to 18 links required)'}
        </span>
      </div>`;
  } else {
    if (navBar) {
      navBar.style.opacity = '1';
      navBar.style.pointerEvents = 'auto';
    }
    runway.innerHTML = `
      <div class="bracelet-links-track" id="studioLinksTrack">
        ${studioCharms.map((ch, idx) => {
          const isSel = studioSelectedUids.includes(ch.uid);
          const linkColor = ch.color || studioSelectedColor;
          return `
            <div class="bracelet-link-slot ${isSel ? 'selected' : ''}" 
                 data-uid="${ch.uid}"
                 onpointerdown="onStudioLinkPointerDown(event, '${ch.uid}', ${idx})"
                 title="${esc(ch.name)} (${idx + 1}) - ${esc(ch.model_no || 'MD-001')}">
              <img src="${ch.image || 'logo.jpg'}" alt="${esc(ch.name)}" class="bracelet-link-png" draggable="false" onerror="this.src='logo.jpg'">
              <button type="button" class="link-remove-btn" 
                      onpointerdown="removeStudioCharm('${ch.uid}', event)" 
                      title="${isKm ? 'លុបគ្រាប់នេះ' : 'Remove link'}">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
              <div class="bracelet-interlink-connector" aria-hidden="true"></div>
            </div>`;
        }).join('')}
      </div>`;
    handleStudioPreviewScroll(runway);
  }

  // Sticky bottom summary bar elements
  const sumCount = $('#studioSummaryCount');
  if (sumCount) {
    if (count < 16) {
      sumCount.textContent = `${count} / 16 Min Links (${16 - count} more needed)`;
      sumCount.className = 'badge err';
    } else if (count >= 16 && count < 18) {
      sumCount.textContent = `${count} / 18 Links (Fit OK)`;
      sumCount.className = 'badge ok';
    } else {
      sumCount.textContent = `18 / 18 Links (Max Limit)`;
      sumCount.className = 'badge ok';
    }
  }

  const sumPrice = $('#studioSummaryPrice');
  if (sumPrice) sumPrice.textContent = `${grandKHR.toLocaleString()}៛ (${money(grandUSD)})`;

  const addCartBtn = $('#studioAddToCartBtn');
  if (addCartBtn) {
    if (count < 16) {
      addCartBtn.disabled = true;
      addCartBtn.style.opacity = '0.55';
      addCartBtn.style.cursor = 'not-allowed';
      addCartBtn.innerHTML = `🛒 ${isKm ? `ត្រូវការថែម ${16 - count} គ្រាប់ទៀត` : `Add ${16 - count} more links`} (${count}/16)`;
    } else {
      addCartBtn.disabled = false;
      addCartBtn.style.opacity = '1';
      addCartBtn.style.cursor = 'pointer';
      addCartBtn.innerHTML = `🛒 ${isKm ? 'ដាក់ខ្សែដៃចូលកន្ត្រក' : 'Add Bracelet to Cart'} (${count} Links)`;
    }
  }
}

function addStudioBraceletToCart() {
  const count = studioCharms.length;
  const isKm = S.lang === 'km';
  if (count < 16) {
    playChime('error');
    return toast(isKm 
      ? `ខ្សែដៃតម្រូវឱ្យមានយ៉ាងតិច ១៦ គ្រាប់ (បច្ចុប្បន្នមានតែ ${count} គ្រាប់ប៉ុណ្ណោះ)! សូមជ្រើសរើស ${16 - count} គ្រាប់ទៀត ⚠️` 
      : `Minimum 16 charms required for a bracelet! (Current: ${count}/16). Please add ${16 - count} more. ⚠️`);
  }
  if (count > 18) {
    playChime('error');
    return toast(isKm 
      ? `ខ្សែដៃអាចដាក់បានច្រើនបំផុត ១៨ គ្រាប់ (បច្ចុប្បន្ន: ${count}/18)!` 
      : `Maximum 18 charms allowed! (Current: ${count}/18).`);
  }

  const c = cfg();
  const code = getStudioDesignCode();
  const colorObj = CHARM_DEFAULT_COLORS.find(c => c.id === studioSelectedColor) || CHARM_DEFAULT_COLORS[0];
  const colorName = isKm ? colorObj.nameKm.split(' ')[0] : colorObj.nameEn;

  const charmsTotalUSD = studioCharms.reduce((sum, ch) => sum + (parseFloat(ch.price) || c.charmPrice || 0.75), 0);
  const grandUSD = (c.customBasePrice || 0) + charmsTotalUSD;
  const grandKHR = Math.round(grandUSD * 4000);

  const customItem = {
    name: isKm ? `ខ្សែដៃអ៊ីតាលីកែច្នៃ (${studioCharms.length} គ្រាប់)` : `Custom Italy Bracelet (${studioCharms.length} Charms)`,
    desc: `${studioCharms.length} Links (16–18 Modular Stainless Fit)`,
    price: grandUSD,
    priceKHR: grandKHR,
    pt: c.customPt || 5,
    icon: '🔗',
    image: studioCharms[0]?.image || 'logo.jpg',
    color: studioSelectedColor,
    qty: 1,
    charms: [...studioCharms],
    code: code
  };

  addToCart(null, customItem);
  playChime('success');
  toast(isKm ? 'បានដាក់ខ្សែដៃចូលកន្ត្រកជោគជ័យ! 🛒' : 'Custom Italy Bracelet added to Cart! 🛒');
}

function customizer() {
  initStudioCharms();
  const isKm = S.lang === 'km';
  const categories = SRDB.charmCategories();
  const allCharms = SRDB.charms(true);
  const colorObj = CHARM_DEFAULT_COLORS.find(c => c.id === studioSelectedColor) || CHARM_DEFAULT_COLORS[0];
  const colorName = isKm ? colorObj.nameKm.split(' ')[0] : colorObj.nameEn;

  view(`
  <div class="customizer-container studio-clean-layout">
    <!-- Header (Centered, Minimal Luxury) -->
    <div class="studio-clean-header">
      <button class="btn ghost sm" data-nav="home">← ${t('backToHome')}</button>
      <div class="studio-header-titles">
        <h2 class="kh studio-main-title">${isKm ? 'ស្ទូឌីយោរចនាខ្សែដៃអ៊ីតាលី' : 'Italy Charm Custom Studio'}</h2>
        <p class="muted studio-sub-title">${isKm ? 'កម្រិតពី ១៦ ដល់ ១៨ គ្រាប់ • គំរូគ្រាប់ពិត 9mm' : '9mm Modular Stainless Steel • Standard Fit: 16 to 18 Links'}</p>
      </div>
      <div style="width:70px"></div>
    </div>

    <!-- Centered Large Bracelet Box (Centered & Spacious) -->
    <div class="glass panel studio-bracelet-box">
      <!-- Top info bar: Count / Limit & Reset / Duplicate / Delete -->
      <div class="studio-box-top-bar">
        <div class="studio-top-stat-group">
          <div class="studio-top-stat-item">
            <span class="studio-stat-label">${isKm ? 'ចំនួនត្បូង' : 'Charms'}</span>
            <span id="studioHeaderCount" class="studio-stat-num">0</span>
          </div>
          <div class="studio-stat-divider"></div>
          <div class="studio-top-stat-item">
            <span class="studio-stat-label">${isKm ? 'តម្លៃ' : 'Price'}</span>
            <span id="studioHeaderPrice" class="studio-stat-price">0៛</span>
          </div>
          <div class="studio-stat-divider"></div>
          <div class="studio-top-stat-item">
            <span class="studio-stat-label">${isKm ? 'ទំហំខ្សែដៃ' : 'Fit Status'}</span>
            <div id="studioLimitStatus" class="bracelet-limit-status" style="margin-top:2px">
              <!-- Rendered dynamically -->
            </div>
          </div>
        </div>

        <div class="studio-top-actions-cluster">
          <button id="studioDeleteBtn" type="button" class="studio-action-pill btn-danger-pill hidden" onclick="deleteStudioSelected()" title="${isKm ? 'លុបគ្រាប់ដែលបានជ្រើសរើស' : 'Delete selected'}">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            <span>${isKm ? 'លុប' : 'Delete'}</span>
          </button>
          <button id="studioDuplicateBtn" type="button" class="studio-action-pill btn-blue-pill hidden" onclick="duplicateStudioSelected()" title="${isKm ? 'ចម្លងគ្រាប់ដែលបានជ្រើសរើស' : 'Duplicate selected'}">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            <span>${isKm ? 'ចម្លង' : 'Duplicate'}</span>
          </button>
          <button id="studioResetBtn" type="button" class="studio-action-pill btn-ghost-pill" onclick="clearStudioBracelet()" title="${isKm ? 'ជម្រះការរចនា' : 'Reset design'}">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
            <span>${isKm ? 'ជម្រះ' : 'Reset'}</span>
          </button>
        </div>
      </div>

      <!-- The Bracelet Track (Centered in box, Glow Selection, Connected Links) -->
      <div class="bracelet-track-wrapper">
        <div class="bracelet-track-rails"></div>
        <div id="studioTrackRunway" class="bracelet-track-runway" onclick="handleStudioBackgroundClick(event)" onscroll="handleStudioPreviewScroll(this)">
          <!-- Centered links rendered dynamically by renderStudioRunway() -->
        </div>

        <!-- Navigation Scroll Indicator Bar (< BAR >) Matching Reference -->
        <div id="studioNavIndicatorBar" class="nav-indicator-container">
          <button type="button" onclick="scrollStudioRunway(-90)" class="nav-arrow" title="Scroll left">‹</button>
          <div id="studioScrollTrack" class="nav-scroll-track">
            <div id="studioScrollThumb" class="nav-scroll-thumb"></div>
          </div>
          <button type="button" onclick="scrollStudioRunway(90)" class="nav-arrow" title="Scroll right">›</button>
        </div>
      </div>

      <!-- Helper hint under runway -->
      <div class="studio-runway-hint">
        <span>${isKm ? 'ចុចលើគ្រាប់ដើម្បីជ្រើសរើស (Glow) • អូសគ្រាប់ដើម្បីប្តូរទីតាំង • ចុចខាងក្រៅដើម្បីដោះការជ្រើសរើស' : 'Tap link to select (Glow) • Drag to reorder • Click outside runway to deselect'}</span>
      </div>
    </div>

    <!-- 3. Clean Charms Catalog Selection (Centered & Big) -->
    <div class="glass panel studio-catalog-box">
      <div class="studio-catalog-header">
        <div style="display:flex;align-items:center;gap:10px">
          <h3 style="margin:0;font-size:1.2rem;display:flex;align-items:center;gap:8px">
            <span>💎</span>
            <span>${isKm ? 'ជ្រើសរើសគ្រាប់ត្បូង' : 'Select Charms'}</span>
          </h3>
          <span class="badge ok" style="font-size:0.75rem">${allCharms.length} ${isKm ? 'ម៉ូតក្នុងហាង' : 'Models'}</span>
        </div>
        <div style="position:relative;max-width:280px;width:100%">
          <input type="text" id="studioSearchInput" 
                 placeholder="${isKm ? '🔍 ស្វែងរកម៉ូតលេខ (#MD-001)...' : '🔍 Search Model (#MD-001)...'}" 
                 value="${esc(studioSearchQuery)}"
                 oninput="onStudioSearchInput(this.value)"
                 style="padding:8px 16px;font-size:0.85rem;border-radius:99px;width:100%">
        </div>
      </div>

      <!-- Category Filter Pills Bar -->
      <div id="studioCatPills" class="charm-cat-pills-bar">
        <button type="button" class="charm-cat-pill ${studioCatFilter === 'all' ? 'active' : ''}" data-cat="all" onclick="onStudioCatFilter('all')">
          ${isKm ? 'ទាំងអស់' : 'All'} (${allCharms.length})
        </button>
        ${categories.map(cat => `
          <button type="button" class="charm-cat-pill ${studioCatFilter.toLowerCase() === cat.category.toLowerCase() ? 'active' : ''}" data-cat="${esc(cat.category)}" onclick="onStudioCatFilter('${esc(cat.category)}')">
            ${esc(cat.category)} (${cat.count})
          </button>
        `).join('')}
      </div>

      <!-- Charms Grid View -->
      <div id="studioCharmsGrid" class="charm-cards-grid studio-clean-grid">
        <!-- Rendered dynamically -->
      </div>
    </div>

    <!-- 4. Sticky Bottom Summary Bar -->
    <div class="studio-clean-summary">
      <div style="display:flex;align-items:center;gap:14px">
        <div>
          <span class="muted small">${isKm ? 'សរុបខ្សែដៃ' : 'Bracelet Total'}</span>
          <div style="display:flex;align-items:baseline;gap:8px">
            <span id="studioSummaryPrice" style="font-size:1.35rem;font-weight:800;color:#ea580c">0៛ ($0.00)</span>
            <span id="studioSummaryCount" class="badge" style="font-size:0.75rem">0 / 18 Links</span>
          </div>
        </div>
      </div>

      <button id="studioAddToCartBtn" type="button" class="btn primary studio-submit-btn" onclick="addStudioBraceletToCart()">
        🛒 ${isKm ? 'ដាក់ចូលកន្ត្រក' : 'Add Bracelet to Cart'}
      </button>
    </div>

    <!-- Charm Photo Zoom & 3D Model Inspection Modal -->
    <div id="studioCharmZoomModal" class="studio-charm-zoom-modal" style="display:none" onclick="if(event.target===this)closeStudioCharmZoom()">
      <div class="studio-charm-zoom-card">
        <button type="button" onclick="closeStudioCharmZoom()" style="position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.08);border:1px solid var(--border);color:var(--text);cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center">✕</button>
        
        <div id="studioZoomModelBox" style="display:flex;align-items:center;justify-content:center;margin:0 auto 16px;min-height:190px">
          <!-- Rendered dynamically -->
        </div>

        <div style="display:flex;align-items:center;gap:6px;justify-content:center;margin-bottom:4px">
          <span id="studioZoomModelNo" class="charm-model-tag" style="font-size:0.75rem">Model: #MD-001</span>
          <span id="studioZoomCat" class="badge" style="font-size:0.7rem">Category: Plain</span>
        </div>

        <h3 id="studioZoomName" style="margin:4px 0 2px;font-size:1.15rem;color:var(--text)">Charm Name</h3>
        <p class="muted small" style="margin:0 0 10px;font-size:0.75rem">9mm Modular Link · Hypoallergenic 316L Stainless Steel</p>
        
        <div id="studioZoomPrice" style="font-size:1.25rem;font-weight:800;color:#ea580c;margin-bottom:16px">3,000៛ ($0.75)</div>
        
        <button id="studioZoomAddBtn" type="button" class="btn primary" style="width:100%">
          ＋ ${isKm ? 'បន្ថែមចូលខ្សែដៃ' : 'Add to Bracelet Runway'}
        </button>
      </div>
    </div>
  </div>`);

  renderStudioRunway();
  renderStudioCatalog();
}

function addCustom() {
  addStudioBraceletToCart();
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
prefillRememberedLogin();

const centerLogoBtnEl = $('#mbNavCenterLogo');
if (centerLogoBtnEl) {
  centerLogoBtnEl.addEventListener('click', () => {
    if (!location.hash || location.hash === '#home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

if (me()) {
  enterApp();
} else {
  tryAutoLoginRememberedUser();
}


