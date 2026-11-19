<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SubscriptionForm from '../components/SubscriptionForm.vue'
import Icon from '../components/Icon.vue'

const route = useRoute()
const router = useRouter()
const editId = computed(() => Number(route.params.id))
</script>

<template>
  <div class="mx-auto w-full max-w-xl px-4 pb-10 pt-6 sm:px-6 lg:max-w-2xl lg:px-8">
    <header class="mb-6 flex items-center gap-3">
      <button
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-full border border-app-border bg-app-card"
        @click="router.back()"
      >
        <Icon name="chevron-left" :size="16" />
      </button>
      <h1 class="text-xl font-bold">Редактировать</h1>
    </header>

    <SubscriptionForm
      :sub-id="editId"
      @saved="router.back()"
      @deleted="router.replace('/subscriptions')"
    />
  </div>
</template>
