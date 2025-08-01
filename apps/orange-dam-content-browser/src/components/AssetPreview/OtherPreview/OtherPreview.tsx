import { CSSProperties, FC, ReactNode } from 'react';

import { Container } from './OtherPreview.styled';
import { MediaType } from '@/types';

 const getMediaIcon = (type?: MediaType) => {
  switch (type) {
    case MediaType.Audio:
      return 'audio_file';
    case MediaType.Album:
      return 'album';
    case MediaType.Widget:
      return 'widgets';
    case MediaType.Multimedia:
      return 'perm_media';
    case MediaType.Story:
      return 'article';
    case MediaType.Video:
      return 'video_file';
    case MediaType.Image:
      return 'photo';
    default:
      return 'file';
  }
};

type Props = {
  children?: ReactNode;
  style?: CSSProperties;
  docType?: string;
};

const OtherPreview: FC<Props> = ({
  children,
  style,
  docType
}) => {

  return (
    <Container style={style}>
      <cx-icon name={getMediaIcon(docType as MediaType)}></cx-icon>
      {children}
    </Container>
  );
};

export default OtherPreview;