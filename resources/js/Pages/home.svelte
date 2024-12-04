<script>
  import GlobalLayout from '../Layouts/GlobalLayout.svelte'
  import { Link } from '@inertiajs/svelte'
</script>

<GlobalLayout>
  <div class="flex justify-center items-center min-h-[80vh]">
      <div class="w-full max-w-2xl bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-12 text-center">
          <h1 class="text-4xl font-bold text-gray-800 mb-4">Selamat Datang di Timbangan Digital</h1>
          <p class="text-lg text-gray-600 mb-8">Solusi modern untuk penimbangan yang akurat dan efisien</p>
          
          <Link 
              href="/login" 
              class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-8 rounded-lg transition duration-200"
          >
              Mulai Menimbang
          </Link>
      </div>
  </div>
</GlobalLayout>
