import React from 'react';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <div className={styles.promoContainer}>
      <div className={styles.promoCard}>
        <div className={styles.promoHeader}>
          <div className={styles.promoIcon}>📄</div>
          <h3>Try Our Docs to Rich Text App</h3>
        </div>
        <div className={styles.promoContent}>
          <p>Import from Google Docs, Word Online, or HTML with one click. Simplify your content workflow.</p>
        </div>
        <a href="https://www.contentful.com/marketplace/docs-to-rich-text" target="_blank" rel="noopener noreferrer" className={styles.promoCta}>
          Try It →
        </a>
      </div>

      <div className={styles.promoCard}>
        <div className={styles.promoHeader}>
          <div className={styles.promoIcon}>🚀</div>
          <h3>Work with us on your next Contentful app</h3>
        </div>
        <div className={styles.promoContent}>
          <p>We build tailor-made apps, interfaces, and integrations for your team. Let's create something amazing together.</p>
        </div>
        <a href="https://ellavationlabs.com/solutions" target="_blank" rel="noopener noreferrer" className={styles.promoCta}>
          Get in Touch →
        </a>
      </div>
    </div>
  );
};
