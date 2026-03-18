declare module "emoji-picker-react" {
  export enum Theme {
    DARK = "dark",
    LIGHT = "light",
    AUTO = "auto",
  }

  export interface EmojiClickData {
    emoji: string;
    unified: string;
    names: string[];
  }

  export interface EmojiPickerProps {
    onEmojiClick?: (emojiData: EmojiClickData, event: MouseEvent) => void;
    theme?: Theme;
    width?: number | string;
    height?: number | string;
    searchPlaceholder?: string;
    [key: string]: unknown;
  }

  export default function EmojiPicker(props: EmojiPickerProps): JSX.Element;
}
