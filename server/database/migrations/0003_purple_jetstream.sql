CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`user_email` text NOT NULL,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text NOT NULL,
	`details` text,
	`ip_address` text,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_public_talks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`no` text NOT NULL,
	`title` text NOT NULL,
	`multimedia_count` integer DEFAULT 0 NOT NULL,
	`video_count` integer DEFAULT 0 NOT NULL,
	`status` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_public_talks`("id", "no", "title", "multimedia_count", "video_count", "status", "created_at") SELECT "id", "no", "title", "multimedia_count", "video_count", "status", "created_at" FROM `public_talks`;--> statement-breakpoint
DROP TABLE `public_talks`;--> statement-breakpoint
ALTER TABLE `__new_public_talks` RENAME TO `public_talks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;