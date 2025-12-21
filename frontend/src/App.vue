<template>
  <div id="app">
    <nav v-if="!isTelegram">
      <router-link to="/">Home</router-link>
    </nav>
    <main>
      <div v-if="isAuthenticating" class="loading">
        <p>Authenticating...</p>
      </div>
      <router-view v-else />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuth } from './composables/useAuth'

const { isAuthenticated, isAuthenticating, isTelegram, initAuth } = useAuth()

onMounted(async () => {
  await initAuth()
})
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

nav {
  padding: 30px;
  text-align: center;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
  margin: 0 10px;
}

nav a.router-link-exact-active {
  color: #42b983;
}

main {
  padding: 20px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
}

.loading p {
  font-size: 18px;
  color: #42b983;
}
</style>

