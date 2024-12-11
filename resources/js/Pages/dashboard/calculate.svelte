<script>
    import GlobalLayout from '../../Layouts/GlobalLayout.svelte';
    import { Toast } from '../../Components/helper';
    import axios from "axios"
    import CalculateHistory from '../../Components/CalculateHistory.svelte';

    export let user
    export let title;
    export let description;
  
    let calculateHistoryComponent;

    let formData = {
      ticketNumber: '',
      vehicleNumber: '',
      driverName: '',
      ownerName: '',
      entryWeight: '',
      exitWeight: null,
      pricePerKg: '',
      entryDateTime: Date.now(),
      exitDateTime: null
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
      const exitWeight = unformatNumber(formData.exitWeight);
      const pricePerKg = unformatNumber(formData.pricePerKg);
      
      const roundedExit = exitWeight ? roundToNearest10(exitWeight) : exitWeight;
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
        totalPrice: roundedWeight * pricePerKg
      };
    }
  
    async function handleSubmit() {
      try {
        const entryWeight = unformatNumber(formData.entryWeight);
        const roundedEntryWeight = roundToNearest10(entryWeight);
        
        const response = await axios.post('/api/calculate', {
            ticketNumber: formData.ticketNumber,
            vehicleNumber: formData.vehicleNumber,
            driverName: formData.driverName, 
            ownerName: formData.ownerName,
            entryWeight: roundedEntryWeight,
            exitWeight: null,
            pricePerKg: unformatNumber(formData.pricePerKg),
            entryDateTime: formData.entryDateTime,
            exitDateTime: null,
            userId: user.id
        });

        if (response.data.success) {
          Toast('Data berhasil disimpan', "success");
          // Save current price per kg
          const currentPricePerKg = formData.pricePerKg;
          
          // Reset form after successful save
          formData = {
            ticketNumber: '',
            vehicleNumber: '',
            driverName: '',
            ownerName: '',
            entryWeight: '',
            exitWeight: null,
            pricePerKg: currentPricePerKg, // Keep the price per kg value
            entryDateTime: new Date().toLocaleDateString('id-ID', {
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric'
            }).split('/').join('-'),
            exitDateTime: null
          };
          
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
                on:input={(e) => handleNumberInput(e, 'entryWeight')}
                class="w-full h-12 px-4 rounded-lg border-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 text-lg text-right transition duration-200"
                placeholder="0"
                required
              />
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
  
  
            <!-- Results Display -->
            {#if results.weightDifference > 0}
              <div class="col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 space-y-6">
                <div class="grid grid-cols-2 gap-8">
                  <div class="bg-white p-6 rounded-xl shadow-lg ">
                    <h3 class="text-xl font-semibold text-gray-800">Berat Bersih</h3>
                    <p class="text-4xl font-bold text-blue-600 mt-3">{formatNumber(results.roundedWeight)} KG</p>
                    <p class="text-2xl text-gray-600 mt-2">{formatPrice(results.totalPrice)}</p>
                  </div>
                  <div class="bg-white p-6 rounded-xl shadow-lg ">
                    <h3 class="text-xl font-semibold text-gray-800">Potongan</h3>
                    <p class="text-4xl font-bold text-red-600 mt-3">{formatNumber(results.roundingOff)} KG</p>
                    <p class="text-2xl text-gray-600 mt-2">{formatPrice(results.roundingOff * unformatNumber(formData.pricePerKg))}</p>
                  </div>
                </div>
              </div>
            {/if}
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