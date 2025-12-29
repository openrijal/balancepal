CREATE TYPE "public"."expense_category" AS ENUM('food', 'transport', 'entertainment', 'utilities', 'shopping', 'other');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('group_invite', 'expense_added', 'settlement_recorded', 'balance_reminder', 'member_joined');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'venmo', 'paypal', 'zelle', 'bank_transfer', 'other');--> statement-breakpoint
CREATE TABLE "expense_splits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"paid" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"description" varchar(500) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"paid_by_user_id" uuid NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"category" "expense_category" DEFAULT 'other' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"image_url" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"invited_by" uuid NOT NULL,
	"token" varchar(64) NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"profile_picture_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"from_user_id" uuid NOT NULL,
	"to_user_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"reference" varchar(255),
	"proof_image_url" text,
	"verified" boolean DEFAULT false NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paid_by_user_id_profiles_id_fk" FOREIGN KEY ("paid_by_user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_profiles_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_from_user_id_profiles_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_to_user_id_profiles_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expense_splits_expense_id_idx" ON "expense_splits" USING btree ("expense_id");--> statement-breakpoint
CREATE INDEX "expense_splits_user_id_idx" ON "expense_splits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "expenses_group_id_date_idx" ON "expenses" USING btree ("group_id","date");--> statement-breakpoint
CREATE INDEX "expenses_paid_by_user_id_idx" ON "expenses" USING btree ("paid_by_user_id");--> statement-breakpoint
CREATE INDEX "group_members_group_id_idx" ON "group_members" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "group_members_user_id_idx" ON "group_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitations_group_id_idx" ON "invitations" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "invitations_email_idx" ON "invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitations_token_idx" ON "invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "notifications_user_id_read_idx" ON "notifications" USING btree ("user_id","read");--> statement-breakpoint
CREATE INDEX "receipts_expense_id_idx" ON "receipts" USING btree ("expense_id");--> statement-breakpoint
CREATE INDEX "settlements_group_id_idx" ON "settlements" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "settlements_from_user_id_idx" ON "settlements" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX "settlements_to_user_id_idx" ON "settlements" USING btree ("to_user_id");