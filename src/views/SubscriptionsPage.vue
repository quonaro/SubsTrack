<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { deleteSubscription, store, visibleSubscriptions } from '../store'
import type { SortMode, Subscription } from '../types'
import SubCard from '../components/SubCard.vue'
import EmptyState from '../components/EmptyState.vue'
import OptionModal from '../components/OptionModal.vue'
import ToggleSwitch from '../components/ToggleSwitch.vue'
import Modal from '../components/Modal.vue'
import SubscriptionForm from '../components/SubscriptionForm.vue'
import SubscriptionEditModal from '../components/SubscriptionEditModal.vue'
import Icon from '../components/Icon.vue'
import { pluralRu } from '../domain/plural'

const sortOptions: { value: SortMode; label: string }[] = [
  { value: 'next_date', label: 'По дате платежа' },
  { value: 'name', label: 'По имени' },
  { value: 'price', label: 'По цене' },
]

const sortOpen = ref(false)
const formOpen = ref(false)
const editId = ref<number | null>(null)
const pendingDelete = ref<Subscription | null>(null)

// --- card context menu (long-press / right-click) ------------------------------
const LONG_PRESS_MS = 450
const MOVE_CANCEL_PX = 10
const MENU_W = 176
const MENU_H = 84

interface CardMenu {
  sub: Subscription
  x: number
  y: number
}
const cardMenu = ref<CardMenu | null>(null)

let pressTimer: ReturnType<typeof setTimeout> | null = null
let pressSub: Subscription | null = null
let pressX = 0
let pressY = 0
// Clicks within this window after the menu opened are the trailing click of
// the long-press/right-click gesture — swallow them so they don't also fire
// the card's tap action (edit / pay confirm).
const CLICK_SUPPRESS_MS = 500
let menuOpenedAt = 0
// Set when the menu is dismissed by a press outside it, so the same press's
// trailing click doesn't also open the edit sheet.
let clickGuardUntil = 0

function clearPressTimer(): void {
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
  pressSub = null
}

function openMenuAt(sub: Subscription, x: number, y: number): void {
  cardMenu.value = {
    sub,
    x: Math.max(8, Math.min(x, window.innerWidth - MENU_W - 8)),
    y: Math.max(8, Math.min(y, window.innerHeight - MENU_H - 8)),
  }
  menuOpenedAt = Date.now()
}

function onCardTouchStart(sub: Subscription, e: TouchEvent): void {
  const point = e.touches[0]
  if (!point) return
  clearPressTimer()
  pressSub = sub
  pressX = point.clientX
  pressY = point.clientY
  pressTimer = setTimeout(() => {
    pressTimer = null
    const target = pressSub
    pressSub = null
    if (!target) return
    navigator.vibrate?.(20)
    openMenuAt(target, pressX, pressY)
  }, LONG_PRESS_MS)
}

function onCardTouchMove(e: TouchEvent): void {
  if (pressTimer == null || !e.touches[0]) return
  const dx = e.touches[0].clientX - pressX
  const dy = e.touches[0].clientY - pressY
  if (Math.abs(dx) > MOVE_CANCEL_PX || Math.abs(dy) > MOVE_CANCEL_PX) clearPressTimer()
}

function onCardTouchEnd(): void {
  clearPressTimer()
}

function onCardContextMenu(sub: Subscription, e: MouseEvent): void {
  e.preventDefault()
  openMenuAt(sub, e.clientX, e.clientY)
}

function clickJustSuppressed(): boolean {
  return Date.now() - Math.max(menuOpenedAt, clickGuardUntil) < CLICK_SUPPRESS_MS
}

// The menu has no blocking backdrop: cards underneath stay interactive so a
// long-press on another row can replace the open menu. Taps outside it close it.
let outsidePressAt = 0

function onDocumentPointerDown(e: PointerEvent): void {
  if (!cardMenu.value) return
  const target = e.target as Element | null
  if (target?.closest?.('[data-card-menu]')) {
    outsidePressAt = 0
    return
  }
  outsidePressAt = Date.now()
}

function onDocumentPointerUp(): void {
  if (!outsidePressAt) return
  const pressed = outsidePressAt
  outsidePressAt = 0
  if (!cardMenu.value) return
  // A long-press during this gesture already opened a fresh menu — keep it.
  if (menuOpenedAt >= pressed) return
  cardMenu.value = null
  clickGuardUntil = Date.now()
}

onMounted(() => {
  window.addEventListener('pointerdown', onDocumentPointerDown)
  window.addEventListener('pointerup', onDocumentPointerUp)
  window.addEventListener('pointercancel', onDocumentPointerUp)
})

onUnmounted(() => {
  clearPressTimer()
  window.removeEventListener('pointerdown', onDocumentPointerDown)
  window.removeEventListener('pointerup', onDocumentPointerUp)
  window.removeEventListener('pointercancel', onDocumentPointerUp)
})

// Capture phase: also shields inner controls (the pay pill) from the
// trailing click, which would otherwise open the paid-confirm sheet.
function onCardClickCapture(e: MouseEvent): void {
  if (clickJustSuppressed()) e.stopPropagation()
}

