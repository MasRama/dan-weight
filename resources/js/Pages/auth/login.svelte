<script>
   import GlobalLayout from '../../Layouts/GlobalLayout.svelte'
    import { Link } from '@inertiajs/svelte'
    import { Toast } from '../../Components/helper'
    import { router } from '@inertiajs/svelte'
    import axios from 'axios'


    let formData = {
        email: '',
        password: '',
    }

    const handleSubmit = async () => {
        try {
            const response = await axios.post('/login', formData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            
            if (response.data.message === "Login successful") {
                Toast('Login successful', 'success')
                router.visit('/dashboard')
            } else {
                Toast(response.data.message, 'error')
            }
        } catch (error) {
            Toast(error.response?.data?.error || 'Login failed', 'error')
        } 
    }


</script>

<GlobalLayout>
    <div class="flex justify-center items-center">
        <div class="w-full max-w-md bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-8">
            <h1 class="text-3xl font-bold text-center text-gray-800 mb-8">Selamat Datang</h1>
            
            <form on:submit|preventDefault={handleSubmit} class="space-y-6">
                <div class="space-y-2">
                    <label for="email" class="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input 
                        type="email" 
                        id="email"
                        bind:value={formData.email}
                        class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                        placeholder="Masukkan email kamu"
                        required
                    >
                </div>

                <div class="space-y-2">
                    <label for="password" class="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <input 
                        type="password" 
                        id="password"
                        bind:value={formData.password}
                        class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                        placeholder="Masukkan password kamu"
                        required
                    >
                </div>

                <button 
                    type="submit" 
                    class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition duration-200"
                >
                    Masuk
                </button>
            </form>

            <p class="mt-6 text-center text-sm text-gray-600">
                Belum punya akun? 
                <Link href="/register" class="font-medium text-blue-500 hover:text-blue-600 hover:underline">
                    Daftar disini
                </Link>
            </p>
        </div>
    </div>
</GlobalLayout>
