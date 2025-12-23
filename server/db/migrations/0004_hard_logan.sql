CREATE TABLE `meeting_exceptions` (
	`id` text PRIMARY KEY NOT NULL,
	`date` integer NOT NULL,
	`exception_type` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `meeting_exceptions_date_unique` ON `meeting_exceptions` (`date`);