function onCardTap(sub: Subscription): void {
  if (clickJustSuppressed()) return
  editId.value = sub.id
}

function editFromMenu(): void {
  const sub = cardMenu.value?.sub
  cardMenu.value = null
  if (sub) editId.value = sub.id
}

function deleteFromMenu(): void {
  pendingDelete.value = cardMenu.value?.sub ?? null
  cardMenu.value = null
}

async function confirmDeleteSub(): Promise<void> {
  const sub = pendingDelete.value
  pendingDelete.value = null
  if (sub) await deleteSubscription(sub.id)
}

const subsWord = computed(() =>
  pluralRu(visibleSubscriptions.value.length, 'платёж', 'платежа', 'платежей'),
)
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-6 sm:px-6 md:max-w-none lg:px-8"
    :class="visibleSubscriptions.length ? 'pb-24' : 'pb-6'"
  >
    <header class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-bold">
          <Icon name="list" :size="22" class="text-accent-hi" />Платежи
        </h1>
        <p class="text-sm text-app-text-muted">{{ visibleSubscriptions.length }} {{ subsWord }}</p>
      </div>
      <button
        type="button"
        class="flex h-9 items-center gap-1.5 rounded-full border border-app-border bg-app-card px-3 text-sm text-app-text-muted"
        @click="sortOpen = true"
      >
        <Icon name="sort" :size="16" />Сортировка
      </button>
    </header>

    <div class="mb-2 flex items-center justify-between rounded-xl border border-app-border bg-app-card px-4 py-2.5">
      <span class="text-sm text-app-text-muted">Показывать архивные</span>
      <ToggleSwitch :checked="store.showArchived" @update:checked="store.showArchived = $event" />
    </div>

    <OptionModal
      :open="sortOpen"
      title="Сортировка"
      :model-value="store.sortMode"
      :options="sortOptions"
      @update:open="sortOpen = $event"
      @update:model-value="store.sortMode = $event"
    />

    <div v-if="visibleSubscriptions.length" class="@container mt-2">
      <div
        class="flex flex-col gap-2 @2xl:grid @2xl:grid-cols-2 @2xl:items-start @2xl:gap-3 @5xl:grid-cols-3 @[88rem]:grid-cols-4"
      >
        <SubCard
          v-for="s in visibleSubscriptions"
          :key="s.id"
          :sub="s"
          :payable="false"
          @click.capture="onCardClickCapture"
          @click="onCardTap(s)"
          @touchstart.passive="onCardTouchStart(s, $event)"
          @touchmove.passive="onCardTouchMove($event)"
          @touchend="onCardTouchEnd"
          @touchcancel="onCardTouchEnd"
          @contextmenu="onCardContextMenu(s, $event)"
        />
      </div>
    </div>
    <EmptyState v-else class="mt-4" icon="list">
      Платежей пока нет.<br />Нажмите «+», чтобы добавить первый.
    </EmptyState>

    <button
      type="button"
      aria-label="Добавить платёж"
      class="fixed bottom-24 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg shadow-accent/40 md:bottom-8 md:right-8"
      @click="formOpen = true"
    >
      <Icon name="plus" :size="26" />
    </button>

    <Modal :open="formOpen" title="Новый платёж" @update:open="formOpen = $event">
      <SubscriptionForm @saved="formOpen = false" />
    </Modal>

    <SubscriptionEditModal :sub-id="editId" @close="editId = null" />

    <Teleport to="body">
      <Transition name="card-menu" mode="out-in">
        <div
          v-if="cardMenu"
          :key="cardMenu.sub.id"
          data-card-menu
          class="fixed z-40 w-44 origin-top-left overflow-hidden rounded-xl border border-app-border bg-app-card py-1 shadow-xl"
          :style="{ top: `${cardMenu.y}px`, left: `${cardMenu.x}px` }"
        >
          <button
            type="button"
            class="flex h-9 w-full items-center gap-2 px-4 text-sm hover:bg-app-bg"
            @click.stop="editFromMenu"
          >
            <Icon name="pencil" :size="16" class="text-app-text-muted" /> Редактировать
          </button>
          <button
            type="button"
            class="flex h-9 w-full items-center gap-2 px-4 text-sm text-red-400 hover:bg-red-500/10"
            @click.stop="deleteFromMenu"
          >
            <Icon name="trash" :size="16" /> Удалить
          </button>
        </div>
      </Transition>
    </Teleport>

    <Modal
      :open="pendingDelete != null"
      title="Удалить платёж?"
      @update:open="!$event && (pendingDelete = null)"
    >
      <p class="mb-5 text-sm text-app-text-muted">
        «{{ pendingDelete?.name }}» и история его платежей будут удалены безвозвратно.
      </p>
      <div class="flex gap-3">
        <button
          type="button"
          class="flex h-9 flex-1 items-center justify-center rounded-xl border border-app-border"
          @click="pendingDelete = null"
        >
          Отмена
        </button>
        <button
          type="button"
          class="flex h-9 flex-1 items-center justify-center rounded-xl bg-red-600 font-medium"
          @click="confirmDeleteSub"
        >
          Удалить
        </button>
      </div>
    </Modal>
  </div>
</template>
