import { supabase } from '@/integrations/supabase/client';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: string;
  priority?: 'low' | 'normal' | 'high';
  actionUrl?: string;
  metadata?: any;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        title: params.title,
        message: params.message,
        type: params.type || 'general',
        priority: params.priority || 'normal',
        action_url: params.actionUrl,
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { data: null, error };
  }
};

export const createBulkNotifications = async (notifications: CreateNotificationParams[]) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(
        notifications.map(notification => ({
          user_id: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type || 'general',
          priority: notification.priority || 'normal',
          action_url: notification.actionUrl,
          metadata: notification.metadata || {},
        }))
      );

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return { data: null, error };
  }
};

// Function to notify users about new learning content
export const notifyNewLearningContent = async (contentTitle: string, contentId: string) => {
  try {
    // Get all active users
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('subscription_status', 'active');

    if (error) throw error;

    if (profiles && profiles.length > 0) {
      const notifications = profiles.map(profile => ({
        userId: profile.user_id,
        title: 'Konten Pembelajaran Baru!',
        message: `Konten baru "${contentTitle}" telah tersedia untuk Anda.`,
        type: 'learning',
        priority: 'normal' as const,
        actionUrl: '/learning',
        metadata: { content_id: contentId }
      }));

      return await createBulkNotifications(notifications);
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('Error notifying users about new learning content:', error);
    return { data: null, error };
  }
};

// Function to notify users about new opportunities
export const notifyNewOpportunity = async (title: string, category: string, opportunityId: string) => {
  try {
    // Get all users
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('user_id');

    if (error) throw error;

    if (profiles && profiles.length > 0) {
      const getNotificationTitle = (category: string) => {
        switch (category) {
          case 'SCHOLARSHIP': return 'Beasiswa Baru!';
          case 'COMPETITION': return 'Kompetisi Baru!';
          case 'JOB': return 'Lowongan Kerja Baru!';
          case 'CONFERENCE': return 'Event Baru!';
          default: return 'Peluang Baru!';
        }
      };

      const notifications = profiles.map(profile => ({
        userId: profile.user_id,
        title: getNotificationTitle(category),
        message: `Peluang baru "${title}" telah tersedia.`,
        type: 'opportunity',
        priority: 'normal' as const,
        actionUrl: '/opportunities',
        metadata: { opportunity_id: opportunityId, category }
      }));

      return await createBulkNotifications(notifications);
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('Error notifying users about new opportunity:', error);
    return { data: null, error };
  }
};