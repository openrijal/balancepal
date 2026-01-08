<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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
import { Settings, Loader2, X, Trash2, AlertTriangle } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useGroupsStore } from '@/stores/groupsStore';
import InviteMemberDialog from './InviteMemberDialog.vue';

interface Member {
  id: string;
  userId: string;
  role: 'admin' | 'member';
  user: {
    id: string;
    name: string;
    email: string;
    profilePictureUrl?: string | null;
  };
}

const props = defineProps<{
  groupId: string;
  groupName: string;
  description?: string | null;
  members: Member[];
  currentUserId: string;
  isOpen?: boolean;
  hideTrigger?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
  (e: 'group-updated', data: { name: string; description: string | null }): void;
  (e: 'member-removed', userId: string): void;
  (e: 'group-deleted'): void;
}>();

const open = useVModel(props, 'isOpen', emit);
const groupsStore = useGroupsStore();

// Form state
const editName = ref(props.groupName);
const editDescription = ref(props.description || '');
const saving = ref(false);
const deleting = ref(false);
const removingMember = ref<string | null>(null);
const error = ref<string | null>(null);
const showDeleteConfirm = ref(false);
const showInviteDialog = ref(false);

// Sync form with props when dialog opens
watch(open, (isOpen) => {
  if (isOpen) {
    editName.value = props.groupName;
    editDescription.value = props.description || '';
    error.value = null;
    showDeleteConfirm.value = false;
  }
});

const isAdmin = computed(() => {
  return props.members.some(m => m.userId === props.currentUserId && m.role === 'admin');
});

const existingMemberIds = computed(() => props.members.map(m => m.userId));

const canSave = computed(() => {
  return editName.value.trim().length > 0 && (
    editName.value !== props.groupName || 
    editDescription.value !== (props.description || '')
  );
});

async function handleSave() {
  if (!canSave.value) return;
  
  saving.value = true;
  error.value = null;
  
  const result = await groupsStore.updateGroupDetails(props.groupId, {
    name: editName.value.trim(),
    description: editDescription.value.trim() || undefined,
  });
  
  saving.value = false;
  
  if (result.success) {
    toast.success('Group settings updated');
    emit('group-updated', { 
      name: editName.value.trim(), 
      description: editDescription.value.trim() || null 
    });
    open.value = false;
  } else {
    error.value = result.error || 'Failed to update group';
    toast.error(result.error || 'Failed to update group');
  }
}

async function handleRemoveMember(userId: string, memberName: string) {
  if (userId === props.currentUserId) {
    // Leaving the group - confirm first
    if (!confirm(`Are you sure you want to leave this group?`)) return;
  }
  
  removingMember.value = userId;
  error.value = null;
  
  const result = await groupsStore.removeMemberFromGroup(props.groupId, userId);
  
  removingMember.value = null;
  
  if (result.success) {
    toast.success(`${memberName} removed from group`);
    emit('member-removed', userId);
    
    // If user left the group, redirect
    if (userId === props.currentUserId) {
      window.location.href = '/groups';
    }
  } else {
    error.value = result.error || 'Failed to remove member';
    toast.error(result.error || 'Failed to remove member');
  }
}

