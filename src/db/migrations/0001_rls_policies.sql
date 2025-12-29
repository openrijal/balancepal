-- Balance Pal - Row Level Security (RLS) Policies
-- This migration enables RLS and creates policies for all tables

-- ============================================
-- Enable RLS on all tables
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES policies
-- Users can view any profile (for displaying names/avatars)
-- Users can only update their own profile
-- ============================================

CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- GROUPS policies
-- Users can view groups they are members of
-- Users can create groups (they become admin)
-- Only admins can update/delete groups
-- ============================================

CREATE POLICY "Users can view groups they belong to"
ON groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create groups"
ON groups FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update groups"
ON groups FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  )
);

CREATE POLICY "Group admins can delete groups"
ON groups FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  )
);

-- ============================================
-- GROUP_MEMBERS policies
-- Users can view members of groups they belong to
-- Admins can manage members
-- ============================================

CREATE POLICY "Users can view members of their groups"
ON group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members AS gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Group admins can add members"
ON group_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_members.group_id
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  )
  OR
  -- Allow users to add themselves (for accepting invitations)
  user_id = auth.uid()
);

CREATE POLICY "Group admins can update member roles"
ON group_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM group_members AS gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.role = 'admin'
  )
);

CREATE POLICY "Group admins can remove members"
ON group_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM group_members AS gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.role = 'admin'
  )
  OR
  -- Users can remove themselves from a group
  user_id = auth.uid()
);

-- ============================================
-- EXPENSES policies
-- Users can view/create/update expenses in groups they belong to
-- Only expense creator can delete
-- ============================================

CREATE POLICY "Users can view expenses in their groups"
ON expenses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = expenses.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Group members can create expenses"
ON expenses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = expenses.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Expense creators can update their expenses"
ON expenses FOR UPDATE
USING (
  paid_by_user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = expenses.group_id
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  )
);

CREATE POLICY "Expense creators can delete their expenses"
ON expenses FOR DELETE
USING (
  paid_by_user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = expenses.group_id
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  )
);

-- ============================================
-- EXPENSE_SPLITS policies
-- Users can view splits in groups they belong to
-- Managed alongside expenses
-- ============================================

CREATE POLICY "Users can view expense splits in their groups"
ON expense_splits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM expenses
    JOIN group_members ON group_members.group_id = expenses.group_id
    WHERE expenses.id = expense_splits.expense_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Expense creators can manage splits"
ON expense_splits FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM expenses
    WHERE expenses.id = expense_splits.expense_id
    AND expenses.paid_by_user_id = auth.uid()
  )
);

CREATE POLICY "Expense creators can update splits"
ON expense_splits FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM expenses
    WHERE expenses.id = expense_splits.expense_id
    AND expenses.paid_by_user_id = auth.uid()
  )
);

CREATE POLICY "Expense creators can delete splits"
ON expense_splits FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM expenses
    WHERE expenses.id = expense_splits.expense_id
    AND expenses.paid_by_user_id = auth.uid()
  )
);

-- ============================================
-- RECEIPTS policies
-- Users can view receipts in groups they belong to
-- Expense creators can manage receipts
-- ============================================

CREATE POLICY "Users can view receipts in their groups"
ON receipts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM expenses
    JOIN group_members ON group_members.group_id = expenses.group_id
    WHERE expenses.id = receipts.expense_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Expense creators can add receipts"
ON receipts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM expenses
    WHERE expenses.id = receipts.expense_id
    AND expenses.paid_by_user_id = auth.uid()
  )
);

CREATE POLICY "Expense creators can delete receipts"
ON receipts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM expenses
    WHERE expenses.id = receipts.expense_id
    AND expenses.paid_by_user_id = auth.uid()
  )
);

-- ============================================
-- SETTLEMENTS policies
-- Users can view settlements in groups they belong to
-- Participants can create/update settlements
-- ============================================

CREATE POLICY "Users can view settlements in their groups"
ON settlements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = settlements.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Group members can record settlements"
ON settlements FOR INSERT
WITH CHECK (
  -- User must be the one paying
  from_user_id = auth.uid()
  AND
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = settlements.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Settlement participants can update"
ON settlements FOR UPDATE
USING (
  from_user_id = auth.uid() OR to_user_id = auth.uid()
);

CREATE POLICY "Settlement creator can delete"
ON settlements FOR DELETE
USING (from_user_id = auth.uid());

-- ============================================
-- NOTIFICATIONS policies
-- Users can only access their own notifications
-- ============================================

CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- INVITATIONS policies
-- Users can view invitations they sent or received
-- Only group admins can create invitations
-- ============================================

CREATE POLICY "Users can view invitations for their email or sent by them"
ON invitations FOR SELECT
USING (
  email = (SELECT email FROM profiles WHERE id = auth.uid())
  OR invited_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = invitations.group_id
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  )
);

CREATE POLICY "Group admins can create invitations"
ON invitations FOR INSERT
WITH CHECK (
  invited_by = auth.uid()
  AND
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = invitations.group_id
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  )
);

CREATE POLICY "Invitation senders can update"
ON invitations FOR UPDATE
USING (invited_by = auth.uid());

CREATE POLICY "Invitation senders can delete"
ON invitations FOR DELETE
USING (invited_by = auth.uid());
