import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LanguageSwitcherProps {
  style?: any;
  textStyle?: any;
}

export default function LanguageSwitcher({ style, textStyle }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const toggleLanguage = async () => {
    const newLang = isArabic ? 'en' : 'ar';
    
    try {
      await i18n.changeLanguage(newLang);
      await AsyncStorage.setItem('app_language', newLang);
      
      Alert.alert(
        t('languageChanged'),
        t('restartRequired'),
        [{ text: t('ok'), style: 'default' }]
      );
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <TouchableOpacity
      onPress={toggleLanguage}
      style={[styles.container, style]}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, textStyle]}>
        {isArabic ? 'EN' : 'عربي'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderWidth: 1,
    borderColor: '#ec4899',
  },
  text: {
    color: '#c026d3',
    fontWeight: '600',
    fontSize: 14,
  },
});