ALTER TABLE `room_availability` ADD `maxSalesQuantity` int DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `room_availability` ADD `bookedQuantity` int DEFAULT 0 NOT NULL;