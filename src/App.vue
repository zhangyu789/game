<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <aside
      :class="[
        'flex flex-col bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transition-all duration-300 z-30',
        sidebarOpen ? 'w-64' : 'w-0 lg:w-16',
        sidebarOpen ? 'fixed lg:relative inset-y-0 left-0' : 'relative'
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center h-14 px-4 border-b border-gray-200 dark:border-slate-700 shrink-0">
        <div class="flex items-center gap-2 overflow-hidden">
          <span class="text-2xl shrink-0">🛠️</span>
          <transition name="fade">
            <span v-if="sidebarOpen" class="font-bold text-lg whitespace-nowrap text-primary-500">DevPocket</span>
          </transition>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto py-2 px-2">
        <template v-for="(group, groupKey) in toolGroups" :key="groupKey">
          <div v-if="sidebarOpen" class="px-3 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {{ group.icon }} {{ group.label }}
          </div>
          <div v-else class="my-2 border-b border-gray-100 dark:border-slate-700"></div>
          <router-link
            v-for="tool in getGroupTools(groupKey)"
            :key="tool.name"
            :to="{ name: tool.name }"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors mb-0.5"
            active-class="!bg-primary-50 dark:!bg-primary-900/30 !text-primary-600 dark:!text-primary-400 font-medium"
            :title="tool.meta.title"
            @click="mobileClose"
          >
            <span class="text-lg shrink-0">{{ tool.meta.icon }}</span>
            <span v-if="sidebarOpen" class="text-sm whitespace-nowrap">{{ tool.meta.title }}</span>
          </router-link>
        </template>
      </nav>

      <!-- Footer -->
      <div class="border-t border-gray-200 dark:border-slate-700 p-3 shrink-0">
        <button
          @click="toggleDark"
          class="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          :title="isDark ? '切换亮色模式' : '切换暗黑模式'"
        >
          <span class="text-lg">{{ isDark ? '☀️' : '🌙' }}</span>
          <span v-if="sidebarOpen" class="text-sm">{{ isDark ? '亮色模式' : '暗黑模式' }}</span>
        </button>
      </div>
    </aside>

    <!-- Overlay for mobile -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/30 z-20 lg:hidden"
      @click="sidebarOpen = false"
    ></div>

    <!-- Main -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Top bar -->
      <header class="flex items-center h-14 px-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 gap-3">
        <button @click="sidebarOpen = !sidebarOpen" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 lg:hidden">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <button @click="sidebarOpen = !sidebarOpen" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hidden lg:block">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <h1 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {{ currentTitle }}
        </h1>
        <div class="flex-1"></div>
        <!-- Search shortcut -->
        <button
          @click="showSearch = true"
          class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <span class="hidden sm:inline">搜索工具</span>
          <kbd class="hidden sm:inline text-xs bg-gray-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">Ctrl+K</kbd>
        </button>
        <!-- Mobile dark toggle -->
        <button @click="toggleDark" class="lg:hidden text-lg">
          {{ isDark ? '☀️' : '🌙' }}
        </button>
      </header>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- Search Modal -->
    <Teleport to="body">
      <div v-if="showSearch" class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" @click.self="showSearch = false">
        <div class="fixed inset-0 bg-black/40" @click="showSearch = false"></div>
        <div class="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
          <div class="flex items-center px-4 border-b border-gray-200 dark:border-slate-700">
            <svg class="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              placeholder="搜索工具..."
              class="flex-1 px-3 py-3 bg-transparent text-gray-900 dark:text-gray-100 outline-none"
              @keydown.esc="showSearch = false"
              @keydown.enter="goToFirstResult"
            />
          </div>
          <div class="max-h-80 overflow-y-auto p-2">
            <router-link
              v-for="tool in filteredTools"
              :key="tool.name"
              :to="{ name: tool.name }"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              @click="showSearch = false; searchQuery = ''"
            >
              <span class="text-lg">{{ tool.meta.icon }}</span>
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ tool.meta.title }}</span>
            </router-link>
            <div v-if="filteredTools.length === 0" class="px-3 py-4 text-center text-gray-400 text-sm">
              未找到匹配的工具
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
        <transition-group name="toast">
          <div
            v-for="toast in toasts"
            :key="toast.id"
            :class="[
              'px-4 py-2 rounded-lg shadow-lg text-sm font-medium',
              toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
              'bg-primary-500 text-white'
            ]"
          >
            {{ toast.message }}
          </div>
        </transition-group>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDarkMode } from './composables/useDarkMode'
import { useToast } from './composables/useToast'
import { routes, toolGroups } from './router'

const route = useRoute()
const router = useRouter()
const { isDark, toggle: toggleDark } = useDarkMode()
const { toasts } = useToast()

const sidebarOpen = ref(window.innerWidth >= 1024)
const showSearch = ref(false)
const searchQuery = ref('')
const searchInput = ref(null)

const currentTitle = computed(() => {
  return route.meta?.title || 'DevPocket'
})

function getGroupTools(groupKey) {
  return routes.filter(r => r.meta?.group === groupKey)
}

const filteredTools = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return routes.filter(r => r.meta)
  return routes.filter(r => r.meta && r.meta.title.toLowerCase().includes(q))
})

function goToFirstResult() {
  if (filteredTools.value.length > 0) {
    router.push({ name: filteredTools.value[0].name })
    showSearch.value = false
    searchQuery.value = ''
  }
}

function mobileClose() {
  if (window.innerWidth < 1024) sidebarOpen.value = false
}

function handleKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    showSearch.value = true
    nextTick(() => searchInput.value?.focus())
  }
  if (e.key === 'Escape' && showSearch.value) {
    showSearch.value = false
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.page-enter-active, .page-leave-active { transition: opacity 0.15s, transform 0.15s; }
.page-enter-from { opacity: 0; transform: translateY(8px); }
.page-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
