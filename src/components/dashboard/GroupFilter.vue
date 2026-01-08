<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ChevronDown, Check } from 'lucide-vue-next';

interface Group {
  id: string;
  name: string;
}

const props = defineProps<{
  groups: Group[];
  modelValue: string[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const selectedIds = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isAllSelected = computed(() => selectedIds.value.length === 0);

const toggleGroup = (groupId: string) => {
  const current = [...selectedIds.value];
  const index = current.indexOf(groupId);
  if (index === -1) {
    current.push(groupId);
  } else {
    current.splice(index, 1);
  }
  selectedIds.value = current;
};

const selectAll = () => {
  selectedIds.value = [];
};

const displayText = computed(() => {
  if (isAllSelected.value) return 'All Groups';
  if (selectedIds.value.length === 1) {
    const group = props.groups.find(g => g.id === selectedIds.value[0]);
    return group?.name || '1 Group';
  }
  return `${selectedIds.value.length} Groups`;
});

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
    >
      <span class="truncate max-w-[200px]">{{ displayText }}</span>
      <ChevronDown 
        class="w-4 h-4 text-gray-400 transition-transform" 
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-1 max-h-64 overflow-y-auto"
      >
        <!-- All Groups option -->
        <button
          @click="selectAll"
          class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
        >
          <div 
            :class="[
              'w-5 h-5 rounded flex items-center justify-center border-2 transition-colors',
              isAllSelected 
                ? 'bg-sky-500 border-sky-500 text-white' 
                : 'border-gray-300'
            ]"
          >
            <Check v-if="isAllSelected" class="w-3 h-3" />
          </div>
          <span class="text-sm font-medium text-gray-900">All Groups</span>
        </button>

        <div class="h-px bg-gray-100 my-1" />

        <!-- Individual groups -->
        <button
          v-for="group in groups"
          :key="group.id"
          @click="toggleGroup(group.id)"
          class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
        >
          <div 
            :class="[
              'w-5 h-5 rounded flex items-center justify-center border-2 transition-colors',
              selectedIds.includes(group.id) 
                ? 'bg-sky-500 border-sky-500 text-white' 
                : 'border-gray-300'
            ]"
          >
            <Check v-if="selectedIds.includes(group.id)" class="w-3 h-3" />
          </div>
          <span class="text-sm text-gray-700 truncate">{{ group.name }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>
