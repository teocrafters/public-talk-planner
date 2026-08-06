CREATE TYPE "public"."exception_type" AS ENUM('circuit_assembly', 'regional_convention', 'memorial');--> statement-breakpoint
CREATE TYPE "public"."meeting_type" AS ENUM('weekend', 'midweek');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."speaker_source_type" AS ENUM('visiting_speaker', 'local_publisher');--> statement-breakpoint
CREATE TYPE "public"."talk_status" AS ENUM('circuit_overseer', 'will_be_replaced');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_email" text NOT NULL,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"details" jsonb,
	"ip_address" text,
	"timestamp" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_exceptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"exception_type" "exception_type" NOT NULL,
	"description" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_program_parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_program_id" uuid NOT NULL,
	"type" text NOT NULL,
	"name" text,
	"order" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "meeting_type" NOT NULL,
	"date" date NOT NULL,
	"is_circuit_overseer_visit" boolean DEFAULT false NOT NULL,
	"name" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_scheduled_parts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"meeting_program_part_id" uuid NOT NULL,
	"publisher_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_talks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"no" text NOT NULL,
	"title" text NOT NULL,
	"multimedia_count" integer DEFAULT 0 NOT NULL,
	"video_count" integer DEFAULT 0 NOT NULL,
	"status" "talk_status",
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publishers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"sex" "sex" NOT NULL,
	"user_id" uuid,
	"is_elder" boolean DEFAULT false NOT NULL,
	"is_ministerial_servant" boolean DEFAULT false NOT NULL,
	"is_regular_pioneer" boolean DEFAULT false NOT NULL,
	"can_chair_weekend_meeting" boolean DEFAULT false NOT NULL,
	"conducts_watchtower_study" boolean DEFAULT false NOT NULL,
	"backup_watchtower_conductor" boolean DEFAULT false NOT NULL,
	"is_reader" boolean DEFAULT false NOT NULL,
	"offers_public_prayer" boolean DEFAULT false NOT NULL,
	"delivers_public_talks" boolean DEFAULT false NOT NULL,
	"is_circuit_overseer" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "publishers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "scheduled_public_talks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"meeting_program_id" uuid NOT NULL,
	"part_id" uuid NOT NULL,
	"speaker_source_type" "speaker_source_type" DEFAULT 'visiting_speaker' NOT NULL,
	"speaker_id" uuid,
	"publisher_id" uuid,
	"talk_id" uuid,
	"custom_talk_title" text,
	"override_validation" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "speaker_or_publisher_check" CHECK ((speaker_id IS NOT NULL AND publisher_id IS NULL) OR (speaker_id IS NULL AND publisher_id IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "speaker_talks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"speaker_id" uuid NOT NULL,
	"talk_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speakers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text NOT NULL,
	"congregation_id" uuid NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" uuid NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"impersonated_by" text,
	"active_organization_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meeting_program_parts" ADD CONSTRAINT "meeting_program_parts_meeting_program_id_meeting_programs_id_fk" FOREIGN KEY ("meeting_program_id") REFERENCES "public"."meeting_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_scheduled_parts" ADD CONSTRAINT "meeting_scheduled_parts_meeting_program_part_id_meeting_program_parts_id_fk" FOREIGN KEY ("meeting_program_part_id") REFERENCES "public"."meeting_program_parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_scheduled_parts" ADD CONSTRAINT "meeting_scheduled_parts_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publishers" ADD CONSTRAINT "publishers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_public_talks" ADD CONSTRAINT "scheduled_public_talks_meeting_program_id_meeting_programs_id_fk" FOREIGN KEY ("meeting_program_id") REFERENCES "public"."meeting_programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_public_talks" ADD CONSTRAINT "scheduled_public_talks_part_id_meeting_program_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."meeting_program_parts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_public_talks" ADD CONSTRAINT "scheduled_public_talks_speaker_id_speakers_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."speakers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_public_talks" ADD CONSTRAINT "scheduled_public_talks_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_public_talks" ADD CONSTRAINT "scheduled_public_talks_talk_id_public_talks_id_fk" FOREIGN KEY ("talk_id") REFERENCES "public"."public_talks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speaker_talks" ADD CONSTRAINT "speaker_talks_speaker_id_speakers_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."speakers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speaker_talks" ADD CONSTRAINT "speaker_talks_talk_id_public_talks_id_fk" FOREIGN KEY ("talk_id") REFERENCES "public"."public_talks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speakers" ADD CONSTRAINT "speakers_congregation_id_organization_id_fk" FOREIGN KEY ("congregation_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_exceptions_date_unique" ON "meeting_exceptions" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_scheduled_parts_part_unique" ON "meeting_scheduled_parts" USING btree ("meeting_program_part_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_public_talk_schedule" ON "scheduled_public_talks" USING btree ("date","meeting_program_id","part_id");--> statement-breakpoint
CREATE UNIQUE INDEX "speaker_talks_speaker_talk_unique" ON "speaker_talks" USING btree ("speaker_id","talk_id");