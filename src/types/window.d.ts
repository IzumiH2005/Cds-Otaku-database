// Extensions pour le type global Window
interface Window {
  markAppAsLoaded?: () => void;
  appLoaded?: boolean;
}