import React, { ComponentPropsWithoutRef, ComponentPropsWithRef } from 'react';

export type SubmenuContextType = {
  isOpen: boolean;
  getSubmenuListProps: (
    _props: ComponentPropsWithRef<'div'>,
  ) => { 'data-parent-menu': string } & ComponentPropsWithoutRef<'div'>;
  getSubmenuTriggerProps: (
    _props: ComponentPropsWithRef<'button'>,
    _ref: React.Ref<HTMLButtonElement>,
  ) => ComponentPropsWithRef<'button'>;
};

const SubmenuContext = React.createContext<SubmenuContextType | undefined>(undefined);

export const useSubmenuContext = () => {
  return React.useContext(SubmenuContext);
};

export const SubmenuContextProvider = SubmenuContext.Provider;
