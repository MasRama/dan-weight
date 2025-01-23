<script>
    import { onMount, onDestroy } from "svelte";
    import axios from "axios";
    import { Toast } from "./helper";
    
    let calculations = [];
    let filteredCalculations = [];
    let loading = true;
    let showModal = false;
    let selectedCalc = null;
    let showEditModal = false;
    let editingCalc = null;
    let showInvoiceModal = false;
    let selectedInvoice = null;
    let socket = null;
    const WS_URL = 'ws://localhost:3000/ws-edit'; // Changed to use edit-specific endpoint

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

    function roundToNearest10(value) {
      const remainder = value % 10;
      if (remainder >= 5) {
        return value + (10 - remainder);
      }
      return value - remainder;
    }
    
    // Search and Filter states
    let searchQuery = "";
    let filterBy = "ticket_number"; // default filter
    let dateFrom = "";
    let dateTo = "";

    const filterOptions = [
      { value: "ticket_number", label: "No. Tiket" },
      { value: "vehicle_number", label: "No. Kendaraan" },
      { value: "driver_name", label: "Nama Sopir" },
      { value: "owner_name", label: "Nama Pemilik" }
    ];

    const handleSearch = () => {
      filteredCalculations = calculations.filter(calc => {
        const matchesSearch = calc[filterBy].toLowerCase().includes(searchQuery.toLowerCase());
        
        // Convert bigInteger timestamp to Date object for comparison
        const entryDate = new Date(parseInt(calc.entry_datetime));
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;

        // Set time to start and end of day for accurate comparison
        if (fromDate) fromDate.setHours(0,0,0,0);
        if (toDate) toDate.setHours(23,59,59,999);

        const matchesDateRange = (!fromDate || !toDate) ? true : 
          (entryDate >= fromDate && entryDate <= toDate);
        
        return matchesSearch && matchesDateRange;
      });
    };

    function connectWebSocket() {
      console.log('\n--- Edit Modal WebSocket ---');
      console.log('Attempting to connect to:', WS_URL);
      
      if (socket && socket.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
      }

      socket = new WebSocket(WS_URL);
      
      socket.onopen = () => {
        console.log('WebSocket connected successfully');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('\n--- Edit Modal Received Data ---');
          console.log('Raw data:', data);
          console.log('Modal state:', { showEditModal, editingCalc: !!editingCalc });
          
          if (data.type === 'weight' && data.weight) {
            const weight = Math.abs(parseFloat(data.weight));
            console.log('Processing weight:', weight);
            processWeight(weight);
          }
        } catch (err) {
          console.error('Error processing WebSocket data:', err);
        }
      };

      socket.onerror = (error) => {
        console.error('\n--- Edit Modal WebSocket Error ---');
        console.error(error);
      };

      socket.onclose = () => {
        console.log('\n--- Edit Modal WebSocket Closed ---');
        socket = null;
      };
    }

    function disconnectWebSocket() {
      console.log('\n--- Edit Modal Disconnecting ---');
      if (socket) {
        console.log('Closing WebSocket connection');
        socket.close();
        socket = null;
      } else {
        console.log('No active WebSocket connection to close');
      }
    }

    function processWeight(weight) {
      console.log('\n--- Processing Weight in Edit Modal ---');
      console.log('Input weight:', weight);
      console.log('Modal state:', { showEditModal, editingCalc: !!editingCalc });
      
      const MIN_WEIGHT_THRESHOLD = 100;
      
      if (weight >= MIN_WEIGHT_THRESHOLD && showEditModal && editingCalc) {
        const currentWeight = unformatNumber(editingCalc.exit_weight || '0');
        console.log('Current exit weight:', currentWeight);
        
        if (weight !== currentWeight) {
          console.log('Updating exit weight from', currentWeight, 'to', weight);
          editingCalc.exit_weight = formatNumber((weight / 1000).toFixed(2));
          console.log('New formatted exit weight:', editingCalc.exit_weight);
        } else {
          console.log('Weight unchanged, skipping update');
        }
      } else {
        console.log('Skipping weight update. Conditions:', {
          aboveThreshold: weight >= MIN_WEIGHT_THRESHOLD,
          modalOpen: showEditModal,
          hasEditingCalc: !!editingCalc
        });
      }
    }

    const handleEdit = async () => {
      try {
        // Convert kg to grams for both weights
        const entryWeightGrams = parseFloat(editingCalc.entry_weight.toString().replace(',', '.')) * 1000;
        const exitWeightGrams = editingCalc.exit_weight ? parseFloat(editingCalc.exit_weight.toString().replace(',', '.')) * 1000 : null;

        // Calculate net weight as entry weight minus exit weight
        const netWeight = exitWeightGrams ? entryWeightGrams - exitWeightGrams : entryWeightGrams;

        const response = await axios.post(`/api/calculations/edit`, {
          id: editingCalc.id,
          ticketNumber: editingCalc.ticket_number,
          vehicleNumber: editingCalc.vehicle_number,
          driverName: editingCalc.driver_name,
          ownerName: editingCalc.owner_name,
          entryWeight: entryWeightGrams,
          exitWeight: exitWeightGrams,
          netWeight: netWeight, // Add net weight to payload
          pricePerKg: parseFloat(editingCalc.price_per_kg.toString().replace(/,/g, '')),
          entryDateTime: editingCalc.entry_datetime,
          userId: editingCalc.user_id,
          types: editingCalc.types
        });

        if (response.data.success) {
          // Update the local data
          const index = calculations.findIndex(c => c.id === editingCalc.id);
          calculations[index] = response.data.data;
          filteredCalculations = [...calculations];
          showEditModal = false;
          editingCalc = null;
          Toast("Edit berhasil", "success")
        }
      } catch (error) {
        console.error("Failed to update calculation:", error);
        Toast("Gagal mengupdate data", "error");
      }
    };

    const openEditModal = (calc) => {
      console.log('\n--- Opening Edit Modal ---');
      console.log('Original calc:', calc);
      
      // Convert grams to kg for display in form and format with commas
      editingCalc = { 
        ...calc,
        entry_weight: formatNumber(calc.entry_weight / 1000),
        exit_weight: calc.exit_weight ? formatNumber(calc.exit_weight / 1000) : null,
        price_per_kg: calc.price_per_kg.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      };
      console.log('Formatted editingCalc:', editingCalc);
      
      showEditModal = true;
      console.log('Modal opened, connecting WebSocket');
      connectWebSocket();
    };

    $: if (!showEditModal) {
      console.log('\n--- Modal Closed ---');
      disconnectWebSocket();
    }

    onDestroy(() => {
      disconnectWebSocket(); // Cleanup on component destroy
    });

    $: {
      searchQuery;
      filterBy;
      dateFrom;
      dateTo;
      handleSearch();
    }

    const formatCurrency = (amount) => {
      // Format to 2 decimal places and use comma as decimal separator
      const formattedAmount = parseFloat(amount).toFixed(0);
      return `Rp ${formattedAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    };

    const formatDate = (timestamp) => {
      if (!timestamp || isNaN(timestamp)) {
        return "Belum ditentukan";
      }
      const date = new Date(parseInt(timestamp));
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const showDetails = (calc) => {
      selectedCalc = calc;
      showModal = true;
    };
    
    async function refreshData() {
      try {
        const response = await axios.get("/api/calculations");
        calculations = response.data.data;
        filteredCalculations = calculations;
      } catch (error) {
        console.error("Failed to fetch calculations:", error);
        Toast("Gagal mengambil data", "error");
      }
    }

    onMount(async () => {
      try {
        const response = await axios.get("/api/calculations");
        calculations = response.data.data;
        filteredCalculations = calculations;
      } catch (error) {
        console.error("Failed to fetch calculations:", error);
        Toast("Gagal mengambil data", "error");
      } finally {
        loading = false;
      }
    });

    export { refreshData };

    // Add new function to calculate totals
    function calculateTotals(transactions) {
      return transactions.reduce((acc, curr) => {
        return {
          totalTransactions: acc.totalTransactions + 1,
          totalWeight: acc.totalWeight + (curr.rounded_weight || 0),
          totalAmount: acc.totalAmount + (curr.total_price || 0),
          completedTransactions: acc.completedTransactions + (curr.exit_weight ? 1 : 0),
          pendingTransactions: acc.pendingTransactions + (curr.exit_weight ? 0 : 1)
        };
      }, {
        totalTransactions: 0,
        totalWeight: 0,
        totalAmount: 0,
        completedTransactions: 0,
        pendingTransactions: 0
      });
    }

    // Reactive statement to calculate totals when filteredCalculations changes
    $: totals = calculateTotals(filteredCalculations);

    const generateInvoice = (calc) => {
      selectedInvoice = calc;
      showInvoiceModal = true;
    };

    // Format tanggal dan waktu lengkap
    const formatFullDate = (timestamp) => {
      if (!timestamp || isNaN(timestamp)) {
        return "Belum ditentukan";
      }
      const date = new Date(parseInt(timestamp));
      const hari = date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      const waktu = date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      return `${hari} - ${waktu} WIB`;
    };
</script>

<style>
  @media print {
    :global(body > *:not(.invoice-modal)) {
      display: none !important;
    }
    
    /* Remove background colors and shadows for better printing */
    .invoice-modal {
      background: white !important;
      box-shadow: none !important;
    }
    
    /* Hide the close and print buttons when printing */
    .invoice-modal button {
      display: none !important;
    }
    
    /* Ensure the invoice takes up the full page */
    .invoice-modal {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      padding: 2cm !important;
    }
  }
</style>

<div class="mt-12 bg-white rounded-xl shadow-lg p-8">
  <div class="mb-8">
    <h2 class="text-2xl font-bold text-gray-800">Riwayat Kalkulasi</h2>
    <p class="text-gray-600">Catatan seluruh transaksi penimbangan</p>
  </div>

  <!-- Summary Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-blue-600">Total Transaksi</p>
          <div class="mt-2 flex items-baseline">
            <p class="text-2xl font-semibold text-blue-900">{totals.totalTransactions}</p>
            <p class="ml-2 text-sm text-blue-600">transaksi</p>
          </div>
          <div class="mt-1 text-xs text-blue-600">
            <span class="font-medium">{totals.completedTransactions}</span> selesai,
            <span class="font-medium">{totals.pendingTransactions}</span> pending
          </div>
        </div>
        <div class="p-3 bg-blue-100 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
      </div>
    </div>

    <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-green-600">Total Berat</p>
          <div class="mt-2 flex items-baseline">
            <p class="text-2xl font-semibold text-green-900">{totals.totalWeight.toLocaleString()}</p>
            <p class="ml-2 text-sm text-green-600">kg</p>
          </div>
          <div class="mt-1 text-xs text-green-600">
            Berat total dari semua transaksi
          </div>
        </div>
        <div class="p-3 bg-green-100 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        </div>
      </div>
    </div>

    <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-purple-600">Total Pendapatan</p>
          <div class="mt-2 flex items-baseline">
            <p class="text-2xl font-semibold text-purple-900">{formatCurrency(totals.totalAmount)}</p>
          </div>
          <div class="mt-1 text-xs text-purple-600">
            Total nilai dari semua transaksi
          </div>
        </div>
        <div class="p-3 bg-purple-100 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
  </div>

  <!-- Search and Filter Section -->
  <div class="bg-white p-4 rounded-lg shadow-sm mb-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label for="filterBy" class="block text-sm font-medium text-gray-700 mb-1">Cari Berdasarkan</label>
        <select 
          id="filterBy"
          bind:value={filterBy}
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
          {#each filterOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="searchInput" class="block text-sm font-medium text-gray-700 mb-1">Kata Kunci</label>
        <input 
          id="searchInput"
          type="text"
          bind:value={searchQuery}
          placeholder="Cari..."
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="dateFrom" class="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
        <input 
          id="dateFrom"
          type="date"
          bind:value={dateFrom}
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="dateTo" class="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
        <input 
          id="dateTo"
          type="date"
          bind:value={dateTo}
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  {:else}
    <!-- Results count -->
    <div class="mb-4 text-sm text-gray-600">
      Menampilkan {filteredCalculations.length} dari {calculations.length} transaksi
    </div>

    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Tiket</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kendaraan</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sopir</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Berat Bersih</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Harga</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each filteredCalculations as calc}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{calc.ticket_number}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{calc.vehicle_number}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{calc.driver_name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{calc.types || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {calc.exit_weight ? formatNumber((calc.net_weight / 1000).toFixed(2)) : 'Belum ditentukan'} kg
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {calc.exit_weight ? formatCurrency(calc.total_price) : 'Belum ditentukan'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(calc.entry_datetime)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button 
                    on:click={() => showDetails(calc)}
                    class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-colors mr-2">
                    Detail
                  </button>
                  <button 
                    on:click={() => openEditModal(calc)}
                    class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm transition-colors mr-2">
                    Edit
                  </button>
                  <button 
                    on:click={() => generateInvoice(calc)}
                    class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md text-sm transition-colors mr-2">
                    Invoice
                  </button>
                  {#if calc.exit_weight}
                    <span class="inline-flex items-center justify-center w-6 h-6 bg-green-50 text-green-500 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 ">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          
                          
                    </span>
                  {:else}
                    <span class="inline-flex items-center justify-center w-6 h-6 bg-yellow-50 text-yellow-500 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                          </svg>
                    </span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div> 

{#if showModal && selectedCalc}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-2xl w-full p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-800">Detail Transaksi</h2>
        <button 
          on:click={() => showModal = false}
          class="text-gray-500 hover:text-gray-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-sm font-medium text-gray-500">No. Tiket</p>
          <p class="text-gray-900">{selectedCalc.ticket_number}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Kendaraan</p>
          <p class="text-gray-900">{selectedCalc.vehicle_number}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Nama Sopir</p>
          <p class="text-gray-900">{selectedCalc.driver_name}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Nama Pemilik</p>
          <p class="text-gray-900">{selectedCalc.owner_name}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Berat Masuk</p>
          <p class="text-gray-900">{formatNumber((selectedCalc.entry_weight / 1000).toFixed(2))} kg</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Berat Keluar</p>
          <p class="text-gray-900">{selectedCalc.exit_weight ? `${formatNumber((selectedCalc.exit_weight / 1000).toFixed(2))} kg` : 'Belum ditentukan'}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Berat Bersih</p>
          <p class="text-gray-900">{selectedCalc.exit_weight ? `${formatNumber((selectedCalc.net_weight / 1000).toFixed(2))} kg` : 'Belum ditentukan'}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Harga per Kg</p>
          <p class="text-gray-900">{formatCurrency(selectedCalc.price_per_kg)}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Total Harga</p>
          <p class="text-gray-900">{selectedCalc.exit_weight ? formatCurrency(selectedCalc.total_price) : 'Belum ditentukan'}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Waktu Masuk</p>
          <p class="text-gray-900">{formatDate(selectedCalc.entry_datetime)}</p>
        </div>
        {#if selectedCalc.exit_datetime}
        <div>
          <p class="text-sm font-medium text-gray-500">Waktu Keluar</p>
          <p class="text-gray-900">{formatDate(selectedCalc.exit_datetime)}</p>
        </div>
        {/if}
        <div>
          <p class="text-sm font-medium text-gray-500">Jenis Kendaraan</p>
          <p class="text-gray-900">{selectedCalc.types || '-'}</p>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <button 
          on:click={() => showModal = false}
          class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md transition-colors">
          Tutup
        </button>
      </div>
    </div>
  </div>
{/if}

{#if showEditModal && editingCalc}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-2xl w-full p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-800">Edit Transaksi</h2>
        <button 
          on:click={() => showEditModal = false}
          class="text-gray-500 hover:text-gray-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="ticket_number" class="block text-sm font-medium text-gray-700">No. Tiket</label>
          <input 
            type="text"
            bind:value={editingCalc.ticket_number}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="vehicle_number" class="block text-sm font-medium text-gray-700">Kendaraan</label>
          <input 
            type="text"
            bind:value={editingCalc.vehicle_number}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="driver_name" class="block text-sm font-medium text-gray-700">Nama Sopir</label>
          <input 
            type="text"
            bind:value={editingCalc.driver_name}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="owner_name" class="block text-sm font-medium text-gray-700">Nama Pemilik</label>
          <input 
            type="text"
            bind:value={editingCalc.owner_name}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="entry_weight" class="block text-sm font-medium text-gray-700">Berat Masuk (kg)</label>
          <input 
            type="text"
            bind:value={editingCalc.entry_weight}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="exit_weight" class="block text-sm font-medium text-gray-700">Berat Keluar (kg)</label>
          <input 
            type="text"
            bind:value={editingCalc.exit_weight}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Masukkan berat keluar"
          />
        </div>
        <div>
          <label for="price_per_kg" class="block text-sm font-medium text-gray-700">Harga per Kg</label>
          <input 
            type="text"
            bind:value={editingCalc.price_per_kg}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="types" class="block text-sm font-medium text-gray-700">Jenis Kendaraan</label>
          <input 
            type="text"
            bind:value={editingCalc.types}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div class="mt-6 flex justify-end space-x-3">
        <button 
          on:click={() => showEditModal = false}
          class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md transition-colors">
          Batal
        </button>
        <button 
          on:click={handleEdit}
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
          Simpan
        </button>
      </div>
    </div>
  </div>
{/if}

{#if showInvoiceModal && selectedInvoice}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="invoice-modal bg-white rounded-lg w-full max-w-4xl p-8">
      <!-- Invoice Header -->
      <div class="flex justify-between items-start mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">INVOICE</h1>
          <p class="text-gray-600 mt-1">No. Tiket: {selectedInvoice.ticket_number}</p>
        </div>
        <button 
          on:click={() => showInvoiceModal = false}
          class="text-gray-500 hover:text-gray-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Company & Customer Info -->
      <div class="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Dari:</h2>
          <div class="text-gray-600">
            <p class="font-bold text-xl">PT. Timbangan Digital</p>
            <p>Jl. Raya Utama No. 123</p>
            <p>Jakarta Selatan, 12345</p>
            <p>Telp: (021) 123-4567</p>
          </div>
        </div>
        <div>
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Kepada:</h2>
          <div class="text-gray-600">
            <p class="font-bold">{selectedInvoice.owner_name}</p>
            <p>Sopir: {selectedInvoice.driver_name}</p>
            <p>No. Kendaraan: {selectedInvoice.vehicle_number}</p>
            <p>Jenis Kendaraan: {selectedInvoice.types || '-'}</p>
          </div>
        </div>
      </div>

      <!-- Invoice Details -->
      <div class="border rounded-lg overflow-hidden mb-8">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50">
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Berat</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Harga/Kg</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr>
              <td class="px-6 py-4 text-sm text-gray-900">
                Berat Kotor
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 text-right">
                {formatNumber((selectedInvoice.entry_weight / 1000).toFixed(2))} kg
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 text-right">
                -
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 text-right">
                -
              </td>
            </tr>
            <tr>
              <td class="px-6 py-4 text-sm text-gray-900">
                Berat Bersih
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 text-right">
                {selectedInvoice.exit_weight ? `${formatNumber((selectedInvoice.net_weight / 1000).toFixed(2))} kg` : 'Belum ditentukan'}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 text-right">
                {formatCurrency(selectedInvoice.price_per_kg)}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                {selectedInvoice.exit_weight ? formatCurrency(selectedInvoice.total_price) : 'Belum ditentukan'}
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-gray-50">
            <tr>
              <th scope="row" colspan="3" class="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Total
              </th>
              <td class="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                {selectedInvoice.exit_weight ? formatCurrency(selectedInvoice.total_price) : 'Belum ditentukan'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Additional Info -->
      <div class="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 class="text-sm font-medium text-gray-900 mb-2">Informasi Transaksi:</h3>
          <div class="text-sm text-gray-600">
            <p>Tanggal Masuk: {formatFullDate(selectedInvoice.entry_datetime)}</p>
            <p>Tanggal Keluar: {formatFullDate(selectedInvoice.exit_datetime)}</p>
          </div>
        </div>
        <div>
          <h3 class="text-sm font-medium text-gray-900 mb-2">Catatan:</h3>
          <p class="text-sm text-gray-600">
            Pembayaran dilakukan secara tunai atau transfer bank.
            Harap simpan invoice ini sebagai bukti transaksi yang sah.
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <button 
          on:click={() => showInvoiceModal = false}
          class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md transition-colors">
          Tutup
        </button>
        <button 
          on:click={() => window.print()}
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Cetak Invoice
        </button>
      </div>
    </div>
  </div>
{/if}