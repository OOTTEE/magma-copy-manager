ALTER TABLE `sync_logs` ADD COLUMN `process_type` text DEFAULT 'sync';
--> statement-breakpoint
UPDATE `sync_logs` SET `process_type` = 'billing' WHERE `summary` LIKE '%Facturación%' OR `summary` LIKE '%Cobro%' OR `summary` LIKE '%Procesados%';
