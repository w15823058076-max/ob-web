/* Static experience configuration. Keeping these values outside the renderer
   makes the page order and content easier to review without touching UI code. */
export const FLOW = [
  {id:'gender',name:'Gender',node:'1:4244',progressBar:true},
  {id:'name',name:'Name',node:'1:322',progressBar:true},
  {id:'age',name:'Age',node:'1:386',progressBar:true},
  {id:'together',name:'Time Together',node:'1:47678',progressBar:true},
  {id:'distance',name:'Distance',node:'1:438',progressBar:true},
  {id:'purpose',name:'Your Goals',node:'1:4348',progressBar:true},
  {id:'needs',name:'Your Needs',node:'1:476',progressBar:true},
  {id:'brand',name:'Love8 Story',node:'1:4104'},
  {id:'location',name:'Location Sharing',node:'1:3248',progressBar:true},
  {id:'status',name:'Safety Status',node:'1:3426',progressBar:true},
  {id:'interact',name:'Interactions',node:'1:3582',progressBar:true},
  {id:'widgets',name:'Widgets',node:'1:3679',progressBar:true},
  {id:'story',name:'Our Story',node:'1:3878',progressBar:true},
  {id:'product',name:'Why Love8',node:'1:4951'},
  {id:'rights',name:'Premium Benefits',node:'1:179'},
  {id:'price',name:'Plans & Pricing',node:'1:4577'},
  {id:'binding',name:'Link Your Account',node:'1:55872'},
  {id:'download',name:'Download the App',node:'6:55903'},
];

export const ONBOARDING_COUNT = FLOW.filter(screen => !['binding','download'].includes(screen.id)).length;

export const OPTIONS = {
  gender:[['','Female'],['','Male'],['⚧️','Non-binary'],['🌈','Other']],
  age:[['🍭','< 20'],['🌺','20-25'],['💍','26-30'],['🍾','31-45'],['🌳','45+']],
  together:[['🌱','Less than 3 months'],['🌷','3-12 months'],['🌸','1-3 years'],['🌹','3-5 years'],['💎','5+ years']],
  distance:[['🛩️',"We're in different countries"],['🚗',"We're in the same country but\ndifferent cities"],['🚶',"We're in the same city"]],
  purpose:[['📍',"Know my partner's status"],['💞','Stay connected in a long-distance relationship'],['🧩','Use couple widgets'],['💌','More interactions, more love'],['📖','Capture our love story'],['👀','Just looking around']],
  needs:[['📍️','Keeping track of their location'],['🐶','Try to raise a pet together'],['💬','Instant messaging'],['🥰','Enhance intimacy and\ncompatibility'],['💝','Make everyday moments\nfeel special']],
};

export const AVATARS = ['avatar-f1','avatar-f2','avatar-f3','avatar-f4','avatar-m1','avatar-m2','avatar-m3','avatar-m4'];

export const ASSET_FILES = {
  'love8-app-icon':'love8-app-icon.jpg',
};

export const featureData = {
  location:{image:'feature-location',top:27,title:'📍 Always in Sync',copy:'With Love8, you and your partner can stay<br>connected no matter the distance, share your<br>daily moments, and build trust and security in<br>your relationship.'},
  status:{image:'feature-status',top:30,title:'💫 Stay Connected & Safe',copy:'Watch their live location, travel speed, and<br>battery, and get notified when they arrive home<br>—so you always feel safe and connected.'},
  interact:{image:'feature-interaction',top:0,title:'💞 Feel Closer Every Day',copy:'Love8 keeps you in tune with your partner—<br>share your day, be part of theirs, and feel their<br>presence anytime.'},
  widgets:{image:'feature-widgets',top:93,title:'🧩 Love at a Glance',copy:'Share your status right to the home screen'},
  story:{image:'feature-story',top:93,title:'📖 Write Your Love Story',copy:'Capture every romantic moment and build a<br>beautiful timeline together.'}
};

export const STORAGE_KEY = 'love8-ob-v4';
export const LEGACY_STORAGE_KEYS = ['love8-ob-v3'];

export const freshState = () => ({
  name:'',
  picks:{},
  avatar:-1,
  plan:'yearly',
  bindingEmail:'',
  bindingName:'',
  bindingCountry:'Netherlands',
  bindingPhone:'',
  bound:false,
});
