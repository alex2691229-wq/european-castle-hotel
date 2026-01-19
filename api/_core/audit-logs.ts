// ========================================
// Audit Logs System
// Records all admin operations for compliance
// ========================================

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'MANUAL_LOCK';
  entityType: 'BOOKING' | 'ROOM' | 'USER' | 'CONFIG';
  entityId: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface AuditLogFilters {
  adminId?: string;
  actionType?: string;
  entityType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

// SQL Schema for audit_logs table:
/*
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
*/

import * as db from '../db.js';
import crypto from 'crypto';

export async function logAuditAction(
  adminId: string,
  adminEmail: string,
  actionType: AuditLog['actionType'],
  entityType: AuditLog['entityType'],
  entityId: string,
  description: string,
  oldValue?: Record<string, any>,
  newValue?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<AuditLog> {
  const auditLog: AuditLog = {
    id: crypto.randomUUID(),
    adminId,
    adminEmail,
    actionType,
    entityType,
    entityId,
    oldValue,
    newValue,
    description,
    ipAddress: ipAddress || 'UNKNOWN',
    userAgent: userAgent || 'UNKNOWN',
    timestamp: new Date(),
  };

  try {
    // Insert into database
    await db.query(
      `INSERT INTO audit_logs 
      (id, admin_id, admin_email, action_type, entity_type, entity_id, old_value, new_value, description, ip_address, user_agent, timestamp) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        auditLog.id,
        adminId,
        adminEmail,
        actionType,
        entityType,
        entityId,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        description,
        ipAddress || 'UNKNOWN',
        userAgent || 'UNKNOWN',
        auditLog.timestamp,
      ]
    );

    console.log(`[AUDIT] ${actionType} ${entityType} ${entityId} by ${adminEmail}`);
  } catch (error) {
    console.error('[AUDIT] Failed to log action:', error);
  }

  return auditLog;
}

export async function getAuditLogs(filters: AuditLogFilters): Promise<AuditLog[]> {
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: any[] = [];
  let paramCount = 1;

  if (filters.adminId) {
    query += ` AND admin_id = $${paramCount++}`;
    params.push(filters.adminId);
  }

  if (filters.actionType) {
    query += ` AND action_type = $${paramCount++}`;
    params.push(filters.actionType);
  }

  if (filters.entityType) {
    query += ` AND entity_type = $${paramCount++}`;
    params.push(filters.entityType);
  }

  if (filters.dateFrom) {
    query += ` AND timestamp >= $${paramCount++}`;
    params.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    query += ` AND timestamp <= $${paramCount++}`;
    params.push(filters.dateTo);
  }

  query += ' ORDER BY timestamp DESC';

  if (filters.limit) {
    query += ` LIMIT $${paramCount++}`;
    params.push(filters.limit);
  }

  if (filters.offset) {
    query += ` OFFSET $${paramCount++}`;
    params.push(filters.offset);
  }

  const result = await db.query(query, params);
  return result.rows.map((row: any) => ({
    ...row,
    oldValue: row.old_value ? JSON.parse(row.old_value) : undefined,
    newValue: row.new_value ? JSON.parse(row.new_value) : undefined,
    timestamp: new Date(row.timestamp),
  }));
}

export async function getAuditLogsByEntity(
  entityType: AuditLog['entityType'],
  entityId: string
): Promise<AuditLog[]> {
  return getAuditLogs({ entityType, offset: 0, limit: 100 });
}
