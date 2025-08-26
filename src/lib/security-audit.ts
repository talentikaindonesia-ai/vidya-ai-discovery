import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Security audit utility for admin actions
export const auditAdminAction = async (action: string, tableName: string, recordId?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    // Log to audit_logs table
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      table_name: tableName,
      operation: action,
      record_id: recordId,
      user_agent: navigator.userAgent,
      ip_address: 'client-side' // In production, this would come from server
    });

    // Also log to console for immediate visibility
    console.log(`[AUDIT] ${user.email} performed ${action} on ${tableName}${recordId ? ` (${recordId})` : ''} at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Failed to log audit action:', error);
  }
};

// Hook for automatic audit logging on mount
export const useAuditLog = (action: string, tableName: string, recordId?: string) => {
  useEffect(() => {
    auditAdminAction(action, tableName, recordId);
  }, [action, tableName, recordId]);
};

// Secure transaction data formatter (removes sensitive info for logs)
export const sanitizeTransactionForLog = (transaction: any) => {
  return {
    id: transaction.id,
    amount: transaction.amount,
    currency: transaction.currency,
    status: transaction.status,
    transaction_type: transaction.transaction_type,
    created_at: transaction.created_at,
    // Exclude sensitive fields like payment_method, external_transaction_id, etc.
  };
};

// Validate admin role before sensitive operations
export const checkAdminRole = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return userRole?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
};