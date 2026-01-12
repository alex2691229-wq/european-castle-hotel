CREATE TABLE `room_availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomTypeId` int NOT NULL,
	`date` timestamp NOT NULL,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`reason` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `room_availability_id` PRIMARY KEY(`id`)
);
