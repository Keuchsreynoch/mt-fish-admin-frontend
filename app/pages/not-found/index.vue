<template>
  <div class="min-h-screen flex items-center justify-center px-6">
    <div class="max-w-lg text-center">
      <img
        src="https://png.pngtree.com/png-vector/20201123/ourmid/pngtree-404-not-found-or-page-error-flat-line-concept-png-image_2468879.jpg"
        alt="Page Not Found"
        class="w-full max-w-md mx-auto"
      />

      <h1 class="mt-6 text-4xl font-bold text-gray-800">
        404
      </h1>

      <p class="mt-2 text-xl font-semibold text-gray-700">
        Page Not Found
      </p>

      <!-- <p class="mt-3 text-gray-500">
        The page you are looking for does not exist or you do not have permission to access it.
      </p> -->

      <div class="mt-8 flex justify-center gap-3">
        <NuxtLink
          to="/"
          class="px-5 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition"
        >
          Go Home
        </NuxtLink>

        <button
          class="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
          @click="$router.back()"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
</template>
