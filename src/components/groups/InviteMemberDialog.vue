<script setup lang="ts">
import { ref } from 'vue';
import { useVModel } from '@vueuse/core';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Copy, Check, Loader2 } from 'lucide-vue-next';

const props = defineProps<{
  groupId: string;
  isOpen?: boolean;
  hideTrigger?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
}>();

const open = useVModel(props, 'isOpen', emit);
const loading = ref(false);
const email = ref('');
const inviteLink = ref('');
const error = ref<string | null>(null);
const copied = ref(false);

async function handleGenerate() {
  if (!email.value) return;

  loading.value = true;
  error.value = null;
  inviteLink.value = '';

  try {
    const res = await fetch(`/api/groups/${props.groupId}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    });

    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create invitation');
    }

    const data = await res.json();
    inviteLink.value = data.link;

  } catch (e: any) {
    console.error(e);
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function copyLink() {
    navigator.clipboard.writeText(inviteLink.value);
    copied.value = true;
    setTimeout(() => copied.value = false, 2000);
}

function reset() {
    email.value = '';
    inviteLink.value = '';
    error.value = null;
    copied.value = false;
}
</script>

<template>
  <Dialog v-model:open="open" @update:open="val => !val && reset()">
    <DialogTrigger v-if="!hideTrigger" as-child>
      <Button variant="outline" size="sm" class="w-full gap-2">
        <UserPlus class="h-4 w-4" />
        Invite Member
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Invite Member</DialogTitle>
        <DialogDescription>
          Generate a unique link to invite someone to this group.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div v-if="error" class="text-sm text-red-500">{{ error }}</div>

        <div v-if="!inviteLink" class="space-y-4">
             <div class="space-y-2">
                <label for="email" class="text-sm font-medium">Friend's Email (for reference)</label>
                <Input id="email" v-model="email" placeholder="friend@example.com" />
             </div>
             <Button class="w-full" @click="handleGenerate" :disabled="loading || !email">
                <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                Generate Link
             </Button>
        </div>

        <div v-else class="space-y-4">
            <div class="space-y-2">
                <label class="text-sm font-medium">Invitation Link</label>
                <div class="flex items-center gap-2">
                    <Input v-model="inviteLink" readonly />
                    <Button size="icon" variant="outline" @click="copyLink">
                        <Check v-if="copied" class="h-4 w-4 text-green-500" />
                        <Copy v-else class="h-4 w-4" />
                    </Button>
                </div>
                <p class="text-xs text-muted-foreground">
                    Share this link with your friend. It expires when used.
                </p>
            </div>
            <Button variant="secondary" class="w-full" @click="reset">Invite Another</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