async function handleDeleteGroup() {
  if (!showDeleteConfirm.value) {
    showDeleteConfirm.value = true;
    return;
  }
  
  deleting.value = true;
  error.value = null;
  
  const result = await groupsStore.deleteGroupById(props.groupId);
  
  deleting.value = false;
  
  if (result.success) {
    toast.success('Group deleted');
    emit('group-deleted');
    window.location.href = '/groups';
  } else {
    error.value = result.error || 'Failed to delete group';
    toast.error(result.error || 'Failed to delete group');
    showDeleteConfirm.value = false;
  }
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function handleMemberAdded() {
  // Refresh the page to show new member
  window.location.reload();
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger v-if="!hideTrigger" as-child>
      <Button variant="ghost" size="icon" class="h-9 w-9">
        <Settings class="h-5 w-5" />
        <span class="sr-only">Group Settings</span>
      </Button>
    </DialogTrigger>
    
    <DialogContent class="sm:max-w-[500px] overflow-hidden flex flex-col max-h-[90vh]">
      <DialogHeader>
        <DialogTitle class="text-sm font-bold uppercase tracking-wider text-gray-500">
          Edit Group Settings
        </DialogTitle>
        <DialogDescription>
          Update group details, manage members, or delete the group.
        </DialogDescription>
      </DialogHeader>
      
      <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 py-4">
        <!-- Error Message -->
        <div v-if="error" class="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2">
          <AlertTriangle class="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{{ error }}</span>
        </div>
        
        <!-- Group Name -->
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-wider text-gray-500">
            My group is called...
          </label>
          <Input 
            v-model="editName" 
            placeholder="Group name"
            class="text-lg font-medium"
          />
        </div>
        
        <!-- Description -->
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-wider text-gray-500">
            Description (optional)
          </label>
          <Input 
            v-model="editDescription" 
            placeholder="What is this group for?"
          />
        </div>
        
        <!-- Members Section -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500">
              Group Members
            </h3>
            <Button 
              variant="link" 
              size="sm" 
              class="text-primary h-auto p-0"
              @click="showInviteDialog = true"
            >
              + Add a person
            </Button>
          </div>
          
          <div class="space-y-1">
            <div 
              v-for="member in members" 
              :key="member.id"
              class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div class="flex items-center gap-3">
                <div 
                  v-if="member.user.profilePictureUrl"
                  class="w-8 h-8 rounded-full bg-cover bg-center"
                  :style="{ backgroundImage: `url(${member.user.profilePictureUrl})` }"
                />
                <div 
                  v-else 
                  class="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-xs font-medium text-primary"
                >
                  {{ getInitials(member.user.name) }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-sm">{{ member.user.name }}</span>
                    <span 
                      v-if="member.role === 'admin'" 
                      class="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded"
                    >
                      Admin
                    </span>
                    <span 
                      v-if="member.userId === currentUserId" 
                      class="text-[10px] text-gray-400"
                    >
                      (you)
                    </span>
                  </div>
                  <span class="text-xs text-gray-400 italic">{{ member.user.email }}</span>
                </div>
              </div>
              
              <button
                v-if="member.userId !== currentUserId || members.length > 1"
                @click="handleRemoveMember(member.userId, member.user.name)"
                :disabled="removingMember === member.userId"
                class="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                :title="member.userId === currentUserId ? 'Leave group' : 'Remove member'"
              >
                <Loader2 v-if="removingMember === member.userId" class="h-4 w-4 animate-spin" />
                <X v-else class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        <!-- Invite Member Dialog (reused) -->
        <InviteMemberDialog 
          :groupId="groupId" 
          v-model:isOpen="showInviteDialog" 
          :existingMemberIds="existingMemberIds"
          hide-trigger
          @member-added="handleMemberAdded"
        />
        
        <!-- Danger Zone -->
        <div v-if="isAdmin" class="pt-4 border-t">
          <div class="space-y-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-red-500">
              Danger Zone
            </h3>
            
            <div v-if="!showDeleteConfirm">
              <button 
                @click="showDeleteConfirm = true"
                class="text-sm text-red-500 hover:text-red-700 underline underline-offset-2"
              >
                delete group
              </button>
            </div>
            
            <div v-else class="bg-red-50 p-4 rounded-lg border border-red-200 space-y-3">
              <p class="text-sm text-red-700">
                <strong>Are you sure?</strong> This will permanently delete the group and all its expenses. This action cannot be undone.
              </p>
              <p class="text-xs text-red-600">
                Note: All balances must be settled before deleting.
              </p>
              <div class="flex gap-2">
                <Button 
                  variant="destructive" 
                  size="sm"
                  @click="handleDeleteGroup"
                  :disabled="deleting"
                >
                  <Loader2 v-if="deleting" class="mr-2 h-4 w-4 animate-spin" />
                  <Trash2 v-else class="mr-2 h-4 w-4" />
                  Yes, Delete Group
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  @click="showDeleteConfirm = false"
                  :disabled="deleting"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <DialogFooter class="border-t pt-4">
        <Button variant="outline" @click="open = false" :disabled="saving">
          Cancel
        </Button>
        <Button 
          @click="handleSave" 
          :disabled="!canSave || saving"
          class="bg-orange-500 hover:bg-orange-600"
        >
          <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
          Save changes
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #d1d5db;
}
</style>
