<template>
  <div class="flex flex-col items-center justify-center py-20 gap-6">
    <div class="relative">
      <!-- Glow effect -->
      <div class="absolute inset-0 bg-primary-500/30 blur-2xl rounded-full animate-pulse-slow"></div>
      
      <!-- Bouncing Logo -->
      <img 
        src="/logo.png" 
        alt="Loading..." 
        class="h-20 w-20 object-contain relative z-10 animate-bounce-slight" 
      />
    </div>
    
    <!-- Optional Loading Text -->
    <p v-if="text" class="text-sm font-bold uppercase tracking-widest text-app-text-muted animate-pulse">
      {{ text }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
@keyframes bounce-slight {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.05); }
}

.animate-bounce-slight {
  animation: bounce-slight 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
</style>
