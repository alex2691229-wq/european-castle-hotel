// ========================================
// Inventory Protection System
// Prevents overselling through atomic operations
// ========================================

export interface InventoryLock {
  id: string;
  roomTypeId: string;
  bookingId?: string;
  lockType: 'SOFT' | 'HARD';
  expiresAt: Date;
  createdAt: Date;
  reason: string;
}

// Constants
const SOFT_LOCK_DURATION = 10 * 60 * 1000; // 10 minutes
const HARD_LOCK_MULTIPLIER = 1; // 1 unit per booking

import * as db from '../db.js';
import { logAuditAction } from './audit-logs.js';
import crypto from 'crypto';

/**
 * Check available inventory with real-time count
 * Uses database lock to ensure consistency
 */
export async function checkAvailableInventory(
  roomTypeId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<number> {
  const query = `
    SELECT COALESCE(SUM(available_count), 0) as available
    FROM room_inventory
    WHERE room_type_id = $1
      AND date >= $2
      AND date < $3
      AND available_count > 0
    FOR UPDATE; -- Database-level lock
  `;

  const result = await db.query(query, [roomTypeId, dateFrom, dateTo]);
  return result.rows[0]?.available || 0;
}

/**
 * Create soft lock - Reserve inventory for 10 minutes
 * Used when customer starts filling booking form
 */
export async function createSoftLock(
  roomTypeId: string,
  dateFrom: Date,
  dateTo: Date,
  quantity: number = 1
): Promise<InventoryLock> {
  const lockId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SOFT_LOCK_DURATION);

  try {
    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Check availability
      const availResult = await client.query(
        `SELECT COALESCE(SUM(available_count), 0) as available
         FROM room_inventory
         WHERE room_type_id = $1
           AND date >= $2
           AND date < $3
           AND available_count > 0
         FOR UPDATE`,
        [roomTypeId, dateFrom, dateTo]
      );

      if (availResult.rows[0]?.available < quantity) {
        await client.query('ROLLBACK');
        throw new Error(`Insufficient inventory. Available: ${availResult.rows[0]?.available}`);
      }

      // Create soft lock record
      await client.query(
        `INSERT INTO inventory_locks (id, room_type_id, lock_type, expires_at, reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [lockId, roomTypeId, 'SOFT', expiresAt, `Soft lock for booking`]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[Inventory] Soft lock failed:', error);
    throw error;
  }

  return { id: lockId, roomTypeId, lockType: 'SOFT', expiresAt, createdAt: new Date(), reason: 'Soft lock' };
}

/**
 * Create hard lock - Deduct inventory permanently
 * Used when booking is confirmed and payment is received
 */
export async function createHardLock(
  roomTypeId: string,
  dateFrom: Date,
  dateTo: Date,
  bookingId: string,
  quantity: number = 1,
  adminId?: string
): Promise<InventoryLock> {
  const lockId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

  try {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Check & deduct inventory
      const updateResult = await client.query(
        `UPDATE room_inventory
         SET available_count = available_count - $1
         WHERE room_type_id = $2
           AND date >= $3
           AND date < $4
           AND available_count >= $1
         RETURNING available_count`,
        [quantity, roomTypeId, dateFrom, dateTo]
      );

      if (updateResult.rowCount === 0) {
        await client.query('ROLLBACK');
        throw new Error('Failed to deduct inventory - may be oversold');
      }

      // Create hard lock
      await client.query(
        `INSERT INTO inventory_locks (id, room_type_id, booking_id, lock_type, expires_at, reason)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [lockId, roomTypeId, bookingId, 'HARD', expiresAt, `Booking ${bookingId} confirmed`]
      );

      // Log audit
      if (adminId) {
        await logAuditAction(
          adminId,
          'system',
          'MANUAL_LOCK',
          'ROOM',
          roomTypeId,
          `Hard lock created for booking ${bookingId}`,
          null,
          { bookingId, quantity, dateRange: `${dateFrom} - ${dateTo}` }
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[Inventory] Hard lock failed:', error);
    throw error;
  }

  return { id: lockId, roomTypeId, bookingId, lockType: 'HARD', expiresAt, createdAt: new Date(), reason: 'Hard lock' };
}

/**
 * Release soft locks that have expired
 * Should be called by cron job every 10 minutes
 */
export async function releasExpiredSoftLocks(): Promise<number> {
  try {
    const result = await db.query(
      `DELETE FROM inventory_locks
       WHERE lock_type = 'SOFT' AND expires_at < NOW()`,
      []
    );
    console.log(`[Inventory] Released ${result.rowCount} expired soft locks`);
    return result.rowCount || 0;
  } catch (error) {
    console.error('[Inventory] Failed to release expired locks:', error);
    return 0;
  }
}

/**
 * Check if date range has adequate inventory
 */
export async function hasInventory(
  roomTypeId: string,
  dateFrom: Date,
  dateTo: Date,
  requiredQuantity: number = 1
): Promise<boolean> {
  try {
    const result = await db.query(
      `SELECT COALESCE(SUM(available_count), 0) as available
       FROM room_inventory
       WHERE room_type_id = $1
         AND date >= $2
         AND date < $3`,
      [roomTypeId, dateFrom, dateTo]
    );
    return (result.rows[0]?.available || 0) >= requiredQuantity;
  } catch (error) {
    console.error('[Inventory] Availability check failed:', error);
    return false;
  }
}
