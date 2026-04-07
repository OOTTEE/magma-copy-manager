CREATE TABLE `nexudus_sales` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`month` text NOT NULL,
	`type` text NOT NULL,
	`quantity` integer NOT NULL,
	`nexudus_sale_id` text NOT NULL,
	`nexudus_product_id` text NOT NULL,
	`sale_date` text NOT NULL,
	`created_on` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sync_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`datetime` text NOT NULL,
	`status` text NOT NULL,
	`trigger_type` text DEFAULT 'auto',
	`summary` text,
	`details` text NOT NULL
);
--> statement-breakpoint
DROP TABLE `invoice_items`;--> statement-breakpoint
DROP TABLE `invoices`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'customer' NOT NULL,
	`print_user` text NOT NULL,
	`nexudus_user` text,
	`a3_no_paper_mode` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "username", "password", "role", "print_user", "nexudus_user", "a3_no_paper_mode") SELECT "id", "username", "password", "role", "print_user", "nexudus_user", "a3_no_paper_mode" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
ALTER TABLE `copies` ADD `nexudus_sale_id` text REFERENCES nexudus_sales(id);