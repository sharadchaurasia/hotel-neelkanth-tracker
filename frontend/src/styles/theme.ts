// Shared Design System - Based on Login Page
// Maintains visual consistency across the application

export const THEME = {
  colors: {
    background: '#1a2332',
    cardBg: '#f5f3ef',
    primary: '#c9a35f',
    secondary: '#6b7b93',
    textDark: '#1a2332',
    textLight: '#7a8699',
    label: '#a67c52',
    border: '#e5e7eb',
    white: '#ffffff',
    error: '#ef4444',
    errorBg: '#fef2f2',
    errorBorder: '#fecaca',
  },
  shadows: {
    card: '0 20px 60px rgba(0,0,0,0.3)',
    focus: '0 0 0 3px rgba(201,163,95,0.1)',
  },
  radius: {
    small: '8px',
    medium: '10px',
    large: '12px',
    xlarge: '20px',
  },
  spacing: {
    inputPadding: '14px 16px',
    buttonPadding: '16px',
    sectionGap: '24px',
  },
};

export const inputStyle = {
  width: '100%',
  padding: THEME.spacing.inputPadding,
  background: THEME.colors.white,
  border: `1px solid ${THEME.colors.border}`,
  borderRadius: THEME.radius.medium,
  fontSize: '15px',
  color: THEME.colors.textDark,
  outline: 'none',
  transition: 'all 0.2s',
};

export const inputFocusProps = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = THEME.colors.primary;
    e.target.style.boxShadow = THEME.shadows.focus;
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = THEME.colors.border;
    e.target.style.boxShadow = 'none';
  },
};

export const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '700',
  color: THEME.colors.label,
  marginBottom: '10px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};

export const buttonPrimaryStyle = {
  padding: THEME.spacing.buttonPadding,
  background: THEME.colors.secondary,
  border: 'none',
  borderRadius: THEME.radius.medium,
  color: 'white',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
};

export const buttonSecondaryStyle = {
  ...buttonPrimaryStyle,
  background: THEME.colors.white,
  color: THEME.colors.textDark,
  border: `1px solid ${THEME.colors.border}`,
};

export const sectionStyle = {
  marginBottom: THEME.spacing.sectionGap,
  padding: '20px',
  background: THEME.colors.white,
  border: `1px solid ${THEME.colors.border}`,
  borderRadius: THEME.radius.large,
};

export const sectionTitleStyle = {
  fontSize: '13px',
  fontWeight: '700',
  color: THEME.colors.label,
  marginBottom: '16px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1.5px',
};
