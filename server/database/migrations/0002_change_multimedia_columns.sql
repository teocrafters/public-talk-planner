ALTER TABLE `public_talks` DROP COLUMN `has_multimedia`;--> statement-breakpoint
ALTER TABLE `public_talks` DROP COLUMN `has_video`;--> statement-breakpoint
ALTER TABLE `public_talks` ADD `multimedia_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `public_talks` ADD `video_count` integer DEFAULT 0 NOT NULL;
