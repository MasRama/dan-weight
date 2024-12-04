<script>
    import { Link } from '@inertiajs/svelte'
</script>

<nav class="fixed top-0 w-full bg-white/90 backdrop-blur-lg border-b border-gray-100 z-50">
    <div class="container mx-auto px-6">
        <div class="flex h-16">
            <Link href="/" class="text-2xl font-bold relative group flex items-center">
                <span class="relative">
                    <span class="text-blue-500">REDS</span>
                    <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300"></span>
                </span>
            </Link>
        </div>
    </div>
</nav>
