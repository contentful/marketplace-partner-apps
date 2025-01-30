'use client';
import Image from 'next/image';
import style from './noData.module.scss';
function NoData() {
  return (
    <div className={style.NoDataMain}>
      <div className={style.NoDataInner}>
        <Image src="/images/nodata.svg" width="60" height="60" alt="Logo" />
        <h3>No data</h3>
      </div>
    </div>
  );
}

export default NoData;
