import React from 'react';
import { Box } from '@mui/material';

// We'll use Box with display: grid to avoid the typing issues with Material-UI's Grid component
// This will give us a similar layout capability with better typing support

interface GridContainerProps {
  children: React.ReactNode;
  spacing?: number | { xs?: number, sm?: number, md?: number, lg?: number, xl?: number };
}

interface GridItemProps {
  children: React.ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

// Utility to convert grid sizes to percentage widths
const getGridTemplateColumns = (columnsCount: number) => {
  return `repeat(${columnsCount}, 1fr)`;
};

export const GridContainer: React.FC<GridContainerProps> = ({ children, spacing = 2 }) => {
  // Convert spacing to pixels
  const spacingInPx = typeof spacing === 'number' ? spacing * 8 : 16; // 8px is the default MUI spacing unit
  
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: typeof spacing === 'number' ? spacing : { 
          xs: spacing.xs ? spacing.xs : 2,
          sm: spacing.sm,
          md: spacing.md,
          lg: spacing.lg,
          xl: spacing.xl
        },
        width: '100%'
      }}
    >
      {children}
    </Box>
  );
};

export const GridItem: React.FC<GridItemProps> = ({ 
  children, 
  xs = 12, // default to full width
  sm,
  md,
  lg,
  xl
}) => {
  return (
    <Box
      sx={{
        gridColumn: {
          xs: `span ${xs}`,
          sm: sm ? `span ${sm}` : undefined,
          md: md ? `span ${md}` : undefined,
          lg: lg ? `span ${lg}` : undefined,
          xl: xl ? `span ${xl}` : undefined,
        }
      }}
    >
      {children}
    </Box>
  );
};

export default {
  GridContainer,
  GridItem
}; 