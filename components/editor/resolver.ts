import { SectionBlock } from "./blocks/SectionBlock";
import { TextBlock } from "./blocks/TextBlock";
import { ImageBlock } from "./blocks/ImageBlock";
import { CountdownBlock } from "./blocks/CountdownBlock";
import { DividerBlock } from "./blocks/DividerBlock";
import { ButtonBlock } from "./blocks/ButtonBlock";
import { IconBlock } from "./blocks/IconBlock";
import { GiftBoxBlock } from "./blocks/GiftBoxBlock";
import { RootCanvas } from "./blocks/RootCanvas";
import { WishesBlock } from "./blocks/WishesBlock";

export const editorResolver = {
  SectionBlock,
  TextBlock,
  ImageBlock,
  CountdownBlock,
  DividerBlock,
  ButtonBlock,
  IconBlock,
  GiftBoxBlock,
  RootCanvas,
  // Legacy / imported block
  WishesBlock,
};

export type ResolverKeys = keyof typeof editorResolver;
