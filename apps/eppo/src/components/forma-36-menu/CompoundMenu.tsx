import { Menu as OriginalMenu } from '../forma-36-menu/Menu';
import { MenuDivider } from '../forma-36-menu/MenuDivider/MenuDivider';
import { MenuItem } from '../forma-36-menu/MenuItem/MenuItem';
import { MenuList } from '../forma-36-menu/MenuList/MenuList';
import { MenuListFooter } from '../forma-36-menu/MenuList/MenuListFooter';
import { MenuListHeader } from '../forma-36-menu/MenuList/MenuListHeader';
import { MenuSectionTitle } from '../forma-36-menu/MenuSectionTitle/MenuSectionTitle';
import { MenuTrigger } from '../forma-36-menu/MenuTrigger/MenuTrigger';
import { Submenu } from '../forma-36-menu/Submenu/Submenu';
import { SubmenuTrigger } from '../forma-36-menu/SubmenuTrigger/SubmenuTrigger';

type CompoundMenu = typeof OriginalMenu & {
  List: typeof MenuList;
  ListHeader: typeof MenuListHeader;
  ListFooter: typeof MenuListFooter;
  Item: typeof MenuItem;
  Trigger: typeof MenuTrigger;
  Divider: typeof MenuDivider;
  SectionTitle: typeof MenuSectionTitle;
  Submenu: typeof Submenu;
  SubmenuTrigger: typeof SubmenuTrigger;
};

export const Menu = OriginalMenu as CompoundMenu;
Menu.List = MenuList;
Menu.ListHeader = MenuListHeader;
Menu.ListFooter = MenuListFooter;
Menu.Item = MenuItem;
Menu.Trigger = MenuTrigger;
Menu.Divider = MenuDivider;
Menu.SectionTitle = MenuSectionTitle;
Menu.Submenu = Submenu;
Menu.SubmenuTrigger = SubmenuTrigger;
