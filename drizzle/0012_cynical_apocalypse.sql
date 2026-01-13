ALTER TABLE `users` MODIFY COLUMN `username` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64) DEFAULT 'oauth';