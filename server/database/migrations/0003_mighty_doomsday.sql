CREATE TABLE `meeting_program_parts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`meeting_program_id` integer NOT NULL,
	`name` text NOT NULL,
	`order` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`meeting_program_id`) REFERENCES `meeting_programs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `meeting_programs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scheduled_meetings` (
	`id` text PRIMARY KEY NOT NULL,
	`date` integer NOT NULL,
	`meeting_program_id` integer NOT NULL,
	`part_id` integer NOT NULL,
	`speaker_id` text NOT NULL,
	`talk_id` integer,
	`custom_talk_title` text,
	`is_circuit_overseer_visit` integer DEFAULT false NOT NULL,
	`override_validation` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`meeting_program_id`) REFERENCES `meeting_programs`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`part_id`) REFERENCES `meeting_program_parts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`speaker_id`) REFERENCES `speakers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`talk_id`) REFERENCES `public_talks`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_schedule` ON `scheduled_meetings` (`date`,`meeting_program_id`,`part_id`);