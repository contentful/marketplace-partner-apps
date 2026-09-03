import { IconButton, IconButtonProps } from '@contentful/f36-components';
import { CloseIcon } from '@contentful/f36-icons';

type Props = Omit<IconButtonProps, 'variant' | 'icon'>;

const CloseButton = ({ size = 'small', ...props }: Props) => <IconButton {...props} variant="transparent" icon={<CloseIcon />} size={size} />;

export default CloseButton;
