import { EntryCard, Text } from '@contentful/f36-components';
import CloseButton from './CloseButton';
import { css } from 'emotion';
import CategoryCardType from '../types/CategoryCard';

interface Props extends CategoryCardType {}

const CategoryCard = ({ aria = 'Close category', contentType, thumbnailSrc, title, description, onClose }: Props) => (
  <EntryCard
    contentType={contentType}
    title={title}
    thumbnailElement={thumbnailSrc !== '' ? <img alt="" src={thumbnailSrc} /> : undefined}
    style={{ position: 'relative' }}
    className={css({
      '> div > div': {
        padding: '0 !important',
        '> div': {
          flexDirection: 'row-reverse',
          gap: '0.5rem',
          marginTop: 0,
          margin: '1rem',
          '> div': {
            gap: 0,
          },
        },
      },
    })}>
    {onClose && <CloseButton aria-label={aria} onClick={onClose} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }} />}

    <Text fontColor="gray500">{description}</Text>
  </EntryCard>
);

export default CategoryCard;
