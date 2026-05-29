<script setup lang="ts">
// Dashboard now lives at /home
const router = useRouter()
onMounted(() => router.replace('/home'))
</script>