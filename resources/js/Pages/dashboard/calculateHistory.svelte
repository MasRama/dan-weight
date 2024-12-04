<script>
    import Layout from "../../Layouts/GlobalLayout.svelte";
    import { onMount } from "svelte";
    import axios from "axios";
    import { Toast } from "../../Components/helper";
    
    let calculations = [];
    let filteredCalculations = [];
    let loading = true;
    let showModal = false;
    let selectedCalc = null;
    let showEditModal = false;
    let editingCalc = null;
    
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
      const response = await axios.post(`/api/calculations/edit`, {
        id: editingCalc.id,
        ticketNumber: editingCalc.ticket_number,
        vehicleNumber: editingCalc.vehicle_number,
        driverName: editingCalc.driver_name,
        ownerName: editingCalc.owner_name,
        entryWeight: editingCalc.entry_weight,
        exitWeight: editingCalc.exit_weight,
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
    
    onMount(async () => {
  try {
    const response = await axios.get("/api/calculations");
    calculations = response.data.data;
    filteredCalculations = calculations;
    
    // Initialize Tippy tooltips
    tippy('[data-tippy-content]', {
      placement: 'top',
      arrow: true,
      theme: 'light'
    });
    
  } catch (error) {
    console.error("Failed to fetch calculations:", error);
  } finally {
    loading = false;
  }
});


  </script>
  
  <Layout>
    <div class="p-6">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-800">Riwayat Kalkulasi</h1>
        <p class="text-gray-600">Catatan seluruh transaksi penimbangan</p>
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
                        <!-- Ganti bagian status verifikasi dengan yang ini -->
{#if calc.exit_weight}
<span class="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-500 rounded-full relative group">
  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
  </svg>
  <span class="invisible group-hover:visible absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-cyan-500 text-white text-xs rounded-lg shadow-lg whitespace-nowrap after:content-[''] after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:-translate-y-1 after:border-4 after:border-transparent after:border-t-cyan-500">
    Telah terverifikasi
  </span>
</span>
{:else}
<span class="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-500 rounded-full relative group">
  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
  </svg>
  <span class="invisible group-hover:visible absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg shadow-lg whitespace-nowrap after:content-[''] after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:-translate-y-1 after:border-4 after:border-transparent after:border-t-red-500">
    Belum terverifikasi
  </span>
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
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
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
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
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
  </Layout>
  