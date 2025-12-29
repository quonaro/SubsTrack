<template>
  <div class="emoji-picker-overlay animate-fade-in" @click.self="$emit('close')">
    <div class="emoji-picker-container bg-app-bg text-app-text shadow-premium rounded-t-[2.5rem] sm:rounded-[2.5rem] border-t sm:border border-app-border">
      <div class="emoji-picker-header border-b border-app-border">
        <h2 class="text-xl font-bold">Выберите эмодзи</h2>
        <button class="close-btn text-app-text-muted hover:text-app-text hover:bg-surface-100 transition-all rounded-xl p-2" @click="$emit('close')">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="search-section space-y-4 pt-6 px-6">
        <div class="search-bar group relative">
          <span class="search-icon absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted transition-colors group-focus-within:text-primary-500">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск эмодзи..."
            class="search-input w-full bg-surface-50 border border-app-border rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all"
            @click.stop
          />
        </div>

      </div>

      <div class="emoji-categories px-6 py-4 flex gap-2 overflow-x-auto scrollbar-hide">
        <button
          v-for="category in categories"
          :key="category.key"
          type="button"
          class="category-btn flex-shrink-0 px-4 py-2 h-10 flex items-center justify-center rounded-xl transition-all text-sm font-medium whitespace-nowrap"
          :class="selectedCategory === category.key ? 'bg-primary-500 text-white shadow-accent' : 'bg-surface-50 border border-app-border text-app-text-muted hover:bg-surface-100'"
          @click.stop="selectedCategory = category.key"
        >
          {{ category.label }}
        </button>
      </div>

      <div class="emoji-section px-4 pb-12">
        <div class="emoji-grid-container h-[50vh] overflow-y-auto scrollbar-hide px-2">
          <div class="emoji-grid grid grid-cols-6 sm:grid-cols-8 gap-2">
            <button
              v-for="emoji in filteredEmojis"
              :key="emoji.hexcode"
              type="button"
              class="emoji-item aspect-square flex items-center justify-center text-3xl rounded-xl hover:bg-surface-100 active:scale-75 transition-all duration-200"
              @click.stop="selectEmoji(emoji.emoji)"
            >
              {{ emoji.emoji }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const emit = defineEmits(['close', 'select'])

const selectedCategory = ref('smileys-emotion')
const searchQuery = ref('')
const allEmojis = ref([])



const categories = [
  { key: 'smileys-emotion', icon: '😀', label: 'Смайлы и эмоции', group: 0, groupName: 'smileys-emotion' },
  { key: 'people-body', icon: '👋', label: 'Люди и тело', group: 1, groupName: 'people-body' },
  { key: 'animals-nature', icon: '🐶', label: 'Животные и природа', group: 3, groupName: 'animals-nature' },
  { key: 'food-drink', icon: '🍕', label: 'Еда и напитки', group: 4, groupName: 'food-drink' },
  { key: 'travel-places', icon: '✈️', label: 'Путешествия и места', group: 5, groupName: 'travel-places' },
  { key: 'activities', icon: '⚽', label: 'Активности', group: 6, groupName: 'activities' },
  { key: 'objects', icon: '💡', label: 'Объекты', group: 7, groupName: 'objects' },
  { key: 'symbols', icon: '❤️', label: 'Символы', group: 8, groupName: 'symbols' },
  { key: 'flags', icon: '🏳️', label: 'Флаги', group: 9, groupName: 'flags' }
]

async function loadEmojis() {
  try {
    const { fetchFromCDN } = await import('emojibase')
    const emojis = await fetchFromCDN('en/data.json')
    allEmojis.value = emojis.filter(emoji => !emoji.skinTone && emoji.emoji && emoji.group !== undefined)
  } catch (error) {
    allEmojis.value = []
  }
}

onMounted(() => {
  loadEmojis()
})

const filteredEmojis = computed(() => {
  let emojis = allEmojis.value

  if (selectedCategory.value && selectedCategory.value !== 'all') {
    const category = categories.find(c => c.key === selectedCategory.value)
    if (category) {
      emojis = emojis.filter(emoji => {
        if (typeof emoji.group === 'number') {
          return emoji.group === category.group
        } else if (typeof emoji.group === 'string') {
          return emoji.group === category.groupName || emoji.group === category.key
        }
        return false
      })
    }
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    emojis = emojis.filter(emoji => {
      const label = (emoji.label || '').toLowerCase()
      const tags = (emoji.tags || []).join(' ').toLowerCase()
      const emojiChar = emoji.emoji || ''
      return label.includes(query) || tags.includes(query) || emojiChar.includes(query)
    })
  }

  return emojis
})

function selectEmoji(emoji) {
  emit('select', emoji)
  emit('close')
}
</script>

<style scoped>
.emoji-picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-blur: 8px;
  z-index: 1001;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

@media (min-width: 640px) {
  .emoji-picker-overlay {
    align-items: center;
    padding: 24px;
  }
}

.emoji-picker-container {
  width: 100%;
  max-width: 32rem;
  overflow: hidden;
  max-height: 90vh;
}

.emoji-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 1rem;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
