ALTER TABLE "expenses" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "deleted_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_deleted_by_user_id_profiles_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;