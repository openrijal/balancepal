<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
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
import { UserPlus, Copy, Check, Loader2, User, Search, Plus } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

interface Friend {
  id: string;
  name: string;
  email: string;
}

const props = defineProps<{
  groupId: string;
  isOpen?: boolean;
  hideTrigger?: boolean;
  existingMemberIds?: string[];
}>();

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
  (e: 'member-added'): void;
}>();

const open = useVModel(props, 'isOpen', emit);
const loading = ref(false);
const emailInput = ref('');
const inviteLinks = ref<{email: string, link: string}[]>([]);
const error = ref<string | null>(null);

const friends = ref<Friend[]>([]);
const searchFriendQuery = ref('');
const friendsLoading = ref(false);

async function fetchFriends() {
  friendsLoading.value = true;
  try {
    const res = await fetch('/api/sidebar/data', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      friends.value = data.friends;
    }
  } catch (e) {
    console.error('Failed to fetch friends', e);
  } finally {
    friendsLoading.value = false;
  }
}

async function handleAddExistingFriend(friendId: string) {
  loading.value = true;
  error.value = null;

  try {
    const res = await fetch(`/api/groups/${props.groupId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: friendId }),
    });

    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add member');
    }

    toast.success('Member added successfully!');
    emit('member-added');
    open.value = false;
    reset();

  } catch (e: any) {
    console.error(e);
    error.value = e.message;
    toast.error(e.message);
  } finally {
    loading.value = false;
  }
}

async function handleGenerate() {
  const emails = emailInput.value
    .split(/[,;\s]+/)
    .map(e => e.trim())
    .filter(e => e.length > 0 && e.includes('@'));

  if (emails.length === 0) return;

  loading.value = true;
  error.value = null;
  inviteLinks.value = [];

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const results: {email: string, link: string}[] = [];
  let errorCount = 0;

  for (const email of emails) {
    try {
      const res = await fetch(`/api/groups/${props.groupId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
          errorCount++;
          continue;
      }

      const data = await res.json();
      results.push({
        email,
        link: `${baseUrl}/invites/${data.token}`
      });
    } catch (e) {
      console.error(`Failed to invite ${email}`, e);
      errorCount++;
    }
  }

  inviteLinks.value = results;
  
  if (results.length > 0) {
    toast.success(`${results.length} invitation link(s) generated!`);
  }
  
  if (errorCount > 0) {
    toast.error(`Failed to generate ${errorCount} invitation(s).`);
  }
  
  loading.value = false;
}

function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
}

function reset() {
    emailInput.value = '';
    inviteLinks.value = [];
    error.value = null;
    searchFriendQuery.value = '';
}

onMounted(() => {
  fetchFriends();
});

const filteredFriends = computed(() => {
  let list = friends.value;
  
  // Filter out existing members
  if (props.existingMemberIds && props.existingMemberIds.length > 0) {
    list = list.filter(f => !props.existingMemberIds!.includes(f.id));
  }

  if (!searchFriendQuery.value) return list;
  const q = searchFriendQuery.value.toLowerCase();
  return list.filter(f => 
    f.name.toLowerCase().includes(q) || 
    f.email.toLowerCase().includes(q)
  );
});

</script>

<template>
  <Dialog v-model:open="open" @update:open="val => !val && reset()">
    <DialogTrigger v-if="!hideTrigger" as-child>
      <Button variant="outline" size="sm" class="w-full gap-2">
        <UserPlus class="h-4 w-4" />
        Invite Member
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px] overflow-hidden flex flex-col max-h-[90vh]">
      <DialogHeader>
        <DialogTitle>Add Member</DialogTitle>
        <DialogDescription>
          Add an existing friend or invite someone new to this group.
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 py-4">
        <div v-if="error" class="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-100">{{ error }}</div>

        <!-- Section 1: Add Existing Friends -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500">Your Friends</h3>
          </div>
          
          <div class="relative">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              v-model="searchFriendQuery" 
              placeholder="Search friends..." 
              class="pl-9 h-9 text-sm"
            />
          </div>

          <div v-if="friendsLoading" class="py-4 text-center">
            <Loader2 class="h-5 w-5 animate-spin mx-auto text-gray-400" />
          </div>
          
          <div v-else-if="filteredFriends.length === 0" class="py-4 text-center">
            <p class="text-xs text-gray-400 italic">No friends found</p>
          </div>

          <div v-else class="space-y-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            <button
              v-for="friend in filteredFriends"
              :key="friend.id"
              @click="handleAddExistingFriend(friend.id)"
              :disabled="loading"
              class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-50 group"
            >
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700 border border-primary-100 uppercase">
                {{ friend.name.charAt(0) }}
              </div>
              <div class="flex-1 overflow-hidden">
                <p class="truncate text-xs font-semibold text-gray-900">{{ friend.name }}</p>
                <p class="truncate text-[10px] text-gray-500">{{ friend.email }}</p>
              </div>
              <Plus class="h-3.5 w-3.5 text-gray-300 group-hover:text-primary-500 transition-colors" />
            </button>
          </div>
        </div>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t border-gray-100" />
          </div>
          <div class="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
            <span class="bg-white px-3 text-gray-400">or invite via link</span>
          </div>
        </div>

        <!-- Section 2: Invite via Email -->
        <div v-if="inviteLinks.length === 0" class="space-y-4">
             <div class="space-y-2">
                <label for="email" class="text-sm font-medium">Invitation Emails</label>
                <Input 
                  id="email" 
                  v-on:keyup.enter="handleGenerate" 
                  v-model="emailInput" 
                  placeholder="friend1@example.com, friend2@example.com" 
                  class="h-10" 
                />
                <p class="text-[10px] text-gray-400">Separate multiple emails with commas or spaces.</p>
             </div>
             <Button class="w-full h-10 font-bold" @click="handleGenerate" :disabled="loading || !emailInput.trim()">
                <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                Generate Invite Link(s)
             </Button>
        </div>

        <div v-else class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div class="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-inner">
                <div class="p-3 border-b border-gray-200 bg-white">
                  <p class="text-[11px] font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2">
                    <Check class="w-3.5 h-3.5 text-emerald-500" />
                    Generated Invite Links
                  </p>
                </div>
                <div class="max-h-60 overflow-y-auto custom-scrollbar p-3 space-y-3">
                  <div v-for="invite in inviteLinks" :key="invite.email" class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm space-y-2">
                    <div class="flex items-center justify-between gap-2">
                      <p class="text-[10px] font-bold text-gray-600 truncate">{{ invite.email }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <div class="relative flex-1">
                        <Input 
                          :value="invite.link" 
                          readonly 
                          class="text-[11px] h-8 bg-gray-50 font-mono pr-8 text-primary-900 border-gray-200" 
                        />
                      </div>
                      <Button size="icon" variant="outline" @click="copyLink(invite.link)" class="h-8 w-8 shrink-0 hover:bg-primary-50 hover:text-primary-600 border-gray-200">
                        <Copy class="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
            </div>
            <Button variant="ghost" size="sm" class="w-full text-xs font-semibold text-primary-600 hover:text-primary-700" @click="reset">
              Invite More People
            </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #f1f5f9;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #e2e8f0;
}
</style>

