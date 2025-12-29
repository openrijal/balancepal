<script setup lang="ts">
import { ref } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { toast } from 'vue-sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const props = defineProps<{
  groupId: string;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
  (e: 'success'): void;
}>();

const isLoading = ref(false);

const formSchema = toTypedSchema(
  z.object({
    email: z.string().email('Please enter a valid email'),
  })
);

const { handleSubmit, errors, defineField, resetForm } = useForm({
  validationSchema: formSchema,
});

const [email, emailProps] = defineField('email');

const onSubmit = handleSubmit(async (values) => {
  isLoading.value = true;
  try {
    const response = await fetch(`/api/groups/${props.groupId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to send invite');
    }

    toast.success('Invitation sent!');
    resetForm();
    emit('update:isOpen', false);
    emit('success');
    
  } catch (error: any) {
    console.error(error);
    toast.error(error.message || 'Failed to send invitation');
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <Dialog :open="isOpen" @update:open="(val) => emit('update:isOpen', val)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Invite Member</DialogTitle>
        <DialogDescription>
          Send an email invitation to join this group.
        </DialogDescription>
      </DialogHeader>
      
      <form @submit="onSubmit" class="grid gap-4 py-4">
        <div class="grid gap-2">
          <label for="email" class="text-sm font-medium">Email Address</label>
          <Input id="email" type="email" v-model="email" v-bind="emailProps" placeholder="friend@example.com" />
          <span v-if="errors.email" class="text-sm text-red-500">{{ errors.email }}</span>
        </div>

        <DialogFooter>
          <Button type="submit" :disabled="isLoading">
            {{ isLoading ? 'Sending...' : 'Send Invite' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
