<script>
    import GlobalLayout from '../../Layouts/GlobalLayout.svelte';
    import { Toast } from '../../Components/helper';
    import axios from "axios"
    import CalculateHistory from '../../Components/CalculateHistory.svelte';

    export let user
    export let title;
    export let description;
  
    let calculateHistoryComponent;

    let selectedType = ''; // Will store either 'truk' or 'gandengan' types vehicle

    // Add vehicle weight options
    const vehicleWeightOptions = [
      { value: 3500, label: '3.500 KG' },
      { value: 4000, label: '4.000 KG' }
    ];

    let formData = {
      ticketNumber: '',
      vehicleNumber: '',
      driverName: '',
      ownerName: '',
      entryWeight: '',
      exitWeight: null,
      pricePerKg: '',
      entryDateTime: Date.now(),
      exitDateTime: null,
      types: '',
      vehicleWeight: '' // Add new field
    };

  
    let results = {
      weightDifference: 0,
      roundedWeight: 0,
      roundingOff: 0,
      totalPrice: 0
    };
  
    function formatNumber(value) {
      if (!value) return '';
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
  
    function unformatNumber(value) {
      if (!value) return 0;
      return parseFloat(value.replace(/\./g, ''));
    }

    function roundToNearest10(value) {
      const remainder = value % 10;
      if (remainder >= 5) {
        return value + (10 - remainder);
      }
      return value - remainder;
    }
  
    function handleNumberInput(event, field) {
      const value = event.target.value.replace(/\D/g, '');
      formData[field] = formatNumber(value);
    }
  
    function formatPrice(price) {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(price);
    }
  
    function calculateWeight() {
      const entryWeight = unformatNumber(formData.entryWeight);
      const vehicleWeight = parseInt(formData.vehicleWeight) || 0;
      
      // Calculate exit weight by subtracting vehicle weight from entry weight
      const calculatedExitWeight = entryWeight - vehicleWeight;
      const roundedExit = roundToNearest10(calculatedExitWeight);
      const weightDiff = entryWeight - roundedExit;
      let roundedWeight;

      if (weightDiff >= 1000) {
        roundedWeight = Math.floor(weightDiff / 100) * 100;
      } else if (weightDiff >= 100) {
        roundedWeight = Math.floor(weightDiff / 10) * 10;
      } else {
        roundedWeight = Math.floor(weightDiff);
      }

      results = {
        weightDifference: weightDiff,
        roundedWeight: roundedWeight,
        roundingOff: weightDiff - roundedWeight,
        totalPrice: roundedWeight * unformatNumber(formData.pricePerKg)
      };
    }
  
    function selectVehicleType(type) {
      selectedType = type;
      formData = { ...formData, types: type };
    }

    async function handleSubmit() {
      if (!formData.types) {
        Toast('Pilih jenis kendaraan terlebih dahulu', "error");
        return;
      }
      try {
        const entryWeight = unformatNumber(formData.entryWeight);
        const vehicleWeight = parseInt(formData.vehicleWeight) || 0;
        const exitWeight = entryWeight - vehicleWeight;
        const roundedExitWeight = roundToNearest10(exitWeight);
        
        const payload = {
          ticketNumber: formData.ticketNumber,
          vehicleNumber: formData.vehicleNumber,
          driverName: formData.driverName, 
          ownerName: formData.ownerName,
          entryWeight: entryWeight,
          exitWeight: roundedExitWeight,
          pricePerKg: unformatNumber(formData.pricePerKg),
          entryDateTime: formData.entryDateTime,
          exitDateTime: null,
          types: selectedType,
          userId: user.id,
          vehicleWeight: vehicleWeight,
        };
        
        console.log('Submitting payload:', payload); // Debug full payload
        
        const response = await axios.post('/api/calculate', payload);
        console.log('Response:', response.data); // Debug response

        if (response.data.success) {
          Toast('Data berhasil disimpan', "success");
          // Save current values
          const currentPricePerKg = formData.pricePerKg;
          const currentType = selectedType; // Save current type
          
          // Reset form after successful save
          formData = {
            ticketNumber: '',
            vehicleNumber: '',
            driverName: '',
            ownerName: '',
            entryWeight: '',
            exitWeight: null,
            pricePerKg: currentPricePerKg,
            entryDateTime: Date.now(),
            exitDateTime: null,
            types: currentType, // Use saved type
            vehicleWeight: ''
          };
          selectedType = currentType; // Keep the selected type
          
          // Refresh the calculation history
          if (calculateHistoryComponent) {
            await calculateHistoryComponent.refreshData();
          }
        }
      } catch (error) {
        Toast('Gagal menyimpan data', "error");
        console.error('Submit error:', error);
      }
    }
  </script>
  
  <GlobalLayout>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-xl shadow-lg p-8">
        <div class="mb-10 text-center">
          <h1 class="text-4xl font-bold text-gray-900">{title}</h1>
          <p class="mt-3 text-lg text-gray-600">{description}</p>
        </div>        
        
        <!-- Vehicle Type Selection -->
        <div class="mb-8 max-w-2xl mx-auto">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 text-center">Pilih Jenis Kendaraan:</h2>
          <div class="flex gap-4">
            <button
              type="button"
              class="flex-1 py-4 px-6 rounded-lg text-lg font-medium transition-all duration-200 {selectedType === 'truk' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
              on:click={() => selectVehicleType('truk')}
            >
              <div class="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
                Truk
              </div>
            </button>
            
            <button
              type="button"
              class="flex-1 py-4 px-6 rounded-lg text-lg font-medium transition-all duration-200 {selectedType === 'gandengan' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
              on:click={() => selectVehicleType('gandengan')}
            >
              <div class="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
                Gandengan
              </div>
            </button>
          </div>
        </div>
        
        <form on:submit|preventDefault={handleSubmit} class="space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Text inputs with larger styling -->
            <div class="space-y-3">
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label class="block text-base font-semibold text-gray-700">Nomor Tiket</label>
              <input
                type="text"
                bind:value={formData.ticketNumber}
                class="w-full h-12 px-4 rounded-lg border-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 text-lg transition duration-200"
                placeholder="Masukkan Nomor Tiket"
                required
              />
            </div>
  
            <div class="space-y-3">
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label class="block text-base font-semibold text-gray-700">Nomor Kendaraan</label>
              <input
                type="text"
                bind:value={formData.vehicleNumber}
                class="w-full h-12 px-4 rounded-lg border-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 text-lg uppercase transition duration-200"
                placeholder="Masukkan Nomor Kendaraan"
                required
              />
            </div>
  
            <div class="space-y-3">
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label class="block text-base font-semibold text-gray-700">Nama Sopir</label>
              <input
                type="text"
                bind:value={formData.driverName}
                class="w-full h-12 px-4 rounded-lg border-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 text-lg transition duration-200"
                placeholder="Masukkan Nama Sopir"
                required
              />
            </div>
  
            <div class="space-y-3">
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label class="block text-base font-semibold text-gray-700">Nama Pemilik</label>
              <input
                type="text"
                bind:value={formData.ownerName}
                class="w-full h-12 px-4 rounded-lg border-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 text-lg transition duration-200"
                placeholder="Masukkan Nama Pemilik"
                required
              />
            </div>
  
            <!-- Number inputs with auto formatting -->
            <div class="space-y-3">
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label class="block text-base font-semibold text-gray-700">Berat Masuk (KG)</label>
              <input
                type="text"
                value={formData.entryWeight}
                on:input={(e) => {
                  handleNumberInput(e, 'entryWeight');
                  calculateWeight();
                }}
                class="w-full h-12 px-4 rounded-lg border-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 text-lg text-right transition duration-200"
                placeholder="0"
                required
              />
            </div>
  
            <div class="space-y-3">
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label class="block text-base font-semibold text-gray-700">Berat Kendaraan</label>
              <select
                bind:value={formData.vehicleWeight}
                on:change={calculateWeight}
                class="w-full h-12 px-4 rounded-lg border-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 text-lg transition duration-200"
                required
              >
                <option value="">Pilih Berat Kendaraan</option>
                {#each vehicleWeightOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
  
            <div class="space-y-3">
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label class="block text-base font-semibold text-gray-700">Harga per KG</label>
              <input
                type="text"
                value={formData.pricePerKg}
                on:input={(e) => handleNumberInput(e, 'pricePerKg')}
                class="w-full h-12 px-4 rounded-lg border-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 text-lg text-right transition duration-200"
                placeholder="0"
                required
              />
            </div>
  
  
           
          </div>
  
          <div class="flex justify-end pt-4">
            <button
              type="submit"
              class="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Simpan
            </button>
          </div> 
        </form>
      </div>

      <CalculateHistory 
        bind:this={calculateHistoryComponent}
      />
    </div>
  </GlobalLayout>