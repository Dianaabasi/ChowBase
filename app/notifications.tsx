import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CaretLeft, BellZ, Trash, UserPlus, Heart, ChatCircle } from 'phosphor-react-native';
import { useThemeColors } from '../constants/theme';
import { useNotificationStore, Notification } from '../stores/notificationStore';
import { Swipeable } from 'react-native-gesture-handler';
import { Avatar } from '../components/ui/Avatar';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  
  const { notifications, markAllRead, clearAll, deleteNotification } = useNotificationStore();

  useEffect(() => {
    // Mark as read when opening the screen
    markAllRead();
  }, [markAllRead]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'follow': return <UserPlus size={16} color="#FFF" weight="fill" />;
      case 'like': return <Heart size={16} color="#FFF" weight="fill" />;
      case 'comment': return <ChatCircle size={16} color="#FFF" weight="fill" />;
      default: return <BellZ size={16} color="#FFF" weight="fill" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'follow': return colors.brand.primary;
      case 'like': return '#E11D48'; // Red for like
      case 'comment': return colors.info; // Blue for comment
      default: return colors.textSecondary;
    }
  };

  const getMessage = (n: Notification) => {
    switch (n.type) {
      case 'follow': return <Text><Text style={styles.boldText}>{n.actorName}</Text> started following you.</Text>;
      case 'like': return <Text><Text style={styles.boldText}>{n.actorName}</Text> liked your recipe <Text style={styles.boldText}>{n.recipeTitle}</Text>.</Text>;
      case 'comment': return <Text><Text style={styles.boldText}>{n.actorName}</Text> commented on your recipe <Text style={styles.boldText}>{n.recipeTitle}</Text>.</Text>;
      default: return <Text>New notification</Text>;
    }
  };

  const handlePress = (n: Notification) => {
    if (n.type === 'follow' && n.actorUsername) {
      router.push(`/profile/${n.actorUsername}`);
    } else if ((n.type === 'like' || n.type === 'comment') && n.recipeId) {
      router.push(`/recipe/${n.recipeId}`);
    }
  };

  const renderRightActions = (id: string) => (
    <TouchableOpacity 
      style={styles.deleteAction} 
      onPress={() => deleteNotification(id)}
    >
      <Trash size={24} color="#FFF" />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <CaretLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Notifications</Text>
        
        {notifications.length > 0 ? (
          <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
            <Text style={[styles.clearText, { color: colors.brand.primary }]}>Clear All</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={notifications.length === 0 ? styles.emptyScrollContent : styles.scrollContent}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <BellZ size={64} color={colors.textMuted} weight="duotone" style={{ opacity: 0.5, marginBottom: 16 }} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No notifications yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>We'll let you know when there's something new to check out.</Text>
          </View>
        ) : (
          notifications.map(n => (
            <Swipeable key={n.id} renderRightActions={() => renderRightActions(n.id)}>
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => handlePress(n)}
                style={[
                  styles.notificationCard, 
                  { backgroundColor: n.read ? colors.bgPrimary : colors.bgSecondary, borderBottomColor: colors.borderSubtle }
                ]}
              >
                <View style={styles.avatarContainer}>
                  <Avatar url={n.actorAvatar} name={n.actorName} size={48} />
                  <View style={[styles.typeIcon, { backgroundColor: getIconColor(n.type) }]}>
                    {getIcon(n.type)}
                  </View>
                </View>

                <View style={styles.contentContainer}>
                  <Text style={[styles.messageText, { color: colors.textPrimary }]}>
                    {getMessage(n)}
                  </Text>
                  <Text style={[styles.timeText, { color: colors.textMuted }]}>
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </Text>
                </View>
                
                {!n.read && (
                  <View style={[styles.unreadDot, { backgroundColor: colors.brand.primary }]} />
                )}
              </TouchableOpacity>
            </Swipeable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, width: 60 },
  clearBtn: { padding: 4, width: 80, alignItems: 'flex-end' },
  clearText: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 14,
  },
  title: {
    fontFamily: 'Sora-Bold',
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Sora-Bold',
    fontSize: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'DM-Sans',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  typeIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  contentContainer: {
    flex: 1,
  },
  messageText: {
    fontFamily: 'DM-Sans',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  boldText: {
    fontFamily: 'DM-Sans-Bold',
  },
  timeText: {
    fontFamily: 'DM-Sans',
    fontSize: 13,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
});
