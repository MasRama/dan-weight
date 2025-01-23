<script>
    import GlobalLayout from '../../Layouts/GlobalLayout.svelte';
    import { Toast } from '../../Components/helper';
    import axios from "axios"
    import CalculateHistory from '../../Components/CalculateHistory.svelte';
    import { onMount, onDestroy } from 'svelte';

    export let user
    export let title;
    export let description;
  
    let calculateHistoryComponent;
    let port;
    let reader;
    let keepReading = true;
    let socket;
    const WS_URL = 'ws://localhost:3000/ws'; // Default to localhost for testing

    function processWeight(weight) {
      const MIN_WEIGHT_THRESHOLD = 100;
      console.log('Processing weight:', weight);
      
      if (weight >= MIN_WEIGHT_THRESHOLD) {
        const currentWeight = unformatNumber(formData.entryWeight);
        if (weight !== currentWeight) {
          console.log('New weight measurement:', weight, 'Current:', currentWeight);
          formData.entryWeight = formatNumber(Math.round(weight).toString());
          calculateWeight();
        }
      } else {
        console.log('Ignoring weight below threshold:', weight);
      }
    }

    async function connectArduino() {
      try {
        // Check if already connected
        if (socket && socket.readyState === WebSocket.OPEN) {
          Toast('Arduino sudah terhubung', "info");
          return;
        }

        console.log('Attempting to connect to WebSocket at:', WS_URL);
        
        try {
          socket = new WebSocket(WS_URL);
          
          socket.onopen = () => {
            Toast('Arduino berhasil terhubung', "success");
            console.log('WebSocket Connected');
          };

          socket.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              console.log('Received WebSocket data:', data);
              if (data.type === 'weight' && data.weight) {
                processWeight(Math.abs(parseFloat(data.weight)));
              }
            } catch (err) {
              console.error('Error processing WebSocket data:', err);
            }
          };

          socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
            Toast('Gagal terhubung ke Arduino', "error");
          };

          socket.onclose = () => {
            console.log('WebSocket Disconnected');
            Toast('Koneksi terputus, mencoba menghubungkan kembali...', "error");
            // Attempt to reconnect after 5 seconds
            setTimeout(connectArduino, 5000);
          };

        } catch (wsError) {
          console.error('WebSocket connection failed:', wsError);
          Toast('Gagal terhubung ke Arduino', "error");
        }
      } catch (error) {
        Toast(`Gagal menghubungkan Arduino: ${error.message}`, "error");
        console.error('Connection error:', error);
      }
    }

    async function readSerialData() {
      const decoder = new TextDecoder();
      let buffer = '';
      let lastWeight = 0;
      let initialWeightSet = false;
      const MIN_WEIGHT_THRESHOLD = 100; // Minimum weight threshold in grams
      
      try {
        console.log('Starting to read serial data...');
        while (port && keepReading) {
          const { value, done } = await reader.read();
          if (done) {
            console.log('Reader done, breaking loop');
            reader.releaseLock();
            break;
          }
          
          // Decode the incoming data
          const decodedData = decoder.decode(value);
          console.log('Raw decoded data:', decodedData);
          buffer += decodedData;
          
          // Process complete lines and handle multiple data formats
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (!line.trim()) continue; // Skip empty lines
            
            console.log('Processing line:', line);
            
            // Extract weight value
            // Format expected: "Reading: X.XX gram calibration_factor: YYY"
            const weightMatch = line.match(/Reading:\s*([-]?\d+\.?\d*)\s*gram/);
            if (weightMatch) {
              const weight = Math.abs(parseFloat(weightMatch[1]));
              console.log('Extracted weight:', weight);
              
              // Only process weights above threshold
              if (weight >= MIN_WEIGHT_THRESHOLD) {
                if (!initialWeightSet) {
                  lastWeight = weight;
                  formData.entryWeight = formatNumber(Math.round(weight).toString());
                  calculateWeight();
                  initialWeightSet = true;
                  console.log('Initial weight set to:', weight);
                } else {
                  // Only update if it's a new measurement above threshold
                  const currentWeight = unformatNumber(formData.entryWeight);
                  if (weight !== currentWeight) {
                    console.log('New weight measurement:', weight, 'Current:', currentWeight);
                    formData.entryWeight = formatNumber(Math.round(weight).toString());
                    calculateWeight();
                    lastWeight = weight;
                  }
                }
              } else {
                console.log('Ignoring weight below threshold:', weight);
              }
            } else if (line.includes('Zero factor:')) {
              const zeroMatch = line.match(/Zero factor:\s*(\d+)/);
              if (zeroMatch) {
                console.log('Found zero factor:', zeroMatch[1]);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error reading serial data:', error);
        Toast('Error membaca data dari Arduino', "error");
        
        // Try to gracefully handle disconnection
        if (port) {
          try {
            reader.releaseLock();
            await port.close();
          } catch (e) {
            console.error('Error closing port:', e);
          }
          port = null;
          Toast('Koneksi terputus, silakan hubungkan kembali', "error");
        }
      }
    }

    onMount(() => {
      // Automatically try to connect when component mounts
      connectArduino();
    });

    onDestroy(() => {
      if (socket) {
        socket.close();
      }
    });

    let selectedType = ''; // Will store either 'truk' or 'gandengan' types vehicle

    let formData = {
      vehicleNumber: '',
      driverName: '',
      ownerName: '',
      entryWeight: '',
      pricePerKg: '',
      entryDateTime: Date.now(),
      types: ''
    };

    let results = {
      totalPrice: 0
    };
  
    function formatNumber(value) {
      if (!value) return '';
      if (typeof value === 'number') {
        const formattedValue = value.toFixed(2);
        const [whole, decimal] = formattedValue.split('.');
        const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return decimal ? `${formattedWhole},${decimal}` : formattedWhole;
      }
      const [whole, decimal] = value.toString().split('.');
      const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return decimal ? `${formattedWhole},${decimal}` : formattedWhole;
    }
  
    function unformatNumber(value) {
      if (!value) return 0;
      return parseFloat(value.toString().replace(/,/g, ''));
    }
  
    function handleNumberInput(event, field) {
      const value = event.target.value.replace(/\D/g, '');
      formData[field] = formatNumber(value);
    }
  
    function formatPrice(price) {
      const formattedAmount = parseFloat(price).toFixed(0);
      return `Rp ${formattedAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    }
  
    function calculateWeight() {
      const entryWeight = unformatNumber(formData.entryWeight);
      
      results = {
        totalPrice: (entryWeight / 1000) * unformatNumber(formData.pricePerKg)
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
        
        const payload = {
          vehicleNumber: formData.vehicleNumber,
          driverName: formData.driverName, 
          ownerName: formData.ownerName,
          entryWeight: entryWeight,
          pricePerKg: unformatNumber(formData.pricePerKg),
          entryDateTime: formData.entryDateTime,
          types: selectedType,
          userId: user.id
        };
        
        console.log('Submitting payload:', payload);
        
        const response = await axios.post('/api/calculate', payload);
        console.log('Response:', response.data);

        if (response.data.success) {
          Toast('Data berhasil disimpan', "success");
          // Save current values
          const currentPricePerKg = formData.pricePerKg;
          const currentType = selectedType;
          
          // Reset form after successful save
          formData = {
            vehicleNumber: '',
            driverName: '',
            ownerName: '',
            entryWeight: '',
            pricePerKg: currentPricePerKg,
            entryDateTime: Date.now(),
            types: currentType
          };
          selectedType = currentType;
          
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

    async function deleteAllData() {
      if (confirm('Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.')) {
        try {
          const response = await axios.delete('/api/calculate/all');
          if (response.data.success) {
            Toast('Semua data berhasil dihapus', "success");
            if (calculateHistoryComponent) {
              await calculateHistoryComponent.refreshData();
            }
          }
        } catch (error) {
          Toast('Gagal menghapus data', "error");
          console.error('Delete all error:', error);
        }
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
                value={formData.entryWeight ? formatNumber((unformatNumber(formData.entryWeight) / 1000).toFixed(2)).replace('.', ',') : ''}
                on:input={(e) => {
                  const kgValue = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
                  const gramValue = (parseFloat(kgValue) * 1000).toString();
                  formData.entryWeight = formatNumber(gramValue);
                  calculateWeight();
                }}
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

      <!-- Delete All Button -->
      <div class="mt-8 flex justify-end">
        <button
          type="button"
          on:click={deleteAllData}
          class="px-6 py-3 bg-red-600 text-white text-base font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
        >
          Hapus Semua Data
        </button>
      </div>
    </div>
  </GlobalLayout>