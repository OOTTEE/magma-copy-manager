CREATE TABLE `copies` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`from` text NOT NULL,
	`to` text NOT NULL,
	`a4_copies` integer DEFAULT 0 NOT NULL,
	`a3_copies` integer DEFAULT 0 NOT NULL,
	`sra3_copies` integer DEFAULT 0 NOT NULL,
	`color_copies` integer DEFAULT 0 NOT NULL,
	`bw_copies` integer DEFAULT 0 NOT NULL,
	`total_copies` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`print_user` text NOT NULL,
	`nexudus_user` text NOT NULL
);
