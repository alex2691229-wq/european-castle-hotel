CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomTypeId` int NOT NULL,
	`userId` int,
	`guestName` varchar(100) NOT NULL,
	`guestEmail` varchar(320),
	`guestPhone` varchar(20) NOT NULL,
	`checkInDate` timestamp NOT NULL,
	`checkOutDate` timestamp NOT NULL,
	`numberOfGuests` int NOT NULL DEFAULT 2,
	`totalPrice` decimal(10,2) NOT NULL,
	`specialRequests` text,
	`status` enum('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`subject` varchar(200),
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `facilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameEn` varchar(100),
	`description` text NOT NULL,
	`descriptionEn` text,
	`icon` varchar(50),
	`images` text,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `facilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `news` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`titleEn` varchar(200),
	`content` text NOT NULL,
	`contentEn` text,
	`type` enum('announcement','promotion','event') NOT NULL DEFAULT 'announcement',
	`coverImage` varchar(500),
	`isPublished` boolean NOT NULL DEFAULT true,
	`publishDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `news_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `room_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameEn` varchar(100),
	`description` text NOT NULL,
	`descriptionEn` text,
	`size` varchar(50),
	`capacity` int NOT NULL DEFAULT 2,
	`price` decimal(10,2) NOT NULL,
	`weekendPrice` decimal(10,2),
	`images` text,
	`amenities` text,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `room_types_id` PRIMARY KEY(`id`)
);
