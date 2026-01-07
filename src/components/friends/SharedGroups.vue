<script setup lang="ts">
import { Users } from 'lucide-vue-next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SharedGroup {
  id: string;
  name: string;
  description?: string | null;
}

interface Props {
  groups: SharedGroup[];
}

defineProps<Props>();
</script>

<template>
  <Card>
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium text-gray-500 flex items-center gap-2">
        <Users class="h-4 w-4" />
        Shared Groups
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="groups.length === 0" class="text-center py-4">
        <p class="text-sm text-gray-400">No shared groups</p>
      </div>

      <div v-else class="space-y-2">
        <a
          v-for="group in groups"
          :key="group.id"
          :href="`/groups/${group.id}`"
          class="block p-3 rounded-lg bg-gray-50 hover:bg-primary-50 transition-colors group"
        >
          <p class="text-sm font-medium text-gray-900 group-hover:text-primary-700">
            {{ group.name }}
          </p>
          <p v-if="group.description" class="text-xs text-gray-500 mt-0.5 truncate">
            {{ group.description }}
          </p>
        </a>
      </div>
    </CardContent>
  </Card>
</template>
