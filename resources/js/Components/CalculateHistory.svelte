<script>
    import { onMount } from "svelte";
    import axios from "axios";
    import { Toast } from "./helper";
    
    let calculations = [];
    let filteredCalculations = [];
    let loading = true;
    let showModal = false;
    let selectedCalc = null;
    let showEditModal = false;
    let editingCalc = null;

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

    const handleEdit = async () => {
      try {
        const roundedExitWeight = editingCalc.exit_weight ? roundToNearest10(parseFloat(editingCalc.exit_weight)) : null;
        
        const response = await axios.post(`/api/calculations/edit`, {
          id: editingCalc.id,
          ticketNumber: editingCalc.ticket_number,
          vehicleNumber: editingCalc.vehicle_number,
          driverName: editingCalc.driver_name,
          ownerName: editingCalc.owner_name,
          entryWeight: editingCalc.entry_weight,
          exitWeight: roundedExitWeight,
          pricePerKg: editingCalc.price_per_kg,
          entryDateTime: editingCalc.entry_datetime,
          exitDateTime: editingCalc.exit_datetime,
          userId: editingCalc.user_id
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
      editingCalc = { ...calc };
      showEditModal = true;
    };

    $: {
      searchQuery;
      filterBy;
      dateFrom;
      dateTo;
      handleSearch();
    }

    const formatCurrency = (amount) => {
      return `Rp ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
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
</script>

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
        <label class="block text-sm font-medium text-gray-700 mb-1">Cari Berdasarkan</label>
        <select 
          bind:value={filterBy}
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
          {#each filterOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Kata Kunci</label>
        <input 
          type="text"
          bind:value={searchQuery}
          placeholder="Cari..."
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
        <input 
          type="date"
          bind:value={dateFrom}
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
        <input 
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
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{calc.rounded_weight} kg</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(calc.total_price)}</td>
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
          <p class="text-gray-900">{selectedCalc.entry_weight} kg</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Berat Keluar</p>
          <p class="text-gray-900">{selectedCalc.exit_weight ? `${selectedCalc.exit_weight} kg` : 'Belum ditentukan'}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Berat Bersih</p>
          <p class="text-gray-900">{selectedCalc.net_weight} kg</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Berat Dibulatkan</p>
          <p class="text-gray-900">{selectedCalc.rounded_weight} kg</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Selisih Pembulatan</p>
          <p class="text-gray-900">{selectedCalc.net_weight - selectedCalc.rounded_weight} kg</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Harga Selisih Pembulatan</p>
          <p class="text-gray-900">{formatCurrency((selectedCalc.net_weight - selectedCalc.rounded_weight) * selectedCalc.price_per_kg)}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Harga per Kg</p>
          <p class="text-gray-900">{formatCurrency(selectedCalc.price_per_kg)}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Total Harga</p>
          <p class="text-gray-900">{formatCurrency(selectedCalc.total_price)}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Waktu Masuk</p>
          <p class="text-gray-900">{formatDate(selectedCalc.entry_datetime)}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Waktu Keluar</p>
          <p class="text-gray-900">{formatDate(selectedCalc.exit_datetime)}</p>
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
          <label class="block text-sm font-medium text-gray-700">No. Tiket</label>
          <input 
            type="text"
            bind:value={editingCalc.ticket_number}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Kendaraan</label>
          <input 
            type="text"
            bind:value={editingCalc.vehicle_number}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Nama Sopir</label>
          <input 
            type="text"
            bind:value={editingCalc.driver_name}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Nama Pemilik</label>
          <input 
            type="text"
            bind:value={editingCalc.owner_name}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Berat Masuk (kg)</label>
          <input 
            type="number"
            bind:value={editingCalc.entry_weight}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Berat Keluar (kg)</label>
          <input 
            type="number"
            bind:value={editingCalc.exit_weight}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Harga per Kg</label>
          <input 
            type="number"
            bind:value={editingCalc.price_per_kg}
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