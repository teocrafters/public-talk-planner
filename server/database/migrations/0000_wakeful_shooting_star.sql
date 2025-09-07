CREATE TABLE `public_talks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`no` integer NOT NULL,
	`title` text NOT NULL,
	`has_multimedia` integer NOT NULL,
	`has_video` integer NOT NULL,
	`created_at` integer NOT NULL
);
