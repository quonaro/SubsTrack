import { computed, onScopeDispose, ref, watch } from 'vue'

/**
 * Registry of open modals, ordered by the moment they opened. A modal that is
 * opened while another one is already up (a sheet inside a sheet) ends up later
 * in the stack, which is how the parent learns it has to step aside.
 *
 * Module-level on purpose: nested modals usually live in unrelated components
 * (form → option sheet), so there is no shared provider to hang this on.
 */
const stack = ref<symbol[]>([])

/**
 * Registers a modal in the stack while `open()` is true. Returns `isRoot`
 * (nothing under it) and `isTop` (nothing over it).
 */
export function useModalStack(open: () => boolean) {
  const id = Symbol('modal')

  const register = () => {
    if (!stack.value.includes(id)) stack.value = [...stack.value, id]
  }
  const unregister = () => {
    if (stack.value.includes(id)) stack.value = stack.value.filter((entry) => entry !== id)
  }

  watch(open, (value) => (value ? register() : unregister()), { immediate: true })
  onScopeDispose(unregister)

  const depth = computed(() => stack.value.indexOf(id))

  return {
    depth,
    isRoot: computed(() => depth.value === 0),
    isTop: computed(() => depth.value >= 0 && depth.value === stack.value.length - 1),
  }
}
