'use client';
import { Table, theme } from 'antd';
import type { TableProps } from 'antd';
import style from './soldProduct.module.scss';
import { SoldProductsRetention } from '@/lib/types/dashboard';
import { useAppSelector } from '@/redux/hooks';

export default function SoldProduct({ soldProduct }: { soldProduct: any }) {
  const theme: string = useAppSelector((state) => state.themeSlice?.theme);
  const columns: TableProps<SoldProductsRetention>['columns'] = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      sorter: (a: SoldProductsRetention, b: SoldProductsRetention) => a.productName.localeCompare(b.productName),
      render: (value, record, index) => {
        return <span className={theme}>{value}</span>;
      },
    },
    {
      title: 'Product Family',
      dataIndex: 'productFamily',
      key: 'productFamily',
      render: (value) => {
        return <span className={theme}>{value}</span>;
      },
    },
    {
      title: 'Quantity',
      dataIndex: 'displaySoldAmount',
      key: 'displaySoldAmount',
      render: (value) => {
        return <span className={theme}>{value}</span>;
      },
    },
    {
      title: 'Revenue',
      dataIndex: 'displayRevenue',
      key: 'displayRevenue',
      render: (value) => {
        return <span className={theme}>{value}</span>;
      },
    },
  ];

  return (
    <div className={`${style.TopSoldMain} ${theme == 'dark' ? style.DarkTheme : ''}`}>
      <div className={`${style.TopSoldInner} ${theme}`}>
        <h4>Top 10 Sold Products</h4>
        <Table
          className={`SoldTable  ${theme}-table`}
          rowClassName={theme == 'dark' ? 'table-row-dark' : 'table-row-light'}
          columns={columns}
          dataSource={soldProduct}
          pagination={false}
        />
      </div>
    </div>
  );
}
