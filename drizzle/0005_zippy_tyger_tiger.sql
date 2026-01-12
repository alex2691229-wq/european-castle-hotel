CREATE TABLE `image_gallery` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` varchar(50) NOT NULL,
	`title` varchar(100),
	`description` text,
	`url` varchar(500) NOT NULL,
	`key` varchar(500) NOT NULL,
	`mimeType` varchar(50),
	`size` int,
	`width` int,
	`height` int,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `image_gallery_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `image_gallery` ADD CONSTRAINT `image_gallery_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;