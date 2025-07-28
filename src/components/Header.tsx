import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';

interface HeaderProps {
  onSync?: () => void;
  onSettings?: () => void;
  onClose?: () => void;
  showStatusIndicator?: boolean;
  mode?: 'home' | 'settings';
}

export const Header: React.FC<HeaderProps> = ({
  onSync,
  onSettings,
  onClose,
  showStatusIndicator = true,
  mode = 'home',
}) => {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>P T</Text>
      <View style={styles.headerIcons}>
        {showStatusIndicator && <View style={styles.statusIndicator} />}
        {mode === 'home' ? (
          <>
            <TouchableOpacity onPress={onSync} style={styles.iconButton}>
              <Text style={styles.syncIcon}>↻</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSettings} style={styles.iconButton}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <Text style={styles.homeIcon}>🏠</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === 'android'
        ? StatusBar.currentHeight
          ? StatusBar.currentHeight + 16
          : 40
        : 50,
    paddingBottom: 16,
    backgroundColor: '#1A1A1A',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 12,
  },
  syncIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  settingsIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  homeIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
});
