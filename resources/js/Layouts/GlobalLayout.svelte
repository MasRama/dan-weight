<script>
  import Navbar from '../Components/Navbar.svelte'
  import Footer from '../Components/Footer.svelte'
</script>

<svelte:head>
  <title>UD PUMA TRANS</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
  <Navbar />
  
  <main class="flex-grow container mx-auto px-4 pt-28 pb-16">
      <slot />
  </main>

  <Footer />
</div>
