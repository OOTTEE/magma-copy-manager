CREATE TABLE `copies` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`datetime` text NOT NULL,
	`a4_color` integer DEFAULT 0 NOT NULL,
	`a4_bw` integer DEFAULT 0 NOT NULL,
	`a3_color` integer DEFAULT 0 NOT NULL,
	`a3_bw` integer DEFAULT 0 NOT NULL,
	`a4_color_total` integer DEFAULT 0 NOT NULL,
	`a4_bw_total` integer DEFAULT 0 NOT NULL,
	`a3_color_total` integer DEFAULT 0 NOT NULL,
	`a3_bw_total` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`concept` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`unit_price` integer DEFAULT 0 NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`from` text NOT NULL,
	`to` text NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'customer' NOT NULL,
	`print_user` text NOT NULL,
	`nexudus_user` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);