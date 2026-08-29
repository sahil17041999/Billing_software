/**
 * Indian States and Major Cities/Districts Data Directory & Dynamic Linker
 */

const INDIAN_STATES_CITIES = {
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Kakinada",
    "Rajahmundry", "Kadapa", "Tirupati", "Anantapur", "Vizianagaram", "Eluru",
    "Ongole", "Nandyal", "Machilipatnam", "Tenali", "Chittoor", "Hindupur",
    "Srikakulam", "Bhimavaram", "Madanapalle", "Guntakal", "Dharmavaram", "Gudivada"
  ],
  "Arunachal Pradesh": [
    "Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Along", "Tezu",
    "Bomdila", "Roing", "Khonsa", "Changlang", "Seppa", "Bhalukpong"
  ],
  "Assam": [
    "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia",
    "Tezpur", "Bongaigaon", "Karimganj", "Sivasagar", "Goalpara", "Dhubri",
    "North Lakhimpur", "Barpeta", "Diphu", "Golaghat", "Hailakandi", "Kokrajhar"
  ],
  "Bihar": [
    "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga",
    "Bihar Sharif", "Arrah", "Begusarai", "Katihar", "Munger", "Chhapra",
    "Danapur", "Saharsa", "Sasaram", "Hajipur", "Dehri", "Siwan", "Motihari",
    "Nawada", "Bagaha", "Buxar", "Kishanganj", "Sitamarhi", "Samastipur"
  ],
  "Chandigarh": [
    "Chandigarh", "Manimajra"
  ],
  "Chhattisgarh": [
    "Raipur", "Bhilai", "Bilaspur", "Korba", "Rajnandgaon", "Raigarh",
    "Jagdalpur", "Ambikapur", "Dhamtari", "Mahasamund", "Durg", "Kanker",
    "Champa", "Bhatapara", "Kawardha"
  ],
  "Delhi": [
    "New Delhi", "Central Delhi", "North Delhi", "South Delhi", "East Delhi",
    "West Delhi", "North East Delhi", "North West Delhi", "South East Delhi",
    "South West Delhi", "Shahdara", "Dwarka", "Rohini", "Connaught Place",
    "Karol Bagh", "Lajpat Nagar", "Pitampura", "Vasant Kunj", "Janakpuri"
  ],
  "Goa": [
    "Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim",
    "Curchorem", "Canacona", "Quepem", "Sanguem", "Pernem"
  ],
  "Gujarat": [
    "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar",
    "Junagadh", "Gandhinagar", "Gandhidham", "Anand", "Navsari", "Morbi",
    "Nadiad", "Surendranagar", "Bharuch", "Mehsana", "Bhuj", "Porbandar",
    "Palanpur", "Valsad", "Vapi", "Gondal", "Veraval", "Godhra", "Patan",
    "Dahod", "Botad", "Amreli", "Deesa", "Jetpur"
  ],
  "Haryana": [
    "Faridabad", "Gurugram", "Panipat", "Ambala", "Yamunanagar", "Rohtak",
    "Hisar", "Karnal", "Sonipat", "Panchkula", "Sirsa", "Bhiwani",
    "Bahadurgarh", "Jind", "Thanesar", "Kaithal", "Rewari", "Palwal", "Hansi"
  ],
  "Himachal Pradesh": [
    "Shimla", "Dharamshala", "Mandi", "Solan", "Kullu", "Manali",
    "Baddi", "Nahan", "Hamirpur", "Una", "Bilaspur", "Chamba", "Kangra", "Paonta Sahib"
  ],
  "Jammu and Kashmir": [
    "Srinagar", "Jammu", "Anantnag", "Baramulla", "Kathua", "Sopore",
    "Udhampur", "Kupwara", "Pulwama", "Rajouri", "Poonch", "Doda", "Ganderbal"
  ],
  "Jharkhand": [
    "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City", "Deoghar",
    "Phusro", "Hazaribagh", "Giridih", "Ramgarh", "Medininagar", "Chirkunda",
    "Jhumri Telaiya", "Sahibganj", "Chaibasa", "Dumka", "Gumia"
  ],
  "Karnataka": [
    "Bengaluru", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi",
    "Kalaburagi", "Davanagere", "Ballari", "Vijayapura", "Shivamogga",
    "Tumakuru", "Raichur", "Bidar", "Hosapete", "Gadag-Betageri", "Robertsonpet",
    "Hassan", "Bhadravati", "Chitradurga", "Udupi", "Kolar", "Mandya", "Chikkamagaluru"
  ],
  "Kerala": [
    "Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam", "Thrissur",
    "Kannur", "Alappuzha", "Kottayam", "Palakkad", "Manjeri", "Thalassery",
    "Ponnani", "Vatakara", "Kanhangad", "Payyanur", "Koyilandy", "Neyyattinkara",
    "Kayamkulam", "Malappuram", "Guruvayur", "Kasaragod"
  ],
  "Ladakh": [
    "Leh", "Kargil", "Diskit", "Padum"
  ],
  "Madhya Pradesh": [
    "Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar",
    "Dewas", "Satna", "Ratlam", "Rewa", "Katni", "Singrauli",
    "Burhanpur", "Khandwa", "Bhind", "Chhindwara", "Guna", "Shivpuri",
    "Vidisha", "Damoh", "Mandsaur", "Khargone", "Neemuch", "Pithampur", "Hoshangabad"
  ],
  "Maharashtra": [
    "Mumbai", "Pune", "Nagpur", "Thane", "Pimpri-Chinchwad", "Nashik",
    "Kalyan-Dombivli", "Vasai-Virar", "Aurangabad (Chhatrapati Sambhajinagar)",
    "Navi Mumbai", "Solapur", "Mira-Bhayandar", "Bhiwandi", "Amravati",
    "Nanded", "Kolhapur", "Akola", "Ulhasnagar", "Sangli-Miraj-Kupwad",
    "Malegaon", "Jalgaon", "Latur", "Dhule", "Ahmednagar", "Chandrapur",
    "Parbhani", "Ichalkaranji", "Jalna", "Ambarnath", "Bhusawal", "Panvel",
    "Satara", "Beed", "Yavatmal", "Gondia", "Barshi", "Achalpur", "Osmanabad", "Wardha"
  ],
  "Manipur": [
    "Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Kakching", "Ukhrul", "Senapati"
  ],
  "Meghalaya": [
    "Shillong", "Tura", "Jowai", "Nongpoh", "Williamnagar", "Baghmara", "Cherrapunji"
  ],
  "Mizoram": [
    "Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip", "Lawngtlai"
  ],
  "Nagaland": [
    "Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Mon"
  ],
  "Odisha": [
    "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur",
    "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda", "Jeypore",
    "Bargarh", "Rayagada", "Bolangir", "Dhenkanal", "Kendrapara", "Angul"
  ],
  "Puducherry": [
    "Puducherry", "Karaikal", "Yanam", "Mahe", "Ozhukarai"
  ],
  "Punjab": [
    "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Hoshiarpur",
    "Mohali (SAS Nagar)", "Batala", "Pathankot", "Moga", "Abohar", "Malerkotla",
    "Khanna", "Muktsar", "Barnala", "Firozpur", "Kapurthala", "Phagwara", "Rajpura"
  ],
  "Rajasthan": [
    "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur",
    "Bhilwara", "Alwar", "Bharatpur", "Sri Ganganagar", "Sikar", "Pali",
    "Tonk", "Kishangarh", "Beawar", "Hanumangarh", "Dholpur", "Sawai Madhopur",
    "Churu", "Jhunjhunu", "Barmer", "Chittorgarh", "Makrana", "Nagaur", "Banswara"
  ],
  "Sikkim": [
    "Gangtok", "Namchi", "Gyalshing", "Mangan", "Singtam", "Rangpo", "Ravangla"
  ],
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur",
    "Erode", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", "Ranipet",
    "Sivakasi", "Karur", "Udhagamandalam (Ooty)", "Hosur", "Nagercoil",
    "Kancheepuram", "Kumarapalayam", "Karaikkudi", "Neyveli", "Cuddalore",
    "Kumbakonam", "Tiruvannamalai", "Pollachi", "Rajapalayam", "Gudiyatham", "Pudukkottai"
  ],
  "Telangana": [
    "Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam",
    "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet", "Siddipet", "Miryalaguda",
    "Jagtial", "Mancherial", "Nirmal", "Kothagudem", "Kamareddy", "Bodhan"
  ],
  "Tripura": [
    "Agartala", "Dharmanagar", "Udaipur", "Kailashahar", "Belonia", "Khowai", "Ambassa"
  ],
  "Uttar Pradesh": [
    "Lucknow", "Kanpur", "Ghaziabad", "Agra", "Meerut", "Varanasi",
    "Prayagraj (Allahabad)", "Bareilly", "Aligarh", "Moradabad", "Saharanpur",
    "Gorakhpur", "Noida", "Firozabad", "Jhansi", "Muzaffarnagar", "Mathura",
    "Budaun", "Rampur", "Shahjahanpur", "Farrukhabad", "Ayodhya (Faizabad)",
    "Hapur", "Etawah", "Mirzapur", "Bulandshahr", "Sambhal", "Amroha",
    "Hardoi", "Fatehpur", "Raebareli", "Orai", "Sitapur", "Bahraich", "Modinagar",
    "Unnao", "Jaunpur", "Lakhimpur", "Hathras", "Banda", "Pilibhit", "Barabanki"
  ],
  "Uttarakhand": [
    "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur",
    "Rishikesh", "Pithoragarh", "Ramnagar", "Manglaur", "Kichha", "Kotdwar", "Nainital"
  ],
  "West Bengal": [
    "Kolkata", "Howrah", "Siliguri", "Asansol", "Durgapur", "Bardhaman",
    "Malda", "Baharampur", "Habra", "Kharagpur", "Shantipur", "Dankuni",
    "Dhulian", "Ranaghat", "Haldia", "Raiganj", "Krishnanagar", "Nabadwip",
    "Medinipur", "Jalpaiguri", "Balurghat", "Basirhat", "Bankura", "Chakdaha",
    "Darjeeling", "Alipurduar", "Purulia", "Kalyani", "Cooch Behar", "Bangarapet"
  ]
};

