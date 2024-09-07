<template>
    <LoginForm :isOpen="true" @close="handleClose" />
  </template>
  
  <script>
  import LoginForm from './LoginForm.vue'
  import { useRouter } from 'vue-router'
  
  export default {
    components: { LoginForm },
    setup() {
      const router = useRouter()
  
      const handleClose = () => {
        router.push('/')
      }
  
      return { handleClose }
    }
  }
  </script>