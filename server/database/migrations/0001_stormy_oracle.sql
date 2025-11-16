PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_scheduled_public_talks` (
	`id` text PRIMARY KEY NOT NULL,
	`date` integer NOT NULL,
	`meeting_program_id` integer NOT NULL,
	`part_id` integer NOT NULL,
	`speaker_source_type` text DEFAULT 'visiting_speaker' NOT NULL,
	`speaker_id` text,
	`publisher_id` text,
	`talk_id` integer,
	`custom_talk_title` text,
	`override_validation` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`meeting_program_id`) REFERENCES `meeting_programs`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`part_id`) REFERENCES `meeting_program_parts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`speaker_id`) REFERENCES `speakers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`publisher_id`) REFERENCES `publishers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`talk_id`) REFERENCES `public_talks`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "speaker_or_publisher_check" CHECK((speaker_id IS NOT NULL AND publisher_id IS NULL) OR (speaker_id IS NULL AND publisher_id IS NOT NULL))
);
--> statement-breakpoint
INSERT INTO `__new_scheduled_public_talks`("id", "date", "meeting_program_id", "part_id", "speaker_source_type", "speaker_id", "publisher_id", "talk_id", "custom_talk_title", "override_validation", "created_at", "updated_at") SELECT "id", "date", "meeting_program_id", "part_id", 'visiting_speaker', "speaker_id", NULL, "talk_id", "custom_talk_title", "override_validation", "created_at", "updated_at" FROM `scheduled_public_talks`;--> statement-breakpoint
DROP TABLE `scheduled_public_talks`;--> statement-breakpoint
ALTER TABLE `__new_scheduled_public_talks` RENAME TO `scheduled_public_talks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `unique_public_talk_schedule` ON `scheduled_public_talks` (`date`,`meeting_program_id`,`part_id`);