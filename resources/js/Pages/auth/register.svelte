<script>
    import GlobalLayout from '../../Layouts/GlobalLayout.svelte'
    import { Link, useForm, router } from '@inertiajs/svelte'
    import axios from 'axios'
    import { Toast } from '../../Components/helper'

    const formData = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: ''
    })

    let loading = false

    const handleSubmit = async () => {
        loading = true
        try {
            const registrationData = {
                name: $formData.name,
                email: $formData.email,
                password: $formData.password
            }
            
            const response = await axios.post('/register', registrationData)
            
            if (response.data.message === "Registration successful", 'success') {
                Toast('Registration successful', 'success')
                router.visit('/login')
            } else {
                Toast(response.data.message, 'error')
            }
        } catch (error) {
            console.log(error)
            Toast(error.response?.data?.error || 'Registration failed', 'error')
        } finally {
            loading = false
        }
    }


</script>

<GlobalLayout>
    <div class="flex justify-center items-center">
        <div class="w-full max-w-md bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-8">
            <h1 class="text-3xl font-bold text-center text-gray-800 mb-8">Buat Akun</h1>
            
            
            <form on:submit|preventDefault={handleSubmit} class="space-y-6">
                <div class="space-y-2">
                    <label for="name" class="block text-sm font-medium text-gray-700">
                        Nama Lengkap
                    </label>
                    <input 
                        type="text" 
                        id="name"
                        bind:value={$formData.name}
                        class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                        placeholder="Enter your full name"
                        required
                    >
                </div>

                <div class="space-y-2">
                    <label for="email" class="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input 
                        type="email" 
                        id="email"
                        bind:value={$formData.email}
                        class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                        placeholder="Enter your email"
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
                        bind:value={$formData.password}
                        class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                        placeholder="Create a password"
                        required
                    >
                </div>

                <div class="space-y-2">
                    <label for="password_confirmation" class="block text-sm font-medium text-gray-700">
                        Konfirmasi Password
                    </label>
                    <input 
                        type="password" 
                        id="password_confirmation"
                        bind:value={$formData.password_confirmation}
                        class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                        placeholder="Confirm your password"
                        required
                    >
                </div>

                <button 
                    type="submit" 
                    class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Processing...' : 'Daftar'}
                </button>
            </form>

            <p class="mt-6 text-center text-sm text-gray-600">
                Sudah Punya Akun? 
                <Link href="/login" class="font-medium text-blue-500 hover:text-blue-600 hover:underline">
                    Masuk Disini
                </Link>
            </p>
        </div>
    </div>
</GlobalLayout>
