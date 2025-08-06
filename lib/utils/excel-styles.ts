// Excel styling utilities and configurations

export interface ExcelStyleConfig {
  headerBackgroundColor: string;
  headerFontColor: string;
  headerFontSize: number;
  dataFontSize: number;
  borderStyle: 'thin' | 'medium' | 'thick';
  alignment: {
    horizontal: 'center' | 'left' | 'right';
    vertical: 'center' | 'top' | 'bottom';
  };
}

export interface CellStyle {
  fill?: { fgColor: { rgb: string } };
  font?: { bold?: boolean; sz?: number; color?: { rgb: string } };
  alignment?: { horizontal: string; vertical: string; wrapText?: boolean };
  border?: {
    top: { style: string; color?: { rgb: string } };
    bottom: { style: string; color?: { rgb: string } };
    left: { style: string; color?: { rgb: string } };
    right: { style: string; color?: { rgb: string } };
  };
}

export const DEFAULT_STYLE_CONFIG: ExcelStyleConfig = {
  headerBackgroundColor: 'FFFF00', // Yellow
  headerFontColor: '000000', // Black
  headerFontSize: 12,
  dataFontSize: 10,
  borderStyle: 'thin',
  alignment: {
    horizontal: 'center',
    vertical: 'center'
  }
};

export function createHeaderStyle(config: ExcelStyleConfig = DEFAULT_STYLE_CONFIG): CellStyle {
  return {
    fill: { fgColor: { rgb: config.headerBackgroundColor } },
    font: { 
      bold: true, 
      sz: config.headerFontSize,
      color: { rgb: config.headerFontColor }
    },
    alignment: { 
      horizontal: config.alignment.horizontal, 
      vertical: config.alignment.vertical,
      wrapText: true
    },
    border: {
      top: { style: config.borderStyle, color: { rgb: '000000' } },
      bottom: { style: config.borderStyle, color: { rgb: '000000' } },
      left: { style: config.borderStyle, color: { rgb: '000000' } },
      right: { style: config.borderStyle, color: { rgb: '000000' } }
    }
  };
}

export function createDataStyle(config: ExcelStyleConfig = DEFAULT_STYLE_CONFIG): CellStyle {
  return {
    font: { 
      sz: config.dataFontSize
    },
    alignment: { 
      horizontal: config.alignment.horizontal, 
      vertical: config.alignment.vertical,
      wrapText: true
    },
    border: {
      top: { style: config.borderStyle, color: { rgb: '000000' } },
      bottom: { style: config.borderStyle, color: { rgb: '000000' } },
      left: { style: config.borderStyle, color: { rgb: '000000' } },
      right: { style: config.borderStyle, color: { rgb: '000000' } }
    }
  };
}

export function applyCellStyle(worksheet: any, cellAddress: string, style: CellStyle): void {
  if (!worksheet[cellAddress]) {
    worksheet[cellAddress] = { t: 's', v: '' };
  }
  worksheet[cellAddress].s = style;
}

export function applyRangeStyle(worksheet: any, startRow: number, endRow: number, startCol: number, endCol: number, style: CellStyle): void {
  for (let R = startRow; R <= endRow; R++) {
    for (let C = startCol; C <= endCol; C++) {
      const cellAddress = String.fromCharCode(65 + C) + (R + 1); // Convert to A1 notation
      applyCellStyle(worksheet, cellAddress, style);
    }
  }
}