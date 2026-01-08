<script setup lang="ts">
import { computed } from 'vue';
import { Calendar } from 'lucide-vue-next';

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const formattedDate = computed(() => {
  if (!props.modelValue) return props.placeholder || 'Select date';
  return new Date(props.modelValue).toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
});

const handleChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="relative inline-block">
    <label class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
      <Calendar class="h-4 w-4 text-gray-400" />
      <span>{{ formattedDate }}</span>
      <input 
        type="date"
        :value="modelValue"
        @change="handleChange"
        class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
      />
    </label>
  </div>
</template>
