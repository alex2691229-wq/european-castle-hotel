CREATE TABLE `home_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`carouselImages` text,
	`vipGarageImage` varchar(500),
	`deluxeRoomImage` varchar(500),
	`facilitiesImage` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `home_config_id` PRIMARY KEY(`id`)
);
