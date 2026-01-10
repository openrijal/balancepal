<script setup lang="ts">
import { computed, ref } from 'vue';
import { Calendar } from 'lucide-vue-next';

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const dateInputRef = ref<HTMLInputElement | null>(null);

const openDatePicker = () => {
  dateInputRef.value?.showPicker();
};

const formattedDate = computed(() => {
  if (!props.modelValue) return props.placeholder || 'Select date';
  return new Date(props.modelValue).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
});

const handleChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="relative inline-block">
    <button
      type="button"
      class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
      @click="openDatePicker"
    >
      <Calendar class="h-4 w-4 text-gray-400" />
      <span>{{ formattedDate }}</span>
    </button>
    <input
      ref="dateInputRef"
      type="date"
      :value="modelValue"
      class="sr-only"
      @change="handleChange"
    />
  </div>
</template>
