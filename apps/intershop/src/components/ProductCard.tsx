import { Card, Flex, Text, Tooltip, CardProps } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import CloseButton from './CloseButton';

interface ImageType {
  alt: string;
  src: string;
}

type Props = CardProps<'article'> & {
  title: string;
  subtitle: string;
  identifier?: string;
  price: string;
  warning?: string;
  image: ImageType;
} & (
    | {
        onClose?: () => void;
        ariaCloseButton?: string;
      }
    | { onClose?: never; ariaCloseButton?: never }
  );

const ProductCard = ({ identifier, price, subtitle, title, warning, style, image, onClose, ariaCloseButton = 'Close product', padding, ...props }: Props) => {
  const withDragHandle = 'withDragHandle' in props ? props.withDragHandle : false;
  const card = (
    <Card
      style={{
        position: 'relative',
        ...(warning ? { cursor: 'not-allowed' } : {}),
        ...style,
      }}
      withDragHandle={withDragHandle}
      padding={withDragHandle ? 'none' : padding}
      {...props}>
      {onClose && <CloseButton aria-label={ariaCloseButton} onClick={onClose} style={{ position: 'absolute', top: '0.5em', right: '0.5em' }} />}
      <Flex flexDirection="column" justifyContent="space-between" alignItems="center" fullHeight padding={withDragHandle ? 'spacingM' : undefined}>
        <Flex flexDirection="column" style={{ marginRight: 'auto', height: '5.25em', maxWidth: onClose ? `calc(100% - ${tokens.spacingM})` : '100%' }}>
          <Text fontSize="fontSizeXl" fontWeight="fontWeightDemiBold" isTruncated>
            {title}
          </Text>
          <Text
            fontSize="fontSizeM"
            lineHeight="lineHeightCondensed"
            style={{
              maxHeight: '2.5em',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              display: '-webkit-box',
              overflow: 'hidden',
            }}>
            {subtitle}
          </Text>
          {identifier && (
            <Text fontSize="fontSizeS" isTruncated>
              {identifier}
            </Text>
          )}
        </Flex>

        <img
          src={image.src}
          alt={image.alt}
          style={{
            maxWidth: '100%',
            height: '50%',
            aspectRatio: 'auto 50/50',
          }}
        />
        <Text fontColor="blue700" fontSize="fontSizeXl" fontStack="fontStackMonospace" fontWeight="fontWeightDemiBold" style={{ marginLeft: 'auto' }}>
          {price}
        </Text>
      </Flex>
    </Card>
  );

  return warning ? (
    <Tooltip content={warning} placement="top">
      {card}
    </Tooltip>
  ) : (
    card
  );
};

export default ProductCard;
