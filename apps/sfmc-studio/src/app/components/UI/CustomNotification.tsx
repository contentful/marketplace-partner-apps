'use client';
import React, { useMemo } from 'react';
import { notification } from 'antd';

const Context = React.createContext({ name: 'Default' });

const CustomNotification: React.FC = () => {
  const [api, contextHolder] = notification.useNotification();
  const contextValue = useMemo(() => ({ name: 'Ant Design' }), []);

  return <Context.Provider value={contextValue}>{contextHolder}</Context.Provider>;
};

export default CustomNotification;