/**
 * Initialize dynamic State & City dropdowns / inputs
 * @param {string|HTMLElement} stateElement - State <select> or <input>
 * @param {string|HTMLElement} cityElement - City <select> or <input>
 * @param {string} [initialState] - Initial selected state
 * @param {string} [initialCity] - Initial selected city
 */
function setupDynamicStateCity(stateElement, cityElement, initialState = '', initialCity = '') {
  const stateEl = typeof stateElement === 'string' ? document.getElementById(stateElement) : stateElement;
  const cityEl = typeof cityElement === 'string' ? document.getElementById(cityElement) : cityElement;

  if (!stateEl || !cityEl) return;

  const states = Object.keys(INDIAN_STATES_CITIES).sort();

  // If state is a <select>, populate options
  if (stateEl.tagName.toLowerCase() === 'select') {
    stateEl.innerHTML = '<option value="">-- Select State --</option>';
    states.forEach(state => {
      const opt = document.createElement('option');
      opt.value = state;
      opt.textContent = state;
      if (initialState && state.toLowerCase() === initialState.toLowerCase()) {
        opt.selected = true;
      }
      stateEl.appendChild(opt);
    });
  }

  function updateCities(selectedState, targetCityValue = '') {
    if (!cityEl) return;
    
    // Find matching state key ignoring case
    const matchedKey = Object.keys(INDIAN_STATES_CITIES).find(
      s => s.toLowerCase() === (selectedState || '').trim().toLowerCase()
    );

    const cities = matchedKey ? INDIAN_STATES_CITIES[matchedKey] : [];

    if (cityEl.tagName.toLowerCase() === 'select') {
      cityEl.innerHTML = '<option value="">-- Select City --</option>';
      cities.forEach(city => {
        const opt = document.createElement('option');
        opt.value = city;
        opt.textContent = city;
        if (targetCityValue && city.toLowerCase() === targetCityValue.toLowerCase()) {
          opt.selected = true;
        }
        cityEl.appendChild(opt);
      });
      // Allow custom city if current value not in list
      if (targetCityValue && !cities.some(c => c.toLowerCase() === targetCityValue.toLowerCase())) {
        const customOpt = document.createElement('option');
        customOpt.value = targetCityValue;
        customOpt.textContent = `${targetCityValue} (Custom)`;
        customOpt.selected = true;
        cityEl.appendChild(customOpt);
      }
    } else {
      // If input text, attach a dynamic <datalist>
      const listId = cityEl.id ? `${cityEl.id}_city_datalist` : 'dynamic_city_datalist';
      let datalist = document.getElementById(listId);
      if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = listId;
        document.body.appendChild(datalist);
        cityEl.setAttribute('list', listId);
      }
      datalist.innerHTML = cities.map(c => `<option value="${c}">`).join('');
      if (targetCityValue) {
        cityEl.value = targetCityValue;
      }
    }
  }

  // Handle state change event
  stateEl.addEventListener('change', function () {
    const selectedState = stateEl.value;
    updateCities(selectedState, '');
  });

  // Initial population
  const currentState = initialState || stateEl.value;
  if (currentState) {
    if (stateEl.tagName.toLowerCase() === 'select') {
      stateEl.value = currentState;
    }
    updateCities(currentState, initialCity);
  } else {
    updateCities('', initialCity);
  }
}

// Global expose
window.INDIAN_STATES_CITIES = INDIAN_STATES_CITIES;
window.setupDynamicStateCity = setupDynamicStateCity;
