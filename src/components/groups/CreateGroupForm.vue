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
  DialogTrigger,
} from '@/components/ui/dialog';

const open = ref(false);
const isLoading = ref(false);

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
  })
);

const { handleSubmit, errors, defineField, resetForm } = useForm({
  validationSchema: formSchema,
});

const [name, nameProps] = defineField('name');
const [description, descriptionProps] = defineField('description');

const onSubmit = handleSubmit(async (values) => {
  isLoading.value = true;
  try {
    const response = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      throw new Error('Failed to create group');
    }

    const data = await response.json();
    toast.success('Group created successfully!');

    // Reset and close
    resetForm();
    open.value = false;

    // Redirect to the new group Page
    window.location.href = `/groups/${data.id}`;
  } catch (error) {
    console.error(error);
    toast.error('Failed to create group');
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button>Create Group</Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Create Group</DialogTitle>
        <DialogDescription> Create a new group to split expenses with friends. </DialogDescription>
      </DialogHeader>

      <form class="grid gap-4 py-4" @submit="onSubmit">
        <div class="grid gap-2">
          <label for="name" class="text-sm font-medium">Name</label>
          <Input id="name" v-model="name" v-bind="nameProps" placeholder="Paris Trip 2024" />
          <span v-if="errors.name" class="text-sm text-red-500">{{ errors.name }}</span>
        </div>

        <div class="grid gap-2">
          <label for="description" class="text-sm font-medium">Description (Optional)</label>
          <Input
            id="description"
            v-model="description"
            v-bind="descriptionProps"
            placeholder="Expenses for our trip..."
          />
          <span v-if="errors.description" class="text-sm text-red-500">{{
            errors.description
          }}</span>
        </div>

        <DialogFooter>
          <Button type="submit" :disabled="isLoading">
            {{ isLoading ? 'Creating...' : 'Create' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
